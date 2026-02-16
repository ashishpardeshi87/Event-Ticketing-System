 # Firebase Deployment Guide

Complete guide to deploy your TechFest platform to Firebase using CLI.

## Prerequisites

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Verify your project**
   ```bash
   firebase projects:list
   ```

## Deployment Options

### Option 1: Deploy Everything (Recommended for first deployment)

```bash
# Build frontend
cd frontend
npm run build
cd ..

# Deploy everything (hosting, functions, firestore rules & indexes)
firebase deploy
```

### Option 2: Deploy Specific Components

#### Deploy Frontend Only (Hosting)
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

#### Deploy Backend Only (Cloud Functions)
```bash
firebase deploy --only functions
```

#### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

#### Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

## Step-by-Step Deployment

### 1. Initial Setup (First Time Only)

```bash
# Initialize Firebase in your project (if not already done)
firebase init

# Select:
# - Hosting
# - Functions
# - Firestore
# - Storage (for admin banner uploads)
```

**Enable Firebase Storage** (for admin banner image uploads):
1. Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Storage
2. Click "Get Started" if Storage is not enabled
3. Deploy Storage rules: `firebase deploy --only storage` (using `storage.rules` in project root)
4. Ensure `VITE_FIREBASE_STORAGE_BUCKET` is set in frontend `.env` (e.g. `your-project.appspot.com`)

### 2. Configure Environment Variables

#### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=ts-tickets-c8698.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ts-tickets-c8698
VITE_FIREBASE_STORAGE_BUCKET=ts-tickets-c8698.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=https://us-central1-ts-tickets-c8698.cloudfunctions.net/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

#### Backend (Firebase Functions Config)
```bash
# Set environment variables for Cloud Functions
firebase functions:config:set \
  razorpay.key_id="your_razorpay_key_id" \
  razorpay.key_secret="your_razorpay_secret"

# View current config
firebase functions:config:get
```

### 3. Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

This creates `frontend/dist` folder with production build.

### 4. Prepare Backend for Cloud Functions

Update `backend/package.json` to add:
```json
{
  "engines": {
    "node": "18"
  },
  "main": "src/server.js"
}
```

### 5. Deploy

```bash
# Deploy everything
firebase deploy

# Or deploy individually
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

### 6. Verify Deployment

```bash
# Get your hosting URL
firebase hosting:channel:list

# Your app will be at:
# https://ts-tickets-c8698.web.app
# or
# https://ts-tickets-c8698.firebaseapp.com
```

## Quick Deploy Scripts

### Windows (deploy.bat)
```batch
@echo off
echo Building frontend...
cd frontend
call npm run build
cd ..

echo Deploying to Firebase...
firebase deploy

echo Deployment complete!
pause
```

### Linux/Mac (deploy.sh)
```bash
#!/bin/bash
echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Deploying to Firebase..."
firebase deploy

echo "Deployment complete!"
```

## Deployment Commands Reference

```bash
# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only firestore rules
firebase deploy --only firestore:rules

# Deploy only firestore indexes
firebase deploy --only firestore:indexes

# Deploy with message
firebase deploy -m "Deployment message"

# Preview before deploying
firebase hosting:channel:deploy preview

# View deployment history
firebase hosting:releases:list
```

## Cloud Functions Deployment

For backend API as Cloud Functions, you need to modify the backend structure:

### Create `backend/index.js`:
```javascript
const functions = require('firebase-functions');
const app = require('./src/server.js');

exports.api = functions.https.onRequest(app);
```

Then deploy:
```bash
firebase deploy --only functions
```

Your API will be available at:
`https://us-central1-ts-tickets-c8698.cloudfunctions.net/api`

## Alternative: Deploy Backend to Other Services

If you prefer not to use Cloud Functions:

### Deploy Backend to Render/Railway/Heroku

1. **Render.com** (Recommended)
   - Connect GitHub repo
   - Select `backend` folder
   - Set environment variables
   - Deploy

2. **Railway.app**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Heroku**
   ```bash
   heroku login
   heroku create techfest-api
   git subtree push --prefix backend heroku main
   ```

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend API responding
- [ ] Firestore rules deployed
- [ ] Firestore indexes created
- [ ] Environment variables set
- [ ] CORS configured for production domain
- [ ] Test authentication flow
- [ ] Test payment integration
- [ ] Monitor Cloud Functions logs

## Monitoring & Logs

```bash
# View function logs
firebase functions:log

# View hosting logs
firebase hosting:channel:list

# Real-time logs
firebase functions:log --only api
```

## Rollback

```bash
# List previous releases
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:rollback
```

## Cost Optimization

1. **Hosting**: Free tier includes 10GB storage, 360MB/day transfer
2. **Cloud Functions**: Free tier includes 2M invocations/month
3. **Firestore**: Free tier includes 50K reads, 20K writes per day

Monitor usage:
```bash
firebase projects:list
# Then check Firebase Console → Usage
```

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### Functions Deploy Fails
```bash
# Check Node version
node --version  # Should be 18.x

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### CORS Issues
Update `backend/src/server.js` CORS config to include production domain:
```javascript
const allowedOrigins = [
  'https://ts-tickets-c8698.web.app',
  'https://ts-tickets-c8698.firebaseapp.com',
  'http://localhost:3000'
]
```

## Custom Domain (Optional)

1. Go to Firebase Console → Hosting → Add custom domain
2. Follow DNS configuration steps
3. Wait for SSL certificate provisioning (24-48 hours)

```bash
# Add custom domain via CLI
firebase hosting:sites:create your-domain
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
          
      - name: Build
        run: |
          cd frontend
          npm run build
          
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Get Firebase token:
```bash
firebase login:ci
```

Add token to GitHub Secrets as `FIREBASE_TOKEN`.

## Support

For issues:
1. Check Firebase Console logs
2. Run `firebase debug` for detailed logs
3. Check [Firebase Status](https://status.firebase.google.com/)

## Quick Commands Summary

```bash
# Login
firebase login

# Deploy all
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions

# View logs
firebase functions:log

# Rollback
firebase hosting:rollback
```
