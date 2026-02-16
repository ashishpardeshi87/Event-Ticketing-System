import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { TeamController } from '../modules/team/teamController.js'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// User routes
router.post('/', TeamController.createTeam)
router.post('/join', TeamController.joinTeam)
router.get('/my-teams', TeamController.getMyTeams)
router.get('/:id', TeamController.getTeam)
router.post('/:id/leave', TeamController.leaveTeam)
router.delete('/:id', TeamController.deleteTeam)

// Leader routes
router.delete('/:id/members/:memberId', TeamController.removeMember)
router.post('/:id/replace-member', TeamController.replaceMember)

// Admin routes
router.post('/:id/lock', requireAdmin, TeamController.lockTeam)

export default router
