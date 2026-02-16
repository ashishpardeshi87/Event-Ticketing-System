# TechFest Platform

A production-ready full-stack web application for National-Level Techfest Participation & Ticketing Platform.

## 🚀 Features

### Frontend (React + Vite)
- **React 18** with Vite for fast development
- **TailwindCSS** for modern, responsive UI
- **Firebase Authentication** (Google + Email/Password)
- **React Query** for efficient data fetching
- **React Router** for client-side routing
- **Razorpay Integration** for payments
- **Professional SaaS-style UI** with clean design system

### Backend (Node.js + Express)
- **Node.js + Express** with modular architecture
- **Firebase Admin SDK** for authentication & database
- **Razorpay integration** for payments
- **Comprehensive API** with proper error handling
- **Request validation** and rate limiting
- **Webhook support** for payment processing
- **CORS configuration** for frontend connection

### Database & Infrastructure
- **Firebase Firestore** as primary database
- **Firebase Storage** for file uploads
- **Firebase Authentication** for user management
- **Razorpay** for payment processing

## 🏗️ Project Structure

```
techfest-platform/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── api/            # API client and services
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # Page layouts
│   │   ├── pages/          # Route components
│   │   ├── features/       # Feature-specific modules
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration files
│   ├── package.json
│   └── vite.config.js
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility functions
│   ├── package.json
│   └── server.js
├── start-frontend.bat       # Windows frontend startup
├── start-backend.bat        # Windows backend startup
├── start-frontend.sh        # Linux/Mac frontend startup
├── start-backend.sh         # Linux/Mac backend startup
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Firebase project with Firestore enabled
- Razorpay account for payments

### 1. Clone Repository
```bash
git clone <repository-url>
cd techfest-platform
```

### 2. Firebase Setup
Your Firebase project details have been configured:
- **Project ID**: `techfest-tickets`
- **Frontend**: Configuration is already set up in `frontend/.env`
- **Backend**: You need to set up the service account key

**Important**: Follow the detailed setup guide in `FIREBASE_SETUP.md`

**Quick Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com) → techfest-tickets project
2. Project Settings → Service Accounts → Generate new private key
3. Download the JSON file and extract values to `backend/.env`
4. Enable Authentication (Email/Password + Google)
5. Create Firestore Database in test mode
6. Enable Storage

### 3. Environment Configuration

#### Frontend Environment
```bash
cd frontend
cp .env.example .env
```
Edit `frontend/.env` with your Firebase web app configuration:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

#### Backend Environment
```bash
cd backend
cp .env.example .env
```
Edit `backend/.env` with your Firebase service account and Razorpay credentials:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Installation & Running

#### Option 1: Using Startup Scripts

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

#### Option 2: Manual Setup

**Backend (Terminal 1):**
```bash
cd backend
npm install
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health

## � Frontend-Backend Connection

The frontend automatically connects to the backend through:

1. **Vite Proxy Configuration** - API calls are proxied to backend
2. **Axios Client** - Configured with proper base URL and auth headers
3. **Connection Testing** - Automatic health checks and error handling
4. **CORS Setup** - Backend configured to accept frontend requests

### Connection Features:
- **Automatic token refresh** for Firebase authentication
- **Connection status monitoring** with error display
- **Retry mechanisms** for failed requests
- **Proper error handling** for network issues

## 🔐 Authentication Flow

1. **User Registration/Login** via Firebase Auth
2. **Token Management** - Automatic token refresh and validation
3. **Protected Routes** - Frontend route protection
4. **API Authentication** - Backend validates Firebase tokens
5. **Role-based Access** - Admin routes and permissions

---

## 📋 Platform & Website Workflow

This section describes how the platform and website work end-to-end: user roles, routes, and feature workflows.

### User Roles

| Role | Description | Access |
|------|-------------|--------|
| **User** | Regular participant | Dashboard, Passes, Events, Teams, My Pass |
| **Volunteer** | Entry/attendance staff | Scanner only (QR scan, verify, mark present/absent); no dashboard |
| **Admin** | Full management | Everything + Admin panel (users, events, passes, teams, registrations, attendance, payments, settings) |
| **Super Admin** | Highest privilege | Same as Admin (reserved for system-level actions) |

- **Volunteers** are redirected to `/scanner` on login; they do not see the main dashboard or Passes/Events/Teams.
- **Admins** see the normal dashboard plus an "Admin" section in the sidebar (Admin Dashboard, Pass/Event/Team Management, Registrations, Attendance, Payments, Settings).
- A user can be both Admin and Volunteer; then they get dashboard access and can also open the scanner.

### Website Routes & Pages

