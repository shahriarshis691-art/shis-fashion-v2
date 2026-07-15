export function formatBDT(value: number | string): string {
  const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/[^0-9.]/g, ''))

  if (Number.isNaN(numericValue)) {
    return '৳ 0'
  }

  return `৳ ${numericValue.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

export function parseBDT(value: number | string): number {
  if (typeof value === 'number') {
    return value
  }

  const numericValue = Number.parseFloat(String(value).replace(/[^0-9.]/g, ''))
  return Number.isNaN(numericValue) ? 0 : numericValue
}
