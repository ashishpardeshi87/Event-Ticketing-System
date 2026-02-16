import { PassService } from './passService.js'
import { cacheGet, cacheSet, cacheDel } from '../../config/redis.js'

const CACHE_TTL = 60

export class PassController {
  /**
   * Get single pass by ID (public)
   * GET /api/passes/:id
   */
  static async getPassById(req, res, next) {
    try {
      const { id } = req.params
      if (id === 'my-pass' || id === 'my-passes') return next()
      const cacheKey = `passes:${id}`
      const cached = await cacheGet(cacheKey)
      if (cached) return res.status(200).json(cached)
      const pass = await PassService.getPass(id)
      const payload = { success: true, data: pass }
      await cacheSet(cacheKey, payload, CACHE_TTL)
      res.status(200).json(payload)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all available passes. Optional query: ?eventId=xxx for passes attached to that event (fest).
   * GET /api/passes
   */
  static async getPasses(req, res, next) {
    try {
      const filters = {}
      if (req.query.eventId) filters.eventId = req.query.eventId
      const cacheKey = filters.eventId ? `passes:list:${filters.eventId}` : 'passes:list'
      const cached = await cacheGet(cacheKey)
      if (cached) return res.status(200).json(cached)
      const passes = await PassService.getPasses(filters)
      const payload = { success: true, data: passes }
      await cacheSet(cacheKey, payload, CACHE_TTL)
      res.status(200).json(payload)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user's pass
   * GET /api/passes/my-pass
   */
  static async getMyPass(req, res, next) {
    try {
      const userId = req.user.uid
      
      const userPass = await PassService.getUserPass(userId)
      
      if (!userPass) {
        return res.status(200).json({ success: true, data: null })
      }
      
      // Normalize response for frontend
      const passType = userPass.passTypeDetails || {}
      const maxEvents = passType.maxEvents ?? userPass.maxEvents ?? 0
      const eventsRegistered = userPass.eventsRegistered ?? 0
      
      const normalized = {
        id: userPass.id,
        pass: { name: passType.name || 'Pass', description: passType.description },
        version: {
          version: '1.0',
          allowedEventIds: passType.allowedEventIds || userPass.allowedEventIds || [],
          allowedEvents: passType.allowedEvents || []
        },
        userStats: {
          eventsRegistered,
          maxEvents,
          eventsRemaining: maxEvents > 0 ? Math.max(0, maxEvents - eventsRegistered) : 999
        },
        purchasedAt: userPass.purchasedAt,
        qrToken: userPass.qrToken,
        passTypeDetails: passType
      }
      
      res.status(200).json({
        success: true,
        data: normalized
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all of user's passes (multi-pass support)
   * GET /api/passes/my-passes
   */
  static async getMyPasses(req, res, next) {
    try {
      const userId = req.user.uid
      const passes = await PassService.getUserPasses(userId)
      const normalized = passes.map((p) => {
        const passType = p.passTypeDetails || {}
        const allowedEventIds = (passType.allowedEventIds && passType.allowedEventIds.length)
          ? passType.allowedEventIds
          : (p.allowedEventIds || [])
        return {
          id: p.id,
          passType: p.passType,
          passTypeDetails: p.passTypeDetails,
          status: p.status,
          purchasedAt: p.purchasedAt,
          qrToken: p.qrToken,
          maxEvents: p.maxEvents,
          eventsRegistered: p.eventsRegistered,
          allowedEventIds: Array.isArray(allowedEventIds) ? allowedEventIds : []
        }
      })
      res.status(200).json({ success: true, data: normalized })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Complete post-payment registration for a pass (optional).
   * POST /api/passes/complete-registration body: { userPassId, formData?, teamId? }
   */
  static async completeRegistration(req, res, next) {
    try {
      const { userPassId, formData, teamId } = req.body
      const userId = req.user.uid
      if (!userPassId) {
        return res.status(400).json({ success: false, message: 'userPassId required' })
      }
      const result = await PassService.completeRegistration(userPassId, userId, { formData, teamId })
      res.status(200).json({ success: true, data: result, message: 'Registration completed' })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Verify QR token
   * POST /api/passes/verify-qr
   */
  static async verifyQR(req, res, next) {
    try {
      const { qrToken } = req.body
      
      const result = await PassService.verifyQRToken(qrToken)
      
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create pass (admin)
   * POST /api/passes
   */
  static async createPass(req, res, next) {
    try {
      const passData = req.body
      const createdBy = req.user.uid
      const pass = await PassService.createPass(passData, createdBy)
      await cacheDel('passes:list')
      res.status(201).json({
        success: true,
        data: pass,
        message: 'Pass created successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update pass - creates new version (admin)
   * PUT /api/passes/:id
   */
  static async updatePass(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body
      const updatedBy = req.user.uid
      const result = await PassService.updatePass(id, updateData, updatedBy)
      await cacheDel('passes:list')
      await cacheDel(`passes:${id}`)
      res.status(200).json({
        success: true,
        data: result,
        message: 'Pass updated successfully. New version created.'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get pass versions (admin)
   * GET /api/passes/:id/versions
   */
  static async getPassVersions(req, res, next) {
    try {
      const { id } = req.params
      
      const versions = await PassService.getPassVersions(id)
      
      res.status(200).json({
        success: true,
        data: versions
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete pass (admin)
   * DELETE /api/passes/:id
   */
  static async deletePass(req, res, next) {
    try {
      const { id } = req.params
      await PassService.deletePass(id)
      await cacheDel('passes:list')
      await cacheDel(`passes:${id}`)
      res.status(200).json({
        success: true,
        message: 'Pass deactivated successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}