| Route | Who | Purpose |
|-------|-----|--------|
| `/login` | Public | Sign in (Firebase: Email/Password or Google) |
| `/register` | Public | Create account |
| `/` | Logged-in | Redirects: Volunteer (non-admin) → `/scanner`; others → Dashboard |
| `/dashboard` | User (not volunteer-only) | Main dashboard (overview, quick links) |
| `/passes` | User | Browse and purchase passes |
| `/passes/:id` | User | Pass details and purchase |
| `/dashboard/my-pass` | User | My pass and QR code |
| `/events` | User | Browse events |
| `/events/:id` | User | Event details and register |
| `/teams` | User | Create/join teams, view my teams |
| `/scanner` | Volunteer (or Admin) | QR scanner: verify pass, view details, mark present/absent |
| `/admin` | Admin | Admin dashboard (stats, users, volunteer toggles, assign events) |
| `/admin/passes` | Admin | Create/edit/delete passes |
| `/admin/events` | Admin | Create/edit/delete events |
| `/admin/teams` | Admin | Manage teams, lock teams |
| `/admin/registrations` | Admin | All registrations, manual register |
| `/admin/attendance` | Admin | View all attendance and stats |
| `/admin/payments` | Admin | All payments, stats (₹) |
| `/admin/settings` | Admin | Platform settings |

All routes except `/login` and `/register` are protected; unauthenticated users are sent to login. Currency is shown in **₹** (INR).

### Workflow 1: Authentication

1. User opens app → if not logged in, goes to **Login** or **Register**.
2. **Register**: Email/password or Google → Firebase creates account → user is logged in.
3. **Login**: Same providers → Firebase signs in → frontend gets ID token.
4. Frontend sends token to backend `POST /api/auth/verify-token`; backend validates with Firebase and returns profile (including `role`, `assignedEventIds` for volunteers).
5. On every API call, frontend attaches the current Firebase token; backend middleware validates it and attaches user to request.
6. Role is used to show/hide routes and sidebar (e.g. Volunteer → only Scanner; Admin → Admin section).

### Workflow 2: Pass Purchase (User)

1. User goes to **Passes** → sees list of passes (from `GET /api/passes`).
2. Clicks a pass → **Pass Detail** page → **Buy** / purchase.
3. Frontend calls `POST /api/payments/create-order` with pass id and amount → backend creates Razorpay order.
4. Razorpay checkout opens (amount in ₹); user pays.
5. On success, frontend calls `POST /api/payments/verify` with payment details → backend verifies with Razorpay and creates/updates pass for user in Firestore.
6. User can go to **My Pass** to see their pass and **QR code** (used at venue).

### Workflow 3: Event Registration (User)

1. User goes to **Events** → **Event Detail** → **Register** (if allowed).
2. Frontend calls `POST /api/events/:id/register` (or registration service); backend creates a registration record.
3. User’s **My Pass** or event section can show registered events.
4. Admin can see all registrations under **Admin → Registrations** and do manual registration if needed.

### Workflow 4: Teams (User)

1. User goes to **Teams** → **Create team** or **Join team** (invite/code).
2. `POST /api/teams` (create) or `POST /api/teams/join` (join) → backend updates Firestore.
3. User can leave team, and admins can **lock** teams or manage members from **Admin → Team Management**.

### Workflow 5: Volunteer – QR Scan & Attendance

1. Volunteer (or admin) opens **Scanner** (`/scanner`).
2. **Venue / Event**: Volunteer optionally sets venue and event (for attendance context).
3. **Scan QR**: Uses device camera (or paste token) to scan the attendee’s pass QR.
4. Frontend sends token to `POST /api/attendance/verify` → backend validates pass and returns user + pass + registrations.
5. Volunteer sees **attendee details** (name, email, events) and can **Mark Present** or **Mark Absent**.
6. Frontend calls `POST /api/attendance/scan` with `qrToken`, `venue`, `eventId`, `status` (present/absent) → backend records attendance.
7. Volunteer can see their own scan history; Admin sees **all attendance** under **Admin → Attendance**.

**Volunteer assignment (Admin):**

- Admin goes to **Admin → Users** (or dashboard) → selects user → **Make volunteer** / **Remove volunteer**.
- Admin can **Assign events** to a volunteer → volunteer then only marks attendance for those events (optional filter).

### Workflow 6: Admin – Management

1. **Admin Dashboard** (`/admin`): Stats, user list, quick actions (set admin/volunteer, assign events).
2. **Pass Management**: Create/update/delete passes; set price (₹), type, validity.
3. **Event Management**: Create/update/delete events; manage event registrations.
4. **Team Management**: View teams, lock teams, manage members.
5. **Registrations**: List all registrations; filter by event; manual register.
6. **Attendance**: View all scans; filter by event/venue; attendance stats.
7. **Payments**: View all payments and stats (₹); refunds if supported.
8. **Settings**: Platform-wide settings.

### Data Flow (High Level)

- **Frontend**: React (Vite), React Router, React Query, Axios, Firebase Auth, Tailwind. Uses `VITE_API_BASE_URL` for API (e.g. `http://localhost:5000/api`).
- **Backend**: Node + Express; Firebase Admin (auth + Firestore); Razorpay. Validates Firebase ID token on protected routes; uses `requireAdmin` / `requireVolunteer` where needed.
- **Database**: Firestore for users, passes, events, teams, registrations, payments, attendance.
- **Payments**: Razorpay; webhook `POST /api/payments/webhook` for server-side confirmation; currency ₹.

