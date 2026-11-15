import { describe, it, expect } from 'vitest'
import { interestTone, ratingText, previewNotes, PREVIEW_MAX } from './feedbackView'

describe('interestTone', () => {
  it.each([['Nóng', 'volcano'], ['Ấm', 'gold'], ['Lạnh', 'blue'], ['Rất nóng', 'default'], ['', 'default'], [undefined, 'default']])(
    '%s → %s', (label, tone) => expect(interestTone(label)).toBe(tone),
  )
})

describe('ratingText', () => {
  it.each([[1, '★ 1/5'], [4, '★ 4/5'], [5, '★ 5/5']])('%s → %s', (n, text) => expect(ratingText(n)).toBe(text))
  it.each([[0], [6], [2.5], ['4'], [null], [undefined], [NaN]])('không hợp lệ (%s) → rỗng', (n) => expect(ratingText(n)).toBe(''))
})

describe('previewNotes', () => {
  it('chuỗi ngắn giữ nguyên', () => {
    expect(previewNotes('Khách ổn')).toEqual({ text: 'Khách ổn', truncated: false })
    expect(previewNotes('')).toEqual({ text: '', truncated: false })
    expect(previewNotes(null)).toEqual({ text: '', truncated: false })
  })

  it('đúng 160 ký tự không cắt, 161 thì cắt', () => {
    expect(previewNotes('a'.repeat(160)).truncated).toBe(false)
    const cut = previewNotes('a'.repeat(161))
    expect(cut.truncated).toBe(true)
    expect(cut.text).toBe(`${'a'.repeat(160)}…`)
  })

  it('5000 ký tự → ngắn gọn', () => {
    const cut = previewNotes('b'.repeat(5000))
    expect(cut.text.length).toBe(PREVIEW_MAX + 1)
  })

  it('không cắt dở emoji', () => {
    const cut = previewNotes(`${'a'.repeat(159)}😀😀`)
    expect(cut.text).toBe(`${'a'.repeat(159)}…`)
  })

  it('XSS: chuỗi giữ nguyên là chữ, không bị đổi', () => {
    const evil = '<img src=x onerror=alert(1)>'
    expect(previewNotes(evil).text).toBe(evil)
  })
})
