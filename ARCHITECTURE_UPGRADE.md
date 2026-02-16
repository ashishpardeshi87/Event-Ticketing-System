# TechFest Platform – Architecture Upgrade (Backward Compatible)

This document summarizes the extensions made to support **multiple passes per user**, **single QR per user**, **per-event attendance**, **volunteer restrictions**, **block mechanism**, and **enhanced scanner payload** without breaking existing APIs, routes, auth, payments, or QR validation.

---

## 1. Multi-Pass & Single QR

- **Before:** One active pass per user; QR token stored on `user_passes`; one token per pass.
- **After:**
  - Users can have **multiple active passes** (e.g. multiple pass types over time).
  - **One QR per user:** A single token resolves to the user; the backend loads all associated data at scan time.
  - New collection: **`user_qr_tokens`** (doc id = `userId`), fields: `userId`, `qrToken`, `updatedAt`.
  - **Lazy migration:** When attaching a second pass, if `user_qr_tokens` has no doc for the user, the existing `user_passes[0].qrToken` is reused and written to `user_qr_tokens`. Old single-pass users keep working; no DB migration script required.
  - **Pass attach:** `attachPassToUser` runs in a **transaction**: get/create user-level token, then create `user_passes` with that token. No “already has active pass” check; payment verification and endpoints unchanged.

---

## 2. QR Verification & Scanner Payload

- **Unchanged:** `POST /api/passes/verify-qr` and `PassService.verifyQRToken` still return the same shape (e.g. `userPassId`, `userId`, `passType`, `userName`, `userEmail`, `passName`, `status`).
- **Resolution:** Token is resolved via:
  1. `user_passes` where `qrToken` = token (legacy and new),
  2. else `user_qr_tokens` where `qrToken` = token → get `userId`.
- **Scanner verify** (`POST /api/attendance/verify`): Now uses `PassService.verifyQRTokenExtended`, which adds **optional** fields to the response (existing fields kept):
  - **`activePasses`:** Array of `{ id, passType, passName, purchasedAt, status }` for active passes.
  - **`attendanceHistory`:** Array of past scans (e.g. `eventId`, `venue`, `status`, `scannedAt`).
  - **`blockStatus`:** `{ blocked, reason?, blockedAt? }`.
- No existing response properties were removed or changed.

---

## 3. Attendance: Per-Event Uniqueness & Block

- **Per-event uniqueness:** When recording attendance with an `eventId`, the backend enforces **at most one record per (userId, eventId)** inside a **transaction** (read existing + create). Duplicate attempt returns: *"Attendance already recorded for this user for this event"*.
- **Block:** New collection **`user_blocks`** (doc id = `userId`), fields: `blocked`, `reason`, `blockedBy`, `blockedAt`. If `blocked === true`, **attendance marking is rejected** (scan and verify still return data; only the “mark present/absent” step is blocked). Login and payment are not affected.
- **Admin:** `POST /api/admin/users/:id/block` (body: `{ reason? }`), `POST /api/admin/users/:id/unblock`.

---

## 4. Volunteer Assignment (Extended)

- **Existing:** `assignedEventIds` on user; volunteer can only mark attendance for those events (or any event if empty).
- **New (optional):** `assignedPassIds` on user (array of pass type IDs). If non-empty, volunteer can only scan users who have at least one active pass whose `passType` is in `assignedPassIds`. If **both** `assignedEventIds` and `assignedPassIds` are empty/missing, behavior is **permissive** (legacy).
- **API:** `PUT /api/admin/users/:id/volunteer-events` body can include `eventIds` and `passIds`; both are optional. `removeVolunteerRole` clears `assignedEventIds` and `assignedPassIds`.

---

## 5. Volunteer Attendance List

- **Before:** Volunteer attendance list could return all attendance records.
- **After:** `GET /api/attendance/volunteer` returns only records where `scannedBy === volunteerId` (filter applied in service).

---

## 6. New / Extended APIs (Additive Only)

| API | Change |
|-----|--------|
| `GET /api/passes/my-passes` | **New.** Returns array of all passes for the current user. |
| `POST /api/admin/users/:id/block` | **New.** Body: `{ reason? }`. |
| `POST /api/admin/users/:id/unblock` | **New.** |
| `PUT /api/admin/users/:id/volunteer-events` | **Extended.** Body: `{ eventIds?, passIds? }`. |
| `POST /api/attendance/verify` | **Extended response.** Same fields + `activePasses`, `attendanceHistory`, `blockStatus`. |
| `POST /api/attendance/scan` | Same contract; enforces per-event uniqueness, block, and volunteer pass/event rules. |

---

## 7. Firestore Collections (Additive)

- **`user_qr_tokens`:** One doc per user; `userId`, `qrToken`, `updatedAt`. Index: `qrToken` (ASC).
- **`user_blocks`:** One doc per user when blocked; `blocked`, `reason`, `blockedBy`, `blockedAt`.
- **`user_passes`:** Unchanged schema; new passes get the user’s single `qrToken` from `user_qr_tokens` (or lazy-migrated from existing pass).
- **`attendance`:** Unchanged schema; uniqueness enforced in code. Composite index added: `userId` (ASC), `eventId` (ASC) for the per-event check.

---

## 8. Deployment Notes

1. **Firestore indexes:** Deploy updated `firestore.indexes.json` (adds `attendance` userId+eventId and `user_qr_tokens` qrToken). Run e.g. `firebase deploy --only firestore:indexes` if you use Firebase CLI.
2. **Backend:** Deploy as usual; no env or config changes required. Existing payment, auth, and pass purchase flows are unchanged.
3. **Frontend:** Optional: use `GET /api/passes/my-passes` and the new scanner fields (`activePasses`, `attendanceHistory`, `blockStatus`) where needed; existing usage continues to work.

---

## 9. Summary

- **Multi-pass:** Supported; single QR per user; token resolved via `user_passes` or `user_qr_tokens`; backend fetches all passes at scan time.
- **Payment / Razorpay:** Unchanged; `attachPassToUser` now allows multiple passes and uses a transaction with user-level token.
- **Attendance:** One record per user per event; block prevents marking only; volunteer event and pass restrictions with permissive fallback.
- **Scanner response:** Extended with optional fields; no existing properties removed or altered.
- **Compatibility:** Old users and single-pass flows remain supported via lazy migration and unchanged API shapes.
