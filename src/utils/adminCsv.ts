function escapeCsvCell(value: string | number) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>) {
  const csv = [header.map(escapeCsvCell).join(','), ...rows.map((row) => row.map(escapeCsvCell).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  const source = text.replace(/^\uFEFF/, '')
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index] ?? ''
    const next = source[index + 1] ?? ''

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"'
        index += 1
        continue
      }
      if (char === '"') {
        inQuotes = false
        continue
      }
      current += char
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(current.trim())
      current = ''
      continue
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') {
        index += 1
      }
      row.push(current.trim())
      current = ''
      if (row.some((cell) => cell)) {
        rows.push(row)
      }
      row = []
      continue
    }

    current += char
  }

  row.push(current.trim())
  if (row.some((cell) => cell)) {
    rows.push(row)
  }

  return rows
}

export function csvRowsToObjects(rows: string[][]) {
  const [headerRow, ...body] = rows
  const header = (headerRow ?? []).map((cell) => cell.trim().toLowerCase())
  return body.map((row, index) => {
    const record: Record<string, string> = {}
    header.forEach((key, column) => {
      if (key) {
        record[key] = row[column] ?? ''
      }
    })
    return { line: index + 2, record }
  })
}