### Quick Reference – Main API Groups

- **Auth**: `POST /api/auth/verify-token`, `GET/PUT /api/auth/profile`
- **Events**: `GET /api/events`, `GET /api/events/:id`, `POST /api/events/:id/register`, `GET /api/events/my-registrations`
- **Passes**: `GET /api/passes`, `GET /api/passes/:id`, `GET /api/passes/my-pass`, `POST /api/passes/verify-qr`
- **Teams**: `GET/POST /api/teams`, `POST /api/teams/join`, `GET /api/teams/my-teams`
- **Payments**: `POST /api/payments/create-order`, `POST /api/payments/verify`, `GET /api/payments/history`, `POST /api/payments/webhook`
- **Attendance**: `POST /api/attendance/verify`, `POST /api/attendance/scan`, `GET /api/attendance/volunteer`, `GET /api/attendance` (admin)
- **Admin**: `GET /api/admin/stats`, `GET/PUT /api/admin/users/*`, `POST /api/admin/users/:id/set-volunteer`, `PUT /api/admin/users/:id/volunteer-events`, etc.

---

## 💳 Payment Integration

### Razorpay Setup
1. Create Razorpay account at https://razorpay.com
2. Get API keys from dashboard
3. Configure webhook endpoints
4. Add keys to environment files

### Payment Flow
1. User initiates payment (pass/event purchase)
2. Frontend calls backend to create Razorpay order
3. Razorpay checkout opens on frontend
4. Payment completion triggers verification
5. Backend validates and processes payment
6. User receives confirmation and access

## 🎨 UI Design System

### Professional SaaS Aesthetic
- **Background:** `#F5F6F8` (Light gray)
- **Primary:** `#111827` (Gray-900)
- **Cards:** White with subtle shadows
- **Typography:** Inter font family
- **Spacing:** 8px grid system
- **Borders:** Rounded corners with subtle borders

### Component Library
- **Buttons:** Primary (dark) and secondary (light) variants
- **Cards:** Elevated design with hover effects
- **Forms:** Clean inputs with focus states
- **Navigation:** Sidebar with active states
- **Modals:** Centered with backdrop blur

## 📱 Responsive Design

- **Mobile-first** approach with TailwindCSS
- **Breakpoints:** sm(640px), md(768px), lg(1024px), xl(1280px)
- **Collapsible sidebar** on mobile devices
- **Touch-friendly** button sizes and interactions
- **Optimized layouts** for all screen sizes

## � API Endpoints

### Authentication
- `POST /api/auth/verify-token` - Verify Firebase token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Events
- `GET /api/events` - List events (with filters)
- `POST /api/events` - Create event (admin only)
- `POST /api/events/:id/register` - Register for event
- `GET /api/events/my/registrations` - User's registrations

### Passes
- `GET /api/passes` - List available passes
- `POST /api/passes/:id/purchase` - Purchase pass
- `GET /api/passes/my-passes` - User's passes
- `GET /api/passes/:id/qr` - Get pass QR code

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/join` - Join team
- `GET /api/teams/invitations/received` - Get invitations

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/webhook` - Razorpay webhook

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/system/health` - System health

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend Deployment (Railway/Heroku/DigitalOcean)
```bash
cd backend
# Set environment variables
# Deploy with Node.js runtime
```

### Environment Variables for Production
- Update `VITE_API_BASE_URL` to production backend URL
- Update `FRONTEND_URL` in backend to production frontend URL
- Use production Firebase and Razorpay credentials
- Enable HTTPS for both frontend and backend

## 🧪 Testing Connection

### Health Check
Visit `http://localhost:5000/health` to verify backend is running.

### API Test
The frontend automatically tests the connection and displays status.

### Manual Testing
```bash
# Test backend health
curl http://localhost:5000/health

# Test API endpoint
curl http://localhost:5000/api/events
```

## 🔒 Security Features

- **Firebase Authentication** with secure token validation
- **CORS configuration** for cross-origin requests
- **Rate limiting** to prevent API abuse
- **Input validation** with Joi schemas
- **Helmet.js** for security headers
- **Payment webhook verification** for Razorpay
- **Environment variable protection**

## 📊 Monitoring & Logging

- **Health check endpoints** for uptime monitoring
- **Request logging** with Morgan middleware
- **Error tracking** with proper error handling
- **Connection status** monitoring on frontend
- **Payment webhook logging** for audit trails

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend is running on port 5000
   - Check environment variables are set
   - Verify CORS configuration

2. **Firebase Authentication Issues**
   - Check Firebase configuration
   - Verify API keys and project settings
   - Ensure authentication methods are enabled

3. **Payment Integration Issues**
   - Verify Razorpay API keys
   - Check webhook configuration
   - Test with Razorpay test mode first

### Getting Help
- Create an issue in the repository
- Check the API documentation
- Review the setup instructions

---

**Built with ❤️ for TechFest 2024**