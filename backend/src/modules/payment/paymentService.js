import crypto from 'crypto'
import { razorpay, RAZORPAY_WEBHOOK_SECRET } from '../../config/razorpay.js'
import { db } from '../../config/firebase.js'

export class PaymentService {
  static async createOrder(orderData) {
    try {
      const { amount, currency = 'INR', itemType, itemId, userId } = orderData
      
      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency,
        receipt: `${itemType}_${itemId}_${Date.now()}`,
        notes: {
          userId,
          itemType,
          itemId
        }
      })
      
      // Save order to database
      const order = {
        orderId: razorpayOrder.id,
        userId,
        amount,
        currency,
        itemType,
        itemId,
        status: 'created',
        razorpayOrder,
        createdAt: new Date()
      }
      
      const docRef = await db.collection('orders').add(order)
      
      return {
        id: docRef.id,
        ...order
      }
    } catch (error) {
      throw error
    }
  }

  static async verifyPayment(paymentData) {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        userId 
      } = paymentData
      
      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex')
      
      if (expectedSignature !== razorpay_signature) {
        throw new Error('Invalid payment signature')
      }
      
      // Get order from database
      const orderSnapshot = await db.collection('orders')
        .where('orderId', '==', razorpay_order_id)
        .where('userId', '==', userId)
        .get()
      
      if (orderSnapshot.empty) {
        throw new Error('Order not found')
      }
      
      const orderDoc = orderSnapshot.docs[0]
      const orderData = orderDoc.data()
      
      // Create payment record
      const payment = {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        userId,
        amount: orderData.amount,
        currency: orderData.currency,
        itemType: orderData.itemType,
        itemId: orderData.itemId,
        status: 'success',
        signature: razorpay_signature,
        paidAt: new Date()
      }
      
      const paymentRef = await db.collection('payments').add(payment)
      
      // Update order status
      await orderDoc.ref.update({
        status: 'paid',
        paymentId: razorpay_payment_id,
        paidAt: new Date()
      })
      
      // Process the purchase based on item type
      await this.processPurchase(orderData.itemType, orderData.itemId, userId, paymentRef.id)
      
      return {
        id: paymentRef.id,
        ...payment
      }
    } catch (error) {
      throw error
    }
  }

  static async processPurchase(itemType, itemId, userId, paymentId) {
    try {
      if (itemType === 'pass') {
        // Import PassService dynamically to avoid circular dependency
        const { PassService } = await import('../pass/passService.js')
        
        // Attach pass version to user (includes QR token generation)
        await PassService.attachPassToUser(userId, itemId, paymentId)
      } else if (itemType === 'event') {
        // Event registration - use RegistrationService for full validation & pass tracking
        const { RegistrationService } = await import('../registration/registrationService.js')
        await RegistrationService.registerForEvent(
          { eventId: itemId, formData: {}, paymentId },
          userId
        )
        // Note: RegistrationService handles registration creation, event count, and pass eventsRegistered
      }
    } catch (error) {
      console.error('Error processing purchase:', error)
      throw error
    }
  }

  static async getPaymentHistory(userId) {
    try {
      const snapshot = await db.collection('payments')
        .where('userId', '==', userId)
        .orderBy('paidAt', 'desc')
        .get()
      
      const payments = []
      
      snapshot.forEach(doc => {
        payments.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return payments
    } catch (error) {
      throw error
    }
  }

  static async getPayment(paymentId, userId) {
    try {
      const paymentDoc = await db.collection('payments').doc(paymentId).get()
      
      if (!paymentDoc.exists) {
        throw new Error('Payment not found')
      }
      
      const paymentData = paymentDoc.data()
      
      // Check if user owns this payment
      if (paymentData.userId !== userId) {
        throw new Error('Unauthorized access to payment')
      }
      
      return {
        id: paymentDoc.id,
        ...paymentData
      }
    } catch (error) {
      throw error
    }
  }

  static async requestRefund(paymentId, refundData) {
    try {
      const { reason, userId } = refundData
      
      const paymentDoc = await db.collection('payments').doc(paymentId).get()
      
      if (!paymentDoc.exists) {
        throw new Error('Payment not found')
      }
      
      const paymentData = paymentDoc.data()
      
      // Check if user owns this payment
      if (paymentData.userId !== userId) {
        throw new Error('Unauthorized access to payment')
      }
      
      // Create refund request
      const refundRequest = {
        paymentId,
        userId,
        amount: paymentData.amount,
        reason,
        status: 'pending',
        requestedAt: new Date()
      }
      
      const docRef = await db.collection('refund_requests').add(refundRequest)
      
      return {
        id: docRef.id,
        ...refundRequest
      }
    } catch (error) {
      throw error
    }
  }

  static async handleWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex')
      
      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature')
      }
      
      const { event, payload: webhookPayload } = payload
      
      switch (event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(webhookPayload.payment.entity)
          break
        case 'payment.failed':
          await this.handlePaymentFailed(webhookPayload.payment.entity)
          break
        case 'refund.processed':
          await this.handleRefundProcessed(webhookPayload.refund.entity)
          break
        default:
          console.log(`Unhandled webhook event: ${event}`)
      }
    } catch (error) {
      throw error
    }
  }

  static async handlePaymentCaptured(payment) {
    try {
      // Update payment status in database
      const paymentSnapshot = await db.collection('payments')
        .where('paymentId', '==', payment.id)
        .get()
      
      if (!paymentSnapshot.empty) {
        const paymentDoc = paymentSnapshot.docs[0]
        await paymentDoc.ref.update({
          status: 'captured',
          capturedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error handling payment captured:', error)
    }
  }

  static async handlePaymentFailed(payment) {
    try {
      // Update payment status in database
      const paymentSnapshot = await db.collection('payments')
        .where('paymentId', '==', payment.id)
        .get()
      
      if (!paymentSnapshot.empty) {
        const paymentDoc = paymentSnapshot.docs[0]
        await paymentDoc.ref.update({
          status: 'failed',
          failedAt: new Date(),
          errorCode: payment.error_code,
          errorDescription: payment.error_description
        })
      }
    } catch (error) {
      console.error('Error handling payment failed:', error)
    }
  }

  static async handleRefundProcessed(refund) {
    try {
      // Update refund status in database
      const refundSnapshot = await db.collection('refund_requests')
        .where('paymentId', '==', refund.payment_id)
        .get()
      
      if (!refundSnapshot.empty) {
        const refundDoc = refundSnapshot.docs[0]
        await refundDoc.ref.update({
          status: 'processed',
          refundId: refund.id,
          processedAt: new Date()
        })
      }
    } catch (error) {
      console.error('Error handling refund processed:', error)
    }
  }

  static async getAllPayments(filters = {}) {
    try {
      let query = db.collection('payments')
      
      if (filters.status) {
        query = query.where('status', '==', filters.status)
      }
      
      if (filters.itemType) {
        query = query.where('itemType', '==', filters.itemType)
      }
      
      query = query.orderBy('paidAt', 'desc')
      
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit))
      }
      
      const snapshot = await query.get()
      const payments = []
      
      snapshot.forEach(doc => {
        payments.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      return payments
    } catch (error) {
      throw error
    }
  }

  static async getPaymentStats() {
    try {
      const paymentsSnapshot = await db.collection('payments').get()
      
      let totalRevenue = 0
      let totalTransactions = 0
      const statusCounts = {}
      const itemTypeCounts = {}
      
      paymentsSnapshot.forEach(doc => {
        const payment = doc.data()
        
        if (payment.status === 'success' || payment.status === 'captured') {
          totalRevenue += payment.amount
          totalTransactions++
        }
        
        statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1
        itemTypeCounts[payment.itemType] = (itemTypeCounts[payment.itemType] || 0) + 1
      })
      
      return {
        totalRevenue,
        totalTransactions,
        statusCounts,
        itemTypeCounts
      }
    } catch (error) {
      throw error
    }
  }
}