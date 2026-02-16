# Firestore Rules Setup – Fix "User in Auth but not in DB"

## Why users were in Authentication but not in Firestore

1. **Firestore security rules** were blocking client-side writes. The app writes the user document from the browser with `setDoc(doc(db, 'users', uid), data)`. If rules don’t allow it, the write fails and you get a user in Auth but no document in the `users` collection.
2. **Registration order** – `pendingUserData` was saved to localStorage only after signup, so when `onAuthStateChanged` ran it didn’t have the extra profile fields yet. This is now fixed (we save before signup).

## What was changed in the project

- **`firestore.rules`** added so each user can read/write only their own `users/{userId}` document.
- **Security (least privilege):** `events`, `passes`, `teams`, `payments`, and `registrations` are **backend-only** in Firestore (client `read, write: if false`). All access goes through the API so auth, ownership, and validation are enforced in one place. Only `users` allows limited client access so the app can create/update the profile after signup.
- **Backend** – `GET /api/auth/profile` now creates the user document in Firestore if it’s missing (using Firebase Admin), so existing Auth-only users get a doc on first profile load.
- **Register page** – `pendingUserData` is stored in localStorage **before** calling `signUpWithEmail`, so the full profile can be written to Firestore when the auth state listener runs.
- **AuthContext** – If reading/creating the user doc in Firestore fails, it falls back to calling the backend `getProfile`, which creates the doc and returns the profile.

## Deploy Firestore rules (required for new signups to write to Firestore)

You need to deploy the rules in `firestore.rules` to your Firebase project.

### Option A: Firebase Console (quick)

1. Open [Firebase Console](https://console.firebase.google.com) → project **techfest-tickets**.
2. Go to **Firestore Database** → **Rules**.
3. Replace the rules with the contents of `firestore.rules` in this repo (or at least the `users` rule below).
4. Click **Publish**.

Minimal rule so users can write their own document:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Option B: Firebase CLI

1. Install CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. In the project root (where `firestore.rules` is):
   - `firebase init firestore` (choose existing project `techfest-tickets`, keep `firestore.rules` as rules file)
   - Or if already initialized: `firebase deploy --only firestore:rules`

After deployment, new registrations will create the user document in Firestore from the client. Existing users who only exist in Auth will get a document the first time the backend `getProfile` is called (e.g. when they open the app or dashboard).

## Fixing the user that’s already in Auth but not in DB

For **ghanishpatil56@gmail.com** (or any user that already exists in Auth but not in Firestore):

1. Deploy the rules (above).
2. Ensure the backend is running.
3. Log in on the app with that account.
4. Open a page that loads the profile (e.g. dashboard). The app will call `GET /api/auth/profile`. The backend will see there is no Firestore document for that UID and will create it from Auth (email, displayName, photoURL, etc.).
5. Refresh the Firestore **Data** tab – you should see a `users` collection and a document with that user’s UID.

No need to register again; the document is created on first profile load after the backend and rules changes are in place.
