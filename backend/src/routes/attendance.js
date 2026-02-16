import express from 'express'
import { authenticateToken, requireVolunteer, requireAdmin } from '../middleware/auth.js'
import { AttendanceController } from '../modules/attendance/attendanceController.js'

const router = express.Router()

// Volunteer: verify QR (preview user details + registrations, no record)
router.post('/verify', authenticateToken, requireVolunteer, AttendanceController.verify)

// Volunteer: scan QR and record attendance
router.post('/scan', authenticateToken, requireVolunteer, AttendanceController.scan)

// Volunteer: get attendance list (for their view)
router.get('/volunteer', authenticateToken, requireVolunteer, AttendanceController.getVolunteerAttendance)

// Admin only: get all attendance
router.get('/', authenticateToken, requireAdmin, AttendanceController.getAll)

// Admin: get attendance for specific event
router.get('/event/:eventId', authenticateToken, requireAdmin, AttendanceController.getByEvent)

// Admin: get attendance stats
router.get('/stats', authenticateToken, requireAdmin, AttendanceController.getStats)

export default router
