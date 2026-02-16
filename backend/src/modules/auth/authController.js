import { AuthService } from './authService.js'

export class AuthController {
  static async verifyToken(req, res, next) {
    try {
      const { token } = req.body
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        })
      }

      const result = await AuthService.verifyToken(token)
      
      res.status(200).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  static async getProfile(req, res, next) {
    try {
      const profile = await AuthService.getProfile(req.user.uid)
      res.status(200).json({ success: true, data: profile })
    } catch (error) {
      next(error)
    }
  }

  static async getProfileHub(req, res, next) {
    try {
      const hub = await AuthService.getProfileHub(req.user.uid)
      res.status(200).json({ success: true, data: hub })
    } catch (error) {
      next(error)
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const updatedProfile = await AuthService.updateProfile(req.user.uid, req.body)
      
      res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteAccount(req, res, next) {
    try {
      await AuthService.deleteAccount(req.user.uid)
      
      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }
}