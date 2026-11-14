import { describe, it, expect } from 'vitest'
import { classifyAppointmentError, APPOINTMENT_ERROR as K } from './appointmentErrors'

const http = (status, code, errors) => ({ response: { status, data: { code, errors } } })
const classify = (status, code, errors, names) => classifyAppointmentError(http(status, code, errors), names)

describe('classifyAppointmentError: mọi mã ở Spec mục 6 (AC-F05)', () => {
  it.each([
    [422, 'VALIDATION_ERROR', K.VALIDATION, 'none', /chưa hợp lệ/],
    [422, 'INVALID_OBJECT_ID', K.VALIDATION, 'none', /chưa hợp lệ/],
    [422, 'APPOINTMENT_TOO_SOON', K.SLOT_INVALID, 'slots', /không còn hợp lệ/],
    [422, 'APPOINTMENT_TOO_FAR', K.SLOT_INVALID, 'slots', /không còn hợp lệ/],
    [422, 'APPOINTMENT_SLOT_INVALID', K.SLOT_INVALID, 'slots', /không còn hợp lệ/],
    [422, 'APPOINTMENT_LIMIT_REACHED', K.LIMIT, 'none', /2 lượt/],
    [409, 'APPOINTMENT_CAPACITY_FULL', K.CAPACITY, 'slots', /kín chỗ/],
    [404, 'NOT_FOUND', K.CAR_GONE, 'slots', /không còn mở bán/],
    [404, 'APPOINTMENT_NOT_FOUND', K.NOT_FOUND, 'visit', /Không tìm thấy/],
    [409, 'APPOINTMENT_CANCELLED_ALREADY', K.CANCELLED_ALREADY, 'visit', /đã được hủy/],
    [409, 'APPOINTMENT_STATUS_INVALID', K.STATUS_INVALID, 'visit', /trạng thái hiện tại/],
    [409, 'APPOINTMENT_CAR_UNAVAILABLE', K.CAR_UNAVAILABLE, 'visit', /không còn bán/],
  ])('%i %s → %s, tải lại %s', (status, code, kind, reload, pattern) => {
    const result = classify(status, code)
    expect(result.kind).toBe(kind)
    expect(result.reload).toBe(reload)
    expect(result.message).toMatch(pattern)
  })

  it('409 CONFLICT nêu tên xe bị kín và trả carIds', () => {
    const result = classify(409, 'APPOINTMENT_CONFLICT', { carIds: ['a1', 'b2'] }, { a1: 'Mazda CX-5', b2: 'Kia Sonet', c3: 'X' })
    expect(result).toMatchObject({ kind: K.CONFLICT, reload: 'slots', carIds: ['a1', 'b2'] })
    expect(result.message).toBe('Xe Mazda CX-5, Kia Sonet đã có người đặt khung giờ này.')
  })

  it('409 CONFLICT không biết tên xe vẫn có câu chung', () => {
    expect(classify(409, 'APPOINTMENT_CONFLICT', { carIds: ['zz'] }).message).toBe('Có xe đã có người đặt khung giờ này.')
  })

  it('409 DUPLICATE phân biệt trùng khung và trùng xe, kèm liên kết lịch hẹn', () => {
    const slot = classify(409, 'APPOINTMENT_DUPLICATE', { slot: '2026-11-10T10:00:00+07:00' })
    expect(slot.message).toBe('Bạn đã có lịch ở khung giờ này.')
    expect(slot.action).toEqual({ label: 'Xem lịch hẹn của tôi', to: '/lich-hen' })
    const car = classify(409, 'APPOINTMENT_DUPLICATE', { carIds: ['a1'] }, { a1: 'Mazda CX-5' })
    expect(car.message).toBe('Bạn đã có lịch cho xe Mazda CX-5.')
  })

  it('quá 2 lượt cũng dẫn tới lịch hẹn để hủy bớt', () => {
    expect(classify(422, 'APPOINTMENT_LIMIT_REACHED').action.to).toBe('/lich-hen')
  })
})

