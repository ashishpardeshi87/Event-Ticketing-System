import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { RegistrationController } from '../modules/registration/registrationController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// User routes
router.post('/register', RegistrationController.registerForEvent)
router.get('/my-registrations', RegistrationController.getMyRegistrations)
router.get('/can-register/:eventId', RegistrationController.canRegister)
router.delete('/:id', RegistrationController.cancelRegistration)

// Admin routes
router.get('/admin/all', requireAdmin, RegistrationController.getAllRegistrations)
router.post('/admin/manual-register', requireAdmin, RegistrationController.manualRegister)
router.get('/admin/stats', requireAdmin, RegistrationController.getRegistrationStats)
router.get('/event/:eventId', requireAdmin, RegistrationController.getEventRegistrations)

export default router
