/**
 * Format amount as Indian Rupee (₹) - always ₹, never $
 */
export const formatCurrency = (amount, options = {}) => {
  const num = Number(amount) || 0
  const { maximumFractionDigits = 0 } = options
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(num)
  return `₹${formatted}`
}
