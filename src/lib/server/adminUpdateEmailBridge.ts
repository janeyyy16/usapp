/**
 * Admin "update user email" bridge (runtime-agnostic, Web Crypto only).
 *
 * Why this file exists:
 *  - profiles.email is not just a display field — landing.tsx's
 *    username-login path looks up profiles.email in Supabase and passes
 *    THAT value to Firebase's signInWithEmailAndPassword. So changing
 *    profiles.email without also changing the user's actual Firebase Auth
 *    email would desync the two and lock that user out of username-based
 *    login the next time they try to sign in.
 *  - There is no firebase-admin package here (same reasoning as the other
 *    server bridges — it isn't reliably usable on Cloudflare Workers), so
 *    this talks to the Identity Toolkit REST API directly using a
 *    self-signed service-account JWT exchanged for a Google OAuth2 access
 *    token — the same technique jotformBridge.ts uses for Firestore/Storage,
 *    just with the identitytoolkit scope instead.
 *
 * Flow:
 *  1. Client sends its own Firebase ID token, the target profile's id, and
 *     the desired new email.
 *  2. We verify the caller's ID token (reusing supabaseTokenBridge's
 *     verifyFirebaseToken) to get their real Firebase uid — never trust a
 *     client-supplied "I am an admin" claim.
 *  3. We look up the caller's OWN profile via the Supabase REST API using
 *     the service-role key (bypasses RLS) to confirm their role is ADMIN or
 *     SUPERADMIN, and load the target profile to get its firebase_uid and
 *     confirm it's in the SAME company (cross-tenant safety).
 *  4. We call Identity Toolkit's accounts:update to change the target
 *     Firebase user's email. Only once that succeeds do we return success —
 *     the caller (client) is responsible for then updating profiles.email
 *     via the normal updateCompanyUser() Supabase call, so the two are never
 *     left desynced from a partial failure on either side.
 */

import { verifyFirebaseToken } from "./supabaseTokenBridge";

// ---- base64url helpers (no Buffer; Worker-safe) ----
function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function strToB64url(input: string): string {
  return bytesToB64url(new TextEncoder().encode(input));
}

function pemToPkcs8Bytes(pem: string): ArrayBuffer {
  const normalized = pem.includes("\\n") ? pem.replace(/\\n/g, "\n") : pem;
  const b64 = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// ---- Google service-account OAuth2 token (cached in-memory for its TTL) ----
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getIdentityToolkitAccessToken(serviceAccountEmail: string, privateKeyPem: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > now + 30) return tokenCache.token;

  const headerB64 = strToB64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payloadB64 = strToB64url(
    JSON.stringify({
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/identitytoolkit",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8Bytes(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput));
  const jwt = `${signingInput}.${bytesToB64url(new Uint8Array(sig))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}): ${await res.text()}`);
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: body.access_token, expiresAt: now + body.expires_in };
  return body.access_token;
}

interface ProfileLookup {
  id: string;
  role: string;
  company_id: string;
  firebase_uid: string | null;
}

async function fetchProfile(
  supabaseUrl: string,
  serviceKey: string,
  filter: { firebase_uid: string } | { id: string }
): Promise<ProfileLookup | null> {
  const [[field, value]] = Object.entries(filter);
  const url = `${supabaseUrl}/rest/v1/profiles?${field}=eq.${encodeURIComponent(value)}&select=id,role,company_id,firebase_uid&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });
  if (!res.ok) throw new Error(`Profile lookup failed (${res.status}): ${await res.text()}`);
  const rows = (await res.json()) as ProfileLookup[];
  return rows[0] ?? null;
}

const ADMIN_ROLES = new Set(["ADMIN", "SUPERADMIN"]);

/**
 * Handle a POST /api/admin-update-email request. Returns a standard Response.
 * `env` lets callers pass platform-provided secrets (Cloudflare bindings);
 * falls back to process.env for Node/dev.
 */
export async function handleAdminUpdateEmailRequest(
  request: Request,
  env?: Record<string, string | undefined>
): Promise<Response> {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { idToken, targetProfileId, newEmail } = (await request.json()) as {
      idToken?: string;
      targetProfileId?: string;
      newEmail?: string;
    };
    if (!idToken || !targetProfileId || !newEmail) {
      return json({ error: "Missing idToken, targetProfileId, or newEmail" }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return json({ error: "Invalid email address" }, 400);
    }

    const getEnv = (k: string): string | undefined =>
      env?.[k] ?? (typeof process !== "undefined" ? process.env?.[k] : undefined);

    const projectId =
      (typeof (globalThis as any).__FIREBASE_PROJECT_ID__ === "string" && (globalThis as any).__FIREBASE_PROJECT_ID__) ||
      getEnv("VITE_FIREBASE_PROJECT_ID");
    const supabaseUrl = getEnv("VITE_SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_KEY");
    const serviceAccountEmail = getEnv("FIREBASE_SERVICE_ACCOUNT_EMAIL");
    const serviceAccountKey = getEnv("FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY");
    if (!projectId || !supabaseUrl || !serviceKey || !serviceAccountEmail || !serviceAccountKey) {
      return json({ error: "Server missing required configuration" }, 500);
    }

    // 1. Confirm the caller is really who their ID token says they are.
    const claims = await verifyFirebaseToken(idToken, projectId);

    // 2. Confirm the caller holds ADMIN/SUPERADMIN via their OWN profile row
    //    (never trust a client-supplied role) and load the target's row.
    const callerProfile = await fetchProfile(supabaseUrl, serviceKey, { firebase_uid: claims.sub });
    if (!callerProfile || !ADMIN_ROLES.has(String(callerProfile.role || "").toUpperCase())) {
      return json({ error: "Not authorized to change user emails" }, 403);
    }
    const targetProfile = await fetchProfile(supabaseUrl, serviceKey, { id: targetProfileId });
    if (!targetProfile || !targetProfile.firebase_uid) {
      return json({ error: "Target user not found" }, 404);
    }
    if (targetProfile.company_id !== callerProfile.company_id) {
      return json({ error: "Target user is not in your company" }, 403);
    }

    // 3. Update the ACTUAL Firebase Auth credential — this is the whole
    //    point of this endpoint, since profiles.email alone would desync
    //    from what username-login actually authenticates against.
    const accessToken = await getIdentityToolkitAccessToken(serviceAccountEmail, serviceAccountKey);
    const updateRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${encodeURIComponent(getEnv("VITE_FIREBASE_API_KEY") ?? "")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ localId: targetProfile.firebase_uid, email: newEmail, emailVerified: false }),
      }
    );
    if (!updateRes.ok) {
      const errBody = await updateRes.text();
      if (errBody.includes("EMAIL_EXISTS")) return json({ error: "Email already in use by another account" }, 409);
      throw new Error(`Firebase email update failed (${updateRes.status}): ${errBody}`);
    }

    return json({ success: true });
  } catch (error) {
    console.error("[admin-update-email] error:", error);
    return json({ error: error instanceof Error ? error.message : "Email update failed" }, 500);
  }
}
