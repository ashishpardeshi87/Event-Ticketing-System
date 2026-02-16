import { auth, db } from '../../config/firebase.js'

export class AdminService {
  static async getDashboardStats() {
    try {
      // Get user count
      const usersSnapshot = await db.collection('users').get()
      const totalUsers = usersSnapshot.size

      // Get event count
      const eventsSnapshot = await db.collection('events').get()
      const totalEvents = eventsSnapshot.size
      const activeEvents = eventsSnapshot.docs.filter(doc => 
        doc.data().status === 'open'
      ).length

      // Get registration count
      const registrationsSnapshot = await db.collection('registrations').get()
      const totalRegistrations = registrationsSnapshot.size

      // Get payment stats - simplified query
      const paymentsSnapshot = await db.collection('payments').get()
      
      let totalRevenue = 0
      let successfulPayments = 0
      paymentsSnapshot.forEach(doc => {
        const data = doc.data()
        if (data.status === 'success' || data.status === 'captured') {
          totalRevenue += data.amount || 0
          successfulPayments++
        }
      })

      // Get team count
      const teamsSnapshot = await db.collection('teams').get()
      const totalTeams = teamsSnapshot.size

      return {
        users: {
          total: totalUsers,
          new: await this.getNewUsersCount(7) // Last 7 days
        },
        events: {
          total: totalEvents,
          active: activeEvents
        },
        registrations: {
          total: totalRegistrations
        },
        revenue: {
          total: totalRevenue,
          transactions: successfulPayments
        },
        teams: {
          total: totalTeams
        }
      }
    } catch (error) {
      console.error('[AdminService.getDashboardStats] Error:', error.message)
      throw error
    }
  }

  static async getNewUsersCount(days) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const snapshot = await db.collection('users')
        .where('createdAt', '>=', startDate)
        .get()

