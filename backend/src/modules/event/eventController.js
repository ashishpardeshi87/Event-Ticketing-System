import { EventService } from './eventService.js'
import { cacheGet, cacheSet, cacheDel } from '../../config/redis.js'

const CACHE_TTL = 60

export class EventController {
  static async getEvents(req, res, next) {
    try {
      const cacheKey = 'events:list'
      const cached = await cacheGet(cacheKey)
      if (cached) return res.status(200).json(cached)
      const filters = req.query
      const events = await EventService.getEvents(filters)
      const payload = { success: true, data: events }
      await cacheSet(cacheKey, payload, CACHE_TTL)
      res.status(200).json(payload)
    } catch (error) {
      next(error)
    }
  }

  static async getEvent(req, res, next) {
    try {
      const { id } = req.params
      const cacheKey = `events:${id}`
      const cached = await cacheGet(cacheKey)
      if (cached) return res.status(200).json(cached)
      const event = await EventService.getEvent(id)
      const payload = { success: true, data: event }
      await cacheSet(cacheKey, payload, CACHE_TTL)
      res.status(200).json(payload)
    } catch (error) {
      next(error)
    }
  }

  static async createEvent(req, res, next) {
    try {
      const eventData = { ...req.body, createdBy: req.user.uid }
      const event = await EventService.createEvent(eventData)
      await cacheDel('events:list')
      res.status(201).json({
        success: true,
        data: event,
        message: 'Event created successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async updateEvent(req, res, next) {
    try {
      const { id } = req.params
      const updatedEvent = await EventService.updateEvent(id, req.body)
      await cacheDel('events:list')
      await cacheDel(`events:${id}`)
      res.status(200).json({
        success: true,
        data: updatedEvent,
        message: 'Event updated successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async deleteEvent(req, res, next) {
    try {
      const { id } = req.params
      await EventService.deleteEvent(id)
      await cacheDel('events:list')
      await cacheDel(`events:${id}`)
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async registerForEvent(req, res, next) {
    try {
      const { id } = req.params
      const registrationData = {
        ...req.body,
        userId: req.user.uid,
        eventId: id
      }
      
      const registration = await EventService.registerForEvent(registrationData)
      
      res.status(201).json({
        success: true,
        data: registration,
        message: 'Successfully registered for event'
      })
    } catch (error) {
      next(error)
    }
  }

  static async getMyRegistrations(req, res, next) {
    try {
      const registrations = await EventService.getUserRegistrations(req.user.uid)
      
      res.status(200).json({
        success: true,
        data: registrations
      })
    } catch (error) {
      next(error)
    }
  }

  static async cancelRegistration(req, res, next) {
    try {
      const { id } = req.params
      await EventService.cancelRegistration(id, req.user.uid)
      
      res.status(200).json({
        success: true,
        message: 'Registration cancelled successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async getEventRegistrations(req, res, next) {
    try {
      const { id } = req.params
      const registrations = await EventService.getEventRegistrations(id)
      
      res.status(200).json({
        success: true,
        data: registrations
      })
    } catch (error) {
      next(error)
    }
  }
}