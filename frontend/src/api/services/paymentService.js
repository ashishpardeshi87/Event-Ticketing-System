import apiClient from '../client'
import { createRazorpayOrder } from '../../utils/razorpay'

export const paymentService = {
  // Create Razorpay order
  createOrder: async (orderData) => {
    const response = await apiClient.post('/payments/create-order', orderData)
    return response.data
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    const response = await apiClient.post('/payments/verify', paymentData)
    return response.data
  },

  // Get payment history
  getPaymentHistory: async () => {
    const response = await apiClient.get('/payments/history')
    return response.data
  },

  // Get payment details
  getPayment: async (paymentId) => {
    const response = await apiClient.get(`/payments/${paymentId}`)
    return response.data
  },

  // Request refund
  requestRefund: async (paymentId, refundData) => {
    const response = await apiClient.post(`/payments/${paymentId}/refund`, refundData)
    return response.data
  },

  // Process payment with Razorpay
  processPayment: async (orderData) => {
    try {
      // First create order on backend
      const orderResponse = await apiClient.post('/payments/create-order', orderData)
      const order = orderResponse.data.data

      return new Promise((resolve, reject) => {
        createRazorpayOrder(
          {
            ...order,
            customerName: orderData.customerName,
            customerEmail: orderData.customerEmail,
            customerPhone: orderData.customerPhone,
            description: `Payment for ${orderData.itemType}: ${orderData.itemId}`,
          },
          async (paymentResponse) => {
            try {
              // Verify payment on backend
              const verificationResponse = await apiClient.post('/payments/verify', {
                ...paymentResponse,
                orderId: order.orderId,
              })
              resolve(verificationResponse.data)
            } catch (error) {
              reject(error)
            }
          },
          (error) => {
            reject(new Error(error))
          }
        )
      })
    } catch (error) {
      throw error
    }
  },
}