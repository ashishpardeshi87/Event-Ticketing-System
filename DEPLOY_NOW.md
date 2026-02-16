# Deploy Now - Quick Start

## 1. Install Firebase CLI (One-time setup)

```bash
npm install -g firebase-tools
```

## 2. Login to Firebase

```bash
firebase login
```

## 3. Deploy Using Scripts

### Windows:
```bash
deploy.bat
```

### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

## 4. Deploy Specific Parts

### Frontend Only:
```bash
# Windows
deploy-hosting-only.bat

# Linux/Mac
firebase deploy --only hosting
```

### Backend Only:
```bash
# Windows
deploy-functions-only.bat

# Linux/Mac
firebase deploy --only functions
```

### Firestore Indexes:
```bash
firebase deploy --only firestore:indexes
```

## 5. Manual Deployment Steps

If scripts don't work:

```bash
# Step 1: Build frontend
cd frontend
npm install
npm run build
cd ..

# Step 2: Deploy
firebase deploy
```

## Your Live URLs

After deployment:
- **Frontend**: https://ts-tickets-c8698.web.app
- **Backend API**: https://us-central1-ts-tickets-c8698.cloudfunctions.net/api

## Troubleshooting

### "Firebase CLI not found"
```bash
npm install -g firebase-tools
```

### "Not logged in"
```bash
firebase login
```

### "Build failed"
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### "Permission denied" (Linux/Mac)
```bash
chmod +x deploy.sh
```

## Update Frontend URL in Code

After first deployment, update `frontend/.env`:
```env
VITE_API_URL=https://us-central1-ts-tickets-c8698.cloudfunctions.net/api
```

Then rebuild and redeploy:
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Monitor Deployment

```bash
# View logs
firebase functions:log

# Check status
firebase projects:list
```

## Need Help?

Check the full guide: `DEPLOYMENT_GUIDE.md`
