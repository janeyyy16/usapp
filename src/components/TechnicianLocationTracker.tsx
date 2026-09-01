/**
 * Background, no-visible-page location tracker — mounted once, globally,
 * in __root.tsx (same "always-mounted, renders null unless it has
 * something to show, unconditional" pattern as SuperSuperAdminGuard).
 *
 * Deliberately independent of both existing clock-in/out UIs
 * (TimeClockMenu.tsx's header widget and MobileTechApp.tsx's own inline
 * button) — rather than hook into either one specifically (and duplicate
 * "am I clocked in" logic in two places), this polls timecard_entries
 * directly via getEntryForDate, so it picks up a clock-in made through
 * either UI.
 *
 * Gated on: (1) the signed-in user actually being a technician (same
 * role check getCompanyTechnicians() uses), (2) having a confirmed
 * Location Consent document on file (hasConfirmedLocationConsent), and
 * (3) currently being clocked in (open timecard_entries row for today).
 * All three together mirror exactly what the signed Location Consent
 * agreement promises — see technicianLocationPings.ts's header and
 * migration 0189 for the database-level enforcement of the same rule.
 *
 * This is a plain web app (no PWA/service worker, no native wrapper), so
 * tracking only works while this tab is open and foregrounded — there is
 * no true background-tracking capability here.
 */
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getMyProfileId, getMyFullProfile, getTechnicianContactInfoByIds } from "@/lib/supabase/users";
import { getEntryForDate } from "@/lib/supabase/timecards";
import { hasConfirmedLocationConsent, upsertMyLocationPing, clearMyLocationPing } from "@/lib/supabase/technicianLocationPings";
import { upsertMyCheckoutProposal } from "@/lib/supabase/technicianCheckoutProposals";
import { getMyLatestVisitUpdate } from "@/lib/supabase/tickets";
import { getOfficeCoordinates, geocodeAddress, haversineMiles, CHECKOUT_PROPOSAL_RADIUS_MILES, type LatLng } from "@/lib/mapEngine";
import { getCompanyMapProvider } from "@/lib/supabase/companySettings";
import { setLocationSharingStatus } from "@/lib/locationSharingStatus";
import { useLiveLocation } from "@/lib/liveLocationContext";
import { TECHNICIAN_PAY_ROLES, normalizeRole } from "@/lib/roleLabels";

// Routine tracing -- "not eligible" fires on every load for every
// non-technician account (Admin/CSR/HR/SUPERADMIN...), which is the normal,
// expected case, not a problem. Useful when debugging eligibility/consent
// locally, pure noise in a real user's production console. Same pattern as
// auth.tsx's own devLog.
const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

const POLL_MS = 60_000;
const UPLOAD_THROTTLE_MS = 60_000;

