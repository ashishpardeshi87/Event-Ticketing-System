# TechFest Platform - Project Context & Architecture

## 📋 Project Overview

**TechFest Platform** is a production-ready full-stack web application for National-Level Techfest Participation & Ticketing Platform. It's designed to handle 3000+ concurrent users with a modern, scalable architecture.

### Key Technologies
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication (Email/Password + Google OAuth)
- **Storage**: Firebase Storage
- **Payments**: Razorpay Integration
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6

---

## 🏗️ Architecture Overview

### High-Level Architecture
```
┌─────────────────┐         ┌─────────────────┐
│   React Frontend │ ◄─────► │  Express Backend │
│   (Port 3000)    │  HTTP   │   (Port 5000)    │
└────────┬─────────┘         └────────┬─────────┘
         │                             │
         │                             │
    ┌────▼─────────────────────────────▼────┐
    │         Firebase Services              │
    │  ┌──────────┐  ┌──────────┐          │
    │  │ Firestore │  │   Auth   │          │
    │  └──────────┘  └──────────┘          │
    │  ┌──────────┐  ┌──────────┐          │
    │  │ Storage  │  │ Admin SDK│          │
    │  └──────────┘  └──────────┘          │
    └───────────────────────────────────────┘
```

---

## 📁 Project Structure

### Root Directory
```
techfest-platform/
├── frontend/              # React frontend application
├── backend/               # Node.js backend API
├── README.md              # Main project documentation
├── QUICK_START.md         # Quick setup guide
├── FIREBASE_SETUP.md      # Firebase configuration guide
├── IMPLEMENTATION_STATUS.md # Development status
├── start-frontend.bat     # Windows frontend startup script
├── start-backend.bat      # Windows backend startup script
├── start-frontend.sh      # Linux/Mac frontend startup script
└── start-backend.sh       # Linux/Mac backend startup script
```

---

## 🎨 Frontend Architecture

### Directory Structure
```
frontend/
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Main app component with routing
│   ├── index.css                   # Global styles
│   │
│   ├── api/                        # API client and services
│   │   ├── client.js               # Axios instance with interceptors
│   │   └── services/
│   │       ├── authService.js      # Auth API calls
│   │       ├── eventService.js    # Events API calls
│   │       ├── passService.js     # Passes API calls
│   │       ├── paymentService.js  # Payments API calls
│   │       └── teamService.js     # Teams API calls
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── LoadingSpinner.jsx     # Loading indicator
│   │   ├── ProtectedRoute.jsx     # Route protection wrapper
│   │   └── PublicRoute.jsx        # Public route wrapper
│   │
│   ├── config/                     # Configuration files
│   │   ├── firebase.js            # Firebase client config
│   │   └── constants.js           # App constants
│   │
│   ├── features/                   # Feature-specific modules
│   │   └── auth/
│   │       ├── contexts/
│   │       │   └── AuthContext.jsx # Auth state management
│   │       └── hooks/
│   │           └── useAuth.js     # Auth hook
│   │
│   ├── hooks/                      # Custom React hooks
│   │   └── useApi.js              # API connection hook
│   │
│   ├── layouts/                    # Layout components
│   │   └── DashboardLayout.jsx    # Main dashboard layout
│   │
│   ├── pages/                      # Page components
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx      # Login page
│   │   │   └── RegisterPage.jsx  # Registration page
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx  # User dashboard
│   │   ├── admin/
│   │   │   └── AdminPage.jsx      # Admin dashboard
│   │   ├── events/
│   │   │   └── EventsPage.jsx     # Events listing
│   │   ├── passes/
│   │   │   └── PassesPage.jsx     # Passes listing
│   │   ├── teams/
│   │   │   └── TeamsPage.jsx     # Teams management
│   │   └── NotFoundPage.jsx       # 404 page
│   │
│   └── utils/                      # Utility functions
│       └── razorpay.js            # Razorpay integration
│
├── .env                            # Environment variables
├── .env.example                    # Environment template
├── package.json                    # Dependencies
├── vite.config.js                  # Vite configuration
└── tailwind.config.js              # TailwindCSS configuration
```

