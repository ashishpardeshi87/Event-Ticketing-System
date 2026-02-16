export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
  }

  // Firebase Auth errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('auth/')) {
    error.statusCode = 401
    error.message = getFirebaseAuthErrorMessage(err.code)
  }

  // Firestore errors
  if (err.code === 9 || (err.code && typeof err.code === 'string' && err.code.includes('firestore'))) {
    error.statusCode = 400
    error.message = err.details || 'Database operation failed'
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.statusCode = 400
    error.message = Object.values(err.errors).map(val => val.message).join(', ')
  }

  // Joi validation errors
  if (err.isJoi) {
    error.statusCode = 400
    error.message = err.details[0].message
  }

  // Razorpay errors
  if (err.error && err.error.code) {
    error.statusCode = 400
    error.message = err.error.description || 'Payment processing failed'
  }

  // Development error details
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack
  }

  res.status(error.statusCode).json(error)
}

const getFirebaseAuthErrorMessage = (code) => {
  switch (code) {
    case 'auth/user-not-found':
      return 'User not found'
    case 'auth/wrong-password':
      return 'Invalid password'
    case 'auth/email-already-in-use':
      return 'Email already in use'
    case 'auth/weak-password':
      return 'Password is too weak'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/user-disabled':
      return 'User account has been disabled'
    case 'auth/too-many-requests':
      return 'Too many requests. Please try again later'
    case 'auth/id-token-expired':
      return 'Token has expired'
    case 'auth/id-token-revoked':
      return 'Token has been revoked'
    default:
      return 'Authentication failed'
  }
}