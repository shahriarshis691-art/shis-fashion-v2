export const STANDARD_SIZE_GUIDE = [
  { size: 'S', chest: '38–40 in', length: '27 in' },
  { size: 'M', chest: '40–42 in', length: '28 in' },
  { size: 'L', chest: '42–44 in', length: '29 in' },
  { size: 'XL', chest: '44–46 in', length: '30 in' },
  { size: 'XXL', chest: '46–48 in', length: '31 in' },
] as const

export function normalizeSizes(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .flatMap((entry) => {
        if (typeof entry !== 'string') {
          return []
        }

        return entry
          .split(/[\s,]+/)
          .map((size) => size.trim())
          .filter(Boolean)
      })
      .filter((size, index, array) => array.indexOf(size) === index)
  }

  if (typeof raw === 'string') {
    return raw
      .split(/[\s,]+/)
      .map((size) => size.trim())
      .filter(Boolean)
  }

  return []
}
