import { describe, expect, it } from 'vitest'
import { VALUE_HARD_LIMIT, VALUE_PREVIEW_CHARS } from '../constants/auditConstants'
import { formatValue, prettyJson } from './formatValue'

describe('formatValue: luôn là văn bản thuần', () => {
  it('chuỗi giữ nguyên, kể cả HTML/script (không bị diễn giải hay xóa)', () => {
    for (const html of ['<img src=x onerror=alert(1)>', '<script>alert(1)</script>', '<a href="javascript:x">y</a>', '&lt;b&gt;']) {
      const result = formatValue(html)
      expect(result.text).toBe(html)
      expect(result.full).toBe(html)
      expect(result.truncated).toBe(false)
      expect(typeof result.text).toBe('string')
    }
  })

  it('null và undefined → gạch ngang', () => {
    expect(formatValue(null).text).toBe('—')
    expect(formatValue(undefined).text).toBe('—')
  })

  it('số, boolean, 0 và chuỗi rỗng', () => {
    expect(formatValue(120).text).toBe('120')
    expect(formatValue(0).text).toBe('0')
    expect(formatValue(true).text).toBe('true')
    expect(formatValue(false).text).toBe('false')
    expect(formatValue('').text).toBe('')
  })

  it('đối tượng và mảng thành JSON gọn', () => {
    expect(formatValue({ a: 1, b: { c: 'x' } }).text).toBe('{"a":1,"b":{"c":"x"}}')
    expect(formatValue([1, 'a', null]).text).toBe('[1,"a",null]')
  })

  it('HTML bên trong đối tượng vẫn là chữ (JSON thoát dấu nháy)', () => {
    expect(formatValue({ note: '<script>x</script>' }).text).toBe('{"note":"<script>x</script>"}')
  })

  it('ngày thành chuỗi ISO; ngày hỏng thành null; bigint thành chuỗi', () => {
    expect(formatValue({ at: new Date('2026-11-15T00:00:00Z') }).text).toBe('{"at":"2026-11-15T00:00:00.000Z"}')
    expect(formatValue({ at: new Date('x') }).text).toBe('{"at":null}')
    expect(formatValue(10n).text).toBe('10')
  })

  it('hàm và symbol không văng lỗi', () => {
    expect(() => formatValue(() => 1)).not.toThrow()
    expect(() => formatValue(Symbol('s'))).not.toThrow()
    expect(typeof formatValue(() => 1).text).toBe('string')
  })
})

describe('cắt giá trị dài', () => {
  it('chuỗi vượt 300 ký tự: bản xem trước ngắn, bản đầy đủ nguyên vẹn', () => {
    const long = 'a'.repeat(1000)
    const result = formatValue(long)
    expect(result.truncated).toBe(true)
    expect(result.text.length).toBe(VALUE_PREVIEW_CHARS + 1)
    expect(result.text.endsWith('…')).toBe(true)
    expect(result.full).toBe(long)
  })

  it('đúng 300 ký tự thì không cắt', () => {
    const exact = 'b'.repeat(VALUE_PREVIEW_CHARS)
    expect(formatValue(exact).truncated).toBe(false)
  })

  it('chuỗi 20 000+ ký tự bị cắt cứng kèm ghi chú, không treo', () => {
    const huge = 'c'.repeat(VALUE_HARD_LIMIT * 3)
    const started = Date.now()
    const result = formatValue(huge)
    expect(Date.now() - started).toBeLessThan(500)
    expect(result.full.length).toBeLessThan(VALUE_HARD_LIMIT + 50)
    expect(result.full.endsWith('(đã cắt)')).toBe(true)
  })

  it('đối tượng khổng lồ cũng bị cắt cứng', () => {
    const big = Object.fromEntries(Array.from({ length: 5000 }, (_, i) => [`k${i}`, 'x'.repeat(20)]))
    const result = formatValue(big)
    expect(result.truncated).toBe(true)
    expect(result.full.length).toBeLessThan(VALUE_HARD_LIMIT + 50)
  })
})

describe('an toàn với dữ liệu xấu', () => {
  it('tham chiếu vòng không treo', () => {
    const a = { name: 'a' }
    a.self = a
    const result = formatValue(a)
    expect(result.text).toContain('[vòng lặp]')
  })

  it('cùng một đối tượng xuất hiện hai lần (không phải vòng) vẫn hiện cả hai', () => {
    const shared = { x: 1 }
    expect(formatValue({ a: shared, b: shared }).text).toBe('{"a":{"x":1},"b":{"x":1}}')
  })

  it('đối tượng lồng rất sâu bị cắt thay vì đệ quy vô hạn', () => {
    let deep = { leaf: 'x' }
    for (let i = 0; i < 100; i += 1) deep = { child: deep }
    const result = formatValue(deep)
    expect(result.text).toContain('[quá sâu]')
  })

  it('đối tượng có getter ném lỗi không làm hỏng hiển thị', () => {
    const bad = {}
    Object.defineProperty(bad, 'boom', { enumerable: true, get() { throw new Error('boom') } })
    expect(() => formatValue(bad)).not.toThrow()
    expect(formatValue(bad).text).toBe('[không hiển thị được]')
  })
})

describe('prettyJson', () => {
  it('thụt lề hai khoảng trắng; null → gạch ngang', () => {
    expect(prettyJson({ a: 1 })).toBe('{\n  "a": 1\n}')
    expect(prettyJson(null)).toBe('—')
  })

  it('không treo với vòng lặp', () => {
    const a = {}
    a.self = a
    expect(prettyJson(a)).toContain('[vòng lặp]')
  })
})