function todayKey(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function isTechnicianRole(role: string | null, extraRoles: string[]): boolean {
  return [role, ...extraRoles].some((r) => TECHNICIAN_PAY_ROLES.has(normalizeRole(r)));
}

export function TechnicianLocationTracker() {
  const { ready, uid, role, extraRoles } = useAuth();
  const { setLiveLocation } = useLiveLocation();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [clockedIn, setClockedIn] = useState(false);
  const [watching, setWatching] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastUploadRef = useRef(0);
  // Resolved once per shift (branch office coords are a synchronous lookup;
  // home needs a one-time geocode) so the geofence check on every position
  // update is a cheap local haversine, not a network call each time.
  const branchHomeRef = useRef<{ branch: LatLng | null; home: LatLng | null } | null>(null);
  const proposedCheckoutThisShiftRef = useRef(false);
  const promptHandledThisShiftRef = useRef(false);
  const loadedDateKeyRef = useRef<string>(todayKey());
  const wakeLockRef = useRef<{ release: () => Promise<void> } | null>(null);

  const eligible = ready && !!uid && isTechnicianRole(role, extraRoles);

  // Resolve profile id + consent status once, when eligible.
  useEffect(() => {
    if (!eligible || !uid) {
      devLog("[TechnicianLocationTracker] consent check skipped — not eligible", { eligible, uid, role, extraRoles });
      return;
    }
    let cancelled = false;
    getMyProfileId(uid).then(async (pid) => {
      if (cancelled) return;
      if (!pid) {
        console.warn("[TechnicianLocationTracker] getMyProfileId returned no profile for this uid:", uid);
        return;
      }
      setProfileId(pid);
      const confirmed = await hasConfirmedLocationConsent(pid).catch((err) => {
        console.error("[TechnicianLocationTracker] hasConfirmedLocationConsent failed:", err);
        return false;
      });
      devLog("[TechnicianLocationTracker] consent check:", { profileId: pid, confirmed });
      if (!cancelled) setConsentConfirmed(confirmed);
    });
    return () => {
      cancelled = true;
    };
  }, [eligible, uid]);

  const armed = eligible && !!profileId && consentConfirmed;

  // Publish the same gating state other components (e.g. MobileTechApp.tsx's
  // On-Site Check-In card) need to explain *why* there's no live position
  // yet, rather than just guessing from a bare null.
  useEffect(() => {
    setLiveLocation({ consentConfirmed, clockedIn });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consentConfirmed, clockedIn]);

  // Poll "am I clocked in today" independently of either clock-in UI —
  // same cadence TimeClockButtons.tsx already uses for its own resync.
  useEffect(() => {
    if (!armed || !profileId) return;
    let cancelled = false;

    const check = () => {
      const dateKey = todayKey();
      loadedDateKeyRef.current = dateKey;
      getEntryForDate(profileId, dateKey)
        .then((entry) => {
          if (cancelled) return;
          setClockedIn(!!entry?.checkIn && !entry?.checkOut);
        })
        .catch((err) => console.error("[TechnicianLocationTracker] getEntryForDate failed:", err));
    };

    check();
    const interval = window.setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [armed, profileId]);

  // Resolve this technician's branch + home coordinates once per shift —
  // feeds the auto-proposed-checkout geofence check inside startWatch's
  // position callback below, without re-geocoding on every single ping.
  useEffect(() => {
    if (!armed || !clockedIn || !profileId || !uid || branchHomeRef.current) return;
    let cancelled = false;
    (async () => {
      const [myProfile, contactInfo, mapProvider] = await Promise.all([
        getMyFullProfile(uid),
        getTechnicianContactInfoByIds([profileId]),
        getCompanyMapProvider(),
      ]);
      if (cancelled) return;
      const branch = myProfile?.assignedBranch ? getOfficeCoordinates(myProfile.assignedBranch) : null;
      const homeAddress = contactInfo.get(profileId)?.address;
      const homeHit = homeAddress ? await geocodeAddress(mapProvider, homeAddress) : null;
      if (cancelled) return;
      branchHomeRef.current = { branch, home: homeHit ? { lat: homeHit.lat, lng: homeHit.lng } : null };
    })().catch((err) => console.error("[TechnicianLocationTracker] resolving branch/home coords failed:", err));
    return () => {
      cancelled = true;
    };
  }, [armed, clockedIn, profileId, uid]);

  const stopWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setWatching(false);
    setLiveLocation({ watching: false, position: null, accuracy: null });
  };

  const startWatch = () => {
    if (!navigator.geolocation || watchIdRef.current !== null || !profileId) return;
    setShowPrompt(false);
    // A fresh attempt — clear any earlier denial so a consumer's "location
    // access is blocked" message doesn't linger once permission is granted.
    setLiveLocation({ permissionDenied: false });
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setWatching(true);
        // Local consumers (the shared context) get every reading — cheap,
        // no network cost. The upload to technician_location_pings below
        // stays throttled since that one's a real network write.
        setLiveLocation({
          watching: true,
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
          permissionDenied: false,
        });
        const now = Date.now();
        if (now - lastUploadRef.current < UPLOAD_THROTTLE_MS) return;
        lastUploadRef.current = now;
        // Deliberately NOT pos.timestamp — Safari/WebKit doesn't reliably
        // report it in epoch milliseconds the way Chrome does, and a
        // misinterpreted unit there produces a garbage date far enough out
        // of range that Postgres rejects the write outright (confirmed via
        // a real WebKit reproduction: "time zone displacement out of
        // range"). The device's own current time is what "now" means for
        // a live ping anyway.
        upsertMyLocationPing(
          profileId,
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy ?? null,
          new Date(now).toISOString()
        ).catch((err) => console.error("[TechnicianLocationTracker] upsertMyLocationPing failed:", err));

        // Auto-propose a Time Out the moment this fix lands back inside
        // the branch or home geofence (CHECKOUT_PROPOSAL_RADIUS_MILES — its
        // own constant, not On-Site Check-In's). Once per shift only
        // (proposedCheckoutThisShiftRef); a SuperAdmin/Finance reviewer
        // approves or the tech's own next clock-in resets it, so a
        // wrong/early hit isn't permanent.
        const coords = branchHomeRef.current;
        if (coords && !proposedCheckoutThisShiftRef.current && (coords.branch || coords.home)) {
          const here: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const nearBranch = coords.branch ? haversineMiles(here, coords.branch) <= CHECKOUT_PROPOSAL_RADIUS_MILES : false;
          const nearHome = coords.home ? haversineMiles(here, coords.home) <= CHECKOUT_PROPOSAL_RADIUS_MILES : false;
          if (nearBranch || nearHome) {
            proposedCheckoutThisShiftRef.current = true;
            const at = new Date(now);
            const proposedCheckOut = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}:${String(at.getSeconds()).padStart(2, "0")}`;
            getMyLatestVisitUpdate(profileId)
              .then((lastVisit) =>
                upsertMyCheckoutProposal({
                  profileId,
                  workDate: todayKey(),
                  proposedCheckOut,
                  source: nearBranch ? "branch" : "home",
                  lastTicketNo: lastVisit?.ticketNo ?? null,
                  lastTicketUpdatedAt: lastVisit?.updatedAt ?? null,
                })
              )
              .catch((err) => console.error("[TechnicianLocationTracker] upsertMyCheckoutProposal failed:", err));
          }
        }
      },
      (err) => {
        // Permission denied or unavailable — best-effort feature, never
        // blocks clocking in/out either way.
        console.warn("[TechnicianLocationTracker] geolocation error:", err.message);
        if (err.code === err.PERMISSION_DENIED) {
          setLiveLocation({ permissionDenied: true });
          stopWatch();
        }
      },
      { enableHighAccuracy: false, maximumAge: 30_000, timeout: 20_000 }
    );
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  };

  const requestWakeLock = () => {
    const wakeLock = (navigator as any).wakeLock;
    if (!wakeLock?.request || wakeLockRef.current) return;
    wakeLock
      .request("screen")
      .then((sentinel: any) => {
        wakeLockRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      })
      .catch(() => {
        // Battery Saver, OS-level denial, etc. — best-effort, tracking itself is unaffected.
      });
  };

  // Screen Wake Lock is released by the browser the instant the tab is
  // hidden, so it must be re-requested on every return to foreground —
  // this only keeps the screen from auto-locking while actively watching
  // AND visible; it can't survive the tab actually being backgrounded.
  useEffect(() => {
    if (!watching) {
      releaseWakeLock();
      return;
    }
    requestWakeLock();
    const onVisible = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [watching]);

  useEffect(() => () => releaseWakeLock(), []);

  // Broadcast to anything else that wants to show a "live" indicator (e.g.
  // MobileTechApp.tsx's own header badge) without duplicating the actual
  // tracking logic — see locationSharingStatus.ts.
  useEffect(() => {
    setLocationSharingStatus(watching);
    return () => setLocationSharingStatus(false);
  }, [watching]);

  // Start/stop tracking as the clocked-in state itself flips.
  useEffect(() => {
    if (!armed) return;
    if (!clockedIn) {
      promptHandledThisShiftRef.current = false;
      branchHomeRef.current = null;
      proposedCheckoutThisShiftRef.current = false;
      setShowPrompt(false);
      stopWatch();
      if (profileId) clearMyLocationPing(profileId).catch(() => {});
      return;
    }
    if (promptHandledThisShiftRef.current || !navigator.geolocation) return;
    promptHandledThisShiftRef.current = true;

    const permissions = (navigator as any).permissions;
    if (permissions?.query) {
      permissions
        .query({ name: "geolocation" })
        .then((status: PermissionStatus) => {
          if (status.state === "granted") startWatch();
          else if (status.state === "prompt") setShowPrompt(true);
          // Already denied at the OS/browser level — don't nag with a
          // native prompt that won't appear anyway, but do let consumers
          // (e.g. On-Site Check-In's hint) explain the real blocker instead
          // of showing "waiting for a location fix" forever.
          else if (status.state === "denied") setLiveLocation({ permissionDenied: true });
        })
        .catch(() => setShowPrompt(true));
    } else {
      // Permissions API unavailable (some Safari versions) — err toward
      // showing the friendly explanation before the native prompt.
      setShowPrompt(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed, clockedIn, profileId]);

  // Stop watching on unmount, whatever state we're in.
  useEffect(() => () => stopWatch(), []);

  if (showPrompt) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
        <div className="panel max-w-sm p-5">
          <h2 className="font-semibold text-sm">Share your location while clocked in?</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            You signed the Employee Mobile App Location Sharing Consent Agreement, which lets AHS see your live location strictly between clock-in and clock-out — for dispatching, routing, and timekeeping. You're never tracked off the clock.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn text-xs px-3 py-1.5" onClick={() => setShowPrompt(false)}>Not now</button>
            <button type="button" className="btn btn-primary text-xs px-3 py-1.5" onClick={startWatch}>Share Location</button>
          </div>
        </div>
      </div>
    );
  }

  // No more floating pill here — the "sharing" state now shows as a small
  // badge on the user's own avatar (Header.tsx / MobileTechApp.tsx), via
  // locationSharingStatus.ts, instead of a fixed-position element that
  // used to sit right on top of the mobile bottom tab bar.
  return null;
}
