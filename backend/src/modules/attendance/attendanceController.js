import { AttendanceService } from './attendanceService.js'

export class AttendanceController {
  static async verify(req, res, next) {
    try {
      const { qrToken } = req.body
      if (!qrToken?.trim()) {
        return res.status(400).json({ success: false, message: 'QR token required' })
      }
      const data = await AttendanceService.verifyOnly(qrToken.trim())
      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  static async scan(req, res, next) {
    try {
      const { qrToken, venue, eventId, status } = req.body
      const volunteerId = req.user.uid
      const result = await AttendanceService.scanAndRecord(
        qrToken,
        volunteerId,
        venue || '',
        eventId || '',
        status || 'present'
      )
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  static async getAll(req, res, next) {
    try {
      const filters = req.query
      const list = await AttendanceService.getAllAttendance(filters)
      res.status(200).json({ success: true, data: list })
    } catch (error) {
      next(error)
    }
  }

  static async getByEvent(req, res, next) {
    try {
      const { eventId } = req.params
      const list = await AttendanceService.getAttendanceByEvent(eventId)
      res.status(200).json({ success: true, data: list })
    } catch (error) {
      next(error)
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await AttendanceService.getAttendanceStats()
      res.status(200).json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }

  static async getVolunteerAttendance(req, res, next) {
    try {
      const volunteerId = req.user.uid
      const filters = { ...req.query, limit: req.query.limit || 100 }
      const list = await AttendanceService.getVolunteerAttendance(volunteerId, filters)
      res.status(200).json({ success: true, data: list })
    } catch (error) {
      next(error)
    }
  }
}
