import { describe, expect, it } from 'vitest'
import { diffChanges } from './diffChanges'

const byField = (rows) => Object.fromEntries(rows.map((row) => [row.field, row]))

describe('diffChanges', () => {
  it('price 1 → 2 là dòng đổi; trường không đổi thì không đánh dấu (AC-F10)', () => {
    const rows = diffChanges({ before: { price: 1, color: 'red' }, after: { price: 2, color: 'red' } })
    expect(rows.map((r) => r.field)).toEqual(['color', 'price'])
    expect(byField(rows).price).toMatchObject({ before: 1, after: 2, changed: true, hasBefore: true, hasAfter: true })
    expect(byField(rows).color).toMatchObject({ before: 'red', after: 'red', changed: false })
  })

  it('null hoặc rỗng → không có hàng nào (AC-F11)', () => {
    expect(diffChanges(null)).toEqual([])
    expect(diffChanges(undefined)).toEqual([])
    expect(diffChanges({})).toEqual([])
    expect(diffChanges({ before: null, after: null })).toEqual([])
    expect(diffChanges('text')).toEqual([])
    expect(diffChanges([1, 2])).toEqual([])
  })

  it('trường chỉ có ở một phía là dòng đổi và biết phía nào vắng', () => {
    const rows = byField(diffChanges({ before: { old: 1 }, after: { fresh: 2 } }))
    expect(rows.old).toMatchObject({ hasBefore: true, hasAfter: false, changed: true, before: 1, after: undefined })
    expect(rows.fresh).toMatchObject({ hasBefore: false, hasAfter: true, changed: true, before: undefined, after: 2 })
  })

  it('tạo mới (before null): mọi trường là dòng đổi; xóa (after null): cũng vậy', () => {
    expect(diffChanges({ before: null, after: { a: 1, b: 2 } }).every((r) => r.changed && !r.hasBefore)).toBe(true)
    expect(diffChanges({ before: { a: 1 }, after: null }).every((r) => r.changed && !r.hasAfter)).toBe(true)
  })

  it('phân biệt trường vắng với trường có giá trị null', () => {
    const rows = byField(diffChanges({ before: { a: null }, after: {} }))
    expect(rows.a).toMatchObject({ hasBefore: true, hasAfter: false, changed: true })
    expect(byField(diffChanges({ before: { a: null }, after: { a: null } })).a.changed).toBe(false)
  })

  it('so sánh sâu: đối tượng và mảng bằng nhau không đánh dấu, thứ tự khóa không quan trọng', () => {
    const rows = byField(diffChanges({
      before: { addr: { city: 'Huế', street: 'a' }, tags: [1, 2] },
      after: { addr: { street: 'a', city: 'Huế' }, tags: [1, 2] },
    }))
    expect(rows.addr.changed).toBe(false)
    expect(rows.tags.changed).toBe(false)
  })

  it('so sánh sâu: khác một phần tử lồng nhau là đổi', () => {
    const rows = byField(diffChanges({ before: { addr: { city: 'Huế' }, tags: [1, 2] }, after: { addr: { city: 'Hà Nội' }, tags: [1, 3] } }))
    expect(rows.addr.changed).toBe(true)
    expect(rows.tags.changed).toBe(true)
  })

  it('0, chuỗi "0", false và chuỗi rỗng khác nhau', () => {
    const rows = byField(diffChanges({ before: { a: 0, b: false, c: '' }, after: { a: '0', b: 0, c: null } }))
    expect(rows.a.changed).toBe(true)
    expect(rows.b.changed).toBe(true)
    expect(rows.c.changed).toBe(true)
  })

  it('mảng khác độ dài hoặc đối tượng vs mảng là đổi', () => {
    expect(byField(diffChanges({ before: { a: [1] }, after: { a: [1, 2] } })).a.changed).toBe(true)
    expect(byField(diffChanges({ before: { a: {} }, after: { a: [] } })).a.changed).toBe(true)
  })

  it('before hoặc after là giá trị đơn thay vì đối tượng', () => {
    const rows = diffChanges({ before: 'cũ', after: 'mới' })
    expect(rows).toEqual([{ field: '(giá trị)', hasBefore: true, hasAfter: true, before: 'cũ', after: 'mới', changed: true }])
    expect(diffChanges({ before: [1], after: [1] })[0].changed).toBe(false)
  })

  it('sắp theo tên trường, ổn định', () => {
    const rows = diffChanges({ before: { b: 1, a: 1, c: 1 }, after: { c: 1, a: 1, b: 1 } })
    expect(rows.map((r) => r.field)).toEqual(['a', 'b', 'c'])
  })

  it('"[hidden]" do BE che hiển thị như một giá trị bình thường', () => {
    const rows = byField(diffChanges({ before: { password: '[hidden]' }, after: { password: '[hidden]' } }))
    expect(rows.password).toMatchObject({ before: '[hidden]', after: '[hidden]', changed: false })
  })

  it('khóa độc hại như __proto__ và constructor không phá bảng và không ô nhiễm prototype', () => {
    const changes = JSON.parse('{"before": {"__proto__": 1, "constructor": 2}, "after": {"__proto__": 3, "constructor": 2}}')
    const rows = byField(diffChanges(changes))
    expect(rows.constructor.changed).toBe(false)
    expect(rows.__proto__.changed).toBe(true)
    expect({}.polluted).toBeUndefined()
  })

  it('không đổi dữ liệu gốc', () => {
    const changes = { before: { a: 1 }, after: { a: 2 } }
    const snapshot = JSON.parse(JSON.stringify(changes))
    diffChanges(changes)
    expect(changes).toEqual(snapshot)
  })
})
