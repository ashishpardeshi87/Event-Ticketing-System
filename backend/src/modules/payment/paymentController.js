import { PaymentService } from './paymentService.js'

export class PaymentController {
  static async createOrder(req, res, next) {
    try {
      const orderData = {
        ...req.body,
        userId: req.user.uid
      }
      
      const order = await PaymentService.createOrder(orderData)
      
      res.status(201).json({
        success: true,
        data: order
      })
    } catch (error) {
      next(error)
    }
  }

  static async verifyPayment(req, res, next) {
    try {
      const paymentData = {
        ...req.body,
        userId: req.user.uid
      }
      
      const result = await PaymentService.verifyPayment(paymentData)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Payment verified successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async getPaymentHistory(req, res, next) {
    try {
      const payments = await PaymentService.getPaymentHistory(req.user.uid)
      
      res.status(200).json({
        success: true,
        data: payments
      })
    } catch (error) {
      next(error)
    }
  }

  static async getPayment(req, res, next) {
    try {
      const { id } = req.params
      const payment = await PaymentService.getPayment(id, req.user.uid)
      
      res.status(200).json({
        success: true,
        data: payment
      })
    } catch (error) {
      next(error)
    }
  }

  static async requestRefund(req, res, next) {
    try {
      const { id } = req.params
      const refundData = {
        ...req.body,
        userId: req.user.uid
      }
      
      const refund = await PaymentService.requestRefund(id, refundData)
      
      res.status(200).json({
        success: true,
        data: refund,
        message: 'Refund request submitted successfully'
      })
    } catch (error) {
      next(error)
    }
  }

  static async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature']
      const payload = req.body
      
      await PaymentService.handleWebhook(payload, signature)
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      })
    } catch (error) {
      console.error('Webhook error:', error)
      res.status(400).json({
        success: false,
        message: 'Webhook processing failed'
      })
    }
  }

  static async getAllPayments(req, res, next) {
    try {
      const filters = req.query
      const payments = await PaymentService.getAllPayments(filters)
      
      res.status(200).json({
        success: true,
        data: payments
      })
    } catch (error) {
      next(error)
    }
  }

  static async getPaymentStats(req, res, next) {
    try {
      const stats = await PaymentService.getPaymentStats()
      
      res.status(200).json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }
}