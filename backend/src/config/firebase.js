import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL'
]

const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
if (missingVars.length > 0) {
  throw new Error(
    `❌ Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
    `Please check your backend/.env file and ensure all Firebase Admin SDK credentials are set.`
  )
}

// Firebase Admin SDK configuration
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
  token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
    console.log('✅ Firebase Admin SDK initialized successfully')
    console.log(`📦 Project ID: ${process.env.FIREBASE_PROJECT_ID}`)
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message)
    throw new Error(
      `Firebase Admin SDK initialization failed: ${error.message}\n` +
      `Please verify your Firebase service account credentials in backend/.env`
    )
  }
}

// Export Firebase services
export const auth = admin.auth()
export const db = admin.firestore()
export const storage = admin.storage()

export default admin