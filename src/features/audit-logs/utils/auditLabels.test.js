import { describe, expect, it } from 'vitest'
import { EVENT_LABELS, SYSTEM_ACTOR_LABEL, UNKNOWN_ACTOR_LABEL } from '../constants/auditConstants'
import { describeActor, describeTarget, eventLabel } from './auditLabels'

describe('eventLabel', () => {
  it('mã đã biết → nhãn tiếng Việt', () => {
    expect(eventLabel('CAR_PRICE_UPDATED')).toBe('Cập nhật giá xe')
    expect(eventLabel('USER_LOGIN')).toBe('Đăng nhập')
    expect(eventLabel('PROFILE_UPDATED')).toBe('Cập nhật hồ sơ cá nhân')
  })

  it('mã lạ → nguyên mã, không lỗi', () => {
    expect(eventLabel('FOO_BAR')).toBe('FOO_BAR')
  })

  it('không tra nhầm vào prototype của đối tượng', () => {
    expect(eventLabel('constructor')).toBe('constructor')
    expect(eventLabel('__proto__')).toBe('__proto__')
    expect(eventLabel('toString')).toBe('toString')
  })

  it('thiếu mã → chuỗi rỗng', () => {
    expect(eventLabel(null)).toBe('')
    expect(eventLabel(undefined)).toBe('')
  })

  it('có nhãn cho đủ 38 mã của BE và 2 mã của KAN-25, nhãn không trống và không trùng nhau', () => {
    const codes = Object.keys(EVENT_LABELS)
    expect(codes).toHaveLength(40)
    const labels = Object.values(EVENT_LABELS)
    expect(labels.every((label) => label.trim().length > 0)).toBe(true)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('describeActor', () => {
  it('có email → email', () => {
    expect(describeActor({ id: 'a1', email: 'admin@trustcar.vn' })).toEqual({ text: 'admin@trustcar.vn', system: false })
  })

  it('không email và không id → hành động của hệ thống', () => {
    expect(describeActor({ id: null, email: null })).toEqual({ text: SYSTEM_ACTOR_LABEL, system: true })
    expect(describeActor(null)).toEqual({ text: SYSTEM_ACTOR_LABEL, system: true })
    expect(describeActor(undefined)).toEqual({ text: SYSTEM_ACTOR_LABEL, system: true })
  })

  it('có id nhưng không có email → "không rõ email" (không bịa là hệ thống)', () => {
    expect(describeActor({ id: 'a1', email: null })).toEqual({ text: UNKNOWN_ACTOR_LABEL, system: false })
  })

  it('email chỉ có khoảng trắng coi như không có; email được cắt khoảng trắng', () => {
    expect(describeActor({ id: null, email: '   ' }).system).toBe(true)
    expect(describeActor({ email: '  a@b.vn ' }).text).toBe('a@b.vn')
  })
})

describe('describeTarget', () => {
  it('loại và mã', () => {
    expect(describeTarget({ model: 'Car', id: 'x', code: 'TC-2026-0001' })).toBe('Car · TC-2026-0001')
  })

  it('chỉ loại hoặc chỉ mã', () => {
    expect(describeTarget({ model: 'User', code: null })).toBe('User')
    expect(describeTarget({ model: null, code: 'TC-1' })).toBe('TC-1')
  })

  it('không có gì → gạch ngang', () => {
    expect(describeTarget({ model: null, id: null, code: null })).toBe('—')
    expect(describeTarget(null)).toBe('—')
    expect(describeTarget({ model: '  ', code: '' })).toBe('—')
  })
})
