import { describe, expect, it } from 'vitest'
import { classifyAuditError } from './auditErrors'

const http = (status, data) => ({ response: { status, data } })

describe('classifyAuditError', () => {
  it('401 → mời đăng nhập lại, không thử lại', () => {
    expect(classifyAuditError(http(401))).toMatchObject({ kind: 'UNAUTHORIZED', retry: false, status: 401 })
    expect(classifyAuditError(http(401)).message).toMatch(/đăng nhập lại/)
  })

  it('403 → không có quyền, không thử lại (AC-F15)', () => {
    const result = classifyAuditError(http(403, { code: 'ROLE_INSUFFICIENT' }))
    expect(result).toMatchObject({ kind: 'FORBIDDEN', retry: false })
    expect(result.message).toBe('Bạn không có quyền xem nhật ký hoạt động.')
  })

  it('404 ACTIVITY_LOG_NOT_FOUND → không tìm thấy sự kiện (AC-F12)', () => {
    const result = classifyAuditError(http(404, { code: 'ACTIVITY_LOG_NOT_FOUND' }))
    expect(result).toMatchObject({ kind: 'NOT_FOUND', retry: false })
    expect(result.message).toBe('Không tìm thấy sự kiện.')
  })

  it('404 không có mã (route chưa có) → chưa hỗ trợ, cho thử lại', () => {
    expect(classifyAuditError(http(404, { message: 'Route not found' }))).toMatchObject({ kind: 'UNAVAILABLE', retry: true })
    expect(classifyAuditError(http(404))).toMatchObject({ kind: 'UNAVAILABLE' })
  })

  it('422 → bộ lọc không hợp lệ, kèm thông điệp trường nếu có', () => {
    const result = classifyAuditError(http(422, { code: 'VALIDATION_ERROR', errors: [{ field: 'to', message: 'to must not be before from' }] }))
    expect(result.kind).toBe('VALIDATION')
    expect(result.message).toContain('to must not be before from')
    expect(classifyAuditError(http(422, { code: 'INVALID_OBJECT_ID' })).message).toBe('Bộ lọc không hợp lệ.')
  })

  it('429 → quá nhanh, cho thử lại', () => {
    expect(classifyAuditError(http(429))).toMatchObject({ kind: 'RATE_LIMIT', retry: true })
  })

  it('không có response (mất mạng, timeout) → lỗi kết nối, cho thử lại (AC-F14)', () => {
    expect(classifyAuditError(new Error('Network Error'))).toMatchObject({ kind: 'NETWORK', retry: true, status: null })
    expect(classifyAuditError({ code: 'ECONNABORTED' })).toMatchObject({ kind: 'NETWORK' })
  })

  it('5xx và mã lạ → hệ thống bận, cho thử lại', () => {
    for (const status of [500, 502, 503, 418]) expect(classifyAuditError(http(status))).toMatchObject({ kind: 'SERVER', retry: true })
  })

  it('yêu cầu bị hủy có chủ ý được nhận ra để bỏ qua', () => {
    expect(classifyAuditError({ code: 'ERR_CANCELED' })).toMatchObject({ kind: 'CANCELED', canceled: true, message: '' })
    expect(classifyAuditError({ name: 'CanceledError' }).canceled).toBe(true)
    expect(classifyAuditError({ name: 'AbortError' }).canceled).toBe(true)
    expect(classifyAuditError(http(500)).canceled).toBe(false)
  })

  it('đầu vào lạ (null, chuỗi) không văng lỗi', () => {
    expect(() => classifyAuditError(null)).not.toThrow()
    expect(() => classifyAuditError(undefined)).not.toThrow()
    expect(classifyAuditError('boom').kind).toBe('NETWORK')
  })

  it('thông điệp không lộ dữ liệu nội bộ của phản hồi lỗi', () => {
    const result = classifyAuditError(http(500, { message: 'MongoServerError: secret internals', stack: 'at x.js:1' }))
    expect(result.message).not.toMatch(/Mongo|stack|\.js/)
  })
})
