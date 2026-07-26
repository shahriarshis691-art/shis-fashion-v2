const PREFIX = 'SHIS-'
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function generateCouponCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return `${PREFIX}${code}`
}

export function isValidCouponCode(code: string): boolean {
  return /^SHIS-[A-Z0-9]{6}$/.test(code.trim().toUpperCase())
}

export function generateExpiryDate(days: number): string {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + days)
  return expiry.toISOString()
}

export function isCouponExpired(expiryDate: string): boolean {
  return new Date(expiryDate) <= new Date()
}