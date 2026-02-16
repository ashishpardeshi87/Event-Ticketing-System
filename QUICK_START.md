# 🚀 Quick Start Guide

Your Firebase configuration is complete! Follow these steps to get your TechFest platform running.

## ✅ What's Already Done

- ✅ Firebase web app configuration (frontend)
- ✅ Firebase Admin SDK configuration (backend)
- ✅ Environment files created with your credentials
- ✅ Sample data initialization ready

## 🔥 Firebase Console Setup (Required)

Before starting the servers, you need to enable services in Firebase Console:

### 1. Enable Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/project/techfest-tickets)
2. **Authentication** → **Sign-in method**
3. Enable:
   - ✅ **Email/Password**
   - ✅ **Google** (configure OAuth consent screen)

### 2. Create Firestore Database
1. **Firestore Database** → **Create database**
2. Choose **Start in test mode**
3. Select location (choose closest to your region)

### 3. Enable Storage
1. **Storage** → **Get started**
2. Choose **Start in test mode**
3. Select same location as Firestore

## 🖥️ Start the Application

### Option 1: Using Startup Scripts

**Windows:**
```bash
# Terminal 1 - Backend
start-backend.bat

# Terminal 2 - Frontend
start-frontend.bat
```

**Linux/Mac:**
```bash
# Terminal 1 - Backend
chmod +x start-backend.sh
./start-backend.sh

# Terminal 2 - Frontend
chmod +x start-frontend.sh
./start-frontend.sh
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 📊 Initialize Sample Data

After both servers are running, initialize sample data:

```bash
# Using curl (Windows/Linux/Mac)
curl -X POST http://localhost:5000/initialize-data

# Or visit in browser
http://localhost:5000/initialize-data
```

This will create:
- 3 pass types (Single Day, Multi Day, VIP)
- 5 sample events (Code Sprint, AI/ML Workshop, Cultural Night, etc.)

## 👤 Create Your First Account

1. Visit http://localhost:3000
2. Click **Sign up**
3. Register with email/password or Google
4. You'll be redirected to the dashboard

## 🔐 Make Yourself Admin (Optional)

To access admin features, make your account an admin:

1. Register your account first
2. Note your email address
3. In backend terminal, run:
   ```bash
   # This is a manual process - you'll need to add this to your code
   # Or update the user role directly in Firebase Console
   ```

## 🧪 Test the Platform

### Test Authentication
- ✅ Register new account
- ✅ Login with email/password
- ✅ Login with Google
- ✅ Access dashboard

### Test Events
- ✅ View events list
- ✅ Filter by category
- ✅ Register for free events

### Test Passes
- ✅ View available passes
- ✅ See pass details and features

### Test Teams
- ✅ Create a team
- ✅ View team details
- ✅ Join public teams

## 🔧 Troubleshooting

### Backend Won't Start
- Check if Firebase credentials are correct in `backend/.env`
- Ensure port 5000 is not in use
- Check console for error messages

### Frontend Connection Error
- Ensure backend is running on port 5000
- Check if `VITE_API_BASE_URL` is correct in `frontend/.env`
- Try refreshing the page

### Firebase Authentication Error
- Verify Email/Password is enabled in Firebase Console
- Check if Google sign-in is properly configured
- Ensure Firebase config is correct

### "Permission Denied" in Firestore
- Make sure Firestore is in test mode
- Check if database was created properly

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Both servers start without errors
- ✅ Frontend shows "Connected" status
- ✅ You can register and login
- ✅ Sample data loads (events and passes visible)
- ✅ No console errors in browser

## 📱 Next Steps

Once everything is working:

1. **Customize the UI** - Update colors, branding, content
2. **Add Razorpay** - Set up payment processing
3. **Configure Email** - Set up email notifications
4. **Add Real Events** - Replace sample data with actual events
5. **Deploy** - Deploy to production when ready

## 🆘 Need Help?

If you encounter issues:
1. Check the console logs (both frontend and backend)
2. Verify Firebase Console settings
3. Ensure all environment variables are set
4. Try restarting both servers

Your TechFest platform is ready to go! 🎊