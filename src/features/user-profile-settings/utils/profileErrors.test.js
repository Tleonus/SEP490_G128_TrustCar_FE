import { describe, expect, it } from 'vitest'
import { classifyProfileError, PROFILE_ERROR as K } from './profileErrors'

const http = (status, data = {}) => ({ response: { status, data } })

describe('classifyProfileError: theo bảng mục 6 của Spec', () => {
  it('không có response (mất mạng, timeout) → NETWORK, giữ dữ liệu để thử lại (AC-F16)', () => {
    for (const error of [new Error('Network Error'), { code: 'ECONNABORTED' }, null, undefined]) {
      expect(classifyProfileError(error)).toMatchObject({ kind: K.NETWORK, message: expect.stringContaining('Không kết nối') })
    }
  })

  it('401 → mời đăng nhập lại', () => {
    const result = classifyProfileError(http(401, { code: 'TOKEN_EXPIRED' }))
    expect(result).toMatchObject({ kind: K.UNAUTHORIZED, action: { to: '/dang-nhap' } })
  })

  it('403 PROFILE_INCOMPLETE → hướng dẫn hoàn tất hồ sơ kèm liên kết (AC-F14)', () => {
    const result = classifyProfileError(http(403, { code: 'PROFILE_INCOMPLETE' }))
    expect(result).toMatchObject({ kind: K.PROFILE_INCOMPLETE, action: { to: '/hoan-tat-ho-so' } })
  })

  it('403 ROLE_INSUFFICIENT và mọi 403 khác → không có mục này', () => {
    expect(classifyProfileError(http(403, { code: 'ROLE_INSUFFICIENT' }))).toMatchObject({ kind: K.ROLE, message: 'Tài khoản của bạn không có mục này.' })
    expect(classifyProfileError(http(403, {}))).toMatchObject({ kind: K.ROLE })
  })

  it('404 CUSTOMER_NOT_FOUND → liên hệ showroom, không có hành động đăng nhập (AC-F15)', () => {
    const result = classifyProfileError(http(404, { code: 'CUSTOMER_NOT_FOUND' }))
    expect(result).toMatchObject({ kind: K.NO_PROFILE, message: 'Không tìm thấy hồ sơ khách hàng. Vui lòng liên hệ showroom.' })
    expect(result.action).toBeUndefined()
  })

  it('404 USER_NOT_FOUND → mời đăng nhập lại', () => {
    expect(classifyProfileError(http(404, { code: 'USER_NOT_FOUND' }))).toMatchObject({ kind: K.USER_GONE, action: { to: '/dang-nhap' } })
  })

  it('404 không rõ mã → coi như không có hồ sơ', () => {
    expect(classifyProfileError(http(404, {})).kind).toBe(K.NO_PROFILE)
  })

  it('409 PHONE_ALREADY_EXISTS → lỗi gắn vào ô SĐT (AC-F12)', () => {
    const result = classifyProfileError(http(409, { code: 'PHONE_ALREADY_EXISTS' }))
    expect(result.kind).toBe(K.PHONE_TAKEN)
    expect(result.fieldErrors).toEqual({ phone: 'Số điện thoại đã được dùng bởi tài khoản khác.' })
  })

  it('409 mã khác → lỗi chung của máy chủ, không gắn vào ô nào', () => {
    expect(classifyProfileError(http(409, { code: 'SOMETHING_ELSE' }))).toMatchObject({ kind: K.SERVER, fieldErrors: {} })
  })

  it('429 → thao tác quá nhanh', () => {
    expect(classifyProfileError(http(429, { code: 'RATE_LIMIT_EXCEEDED' }))).toMatchObject({ kind: K.RATE_LIMIT, message: expect.stringContaining('quá nhanh') })
  })

  it.each([500, 502, 503, 504, 418])('%i → hệ thống đang bận', (status) => {
    expect(classifyProfileError(http(status))).toMatchObject({ kind: K.SERVER, message: 'Hệ thống đang bận, vui lòng thử lại.' })
  })
})

describe('422 VALIDATION_ERROR (AC-F13)', () => {
  const invalid = (errors) => classifyProfileError(http(422, { code: 'VALIDATION_ERROR', errors }))

  it('gắn lỗi vào đúng ô, kể cả địa chỉ lồng nhau', () => {
    const result = invalid([{ field: 'address.city', message: 'x' }, { field: 'dateOfBirth', message: 'y' }])
    expect(result.kind).toBe(K.VALIDATION)
    expect(Object.keys(result.fieldErrors).sort()).toEqual(['address.city', 'dateOfBirth'])
    expect(result.message).toBe('Vui lòng sửa các ô được đánh dấu.')
  })

  it('thông báo theo ô bằng tiếng Việt, không chép nguyên văn tiếng Anh của BE', () => {
    const result = invalid([{ field: 'fullName', message: 'fullName length must be at least 2 characters long' }])
    expect(result.fieldErrors.fullName).toBe('Họ tên không hợp lệ (2–100 ký tự).')
    expect(JSON.stringify(result)).not.toMatch(/characters long/)
  })

  it('trường không xác định → thông báo chung (vẫn gắn các ô đã biết)', () => {
    const result = invalid([{ field: 'avatar', message: 'not allowed' }, { field: 'phone', message: 'bad' }])
    expect(result.fieldErrors).toEqual({ phone: 'Số điện thoại không hợp lệ.' })
    expect(result.message).toBe('Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.')
  })

  it('không có errors, hoặc errors không phải mảng → thông báo chung', () => {
    for (const errors of [undefined, null, 'x', {}, []]) {
      const result = invalid(errors)
      expect(result.fieldErrors).toEqual({})
      expect(result.message).toBe('Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.')
    }
  })

  it('mục lỗi hỏng (null) không làm văng lỗi', () => {
    expect(() => invalid([null, { field: 'gender' }])).not.toThrow()
  })
})

describe('không chứa dữ liệu cá nhân', () => {
  it('thông báo không phản chiếu nội dung do BE trả về', () => {
    const result = classifyProfileError(http(409, { code: 'PHONE_ALREADY_EXISTS', message: 'Số 0901234567 của Nguyễn An đã có' }))
    expect(JSON.stringify(result)).not.toMatch(/0901234567|Nguyễn An/)
  })
})
