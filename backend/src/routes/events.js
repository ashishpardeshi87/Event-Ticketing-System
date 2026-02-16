import express from 'express'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { validate, schemas } from '../middleware/validation.js'
import { EventController } from '../modules/event/eventController.js'

const router = express.Router()

// Public routes
router.get('/', optionalAuth, EventController.getEvents)
router.get('/:id', optionalAuth, EventController.getEvent)

// Protected routes
router.use(authenticateToken)
router.post('/:id/register', EventController.registerForEvent)
router.get('/my-registrations', EventController.getMyRegistrations)
router.delete('/registrations/:id', EventController.cancelRegistration)

// Admin routes
router.post('/', requireAdmin, validate(schemas.eventCreation), EventController.createEvent)
router.put('/:id', requireAdmin, EventController.updateEvent)
router.delete('/:id', requireAdmin, EventController.deleteEvent)
router.get('/:id/registrations', requireAdmin, EventController.getEventRegistrations)

export default router