### Frontend Key Components

#### 1. **main.jsx** - Application Entry Point
- Sets up React Router
- Configures React Query
- Wraps app with AuthProvider
- Configures toast notifications

#### 2. **App.jsx** - Routing & Layout
- Defines all routes (public and protected)
- Handles API connection status
- Shows loading states
- Error handling for connection issues

#### 3. **AuthContext.jsx** - Authentication State
- Manages user authentication state
- Provides auth methods (login, signup, logout)
- Handles Firebase auth state changes
- Creates/updates user documents in Firestore
- Role-based access control

#### 4. **api/client.js** - API Client
- Axios instance with base configuration
- Request interceptor: Adds Firebase auth token
- Response interceptor: Handles errors
- Connection testing utility

#### 5. **ProtectedRoute.jsx** - Route Protection
- Checks authentication status
- Redirects to login if not authenticated
- Supports admin-only routes

---

## ⚙️ Backend Architecture

### Directory Structure
```
backend/
├── src/
│   ├── server.js                   # Express server setup
│   │
│   ├── config/                     # Configuration files
│   │   ├── firebase.js            # Firebase Admin SDK config
│   │   └── razorpay.js            # Razorpay config
│   │
│   ├── middleware/                 # Express middleware
│   │   ├── auth.js                # Authentication middleware
│   │   ├── errorHandler.js        # Error handling
│   │   ├── notFound.js            # 404 handler
│   │   └── validation.js          # Request validation
│   │
│   ├── modules/                    # Feature modules (MVC pattern)
│   │   ├── auth/
│   │   │   ├── authController.js  # Auth endpoints logic
│   │   │   └── authService.js     # Auth business logic
│   │   ├── event/
│   │   │   ├── eventController.js # Event endpoints logic
│   │   │   └── eventService.js    # Event business logic
│   │   ├── pass/
│   │   │   ├── passController.js  # Pass endpoints logic
│   │   │   └── passService.js     # Pass business logic
│   │   ├── payment/
│   │   │   ├── paymentController.js # Payment endpoints logic
│   │   │   └── paymentService.js   # Payment business logic
│   │   ├── team/
│   │   │   ├── teamController.js  # Team endpoints logic
│   │   │   └── teamService.js    # Team business logic
│   │   └── admin/
│   │       ├── adminController.js # Admin endpoints logic
│   │       └── adminService.js    # Admin business logic
│   │
│   ├── routes/                     # API route definitions
│   │   ├── auth.js                # Auth routes
│   │   ├── events.js              # Event routes
│   │   ├── passes.js              # Pass routes
│   │   ├── payments.js            # Payment routes
│   │   ├── teams.js               # Team routes
│   │   └── admin.js               # Admin routes
│   │
│   └── utils/                      # Utility functions
│       └── initializeData.js      # Sample data initialization
│
├── .env                            # Environment variables
├── .env.example                    # Environment template
└── package.json                    # Dependencies
```

### Backend Key Components

#### 1. **server.js** - Express Server Setup
- Express app initialization
- Security middleware (Helmet, CORS, Rate Limiting)
- Body parsing and compression
- Route registration
- Error handling middleware
- Health check endpoints

#### 2. **middleware/auth.js** - Authentication
- `authenticateToken`: Verifies Firebase ID tokens
- `requireAdmin`: Checks admin role in custom claims
- `optionalAuth`: Optional authentication for public routes

#### 3. **config/firebase.js** - Firebase Admin SDK
- Initializes Firebase Admin SDK
- Exports Firestore, Auth, and Storage instances
- Uses service account credentials from environment

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/verify-token` - Verify Firebase token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Events (`/api/events`)
- `GET /api/events` - List events (with filters)
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event (admin only)
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/my/registrations` - User's registrations

### Passes (`/api/passes`)
- `GET /api/passes` - List available passes
- `GET /api/passes/:id` - Get pass details
- `POST /api/passes/:id/purchase` - Purchase pass
- `GET /api/passes/my-passes` - User's passes
- `GET /api/passes/:id/qr` - Get pass QR code

