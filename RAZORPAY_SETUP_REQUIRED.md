# Razorpay Setup Required

## Current Issue
Payment is failing because Razorpay credentials are not configured.

## Error
```
Authorization failed (400 Bad Request)
```

This happens because the backend is trying to create a Razorpay order with invalid credentials.

## Solution

### Option 1: Set up Real Razorpay Account (Production)

1. Go to https://razorpay.com/
2. Sign up for an account
3. Go to Dashboard → Settings → API Keys
4. Generate API keys (Key ID and Key Secret)
5. Update `backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx
   ```
6. Also update `frontend/.env`:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
   ```
7. Restart both backend and frontend servers

### Option 2: Use Test Mode (Development Only)

I can implement a mock payment system that bypasses Razorpay for testing. This would:
- Skip actual payment processing
- Automatically mark payments as successful
- Allow you to test the full flow without Razorpay

Would you like me to implement Option 2 for now so you can test the system?

## Files That Need Razorpay Keys

1. `backend/.env` - Backend API keys
2. `frontend/.env` - Frontend Key ID (for Razorpay checkout)

## Current Values (Invalid)
```
RAZORPAY_KEY_ID=your_razorpay_key_id  ❌
RAZORPAY_KEY_SECRET=your_razorpay_key_secret  ❌
```

## What Happens After Setup
Once you add real Razorpay keys:
1. Pass purchase will open Razorpay payment modal
2. User can pay with card/UPI/netbanking
3. Payment is verified on backend
4. Pass/Registration is activated only after successful payment
