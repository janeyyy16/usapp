# Login / Firebase Setup

The merged app uses the collaborator's Firebase authentication.

## Option A — Test now with DEMO accounts (no setup)
If no Firebase credentials are present, login falls back to built-in demo accounts.
Password for all: **demo123**
- admin@ahsolutions.com  (full access)
- hr@ahs.com             (HR dashboards)
- csr1@ahs.com           (CSR agent — personal view + To-Do)
- csr.tl@ahs.com         (CSR Team Leader dashboard)
- csr.mngr@ahs.com       (CSR Manager / Raul — approvals)
- po@ahs.com             (Parts)
- fnnc@ahs.com           (Finance)

Leave COMPANY ID as-is (it's ignored in demo mode).

## Option B — Real Firebase login
1. Copy `.env.example` to `.env`
2. Fill in your Firebase project's VITE_FIREBASE_* values
   (Firebase Console > Project Settings > Your apps > Web app config)
3. Restart `npm run dev`
See FIREBASE_QUICK_START.md and FIREBASE_SETUP.md for full backend setup.
