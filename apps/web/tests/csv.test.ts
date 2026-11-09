import { describe, expect, it } from 'vitest'
import { parseCsv } from '../src/lib/csv'

describe('parseCsv', () => {
  it('parses headers, quotes, escaped quotes and CRLF', () => {
    const rows = parseCsv('﻿Name,Email\r\n"Putri, A.",putri@x.id\r\n"Budi ""B""",budi@x.id\r\n')
    expect(rows).toEqual([
      { name: 'Putri, A.', email: 'putri@x.id' },
      { name: 'Budi "B"', email: 'budi@x.id' },
    ])
  })
  it('accepts semicolons (Excel in Indonesian locale) and skips blank lines', () => {
    expect(parseCsv('name;email\n\nA;a@x.id\n')).toEqual([{ name: 'A', email: 'a@x.id' }])
  })
  it('returns nothing for empty input', () => {
    expect(parseCsv('')).toEqual([])
  })
})
