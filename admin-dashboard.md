Admin Dashboard – System Architecture & Functional Specification
Overview

The Admin Dashboard is the central control system of the Techfest Participation & Ticketing Platform.

It provides full operational control over:

Pass management

Event configuration

Team lifecycle

Participant registrations

Payments & revenue

Platform settings

Live analytics

All changes made by the admin reflect instantly (live configuration model).
Existing users must retain previously granted access (pass versioning enforced).

1. Admin Roles
1.1 Super Admin

Full platform access including:

Pass editing

Event editing

Team overrides

Manual registrations

Payment visibility

Platform configuration

Admin management

1.2 Event Manager (Optional Future Role)

Restricted access:

Only assigned events

Team management for specific events

No pass editing

2. Dashboard Home (Control Center)
Purpose

Provide real-time overview of platform health and participation metrics.

Metrics Displayed

Total registered users

Total pass purchases

Pass distribution breakdown

Total event registrations

Event-wise team count

Revenue summary

Pending team completions

Active vs inactive events

Real-Time Updates

Uses Firestore listeners on:

payments

registrations

events.teamCount

users

Optimized queries only (no full collection listeners).

3. Pass Management
3.1 Core Rules

Each participant can purchase only ONE pass.

No pass upgrades.

Pass defines:

allowed eventIds[]

maxEvents limit

price

Admin edits must not affect existing users.
→ Implement pass versioning.

3.2 Pass Creation

Admin can:

Create new pass

Set price

Set maxEvents

Assign allowed events

Activate/deactivate pass

On creation:

A passVersion is automatically generated.

currentVersion updated.

3.3 Pass Editing (Live)

When admin edits:

Price

maxEvents

Allowed eventIds

System must:

Create new passVersion

Update passes.currentVersion

Preserve old versions for existing users

Existing users remain linked to their original passVersionId.

3.4 Pass Versioning Model

Collections:

passes
passVersions


users.passVersionId references immutable rules.

This prevents retroactive access changes.

4. Event Management
4.1 Event Configuration Fields

Each event contains:

name

price (per person)

maxTeamSize

maxTeams

teamCount

formSchema (dynamic JSON)

isActive

4.2 Admin Capabilities

Admin can:

Create event

Edit name

Edit team size

Edit maxTeams

Toggle active/inactive

Edit form schema dynamically

All changes reflect instantly in UI.

4.3 Capacity Handling

Rules:

Capacity controlled by number of teams.

teamCount increments only when team becomes complete.

If teamCount >= maxTeams, new teams cannot complete.

Reducing maxTeams:

Existing teams remain.

New completions blocked.

5. Team Management
5.1 Team States

draft

partial

complete

locked

5.2 Admin Capabilities

Admin can:

View all teams (filter by event)

Remove member

Replace member

Delete team

Force lock team

Force complete team (if necessary)

Admin actions must update:

registrations

event.teamCount (if status changes)

6. Registration Management
6.1 Registration Rules (Enforced in Backend)

User can register only if:

Has purchased pass

Event exists in passVersion

eventCount < maxEvents

Not already registered in same event

Team is complete (if team event)

Event capacity not exceeded

6.2 Admin Overrides

Admin can:

Manually register participant

Override eventCount

Remove registration

View participant registration history

All overrides must be logged.

7. Payment Management
7.1 Razorpay Integration

Admin panel must display:

Payment list

Payment status

Razorpay paymentId

OrderId

Amount

Timestamp

7.2 Revenue Insights

Admin dashboard must provide:

Revenue by pass type

Revenue by event

Total revenue

Daily revenue breakdown

7.3 Payment Integrity

System requirements:

Webhook signature validation

Idempotent handling

No reliance on frontend success

Payment status immutable once confirmed

8. Dynamic Form Builder (Event Forms)

Each event has:

formSchema: [
  {
    type: "text" | "textarea" | "number" | "select" | "file",
    label: string,
    required: boolean,
    options?: string[]
  }
]


Admin can:

Add fields

Remove fields

Mark required

Change order

Frontend must render dynamically.

Backend must validate submission.

9. User Management

Admin can:

View user profile

View passVersion

View eventCount

View teams

View payments

Manually assign pass (if required)

10. Platform Settings (Global Controls)

Stored in adminConfigs collection.

Example:

registrationOpen: boolean
teamDeadline: timestamp
maintenanceMode: boolean


Admin can toggle:

Open/close registrations

Lock team edits after deadline

Enable maintenance mode

11. Security Requirements

Firebase ID token verification required

Role-based middleware

All writes go through backend

Firestore rules prevent public writes

Admin routes protected

Audit log for critical actions

12. UI/UX Requirements

Design must be:

Clean SaaS-style

Neutral background

Sidebar navigation

Clear hierarchy

No clutter

Card-based layout

Responsive

Professional typography

Admin sidebar sections:

Dashboard

Passes

Events

Teams

Users

Payments

Settings

13. Scalability Considerations (3000+ Users)

Use Firestore transactions for team completion

Cache event/pass configs in backend

Denormalize small fields where needed

Avoid heavy real-time listeners

Use indexed queries

Prevent race conditions in teamCount updates

14. Audit & Logging

Critical actions must log:

Admin ID

Timestamp

Action performed

Affected resource ID

Stored in:

adminLogs

15. Non-Functional Requirements

Zero downtime on admin edits

No retroactive pass changes

No race condition in team creation

All validations backend-enforced

Idempotent payment processing

Optimized Firestore reads

Conclusion

The Admin Dashboard is the operational brain of the Techfest platform.

It must:

Support instant live configuration

Preserve data integrity

Enforce participation rules

Provide real-time analytics

Maintain audit traceability

Scale to 3000+ users reliably

This system must feel enterprise-grade and robust, not experimental.