describe('classifyAppointmentError: mã mới của BE 1.1.0 (AC-F21, AC-F29)', () => {
  const call = (status, code, options, errors, data) =>
    classifyAppointmentError({ response: { status, data: { code, errors, ...data } } }, {}, options)

  it('RESCHEDULE_NOT_ALLOWED: câu khác nhau cho khách và nhân viên, cùng tải lại danh sách', () => {
    const customer = call(409, 'APPOINTMENT_RESCHEDULE_NOT_ALLOWED', { audience: 'customer' })
    expect(customer).toMatchObject({ kind: K.RESCHEDULE_NOT_ALLOWED, reload: 'visit' })
    expect(customer.message).toBe('Lượt này không thể tự đổi lịch nữa. Xin gọi showroom.')
    const staff = call(409, 'APPOINTMENT_RESCHEDULE_NOT_ALLOWED', { audience: 'staff' })
    expect(staff.message).toBe('Lượt này không còn lịch mở nên không đổi được.')
    expect(call(409, 'APPOINTMENT_RESCHEDULE_NOT_ALLOWED').message).toBe(customer.message)
  })

  it('RESCHEDULE_LIMIT_REACHED → tải lại danh sách', () => {
    const result = call(422, 'APPOINTMENT_RESCHEDULE_LIMIT_REACHED')
    expect(result).toMatchObject({ kind: K.RESCHEDULE_LIMIT, reload: 'visit' })
    expect(result.message).toBe('Bạn đã đổi lịch tối đa số lần cho phép. Xin gọi showroom.')
  })

  it('CUSTOMER_NOT_FOUND (đặt hộ) → câu yêu cầu khách đăng ký, không tải lại', () => {
    const result = call(404, 'CUSTOMER_NOT_FOUND')
    expect(result).toMatchObject({ kind: K.CUSTOMER_NOT_FOUND, reload: 'none' })
    expect(result.message).toBe('Không tìm thấy khách có tài khoản. Hãy yêu cầu khách đăng ký trước.')
  })

  it('đổi lịch sang khung đang giữ → câu riêng, giữ modal (tải lại lưới)', () => {
    const result = call(409, 'APPOINTMENT_DUPLICATE', { reschedule: true }, { slot: '2026-11-10T10:00:00+07:00' })
    expect(result.kind).toBe(K.DUPLICATE)
    expect(result.message).toMatch(/khung giờ hiện tại của lượt này/)
    expect(call(409, 'APPOINTMENT_DUPLICATE', {}, { slot: 'x' }).message).toBe('Bạn đã có lịch ở khung giờ này.')
  })

  it('CAPACITY / CONFLICT khi đổi lịch vẫn tải lại lưới', () => {
    expect(call(409, 'APPOINTMENT_CAPACITY_FULL', { reschedule: true }).reload).toBe('slots')
    expect(call(409, 'APPOINTMENT_CONFLICT', { reschedule: true }, { carIds: ['a'] }).reload).toBe('slots')
  })

  it('FA20: 404 của endpoint mới do BE cũ chưa có đường dẫn → lỗi kết nối', () => {
    const route = call(404, 'NOT_FOUND', { newEndpoint: true }, undefined, { message: 'Route PATCH /api/v1/appointments/1/reschedule not found.' })
    expect(route).toMatchObject({ kind: K.NETWORK, message: 'Không thể kết nối. Vui lòng thử lại.', reload: 'none' })
    expect(call(404, undefined, { newEndpoint: true }).kind).toBe(K.NETWORK)
  })

  it('FA20: 404 thật của BE mới vẫn giữ nghĩa riêng (xe, lượt, khách), kể cả khi là endpoint mới', () => {
    const car = call(404, 'NOT_FOUND', { newEndpoint: true }, undefined, { message: 'Car not found.' })
    expect(car.kind).toBe(K.CAR_GONE)
    expect(call(404, 'APPOINTMENT_NOT_FOUND', { newEndpoint: true }).kind).toBe(K.NOT_FOUND)
    expect(call(404, 'CUSTOMER_NOT_FOUND', { newEndpoint: true }).kind).toBe(K.CUSTOMER_NOT_FOUND)
  })

  it('không đặt newEndpoint thì 404 "Route …" vẫn xử lý như 1.0.0', () => {
    expect(call(404, 'NOT_FOUND', {}, undefined, { message: 'Route GET /x not found.' }).kind).toBe(K.CAR_GONE)
  })

  it('403 ở thao tác nhân viên mới vẫn là "không dùng được chức năng này"', () => {
    const result = call(403, 'FORBIDDEN', { audience: 'staff', newEndpoint: true })
    expect(result).toMatchObject({ kind: K.ROLE, message: 'Tài khoản này không dùng được chức năng này.' })
  })
})

describe('classifyAppointmentError: xác thực, quyền, mạng (AC-F16)', () => {
  it('401 → hết phiên, nút đăng nhập', () => {
    const result = classify(401, 'TOKEN_EXPIRED')
    expect(result).toMatchObject({ kind: K.UNAUTHORIZED, message: 'Phiên đăng nhập đã hết hạn.', action: { to: '/dang-nhap' } })
  })

  it('403 PROFILE_INCOMPLETE → nút tới /hoan-tat-ho-so', () => {
    const result = classify(403, 'PROFILE_INCOMPLETE')
    expect(result).toMatchObject({ kind: K.PROFILE_INCOMPLETE, action: { to: '/hoan-tat-ho-so' } })
    expect(result.message).toMatch(/hồ sơ/)
  })

  it('403 khác (sai role/quyền) → thông báo chung, không nút', () => {
    expect(classify(403, 'ROLE_INSUFFICIENT')).toMatchObject({ kind: K.ROLE, action: null })
    expect(classify(403, 'FORBIDDEN').kind).toBe(K.ROLE)
  })

  it('429 → quá nhanh', () => {
    expect(classify(429, 'RATE_LIMIT_EXCEEDED')).toMatchObject({ kind: K.RATE_LIMIT, message: expect.stringMatching(/quá nhanh/) })
  })

  it('không có phản hồi hoặc lỗi máy chủ → lỗi kết nối', () => {
    expect(classifyAppointmentError(new Error('Network Error')).kind).toBe(K.NETWORK)
    expect(classify(500, 'INTERNAL_ERROR').kind).toBe(K.NETWORK)
    expect(classify(503, 'DB_CONNECTION_ERROR').message).toBe('Không thể kết nối. Vui lòng thử lại.')
    expect(classifyAppointmentError(undefined).kind).toBe(K.NETWORK)
  })

  it('mã lạ trả lỗi dữ liệu chung, không làm vỡ; errors dạng mảng được bỏ qua', () => {
    const result = classifyAppointmentError({ response: { status: 422, data: { code: 'NEW_CODE', errors: [{ field: 'x' }] } } })
    expect(result).toMatchObject({ kind: K.VALIDATION, carIds: [], reload: 'none' })
  })
})