      return snapshot.size
    } catch (error) {
      return 0
    }
  }

  static async getAnalytics(period) {
    try {
      const days = this.getPeriodDays(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // User registrations over time
      const userRegistrations = await this.getUserRegistrationsByDate(startDate)
      
      // Revenue over time
      const revenueData = await this.getRevenueByDate(startDate)
      
      // Event registrations over time
      const eventRegistrations = await this.getEventRegistrationsByDate(startDate)

      return {
        userRegistrations,
        revenue: revenueData,
        eventRegistrations,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      }
    } catch (error) {
      throw error
    }
  }

  static getPeriodDays(period) {
    switch (period) {
      case '7d': return 7
      case '30d': return 30
      case '90d': return 90
      case '1y': return 365
      default: return 30
    }
  }

  static async getUserRegistrationsByDate(startDate) {
    try {
      const snapshot = await db.collection('users')
        .where('createdAt', '>=', startDate)
        .orderBy('createdAt', 'asc')
        .get()

      const registrationsByDate = {}
      
      snapshot.forEach(doc => {
        const date = doc.data().createdAt.toDate().toISOString().split('T')[0]
        registrationsByDate[date] = (registrationsByDate[date] || 0) + 1
      })

      return registrationsByDate
    } catch (error) {
      return {}
    }
  }

  static async getRevenueByDate(startDate) {
    try {
      const snapshot = await db.collection('payments')
        .where('paidAt', '>=', startDate)
        .where('status', 'in', ['success', 'captured'])
        .orderBy('paidAt', 'asc')
        .get()

      const revenueByDate = {}
      
      snapshot.forEach(doc => {
        const data = doc.data()
        const date = data.paidAt.toDate().toISOString().split('T')[0]
        revenueByDate[date] = (revenueByDate[date] || 0) + (data.amount || 0)
      })

      return revenueByDate
    } catch (error) {
      return {}
    }
  }

  static async getEventRegistrationsByDate(startDate) {
    try {
      const snapshot = await db.collection('registrations')
        .where('registeredAt', '>=', startDate)
        .orderBy('registeredAt', 'asc')
        .get()

      const registrationsByDate = {}
      
      snapshot.forEach(doc => {
        const date = doc.data().registeredAt.toDate().toISOString().split('T')[0]
        registrationsByDate[date] = (registrationsByDate[date] || 0) + 1
      })

      return registrationsByDate
    } catch (error) {
      return {}
    }
  }

  static async getUsers(filters = {}) {
    try {
      let query = db.collection('users')

      if (filters.role) {
        query = query.where('role', '==', filters.role)
      }

      if (filters.search) {
        // Note: Firestore doesn't support full-text search
        // This is a basic implementation
        query = query.where('email', '>=', filters.search)
          .where('email', '<=', filters.search + '\uf8ff')
      }

      query = query.orderBy('createdAt', 'desc')

      if (filters.limit) {
        query = query.limit(parseInt(filters.limit))
      }

      const snapshot = await query.get()
      const users = []

      snapshot.forEach(doc => {
        users.push({
          id: doc.id,
          ...doc.data()
        })
      })

      return users
    } catch (error) {
      throw error
    }
  }

  static async getUser(userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get()

      if (!userDoc.exists) {
        throw new Error('User not found')
      }

      const userData = userDoc.data()

      // Get user's registrations
      const registrationsSnapshot = await db.collection('registrations')
        .where('userId', '==', userId)
        .get()

      // Get user's payments
      const paymentsSnapshot = await db.collection('payments')
        .where('userId', '==', userId)
        .get()

      // Get user's teams
      const teamMembersSnapshot = await db.collection('team_members')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get()

      return {
        id: userDoc.id,
        ...userData,
        stats: {
          registrations: registrationsSnapshot.size,
          payments: paymentsSnapshot.size,
          teams: teamMembersSnapshot.size
        }
      }
    } catch (error) {
      throw error
    }
  }

  static async updateUser(userId, updateData) {
    try {
      const userRef = db.collection('users').doc(userId)
      const userDoc = await userRef.get()

      if (!userDoc.exists) {
        throw new Error('User not found')
      }

      const updatedData = {
        ...updateData,
        updatedAt: new Date()
      }

      // Remove sensitive fields
      delete updatedData.uid
      delete updatedData.createdAt

      await userRef.update(updatedData)

      const updatedDoc = await userRef.get()
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    } catch (error) {
      throw error
    }
  }

  static async deleteUser(userId) {
    try {
      // Delete user document from Firestore
      await db.collection('users').doc(userId).delete()

      // Delete user from Firebase Auth
      await auth.deleteUser(userId)

      return true
    } catch (error) {
      throw error
    }
  }

  static async setAdminRole(userId) {
    try {
      // Set custom claims
      await auth.setCustomUserClaims(userId, { admin: true })

      // Update user document
      await db.collection('users').doc(userId).update({
        role: 'admin',
        updatedAt: new Date()
      })

      return true
    } catch (error) {
      throw error
    }
  }

  static async removeAdminRole(userId) {
    try {
      await auth.setCustomUserClaims(userId, { admin: false })
      await db.collection('users').doc(userId).update({
        role: 'user',
        updatedAt: new Date()
      })
      return true
    } catch (error) {
      throw error
    }
  }

  static async setVolunteerRole(userId) {
    try {
      await db.collection('users').doc(userId).update({
        role: 'volunteer',
        updatedAt: new Date()
      })
      return true
    } catch (error) {
      throw error
    }
  }

  static async removeVolunteerRole(userId) {
    try {
      await db.collection('users').doc(userId).update({
        role: 'user',
        assignedEventIds: [],
        assignedPassIds: [],
        updatedAt: new Date()
      })
      return true
    } catch (error) {
      throw error
    }
  }

  static async assignVolunteerToEvents(userId, eventIds, passIds = null) {
    try {
      const update = {
        assignedEventIds: Array.isArray(eventIds) ? eventIds : [],
        updatedAt: new Date()
      }
      if (passIds !== undefined && passIds !== null) {
        update.assignedPassIds = Array.isArray(passIds) ? passIds : []
      }
      await db.collection('users').doc(userId).update(update)
      return true
    } catch (error) {
      throw error
    }
  }

  static async blockUser(userId, reason = '', blockedBy) {
    try {
      await db.collection('user_blocks').doc(userId).set({
        blocked: true,
        reason: reason || '',
        blockedBy: blockedBy || null,
        blockedAt: new Date()
      }, { merge: true })
      return true
    } catch (error) {
      throw error
    }
  }

  static async unblockUser(userId) {
    try {
      await db.collection('user_blocks').doc(userId).set({
        blocked: false,
        reason: null,
        blockedBy: null,
        blockedAt: null
      }, { merge: true })
      return true
    } catch (error) {
      throw error
    }
  }

  static async getSystemHealth() {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          database: 'operational',
          authentication: 'operational',
          storage: 'operational',
          payments: 'operational'
        },
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      }

      // Test database connection
      try {
        await db.collection('health_check').limit(1).get()
      } catch (error) {
        health.services.database = 'degraded'
        health.status = 'degraded'
      }

      return health
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message
      }
    }
  }

  static async getSystemLogs(limit = 100, level = 'all') {
    try {
      // This is a placeholder implementation
      // In a real application, you would integrate with a logging service
      const logs = [
        {
          id: '1',
          timestamp: new Date(),
          level: 'info',
          message: 'System health check completed',
          service: 'admin'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000),
          level: 'info',
          message: 'User authentication successful',
          service: 'auth'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000),
          level: 'warn',
          message: 'High memory usage detected',
          service: 'system'
        }
      ]

      return logs.slice(0, limit)
    } catch (error) {
      throw error
    }
  }

  static async createBackup() {
    try {
      // This is a placeholder implementation
      // In a real application, you would implement actual backup logic
      const backup = {
        id: `backup_${Date.now()}`,
        timestamp: new Date(),
        status: 'completed',
        size: '125MB',
        collections: [
          'users',
          'events',
          'registrations',
          'payments',
          'teams'
        ]
      }

      return backup
    } catch (error) {
      throw error
    }
  }
}