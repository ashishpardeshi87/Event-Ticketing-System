import { RegistrationService } from './registrationService.js'

export class RegistrationController {
  /**
   * Register for event
   * POST /api/registrations/register
   */
  static async registerForEvent(req, res, next) {
    try {
      const userId = req.user.uid
      const registrationData = req.body
      
      const registration = await RegistrationService.registerForEvent(registrationData, userId)
      
      res.status(201).json({
        success: true,
        data: registration,
        message: 'Successfully registered for event'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Cancel registration
   * DELETE /api/registrations/:id
   */
  static async cancelRegistration(req, res, next) {
    try {
      const { id } = req.params
      const userId = req.user.uid
      
      await RegistrationService.cancelRegistration(id, userId)
      
      res.status(200).json({
        success: true,
        message: 'Registration cancelled successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user's registrations
   * GET /api/registrations/my-registrations
   */
  static async getMyRegistrations(req, res, next) {
    try {
      const userId = req.user.uid
      
      const registrations = await RegistrationService.getUserRegistrations(userId)
      
      res.status(200).json({
        success: true,
        data: registrations
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get event registrations (admin)
   * GET /api/registrations/event/:eventId
   */
  static async getEventRegistrations(req, res, next) {
    try {
      const { eventId } = req.params
      
      const registrations = await RegistrationService.getEventRegistrations(eventId)
      
      res.status(200).json({
        success: true,
        data: registrations
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Check if user can register
   * GET /api/registrations/can-register/:eventId
   */
  static async canRegister(req, res, next) {
    try {
      const { eventId } = req.params
      const userId = req.user.uid
      
      const result = await RegistrationService.canUserRegister(userId, eventId)
      
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get all registrations (admin)
   * GET /api/registrations/admin/all
   */
  static async getAllRegistrations(req, res, next) {
    try {
      const filters = req.query
      const registrations = await RegistrationService.getAllRegistrations(filters)
      
      res.status(200).json({
        success: true,
        data: registrations
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Manual registration (admin)
   * POST /api/registrations/admin/manual-register
   */
  static async manualRegister(req, res, next) {
    try {
      const registrationData = req.body
      const registration = await RegistrationService.manualRegister(registrationData)
      
      res.status(201).json({
        success: true,
        data: registration,
        message: 'Manual registration successful'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get registration stats (admin)
   * GET /api/registrations/admin/stats
   */
  static async getRegistrationStats(req, res, next) {
    try {
      const stats = await RegistrationService.getRegistrationStats()
      
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }
}