### Teams (`/api/teams`)
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/:id/join` - Join team
- `GET /api/teams/invitations/received` - Get invitations

### Payments (`/api/payments`)
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/webhook` - Razorpay webhook (no auth)

### Admin (`/api/admin`)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/system/health` - System health

### Utility Endpoints
- `GET /health` - Health check
- `GET /api/health` - API health check
- `POST /initialize-data` - Initialize sample data (dev only)

---

## 🔐 Authentication Flow

### Frontend Authentication
1. User registers/logs in via Firebase Auth
2. Firebase returns ID token
3. Token stored in Firebase Auth state
4. Token automatically attached to API requests via interceptor
5. User data fetched from Firestore and merged with auth data

### Backend Authentication
1. API request includes `Authorization: Bearer <token>` header
2. `authenticateToken` middleware verifies token with Firebase Admin SDK
3. Decoded token attached to `req.user`
4. Protected routes check `req.user` exists
5. Admin routes check custom claims for admin role

### Role-Based Access Control
- **User Roles**: `USER`, `ADMIN`, `SUPER_ADMIN`
- Roles stored in Firestore `users` collection
- Admin routes check Firebase custom claims
- Frontend checks role for UI rendering

---

## 💾 Database Schema (Firestore)

### Collections

#### `users`
```javascript
{
  uid: string,              // Firebase Auth UID
  email: string,
  displayName: string,
  firstName: string,
  lastName: string,
  photoURL: string,
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN',
  phone: string,
  college: string,
  year: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `events`
```javascript
{
  id: string,
  title: string,
  description: string,
  category: string,
  date: timestamp,
  venue: string,
  price: number,
  maxParticipants: number,
  currentParticipants: number,
  status: 'upcoming' | 'ongoing' | 'completed',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `passes`
```javascript
{
  id: string,
  name: string,
  description: string,
  price: number,
  features: string[],
  validFrom: timestamp,
  validUntil: timestamp,
  available: boolean,
  createdAt: timestamp
}
```

#### `teams`
```javascript
{
  id: string,
  name: string,
  description: string,
  eventId: string,
  members: string[],        // User UIDs
  leaderId: string,
  status: 'open' | 'closed',
  maxMembers: number,
  createdAt: timestamp
}
```

#### `payments`
```javascript
{
  id: string,
  userId: string,
  type: 'pass' | 'event',
  itemId: string,
  amount: number,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  status: 'pending' | 'completed' | 'failed',
  createdAt: timestamp
}
```

---

## 🎨 UI Design System

### Color Palette
- **Background**: `#F5F6F8` (Light gray)
- **Primary**: `#111827` (Gray-900)
- **Cards**: White with subtle shadows
- **Typography**: Inter font family

### Component Patterns
- **Buttons**: Primary (dark) and secondary (light) variants
- **Cards**: Elevated design with hover effects
- **Forms**: Clean inputs with focus states
- **Navigation**: Sidebar with active states
- **Modals**: Centered with backdrop blur

### Responsive Design
- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Collapsible sidebar on mobile
- Touch-friendly interactions

---

## 🔒 Security Features

### Frontend Security
- Protected routes with authentication checks
- Token refresh on API calls
- Secure token storage (Firebase handles this)
- CORS configuration

### Backend Security
- Firebase token verification
- Rate limiting (100 requests per 15 minutes per IP)
- Helmet.js for security headers
- Input validation with Joi schemas
- Admin role verification
- Payment webhook signature verification

---

## 🚀 Development Workflow

### Starting the Application

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
./start-backend.sh

# Terminal 2 - Frontend
./start-frontend.sh
```

### Environment Setup
1. Configure Firebase project
2. Set up frontend `.env` with Firebase web app config
3. Set up backend `.env` with Firebase Admin SDK credentials
4. Configure Razorpay keys (optional)

### Development URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## 📊 Key Features

### User Features
- ✅ Multi-step registration with comprehensive data collection
- ✅ Email/Password and Google OAuth authentication
- ✅ User dashboard with personalized content
- ✅ Event browsing and registration
- ✅ Pass purchase and management
- ✅ Team creation and joining
- ✅ Payment processing with Razorpay
- ✅ QR code generation for passes

### Admin Features
- ✅ Admin dashboard with statistics
- ✅ User management
- ✅ Event creation and management
- ✅ System health monitoring
- ✅ Payment tracking

---

## 🔧 Configuration Files

### Frontend Environment Variables
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=
```

### Backend Environment Variables
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_AUTH_URI=
FIREBASE_TOKEN_URI=
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=
FIREBASE_CLIENT_X509_CERT_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

---

## 📦 Dependencies

### Frontend Key Dependencies
- `react` ^18.2.0
- `react-router-dom` ^6.20.1
- `@tanstack/react-query` ^5.8.4
- `firebase` ^10.7.1
- `axios` ^1.6.2
- `react-hook-form` ^7.48.2
- `react-hot-toast` ^2.4.1
- `lucide-react` ^0.294.0
- `tailwindcss` ^3.3.6

### Backend Key Dependencies
- `express` ^4.18.2
- `firebase-admin` ^11.11.1
- `razorpay` ^2.9.2
- `joi` ^17.11.0
- `express-rate-limit` ^7.1.5
- `helmet` ^7.1.0
- `cors` ^2.8.5
- `morgan` ^1.10.0

---

## 🧪 Testing & Verification

### Health Checks
- Backend: `GET /health` or `GET /api/health`
- Frontend: Automatic connection test on load

### Sample Data Initialization
```bash
POST http://localhost:5000/initialize-data
```
Creates:
- 3 pass types (Single Day, Multi Day, VIP)
- 5 sample events

---

## 📝 Implementation Status

**Current Status**: 95% Complete

### ✅ Completed
- Full-stack architecture
- Authentication system
- User and admin dashboards
- All API endpoints
- Payment integration structure
- UI components and layouts
- Error handling and validation

### ⚠️ Pending
- Firebase project setup (needs manual configuration)
- Razorpay testing
- Production deployment configuration

---

## 🎯 Key Design Decisions

1. **Modular Backend**: MVC pattern with separate modules for each feature
2. **Feature-Based Frontend**: Organized by features rather than file types
3. **Firebase Integration**: Both client SDK (frontend) and Admin SDK (backend)
4. **React Query**: Efficient data fetching and caching
5. **Protected Routes**: Both frontend and backend route protection
6. **Role-Based Access**: Admin features gated by role checks
7. **Error Handling**: Comprehensive error handling at all levels
8. **Security First**: Rate limiting, token verification, input validation

---

## 🔄 Data Flow

### User Registration Flow
1. User fills registration form
2. Frontend creates Firebase Auth account
3. User data saved to Firestore `users` collection
4. User redirected to dashboard
5. AuthContext updates with user data

### Event Registration Flow
1. User browses events
2. Clicks "Register" on event
3. Frontend calls `POST /api/events/:id/register`
4. Backend verifies token and creates registration
5. Updates event participant count
6. Returns confirmation to frontend

### Payment Flow
1. User initiates pass/event purchase
2. Frontend calls `POST /api/payments/create-order`
3. Backend creates Razorpay order
4. Frontend opens Razorpay checkout
5. User completes payment
6. Razorpay webhook notifies backend
7. Backend verifies and processes payment
8. User receives confirmation

---

## 📚 Additional Resources

- **README.md**: Main project documentation
- **QUICK_START.md**: Quick setup guide
- **FIREBASE_SETUP.md**: Detailed Firebase configuration
- **IMPLEMENTATION_STATUS.md**: Development status and checklist

---

## 🆘 Common Issues & Solutions

### Backend Connection Failed
- Ensure backend is running on port 5000
- Check environment variables
- Verify CORS configuration

### Firebase Authentication Error
- Verify Email/Password is enabled in Firebase Console
- Check API keys in `.env` files
- Ensure Firebase project is properly configured

### Permission Denied (Firestore)
- Ensure Firestore is in test mode for development
- Check security rules
- Verify service account has proper permissions

---

**Last Updated**: February 2026
**Project Version**: 1.0.0
