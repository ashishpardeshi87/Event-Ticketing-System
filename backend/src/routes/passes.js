import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { PassController } from '../modules/pass/passController.js'

const router = express.Router()

// Public routes
router.get('/', PassController.getPasses)
router.get('/:id', PassController.getPassById)

// Protected routes (order matters: more specific routes first)
router.use(authenticateToken)
router.get('/my-pass', PassController.getMyPass)
router.get('/my-passes', PassController.getMyPasses)
router.post('/complete-registration', PassController.completeRegistration)
router.post('/verify-qr', PassController.verifyQR)

// Admin routes (/:id/versions must be before /:id for proper matching)
router.post('/', requireAdmin, PassController.createPass)
router.get('/:id/versions', requireAdmin, PassController.getPassVersions)
router.put('/:id', requireAdmin, PassController.updatePass)
router.delete('/:id', requireAdmin, PassController.deletePass)

export default router
