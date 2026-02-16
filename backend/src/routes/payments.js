import express from 'express'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { validate, schemas } from '../middleware/validation.js'
import { PaymentController } from '../modules/payment/paymentController.js'

const router = express.Router()

// Webhook route (no auth required)
router.post('/webhook', PaymentController.handleWebhook)

// Protected routes
router.use(authenticateToken)
router.post('/create-order', validate(schemas.paymentOrder), PaymentController.createOrder)
router.post('/verify', PaymentController.verifyPayment)
router.get('/history', PaymentController.getPaymentHistory)
router.get('/:id', PaymentController.getPayment)
router.post('/:id/refund', PaymentController.requestRefund)

// Admin routes
router.get('/admin/all', requireAdmin, PaymentController.getAllPayments)
router.get('/admin/stats', requireAdmin, PaymentController.getPaymentStats)

export default router