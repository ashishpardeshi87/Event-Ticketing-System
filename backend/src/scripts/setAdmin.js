import dotenv from 'dotenv'
import { auth, db } from '../config/firebase.js'

dotenv.config()

/**
 * Script to set admin role for a user
 * Usage: node src/scripts/setAdmin.js user@example.com
 */

async function setAdminRole(email) {
  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email)
    
    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { admin: true, role: 'admin' })
    
    // Update Firestore
    await db.collection('users').doc(userRecord.uid).update({
      role: 'admin',
      updatedAt: new Date()
    })
    
    console.log(`✅ Successfully set admin role for ${email}`)
    console.log(`   User ID: ${userRecord.uid}`)
    console.log(`   User must sign out and sign in again for changes to take effect`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error setting admin role:', error.message)
    process.exit(1)
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.error('Usage: node src/scripts/setAdmin.js user@example.com')
  process.exit(1)
}

setAdminRole(email)
