# Firestore Indexes Setup Guide

## Why Indexes Are Important
Indexes dramatically improve query performance and reduce costs by allowing Firestore to efficiently filter and sort data at the database level instead of in memory.

## Required Indexes

### Method 1: Automatic (Recommended)
When you run the application and see index errors, simply click the link in the error message. Firebase will automatically create the index for you.

Example error:
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Just click the link and Firebase will:
1. Open the index creation page
2. Pre-fill all the required fields
3. Create the index when you click "Create"

### Method 2: Manual Creation
Go to Firebase Console → Firestore Database → Indexes tab

Create these composite indexes:

#### 1. Registrations Collection
- **Collection ID**: `registrations`
- **Fields**:
  - `userId` (Ascending)
  - `registeredAt` (Descending)

#### 2. Users Collection (Index 1)
- **Collection ID**: `users`
- **Fields**:
  - `createdAt` (Descending)

#### 3. Users Collection (Index 2)
- **Collection ID**: `users`
- **Fields**:
  - `role` (Ascending)
  - `createdAt` (Descending)

#### 4. Payments Collection (Index 1)
- **Collection ID**: `payments`
- **Fields**:
  - `status` (Ascending)
  - `paidAt` (Ascending)

#### 5. Payments Collection (Index 2)
- **Collection ID**: `payments`
- **Fields**:
  - `userId` (Ascending)
  - `paidAt` (Descending)

#### 6. Events Collection
- **Collection ID**: `events`
- **Fields**:
  - `status` (Ascending)
  - `date` (Ascending)

## Index Build Time
- Indexes typically take 5-10 minutes to build
- You can use the app while indexes are building
- The code has fallback logic to work without indexes (slower)

## Verification
Once indexes are built, you'll see them in the Firebase Console under:
**Firestore Database → Indexes**

Status should show "Enabled" (green)

## Performance Impact

### Without Indexes:
- Fetches ALL documents
- Sorts in memory
- Slower queries (especially with large datasets)
- Higher costs

### With Indexes:
- Fetches only needed documents
- Database-level sorting (very fast)
- 10-100x faster queries
- Lower costs

## Troubleshooting

### Index Still Building
If you see "Building" status, wait a few minutes. The app will work but queries will be slower.

### Index Failed
Delete and recreate the index. Make sure field names match exactly.

### Query Still Slow
Check that:
1. Index status is "Enabled"
2. Field names in code match index fields
3. Field order matches (Ascending/Descending)

## Cost Optimization
Indexes have minimal storage cost but dramatically reduce query costs by:
- Reading fewer documents
- Reducing bandwidth usage
- Faster response times

For a production app, indexes are essential!
