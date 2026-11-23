import { describe, expect, it } from 'vitest'
import { loginDestination, pendingBookingId, resumeLocation, withoutResume } from './resumeBooking'

describe('test-drive-booking resumeBooking', () => {
  it('ghi xe cần đặt lịch vào đường dẫn quay lại, giữ query cũ', () => {
    const loc = resumeLocation({ pathname: '/showroom-3d', search: '?a=1', hash: '' }, 'abc123')
    expect(loc).toEqual({ pathname: '/showroom-3d', search: '?a=1&datlich=abc123', hash: '' })
    expect(pendingBookingId(loc.search)).toBe('abc123')
  })

  it('bỏ tham số chờ đặt lịch', () => {
    expect(withoutResume('?a=1&datlich=x')).toBe('?a=1')
    expect(withoutResume('?datlich=x')).toBe('')
  })

  it('trang đích sau đăng nhập: giữ query; đường dẫn ngoài hoặc thiếu -> trang chủ', () => {
    expect(loginDestination({ pathname: '/showroom-3d', search: '?datlich=x' })).toBe('/showroom-3d?datlich=x')
    expect(loginDestination({ pathname: '//evil.com' })).toBe('/')
    expect(loginDestination({ pathname: 'https://evil.com' })).toBe('/')
    expect(loginDestination(undefined)).toBe('/')
  })
})
