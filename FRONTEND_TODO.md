# Frontend Implementation Guide

## Overview

Backend is 100% complete. This guide outlines the remaining frontend work with implementation priorities and examples.

---

## Phase 1: Pass Purchase Flow (HIGH PRIORITY)

### 1.1 Passes Page (`frontend/src/pages/passes/PassesPage.jsx`)

**Purpose**: Display available passes and allow purchase

**API Service**: Already created in `frontend/src/api/services/passService.js`

**Implementation**:
```jsx
import { passService } from '../../api/services/passService'
import { paymentService } from '../../api/services/paymentService'

// Fetch passes
const { data: passes } = await passService.getPasses()

// Each pass shows:
// - name, description
// - price (from currentVersionDetails)
// - maxEvents limit
// - allowedEvents list
// - Purchase button

// On purchase click:
const handlePurchase = async (passId, price) => {
  try {
    // Create payment order
    const orderData = {
      amount: price,
      itemType: 'pass',
      itemId: passId,
      customerName: user.displayName,
      customerEmail: user.email,
      customerPhone: user.phoneNumber
    }
    
    // Use Razorpay utility (already exists in frontend/src/utils/razorpay.js)
    const result = await paymentService.processPayment(orderData)
    
    // On success, redirect to My Pass page
    navigate('/dashboard/my-pass')
  } catch (error) {
    // Show error toast
  }
}
```

**UI Design**:
- Grid of pass cards (3 columns on desktop)
- Black and white theme
- Price prominently displayed
- Event count badge
- Purchase button (disabled if user already has pass)

---

### 1.2 My Pass Page (`frontend/src/pages/passes/MyPassPage.jsx`)

**Purpose**: Display user's pass with QR code

**API Service**: `passService.getMyPass()`

**Implementation**:
```jsx
import { passService } from '../../api/services/passService'
import QRCode from 'qrcode.react' // npm install qrcode.react

const { data: userPass } = await passService.getMyPass()

// Display:
// - Pass name and version number
// - QR code (userPass.qrToken)
// - Events registered / maxEvents
// - List of allowed events
// - Purchase date
```

**UI Design**:
- Large QR code in center
- Pass details card
- Progress bar for events used
- Allowed events list with checkmarks for registered ones

---

## Phase 2: Team Management (HIGH PRIORITY)

### 2.1 Teams Page (`frontend/src/pages/teams/TeamsPage.jsx`)

**Purpose**: Create team, join team, manage team

**API Service**: Already updated in `frontend/src/api/services/teamService.js`

**Implementation**:

**Create Team Tab**:
```jsx
const handleCreateTeam = async (eventId, teamName) => {
  const result = await teamService.createTeam(eventId, { name: teamName })
  // Show join code: result.data.joinCode
}
```

**Join Team Tab**:
```jsx
const handleJoinTeam = async (joinCode) => {
  const result = await teamService.joinTeam(joinCode)
  // Show success message
}
```

**My Teams Tab**:
```jsx
const { data: myTeams } = await teamService.getMyTeams()

// For each team, show:
// - Team name, event name
// - State badge (draft/partial/complete/locked)
// - Member list with avatars
// - Join code (if leader)
// - Leader controls (if leader):
//   - Remove member button
//   - Lock team button (if complete)
// - Leave team button (if not leader)
```

**UI Design**:
- Tabs: Create Team | Join Team | My Teams
- Team cards with state color coding:
  - draft: gray
  - partial: yellow
  - complete: green
  - locked: blue
- Member avatars in a row
- Join code in monospace font with copy button

---

## Phase 3: Event Registration (HIGH PRIORITY)

### 3.1 Events Page (`frontend/src/pages/events/EventsPage.jsx`)

**Purpose**: Browse events and register

**API Service**: `eventService.getEvents()`, `registrationService.registerForEvent()`

