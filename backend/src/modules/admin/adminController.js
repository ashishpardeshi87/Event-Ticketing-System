import { AdminService } from './adminService.js'

export class AdminController {
  static async getDashboardStats(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats()
      
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  static async getAnalytics(req, res, next) {
    try {
      const { period = '30d' } = req.query
      const analytics = await AdminService.getAnalytics(period)
      
      res.status(200).json({
        success: true,
        data: analytics
      })
    } catch (error) {
      next(error)
    }
  }

  static async getUsers(req, res, next) {
    try {
      const filters = req.query
      const users = await AdminService.getUsers(filters)
      
      res.status(200).json({
        success: true,
        data: users
      })
    } catch (error) {
      next(error)
    }
  }

  static async getUser(req, res, next) {
    try {
      const { id } = req.params
      const user = await AdminService.getUser(id)
      
      res.status(200).json({
        success: true,
        data: user
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params
      const updatedUser = await AdminService.updateUser(id, req.body)
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params
      await AdminService.deleteUser(id)
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async setAdminRole(req, res, next) {
    try {
      const { id } = req.params
      await AdminService.setAdminRole(id)
      
      res.status(200).json({
        success: true,
        message: 'Admin role granted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async removeAdminRole(req, res, next) {
    try {
      const { id } = req.params
      await AdminService.removeAdminRole(id)
      res.status(200).json({ success: true, message: 'Admin role removed successfully' })
    } catch (error) {
      next(error)
    }
  }

  static async setVolunteerRole(req, res, next) {
    try {
      const { id } = req.params
      await AdminService.setVolunteerRole(id)
      res.status(200).json({ success: true, message: 'Volunteer access granted' })
    } catch (error) {
      next(error)
    }
  }

  static async removeVolunteerRole(req, res, next) {
    try {
      const { id } = req.params
      await AdminService.removeVolunteerRole(id)
      res.status(200).json({ success: true, message: 'Volunteer access removed' })
    } catch (error) {
      next(error)
    }
  }

  static async assignVolunteerToEvents(req, res, next) {
    try {
      const { id } = req.params
      const { eventIds, passIds } = req.body
      await AdminService.assignVolunteerToEvents(id, eventIds, passIds)
      res.status(200).json({ success: true, message: 'Volunteer assignment updated' })
    } catch (error) {
      next(error)
    }
  }

  static async blockUser(req, res, next) {
    try {
      const { id } = req.params
      const { reason } = req.body
      const blockedBy = req.user?.uid
      await AdminService.blockUser(id, reason, blockedBy)
      res.status(200).json({ success: true, message: 'User blocked from attendance' })
    } catch (error) {
      next(error)
    }
  }

  static async unblockUser(req, res, next) {
    try {
      const { id } = req.params
      await AdminService.unblockUser(id)
      res.status(200).json({ success: true, message: 'User unblocked' })
    } catch (error) {
      next(error)
    }
  }

  static async getSystemHealth(req, res, next) {
    try {
      const health = await AdminService.getSystemHealth()
      
      res.status(200).json({
        success: true,
        data: health
      })
    } catch (error) {
      next(error)
    }
  }

  static async getSystemLogs(req, res, next) {
    try {
      const { limit = 100, level = 'all' } = req.query
      const logs = await AdminService.getSystemLogs(limit, level)
      
      res.status(200).json({
        success: true,
        data: logs
      })
    } catch (error) {
      next(error)
    }
  }

  static async createBackup(req, res, next) {
    try {
      const backup = await AdminService.createBackup()
      
      res.status(201).json({
        success: true,
        data: backup,
        message: 'Backup created successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}