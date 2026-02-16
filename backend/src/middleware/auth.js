import { auth, db } from '../config/firebase.js'

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      })
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token)
    req.user = decodedToken
    next()
  } catch (error) {
    console.error('Token verification error:', error)
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Check if user has admin role in custom claims
    const userRecord = await auth.getUser(req.user.uid)
    const customClaims = userRecord.customClaims || {}

    // Check custom claims first
    if (customClaims.admin || customClaims.super_admin) {
      return next()
    }

    // Fallback: Check Firestore role field
    const userDoc = await db.collection('users').doc(req.user.uid).get()
    
    if (userDoc.exists) {
      const userData = userDoc.data()
      if (userData.role === 'admin' || userData.role === 'super_admin') {
        return next()
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    })
  }
}

export const requireVolunteer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' })
    }
    const userDoc = await db.collection('users').doc(req.user.uid).get()
    if (userDoc.exists) {
      const role = userDoc.data().role
      if (role === 'volunteer' || role === 'admin' || role === 'super_admin') {
        return next()
      }
    }
    return res.status(403).json({ success: false, message: 'Volunteer access required' })
  } catch (error) {
    console.error('Volunteer check error:', error)
    return res.status(500).json({ success: false, message: 'Error checking volunteer status' })
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decodedToken = await auth.verifyIdToken(token)
      req.user = decodedToken
    }

    next()
  } catch (error) {
    // Continue without authentication if token is invalid
    next()
  }
}