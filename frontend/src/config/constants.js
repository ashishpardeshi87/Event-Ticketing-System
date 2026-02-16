// Ensure base URL always ends with /api so backend routes (e.g. /api/passes) are hit correctly
const raw = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/?$/, '')
export const API_BASE_URL = raw.endsWith('/api') ? raw : raw + '/api'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/dashboard/profile',
  PASSES: '/passes',
  MY_PASSES: '/dashboard/my-pass',
  PURCHASE_PASSES: '/passes',
  PASS_DETAIL: (id) => `/passes/${id}`,
  TEAMS: '/teams',
  ADMIN: '/admin',
  SCANNER: '/scanner',
}

export const USER_ROLES = {
  USER: 'user',
  VOLUNTEER: 'volunteer',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
}

export const PASS_TYPES = {
  SINGLE_DAY: 'single_day',
  MULTI_DAY: 'multi_day',
  VIP: 'vip',
  STUDENT: 'student',
}

export const EVENT_CATEGORIES = {
  TECHNICAL: 'technical',
  CULTURAL: 'cultural',
  SPORTS: 'sports',
  WORKSHOP: 'workshop',
}

export const REGISTRATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
}