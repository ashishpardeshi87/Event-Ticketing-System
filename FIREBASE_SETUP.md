# Firebase Setup Guide for TechFest Platform

Your Firebase project is already configured with the following details:
- **Project ID**: `techfest-tickets`
- **Auth Domain**: `techfest-tickets.firebaseapp.com`
- **Storage Bucket**: `techfest-tickets.firebasestorage.app`

## 🔥 Frontend Configuration (Already Done)

The frontend `.env` file has been created with your Firebase web app configuration.

## 🔧 Backend Configuration (Required)

You need to set up the Firebase Admin SDK for the backend. Follow these steps:

### 1. Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **techfest-tickets**
3. Click on **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### 2. Configure Backend Environment

Create `backend/.env` file with the service account details:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Firebase Admin SDK (Extract from downloaded JSON)
FIREBASE_PROJECT_ID=techfest-tickets
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_from_json
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_from_json\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@techfest-tickets.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id_from_json
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40techfest-tickets.iam.gserviceaccount.com

# Razorpay Configuration (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Extract Values from Service Account JSON

The downloaded JSON file will look like this:
```json
{
  "type": "service_account",
  "project_id": "techfest-tickets",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@techfest-tickets.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

Copy the values to your `.env` file:
- `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and newlines)
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `client_id` → `FIREBASE_CLIENT_ID`
- `client_x509_cert_url` → `FIREBASE_CLIENT_X509_CERT_URL`

## 🔐 Enable Authentication Methods

1. In Firebase Console, go to **Authentication**
2. Click **Sign-in method** tab
3. Enable:
   - **Email/Password**
   - **Google** (configure OAuth consent screen)

## 🗄️ Set up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select a location (choose closest to your users)

## 📦 Enable Storage

1. In Firebase Console, go to **Storage**
2. Click **Get started**
3. Choose **Start in test mode**
4. Select same location as Firestore

## 💳 Razorpay Setup (Optional for now)

1. Create account at [Razorpay](https://razorpay.com)
2. Get API keys from dashboard
3. Add to both frontend and backend `.env` files
4. Configure webhook URL: `https://your-backend-url/api/payments/webhook`

## 🚀 Test the Setup

1. Start the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Visit `http://localhost:3000`
4. Try registering a new account
5. Check Firebase Console to see if user was created

## 🔍 Troubleshooting

### Common Issues:

1. **"Firebase Admin SDK not initialized"**
   - Check if service account JSON values are correctly copied
   - Ensure private key includes proper newlines

2. **"CORS Error"**
   - Backend should be running on port 5000
   - Frontend should be on port 3000

3. **"Authentication Error"**
   - Check if Email/Password is enabled in Firebase Console
   - Verify API keys are correct

4. **"Firestore Permission Denied"**
   - Ensure Firestore is in test mode
   - Check security rules allow read/write

## 📝 Security Rules (For Production)

Update Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events are readable by all authenticated users
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Add more rules as needed...
  }
}
```

## ✅ Verification Checklist

- [ ] Firebase project created and configured
- [ ] Service account key downloaded and configured
- [ ] Authentication methods enabled
- [ ] Firestore database created
- [ ] Storage enabled
- [ ] Backend `.env` file configured
- [ ] Frontend `.env` file configured (already done)
- [ ] Both servers start without errors
- [ ] User registration works
- [ ] User appears in Firebase Console

Once you complete these steps, your TechFest platform will be fully connected to Firebase!