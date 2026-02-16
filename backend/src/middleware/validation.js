import Joi from 'joi'

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }
    next()
  }
}

// Common validation schemas
export const schemas = {
  // User registration
  userRegistration: Joi.object({
    email: Joi.string().email().required(),
    displayName: Joi.string().min(2).max(50).required(),
    password: Joi.string().min(6).required(),
  }),

  // Event creation
  eventCreation: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(1000).required(),
    category: Joi.string().valid('technical', 'cultural', 'sports', 'workshop').required(),
    date: Joi.date().iso().required(),
    time: Joi.string().required(),
    venue: Joi.string().min(3).max(100).required(),
    registrationFee: Joi.number().min(0).required(),
    requirements: Joi.array().items(Joi.string()),
    prizes: Joi.array().items(Joi.string()),
  }),

  // Team creation
  teamCreation: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(10).max(500).required(),
    maxMembers: Joi.number().integer().min(2).max(10).required(),
    isPublic: Joi.boolean().default(true),
  }),

  // Payment order creation
  paymentOrder: Joi.object({
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('INR').default('INR'),
    itemType: Joi.string().valid('pass', 'event').required(),
    itemId: Joi.string().required(),
    customerName: Joi.string().allow('').optional(),
    customerEmail: Joi.string().email().allow('').optional(),
    customerPhone: Joi.string().allow('').optional(),
  }),

  // Pass purchase
  passPurchase: Joi.object({
    passType: Joi.string().valid('single_day', 'multi_day', 'vip', 'student').required(),
    paymentId: Joi.string().required(),
    orderId: Joi.string().required(),
    signature: Joi.string().required(),
  }),
}