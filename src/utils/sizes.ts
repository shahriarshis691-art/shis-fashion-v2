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
