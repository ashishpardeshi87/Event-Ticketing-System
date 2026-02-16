import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { AdminController } from '../modules/admin/adminController.js'

const router = express.Router()

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin)

// Dashboard stats
router.get('/stats', AdminController.getDashboardStats)
router.get('/analytics', AdminController.getAnalytics)

// User management
router.get('/users', AdminController.getUsers)
router.get('/users/:id', AdminController.getUser)
router.put('/users/:id', AdminController.updateUser)
router.delete('/users/:id', AdminController.deleteUser)
router.post('/users/:id/set-admin', AdminController.setAdminRole)
router.post('/users/:id/remove-admin', AdminController.removeAdminRole)
router.post('/users/:id/set-volunteer', AdminController.setVolunteerRole)
router.post('/users/:id/remove-volunteer', AdminController.removeVolunteerRole)
router.put('/users/:id/volunteer-events', AdminController.assignVolunteerToEvents)
router.post('/users/:id/block', AdminController.blockUser)
router.post('/users/:id/unblock', AdminController.unblockUser)

// System management
router.get('/system/health', AdminController.getSystemHealth)
router.get('/system/logs', AdminController.getSystemLogs)
router.post('/system/backup', AdminController.createBackup)

export default router