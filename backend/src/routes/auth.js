import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { AuthController } from '../modules/auth/authController.js'

const router = express.Router()

// Public routes
router.post('/verify-token', AuthController.verifyToken)

// Protected routes (more specific first)
router.use(authenticateToken)
router.get('/profile/hub', AuthController.getProfileHub)
router.get('/profile', AuthController.getProfile)
router.put('/profile', AuthController.updateProfile)
router.delete('/account', AuthController.deleteAccount)

export default router