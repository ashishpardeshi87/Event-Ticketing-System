# Complete Deployment Guide: Vercel (Frontend) + Render (Backend)

## Overview
- **Frontend**: Deploy to Vercel (React + Vite)
- **Backend**: Deploy to Render (Node.js + Express)
- **Database**: Firebase Firestore (already configured)
- **Payment**: Razorpay (already configured)

---

## Part 1: Backend Deployment on Render

### Step 1: Prepare Backend for Deployment

#### 1.1 Update package.json
Ensure your `backend/package.json` has the correct start script:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 1.2 Create render.yaml (Optional but Recommended)
Create `render.yaml` in the root directory:

```yaml
services:
  - type: web
    name: ts-tickets-backend
    env: node
    region: singapore
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
```

### Step 2: Sign Up and Create Service on Render

1. Go to https://render.com/
2. Click "Get Started" or "Sign Up"
3. Sign up with GitHub (recommended for easy deployment)
4. Authorize Render to access your GitHub repositories

### Step 3: Create New Web Service

1. Click "New +" button → "Web Service"
2. Connect your GitHub repository: `ghanishpatil/ts-tickets`
3. Configure the service:
   - **Name**: `ts-tickets-backend`
   - **Region**: Singapore (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### Step 4: Add Environment Variables on Render

Click "Environment" tab and add these variables:

```
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-app.vercel.app

# Firebase Configuration
FIREBASE_PROJECT_ID=ts-tickets-c8698
FIREBASE_PRIVATE_KEY_ID=8ec7c499ff5b47a599d65cb7d58363e708b0322f
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+6kRpAk6Iz2mM\nAdkrj5RexFz+lLv3HFFDmGFLhSPMiGE70RegMNY7VsbN41KaS3rCEHy1ECDsCYfA\nsJvMCSaECwAnstvJL+HzlJgx0sO8S8LXerUUFykCzl86+7oF+JrKPZX6oZ0r8KKx\nFWjDWEjQHRv7DHyBvdpnK2GwDxg+Vikj9ZtIzb0/9BGavHnqg1nayq/7Xnob6Qzr\n00eMquDsJad5EX+9ct5K4eCBSQpkji9n/H1EVIlAIkAAuFMCxiqJAcOJGsBqt35N\nTWKADsN8VU/od3OC3JdA1HljdNqVKBy3fCsQawuveKG7bksFfACztHFK+lnIPIcv\nfzbrOhGDAgMBAAECggEAOjQZnxoA71yshO6bUth3F10uLL8Tfwa3D7CJGQkCHP0H\nB8F7Pm8lIPoXqfU/3aJdToTQQDMmlk9hf7FYDiBMCb2A0pmIwBFFBYmrzKTA38sJ\nH8BdLD7TVfOsvMK5t9BPAJE+BCb5T8gREYPBaKylpiz5ttPbsYI773AeXBp9/aKo\nIzxUlrm6GbUUqftdCA0abzBb1C7pwxHIeafYwZsNr/cvdBOkCpqguRugjYjPH9CD\nf4+K6Qn7ML7VZOxzk21N15H8pnNjlEyykT6m+EJ/9tXTcIZLgkDWPvl2TzPEFpJk\nAZr+2ai8QMzBNBPEat6bfq9rbN6930wFl+rGtuvcgQKBgQDeTPhpwUBaM2/37RqW\n+vIrHbruomTo2JzDaHME2m8PpTVg0Fqs8h/6PzNpUinai/rPM9+FbLiCuGV5eerX\n9yhnAcc9McMJSNI+CZgvaj0DGnJ04+I14yidEgEbtNZoY2KBGJzNcbMb6JCRrBt5\n5Y6t1dZcwthSrsEFS7vawK4asQKBgQDb20nD3SnYrYG2XYa8ZwGlsF3f8AdHIM/N\nv6SziGpCmy84UXHjk2z8fvDqysEh5c2bJDzQk4lQ3GDn5O10fJ0vCsryrkOmbbFL\n+ePwHSEjBh+cQZnaV9gnfc68pGSx68g9a7yPbYXJ1NV77t54YADsMaA+gLmYAw+2\n736zbOJUcwKBgFwBFz8N0IiEiW7fHwYlzlyx7VAevgzwudDWReRYU2byRWlQUncJ\nrtpvleOdMd1V2fQvz+701Fil4LmqD9xaWspnHgLhuYr6LKmoZugY3C+QnpZqSpFq\n9sArV3IUIjkKCRbNDPiqeiqu0ka4KJcGv0qLGjFCIy31TcXXVmRvIp/BAoGABJGw\nHMPx5LDmazXSYQP7AsiBiu/gFthVuT7sW1bQboXvG0qGBWbA8xZoR1jjXqL5/Olp\n4iPOzMFnuioFzU/xrFKbGSQJ/+Fzt9J/rDPOxn2QFp0+Z01ADsIMk9sOxKvTw4MD\nri9mgmVL8oFqWjIUktQNMn9WXBRkNTcQ+QWgRoUCgYEArGhUcT0dlRFLc2L3jghF\nu/1P3jo2ZyWurN8OrOG2xyzxTtpo1Y5d/iectir1+/fTruxjQbO1jd6kaAZA0wEG\nqsLfkh1YvkA+cpcn5U8GD/Y96I81TLIuoZKsX11LK56uYvPBEUTqIOVG3KMKB7n0\nwt8nHsY/i6ONr9428TuDJoc=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@ts-tickets-c8698.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=108627809016246528207
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ts-tickets-c8698.iam.gserviceaccount.com

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_live_SFigp5kPAGV65t
RAZORPAY_KEY_SECRET=07RVup632Y0jlh9qi3UEhp6c
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# JWT Configuration
JWT_SECRET=techfest_jwt_secret_key_2024_secure_random_string
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`, keep the quotes and newlines (`\n`)
- Copy exactly as shown above
- Don't add extra spaces or line breaks

### Step 5: Deploy Backend

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Start the server
3. Wait 3-5 minutes for deployment
4. You'll get a URL like: `https://ts-tickets-backend.onrender.com`

### Step 6: Test Backend

Open your browser and test:
```
https://ts-tickets-backend.onrender.com/api/health
```

You should see: `{"status":"ok"}`

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Deployment

#### 1.1 Update Frontend Environment Variables

Your frontend needs to know the backend URL. Update `frontend/.env.example`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCSaFnBSzLml2QjRNOMIm6zD4nmw_XqIcg
VITE_FIREBASE_AUTH_DOMAIN=ts-tickets-c8698.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ts-tickets-c8698
VITE_FIREBASE_STORAGE_BUCKET=ts-tickets-c8698.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=883684541607
VITE_FIREBASE_APP_ID=1:883684541607:web:c6282d559533bdd22cc782
VITE_FIREBASE_MEASUREMENT_ID=G-HSTRNTVMX4

# API Configuration - UPDATE THIS WITH YOUR RENDER URL
VITE_API_BASE_URL=https://ts-tickets-backend.onrender.com/api

# Environment
VITE_NODE_ENV=production

# Razorpay (Frontend)
VITE_RAZORPAY_KEY_ID=rzp_live_SFigp5kPAGV65t
```

#### 1.2 Create vercel.json

Create `vercel.json` in the `frontend` directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 2: Sign Up and Deploy on Vercel

1. Go to https://vercel.com/
2. Click "Sign Up" → Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 3: Import Project

1. Click "Add New..." → "Project"
2. Import `ghanishpatil/ts-tickets` repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 4: Add Environment Variables on Vercel

In the "Environment Variables" section, add:

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

**Important:** Replace `https://ts-tickets-backend.onrender.com` with your actual Render backend URL!

### Step 5: Deploy Frontend

1. Click "Deploy"
2. Vercel will:
   - Install dependencies
   - Build the project
   - Deploy to CDN
3. Wait 2-3 minutes
4. You'll get a URL like: `https://ts-tickets.vercel.app`

---

## Part 3: Update CORS and URLs

### Step 1: Update Backend CORS

Go back to Render dashboard → Your backend service → Environment

Update `FRONTEND_URL`:
```
FRONTEND_URL=https://ts-tickets.vercel.app
```

Click "Save Changes" - Render will automatically redeploy.

### Step 2: Update Firebase Authorized Domains

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `ts-tickets-c8698`
3. Go to Authentication → Settings → Authorized domains
4. Add your Vercel domain: `ts-tickets.vercel.app`
5. Click "Add domain"

---

## Part 4: Configure Razorpay Webhook (Important!)

### Step 1: Set Up Webhook on Razorpay

1. Go to Razorpay Dashboard: https://dashboard.razorpay.com/
2. Go to Settings → Webhooks
3. Click "Create New Webhook"
4. Configure:
   - **Webhook URL**: `https://ts-tickets-backend.onrender.com/api/payments/webhook`
   - **Secret**: Generate a random string (save this!)
   - **Events**: Select:
     - `payment.captured`
     - `payment.failed`
     - `refund.processed`
5. Click "Create Webhook"

### Step 2: Update Backend with Webhook Secret

Go to Render → Your backend → Environment

Update:
```
RAZORPAY_WEBHOOK_SECRET=your_generated_webhook_secret
```

---

## Part 5: Testing Deployment

### Test Checklist

1. **Frontend Loads**
   - Visit: `https://ts-tickets.vercel.app`
   - Should see login/register page

2. **User Registration**
   - Create a new account
   - Should receive Firebase auth

3. **Backend Connection**
   - After login, check browser console
   - Should see API calls to Render backend

4. **Pass Purchase**
   - Go to Passes page
   - Click "Purchase Pass"
   - Razorpay modal should open
   - Complete test payment
   - Pass should be activated

5. **Event Registration**
   - Go to Events page
   - Register for an event
   - Payment should work
   - Registration should be confirmed

---

## Part 6: Custom Domain (Optional)

### For Vercel (Frontend)

1. Go to Vercel Dashboard → Your project → Settings → Domains
2. Add your custom domain (e.g., `tickets.techfest.com`)
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (5-30 minutes)

### For Render (Backend)

1. Go to Render Dashboard → Your service → Settings
2. Scroll to "Custom Domain"
3. Add your API subdomain (e.g., `api.techfest.com`)
4. Update DNS records as instructed
5. Update `VITE_API_BASE_URL` in Vercel to use new domain

---

## Part 7: Monitoring and Logs

### Render Logs

1. Go to Render Dashboard → Your service
2. Click "Logs" tab
3. Monitor real-time logs
4. Check for errors

### Vercel Logs

1. Go to Vercel Dashboard → Your project
2. Click "Deployments"
3. Click on latest deployment
4. View build and runtime logs

---

## Troubleshooting

### Issue: Frontend can't connect to backend

**Solution:**
1. Check `VITE_API_BASE_URL` in Vercel environment variables
2. Ensure backend is running on Render
3. Check CORS settings in backend
4. Verify `FRONTEND_URL` in Render matches Vercel URL

### Issue: Payment fails

**Solution:**
1. Check Razorpay keys are correct
2. Verify webhook is configured
3. Check Render logs for payment errors
4. Ensure `RAZORPAY_WEBHOOK_SECRET` is set

### Issue: Firebase auth fails

**Solution:**
1. Check Firebase config in Vercel
2. Verify authorized domains in Firebase Console
3. Ensure all Firebase env variables are set correctly

### Issue: Backend crashes on Render

**Solution:**
1. Check Render logs for errors
2. Verify all environment variables are set
3. Check `FIREBASE_PRIVATE_KEY` has correct format with `\n`
4. Ensure Node version is compatible (18+)

---

## Cost Breakdown

### Free Tier Limits

**Render Free:**
- 750 hours/month
- Spins down after 15 min inactivity
- 512 MB RAM
- Shared CPU

**Vercel Free:**
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Global CDN

### Recommended Upgrades for Production

**Render ($7/month):**
- Always on (no spin down)
- 512 MB RAM
- Better performance

**Vercel Pro ($20/month):**
- More bandwidth
- Better analytics
- Priority support

---

## Security Checklist

- [ ] All environment variables set correctly
- [ ] Firebase authorized domains configured
- [ ] Razorpay webhook secret set
- [ ] CORS configured properly
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] `.env` files not committed to Git
- [ ] Strong JWT secret used
- [ ] Firebase security rules configured

---

## Next Steps After Deployment

1. **Set up monitoring**: Use Render and Vercel dashboards
2. **Configure alerts**: Set up email notifications for errors
3. **Test thoroughly**: Run through all user flows
4. **Set up backups**: Firebase automatic backups
5. **Monitor costs**: Check usage on both platforms
6. **Set up CI/CD**: Automatic deployments on git push (already configured!)

---

## Support

If you encounter issues:
- Render Support: https://render.com/docs
- Vercel Support: https://vercel.com/docs
- Firebase Support: https://firebase.google.com/support

---

## Summary

✅ Backend deployed on Render
✅ Frontend deployed on Vercel  
✅ Environment variables configured
✅ CORS and domains set up
✅ Razorpay webhook configured
✅ Ready for production use!

Your app is now live at:
- **Frontend**: https://ts-tickets.vercel.app
- **Backend**: https://ts-tickets-backend.onrender.com
