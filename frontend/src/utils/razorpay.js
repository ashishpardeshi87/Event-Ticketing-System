// Razorpay utility functions
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => {
      resolve(true)
    }
    script.onerror = () => {
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

export const createRazorpayOrder = async (orderData, onSuccess, onFailure) => {
  const isLoaded = await loadRazorpayScript()
  
  if (!isLoaded) {
    onFailure('Failed to load Razorpay SDK')
    return
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: orderData.amount * 100, // Convert to paise
    currency: orderData.currency || 'INR',
    name: 'TechFest Platform',
    description: orderData.description || 'Payment for TechFest',
    order_id: orderData.orderId,
    handler: function (response) {
      onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      })
    },
    prefill: {
      name: orderData.customerName || '',
      email: orderData.customerEmail || '',
      contact: orderData.customerPhone || '',
    },
    notes: orderData.notes || {},
    theme: {
      color: '#111827', // Gray-900
    },
    modal: {
      ondismiss: function() {
        onFailure('Payment cancelled by user')
      }
    }
  }

  const razorpay = new window.Razorpay(options)
  razorpay.open()
}