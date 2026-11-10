import { describe, it, expect } from 'vitest'
import { makeLatest, isSearchable } from './latest'

describe('makeLatest (AC-F28)', () => {
  it('chỉ lần gửi mới nhất là hiện hành', () => {
    const latest = makeLatest()
    const first = latest.next()
    expect(latest.isCurrent(first)).toBe(true)
    const second = latest.next()
    expect(latest.isCurrent(first)).toBe(false)
    expect(latest.isCurrent(second)).toBe(true)
  })

  it('phản hồi lần trước đến sau bị bỏ, kết quả lần sau giữ nguyên', () => {
    const latest = makeLatest()
    let shown = null
    const first = latest.next()
    const second = latest.next()
    const settle = (token, value) => { if (latest.isCurrent(token)) shown = value }
    settle(second, 'kết quả mới')
    settle(first, 'kết quả cũ đến chậm')
    expect(shown).toBe('kết quả mới')
  })

  it('mỗi bộ đếm độc lập; token lạ không hiện hành', () => {
    const a = makeLatest()
    const b = makeLatest()
    const token = a.next()
    b.next()
    b.next()
    expect(b.isCurrent(token)).toBe(false)
    expect(a.isCurrent(undefined)).toBe(false)
    expect(a.isCurrent(0)).toBe(false)
  })
})

describe('isSearchable (AC-F27)', () => {
  it('< 3 ký tự sau khi cắt khoảng trắng → không gọi', () => {
    expect(isSearchable('')).toBe(false)
    expect(isSearchable('ab')).toBe(false)
    expect(isSearchable('  ab  ')).toBe(false)
    expect(isSearchable(undefined)).toBe(false)
    expect(isSearchable(null)).toBe(false)
  })

  it('≥ 3 ký tự → gọi', () => {
    expect(isSearchable('abc')).toBe(true)
    expect(isSearchable(' 090 ')).toBe(true)
  })
})
