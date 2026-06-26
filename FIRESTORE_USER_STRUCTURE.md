# Firestore User Structure (restructured)

## Before
```
users / {uid}          ← flat. Console only showed cryptic doc IDs.
```
Hard to find a user; you had to open each doc to learn its role.

## After
```
users / {ROLE} / {Active | Inactive} / {uid}
users_index / {uid}     ← flat mirror for fast uid/username/login lookups
```

- Browse `users` → pick a role (ADMIN, CSR, HR, PARTS, FINANCE, MANAGER, ...) →
  pick `Active` or `Inactive` → see that group's users.
- Every field from the Add New User form is stored on each document:
  uid, email, loginName, username, displayName, companyId, role, isActive,
  phoneNumber, employeeId, department, managerName, technicianId,
  assignedBranch, branchAccess, poInitials, requiredCheckIn, requiredCheckOut,
  daysOff, permissions, createdAt, createdBy, updatedAt.
- The unique document ID (uid) is stored as the `uid` FIELD on the doc as well,
  so it's visible at the record level rather than only as the folder key.

## Lookups
- `getUserAccount(uid)` reads `users_index/{uid}` (falls back to legacy `users/{uid}`).
- `getUserByUsername`, `getCompanyUsers`, `getAllUsers` query `users_index`
  (which holds every user with all fields, so role/company/username filters work).

## Existing users (one-time migration)
Older accounts written to the flat `users/{uid}` path still work via the
fallback in `getUserAccount`. To move them into the grouped structure, re-save
them (or run a migration that copies each `users/{uid}` doc to
`users/{role}/{status}/{uid}` and `users_index/{uid}`).

## Security rules
`firestore.rules` now has explicit matches for
`users/{role}/{status}/{uid}` and `users_index/{uid}`.