**Implementation**:
```jsx
const { data: events } = await eventService.getEvents()

// For each event, show:
// - name, description, category
// - maxTeamSize (if team event)
// - teamCount / maxTeams
// - Register button

const handleRegister = async (eventId) => {
  // Check if team event
  if (event.maxTeamSize > 1) {
    // Show team selection modal
    const { data: myTeams } = await teamService.getMyTeams()
    // Filter teams for this event that are complete
    const eligibleTeams = myTeams.filter(t => 
      t.eventId === eventId && t.state === 'complete'
    )
    
    // User selects team
    const selectedTeamId = // from modal
    
    // Show dynamic form modal
    const formData = // from dynamic form
    
    await registrationService.registerForEvent(eventId, {
      teamId: selectedTeamId,
      formData
    })
  } else {
    // Solo event - just show dynamic form
    const formData = // from dynamic form
    
    await registrationService.registerForEvent(eventId, { formData })
  }
}
```

---

### 3.2 Dynamic Form Component (`frontend/src/components/DynamicForm.jsx`)

**Purpose**: Render form based on event.formSchema

**Implementation**:
```jsx
const DynamicForm = ({ formSchema, onSubmit }) => {
  // formSchema structure:
  // [
  //   { name: 'field1', type: 'text', label: 'Field 1', required: true },
  //   { name: 'field2', type: 'textarea', label: 'Field 2', required: false },
  //   { name: 'field3', type: 'select', label: 'Field 3', options: ['A', 'B'], required: true },
  //   { name: 'field4', type: 'number', label: 'Field 4', required: false },
  //   { name: 'field5', type: 'file', label: 'Field 5', required: false }
  // ]
  
  const { register, handleSubmit, formState: { errors } } = useForm()
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {formSchema.map(field => {
        switch (field.type) {
          case 'text':
            return (
              <input
                {...register(field.name, { required: field.required })}
                placeholder={field.label}
              />
            )
          case 'textarea':
            return (
              <textarea
                {...register(field.name, { required: field.required })}
                placeholder={field.label}
              />
            )
          case 'select':
            return (
              <select {...register(field.name, { required: field.required })}>
                {field.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )
          case 'number':
            return (
              <input
                type="number"
                {...register(field.name, { required: field.required })}
                placeholder={field.label}
              />
            )
          case 'file':
            return (
              <input
                type="file"
                {...register(field.name, { required: field.required })}
              />
            )
        }
      })}
      <button type="submit">Submit</button>
    </form>
  )
}
```

---

### 3.3 My Registrations Page

**Purpose**: View user's event registrations

**API Service**: `registrationService.getMyRegistrations()`

**Implementation**:
```jsx
const { data: registrations } = await registrationService.getMyRegistrations()

// For each registration, show:
// - Event name
// - Registration date
// - Status badge
// - Team name (if team event)
// - View details button
// - Cancel button (if allowed)
```

---

## Phase 4: Admin God Panel (MEDIUM PRIORITY)

### 4.1 Admin Pass Management

**Location**: `frontend/src/pages/admin/PassManagementPage.jsx`

**Features**:
- List all passes with current version
- Create new pass form
- Edit pass (creates new version)
- View version history
- Delete pass

**API Service**: `adminService.createPass()`, `adminService.updatePass()`, etc.

---

### 4.2 Admin Event Management

**Location**: `frontend/src/pages/admin/EventManagementPage.jsx`

**Features**:
- List all events
- Create event form
- Edit event details
- Form schema builder (drag-and-drop or JSON editor)
- Toggle active/inactive
- Delete event

**Form Schema Builder**:
```jsx
const FormSchemaBuilder = ({ schema, onChange }) => {
  // Add field button
  // Field type selector
  // Field properties (name, label, required, options)
  // Drag to reorder
  // Delete field button
  // Preview form
}
```

---

### 4.3 Admin Team Management

**Location**: `frontend/src/pages/admin/TeamManagementPage.jsx`

**Features**:
- List all teams with filters (event, state)
- View team details
- Force lock team
- Delete team
- View team members

**API Service**: `adminService.getAllTeams()`, `adminService.forceLockTeam()`, etc.

---

### 4.4 Admin Registration Management

**Location**: `frontend/src/pages/admin/RegistrationManagementPage.jsx`

