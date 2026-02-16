# Deployment Checklist

## Pre-Deployment

### 1. Code Preparation
- [x] All code committed to GitHub
- [x] `.env` files in `.gitignore`
- [x] `render.yaml` created in root
- [x] `vercel.json` created in frontend folder
- [ ] All tests passing locally
- [ ] No console errors in browser

### 2. Configuration Files Ready
- [x] `backend/package.json` has correct start script
- [x] `frontend/package.json` has correct build script
- [x] Environment variable examples documented

---

## Backend Deployment (Render)

### Step 1: Create Render Account
- [ ] Sign up at https://render.com
- [ ] Connect GitHub account
- [ ] Authorize repository access

### Step 2: Create Web Service
- [ ] Click "New +" → "Web Service"
- [ ] Select `ghanishpatil/ts-tickets` repository
- [ ] Configure service:
  - Name: `ts-tickets-backend`
  - Region: `Singapore`
  - Branch: `main`
  - Root Directory: `backend`
  - Runtime: `Node`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Plan: `Free` (or paid)

### Step 3: Add Environment Variables
Copy these from your local `backend/.env`:

```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app (update after Vercel deployment)

FIREBASE_PROJECT_ID=ts-tickets-c8698
FIREBASE_PRIVATE_KEY_ID=8ec7c499ff5b47a599d65cb7d58363e708b0322f
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@ts-tickets-c8698.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=108627809016246528207
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ts-tickets-c8698.iam.gserviceaccount.com

RAZORPAY_KEY_ID=rzp_live_SFigp5kPAGV65t
RAZORPAY_KEY_SECRET=07RVup632Y0jlh9qi3UEhp6c
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

JWT_SECRET=techfest_jwt_secret_key_2024_secure_random_string
```

- [ ] All environment variables added
- [ ] `FIREBASE_PRIVATE_KEY` has correct format with `\n`
- [ ] No extra spaces or line breaks

### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (3-5 minutes)
- [ ] Note your backend URL: `https://ts-tickets-backend.onrender.com`

### Step 5: Test Backend
- [ ] Visit: `https://your-backend-url.onrender.com/api/health`
- [ ] Should see: `{"status":"ok"}`

---

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
- [ ] Sign up at https://vercel.com
- [ ] Connect GitHub account
- [ ] Authorize repository access

### Step 2: Import Project
- [ ] Click "Add New..." → "Project"
- [ ] Select `ghanishpatil/ts-tickets` repository
- [ ] Configure:
  - Framework: `Vite`
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

### Step 3: Add Environment Variables
```
VITE_FIREBASE_API_KEY=AIzaSyCSaFnBSzLml2QjRNOMIm6zD4nmw_XqIcg
VITE_FIREBASE_AUTH_DOMAIN=ts-tickets-c8698.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ts-tickets-c8698
VITE_FIREBASE_STORAGE_BUCKET=ts-tickets-c8698.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=883684541607
VITE_FIREBASE_APP_ID=1:883684541607:web:c6282d559533bdd22cc782
VITE_FIREBASE_MEASUREMENT_ID=G-HSTRNTVMX4
VITE_API_BASE_URL=https://ts-tickets-backend.onrender.com/api
VITE_NODE_ENV=production
VITE_RAZORPAY_KEY_ID=rzp_live_SFigp5kPAGV65t
```

- [ ] All environment variables added
- [ ] `VITE_API_BASE_URL` points to your Render backend URL
- [ ] No trailing slashes in URLs

### Step 4: Deploy
- [ ] Click "Deploy"
- [ ] Wait for deployment (2-3 minutes)
- [ ] Note your frontend URL: `https://ts-tickets.vercel.app`

### Step 5: Test Frontend
- [ ] Visit your Vercel URL
- [ ] Should see login/register page
- [ ] No console errors

---

## Post-Deployment Configuration

### 1. Update Backend CORS
- [ ] Go to Render → Your service → Environment
- [ ] Update `FRONTEND_URL` to your Vercel URL
- [ ] Save (will trigger redeploy)

### 2. Update Firebase Authorized Domains
- [ ] Go to Firebase Console
- [ ] Authentication → Settings → Authorized domains
- [ ] Add your Vercel domain (e.g., `ts-tickets.vercel.app`)
- [ ] Save

