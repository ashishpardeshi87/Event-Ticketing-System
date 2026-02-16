import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

// Import middleware
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

// Import routes
import authRoutes from './routes/auth.js'
import eventRoutes from './routes/events.js'
import passRoutes from './routes/passes.js'
import teamRoutes from './routes/teams.js'
import paymentRoutes from './routes/payments.js'
import adminRoutes from './routes/admin.js'
import registrationRoutes from './routes/registrations.js'
import attendanceRoutes from './routes/attendance.js'

// Import utilities
import { initializeSampleData } from './utils/initializeData.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// Rate limiting - increased limit and excluded health check
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // increased from 100 to 500
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.path === '/health' || req.path === '/api/health'
})
app.use('/api/', limiter)

// CORS configuration - allow production and development origins
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true)
    const allowed = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'https://technostav-tickets.vercel.app',
      'https://technostav-tickets-*.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean)
    const allowedMatch = allowed.some(a => {
      if (a.includes('*')) {
        const re = new RegExp('^' + a.replace(/\*/g, '[^.]+') + '$')
        return re.test(origin)
      }
      return origin === a || origin.startsWith(a)
    })
    if (allowedMatch || /\.vercel\.app$/.test(origin)) {
      return callback(null, true)
    }
    callback(null, true) // Allow other origins; set to callback(new Error('Not allowed')) to restrict
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}

app.use(cors(corsOptions))

// Handle preflight requests
app.options('*', cors(corsOptions))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined'))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  })
})

// API health check endpoint (for consistency)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    message: 'API is running'
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'TechFest Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      api: '/api',
      auth: '/api/auth',
      events: '/api/events',
      passes: '/api/passes',
      teams: '/api/teams',
      payments: '/api/payments',
      admin: '/api/admin',
    }
  })
})

// Initialize sample data endpoint (for development)
app.post('/initialize-data', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Data initialization not allowed in production'
      })
    }
    
    await initializeSampleData()
    
    res.status(200).json({
      success: true,
      message: 'Sample data initialized successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize sample data',
      error: error.message
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/passes', passRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/attendance', attendanceRoutes)

// 404 handler
app.use(notFound)

// Error handling middleware
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`🌐 API Base: http://localhost:${PORT}/api`)
  console.log(`📊 Initialize data: POST http://localhost:${PORT}/initialize-data`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:')
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  // Don't exit in development to keep server running
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1))
  }
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:')
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  // Don't exit in development to keep server running
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1))
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

export default app