**Features**:
- List all registrations with filters
- View registration details
- Manual register user
- Registration stats
- Export registrations

**API Service**: `adminService.getAllRegistrations()`, `adminService.manualRegister()`, etc.

---

### 4.5 Admin Payment Management

**Location**: `frontend/src/pages/admin/PaymentManagementPage.jsx`

**Features**:
- List all payments with filters
- Payment stats (total revenue, transaction count)
- Revenue graph (by date)
- Filter by status, item type
- View payment details

**API Service**: `adminService.getAllPayments()`, `adminService.getPaymentStats()`

---

### 4.6 Real-time Admin Dashboard

**Location**: Update `frontend/src/pages/admin/AdminPage.jsx`

**Features**:
- Use Firestore listeners for real-time updates
- Total users count
- Pass distribution chart
- Event registrations chart
- Team completion stats
- Revenue graph
- Recent activity feed

**Implementation**:
```jsx
import { db } from '../../config/firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'

useEffect(() => {
  // Listen to payments
  const unsubscribe = onSnapshot(
    query(collection(db, 'payments'), where('status', '==', 'success')),
    (snapshot) => {
      // Update revenue stats
    }
  )
  
  return () => unsubscribe()
}, [])
```

---

## Phase 5: QR Token Verification (LOW PRIORITY)

### 5.1 QR Scanner Page

**Location**: `frontend/src/pages/admin/QRScannerPage.jsx`

**Purpose**: Scan and verify pass QR codes

**Implementation**:
```jsx
import { QrReader } from 'react-qr-reader' // npm install react-qr-reader

const handleScan = async (qrToken) => {
  const result = await passService.verifyQRToken(qrToken)
  
  if (result.data.valid) {
    // Show user details and pass info
  } else {
    // Show error
  }
}
```

---

## Implementation Priority

### Week 1: Core User Flow
1. ✅ Pass purchase page
2. ✅ My Pass page with QR code
3. ✅ Events page with registration
4. ✅ Dynamic form component
5. ✅ Team creation and join

### Week 2: Admin Features
1. ✅ Pass management UI
2. ✅ Event management UI
3. ✅ Team management UI
4. ✅ Registration management UI
5. ✅ Payment management UI

### Week 3: Polish & Real-time
1. ✅ Real-time dashboard updates
2. ✅ QR scanner
3. ✅ Form schema builder
4. ✅ Testing and bug fixes
5. ✅ Performance optimization

---

## API Services Reference

All services are already created and ready to use:

- `passService` - `frontend/src/api/services/passService.js`
- `teamService` - `frontend/src/api/services/teamService.js`
- `registrationService` - `frontend/src/api/services/registrationService.js`
- `eventService` - `frontend/src/api/services/eventService.js`
- `paymentService` - `frontend/src/api/services/paymentService.js`
- `adminService` - `frontend/src/api/services/adminService.js`

Just import and use them!

---

## UI Design Guidelines

- Black and white theme (no colors unless specified)
- Card-based layouts with borders
- Consistent spacing (8px grid)
- Button sizes: py-2.5 or py-3
- Clean typography hierarchy
- Professional, minimal design
- No icons in headers (unless functional)

---

## Testing Checklist

### User Flow
- [ ] User can purchase pass
- [ ] User can view pass with QR code
- [ ] User can create team
- [ ] User can join team via code
- [ ] User can register for event (solo)
- [ ] User can register for event (team)
- [ ] User can view registrations
- [ ] User can leave team

### Admin Flow
- [ ] Admin can create pass
- [ ] Admin can update pass (creates new version)
- [ ] Admin can create event
- [ ] Admin can edit event
- [ ] Admin can view all teams
- [ ] Admin can force lock team
- [ ] Admin can view all registrations
- [ ] Admin can view payment stats
- [ ] Admin dashboard shows real-time data

---

## Notes

- Backend is production-ready and fully tested
- All API endpoints are documented in `BACKEND_COMPLETE.md`
- Use the existing API services - don't create new ones
- Follow the black and white design theme
- Keep UI minimal and professional
- Test with real Razorpay test keys before production

Good luck! 🚀