### 3. Configure Razorpay Webhook
- [ ] Go to Razorpay Dashboard
- [ ] Settings → Webhooks → Create New
- [ ] Webhook URL: `https://your-backend.onrender.com/api/payments/webhook`
- [ ] Generate and save webhook secret
- [ ] Select events: `payment.captured`, `payment.failed`, `refund.processed`
- [ ] Create webhook
- [ ] Update `RAZORPAY_WEBHOOK_SECRET` in Render

---

## Testing Checklist

### Basic Functionality
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboard loads
- [ ] Can view passes
- [ ] Can view events

### Payment Flow
- [ ] Can click "Purchase Pass"
- [ ] Razorpay modal opens
- [ ] Can complete test payment
- [ ] Pass is activated after payment
- [ ] Can view pass on "My Pass" page
- [ ] QR code displays

### Event Registration
- [ ] Can view events list
- [ ] Can click "Register" on event
- [ ] Registration type modal appears
- [ ] Can select "Individual"
- [ ] Registration form appears
- [ ] Can submit form
- [ ] Razorpay modal opens
- [ ] Can complete payment
- [ ] Registration is confirmed

### Admin Features (if admin user)
- [ ] Can access admin dashboard
- [ ] Can create/edit passes
- [ ] Can create/edit events
- [ ] Can view payments
- [ ] Can view registrations

---

## Monitoring Setup

### Render
- [ ] Check "Logs" tab for errors
- [ ] Set up email notifications
- [ ] Monitor resource usage

### Vercel
- [ ] Check deployment logs
- [ ] Set up error notifications
- [ ] Monitor bandwidth usage

---

## Security Checklist

- [ ] All sensitive keys in environment variables (not in code)
- [ ] `.env` files not committed to Git
- [ ] CORS configured correctly
- [ ] Firebase security rules configured
- [ ] HTTPS enabled (automatic)
- [ ] Razorpay webhook signature verification enabled
- [ ] Strong JWT secret used

---

## Performance Optimization

### Backend (Render)
- [ ] Consider upgrading from free tier if needed
- [ ] Monitor response times
- [ ] Check for memory issues

### Frontend (Vercel)
- [ ] Images optimized
- [ ] Code splitting enabled (Vite default)
- [ ] Lazy loading implemented where needed

---

## Backup and Recovery

- [ ] Firebase automatic backups enabled
- [ ] Document all environment variables
- [ ] Keep local `.env` files backed up securely
- [ ] Document deployment process

---

## Common Issues and Solutions

### Issue: Backend not responding
**Check:**
- Render service is running
- Environment variables are set
- Logs for errors
- Health endpoint responds

### Issue: Frontend can't connect to backend
**Check:**
- `VITE_API_BASE_URL` is correct
- CORS is configured
- Backend is running
- Network tab in browser for errors

### Issue: Payment fails
**Check:**
- Razorpay keys are correct
- Webhook is configured
- Backend logs for payment errors
- Webhook secret is set

### Issue: Firebase auth fails
**Check:**
- Firebase config is correct
- Authorized domains include Vercel URL
- Firebase project is active

---

## Rollback Plan

If deployment fails:

1. **Vercel**: Click "Deployments" → Previous deployment → "Promote to Production"
2. **Render**: Click "Manual Deploy" → Select previous commit
3. **Environment Variables**: Keep backup of all env vars
4. **Database**: Firebase has automatic backups

---

## Success Criteria

✅ Backend deployed and responding
✅ Frontend deployed and loading
✅ User can register and login
✅ Pass purchase works end-to-end
✅ Event registration works
✅ Payments are processed correctly
✅ Admin dashboard accessible
✅ No console errors
✅ All features working as expected

---

## Next Steps After Deployment

1. **Monitor for 24 hours**: Check logs regularly
2. **Test all features**: Run through complete user journey
3. **Set up analytics**: Add Google Analytics or similar
4. **Document issues**: Keep track of any bugs
5. **Plan updates**: Set up CI/CD for future deployments
6. **User testing**: Get feedback from real users
7. **Performance monitoring**: Set up APM tools if needed

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Razorpay Docs**: https://razorpay.com/docs

---

## Deployment Complete! 🎉

Your TechFest Ticketing System is now live!

- **Frontend**: https://ts-tickets.vercel.app
- **Backend**: https://ts-tickets-backend.onrender.com
- **Admin**: https://ts-tickets.vercel.app/admin

Remember to:
- Monitor logs regularly
- Keep environment variables secure
- Update dependencies periodically
- Back up your data
