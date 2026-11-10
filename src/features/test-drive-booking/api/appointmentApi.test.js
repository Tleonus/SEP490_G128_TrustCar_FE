import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const { default: api } = await import('../../../services/api')
const {
  fetchSlots, createVisit, fetchMyVisits, cancelMyVisit, fetchStaffVisits, changeVisitStatus,
  rescheduleMyVisit, fetchStaffSlots, rescheduleVisitAsStaff, searchCustomers, createVisitForCustomer,
} = await import('./appointmentApi')

const ok = (data, meta) => ({ data: { success: true, data, meta } })
const signal = new AbortController().signal

beforeEach(() => vi.resetAllMocks())

describe('appointmentApi: đúng đường dẫn, tham số và thân yêu cầu (hợp đồng BE)', () => {
  it('fetchSlots gửi carIds nối bằng dấu phẩy, from, to và signal', async () => {
    api.get.mockResolvedValue(ok({ days: [{ date: '2026-11-10', slots: [] }] }))
    const data = await fetchSlots({ carIds: ['a', 'b'], from: '2026-11-10', to: '2026-11-23' }, signal)
    expect(api.get).toHaveBeenCalledWith('/customer/appointments/slots', {
      params: { carIds: 'a,b', from: '2026-11-10', to: '2026-11-23' }, signal,
    })
    expect(data.days).toHaveLength(1)
  })

  it('createVisit gửi scheduledAt nguyên văn, bỏ ghi chú rỗng và cắt khoảng trắng', async () => {
    api.post.mockResolvedValue(ok({ visit: { visitId: 'v1' } }))
    const visit = await createVisit({ carIds: ['a'], scheduledAt: '2026-11-10T10:00:00+07:00', notes: '   ' })
    expect(api.post).toHaveBeenCalledWith('/customer/appointments', { carIds: ['a'], scheduledAt: '2026-11-10T10:00:00+07:00' })
    expect(visit.visitId).toBe('v1')

    await createVisit({ carIds: ['a'], scheduledAt: 'x', notes: ' chạy cao tốc ' })
    expect(api.post).toHaveBeenLastCalledWith('/customer/appointments', { carIds: ['a'], scheduledAt: 'x', notes: 'chạy cao tốc' })
  })

  it('fetchMyVisits / fetchStaffVisits bỏ tham số rỗng và trả items + meta', async () => {
    api.get.mockResolvedValue(ok([{ visitId: 'v1' }], { total: 1, page: 1 }))
    const mine = await fetchMyVisits({ status: '', page: 2, limit: undefined }, signal)
    expect(api.get).toHaveBeenCalledWith('/customer/appointments', { params: { page: 2 }, signal })
    expect(mine).toEqual({ items: [{ visitId: 'v1' }], meta: { total: 1, page: 1 } })

    const staff = await fetchStaffVisits({ status: 'PENDING', cancellationType: 'CAR_UNAVAILABLE', from: null }, signal)
    expect(api.get).toHaveBeenLastCalledWith('/appointments', { params: { status: 'PENDING', cancellationType: 'CAR_UNAVAILABLE' }, signal })
    expect(staff.items).toHaveLength(1)
  })

  it('danh sách thiếu dữ liệu không làm vỡ', async () => {
    api.get.mockResolvedValue({ data: { success: true } })
    expect(await fetchMyVisits({})).toEqual({ items: [], meta: null })
  })

  it('cancelMyVisit gửi PATCH tới /cancel, lý do tùy chọn', async () => {
    api.patch.mockResolvedValue(ok({ visit: { status: 'CANCELLED' } }))
    await cancelMyVisit('v1', ' bận ')
    expect(api.patch).toHaveBeenCalledWith('/customer/appointments/v1/cancel', { reason: 'bận' })
    await cancelMyVisit('v1', '')
    expect(api.patch).toHaveBeenLastCalledWith('/customer/appointments/v1/cancel', {})
  })

  it('changeVisitStatus gửi status và chỉ gửi reason/outcome khi có', async () => {
    api.patch.mockResolvedValue(ok({ visit: { status: 'CONFIRMED' } }))
    await changeVisitStatus('v1', { status: 'CONFIRMED' })
    expect(api.patch).toHaveBeenCalledWith('/appointments/v1/status', { status: 'CONFIRMED' })
    await changeVisitStatus('v1', { status: 'CANCELLED', reason: ' Hết xe ' })
    expect(api.patch).toHaveBeenLastCalledWith('/appointments/v1/status', { status: 'CANCELLED', reason: 'Hết xe' })
    await changeVisitStatus('v1', { status: 'COMPLETED', outcome: ' hài lòng ' })
    expect(api.patch).toHaveBeenLastCalledWith('/appointments/v1/status', { status: 'COMPLETED', outcome: 'hài lòng' })
  })

  it('không bắt lỗi: lỗi axios được ném lên nguyên vẹn', async () => {
    const error = { response: { status: 409, data: { code: 'APPOINTMENT_CONFLICT' } } }
    api.post.mockRejectedValue(error)
    await expect(createVisit({ carIds: ['a'], scheduledAt: 'x' })).rejects.toBe(error)
  })
})

describe('appointmentApi 1.1.0: đổi lịch, lưới nhân viên, tìm khách, đặt hộ', () => {
  it('fetchSlots chỉ gửi excludeVisitId khi có (AC-F19)', async () => {
    api.get.mockResolvedValue(ok({ days: [] }))
    await fetchSlots({ carIds: ['a', 'b'], from: '2026-11-10', to: '2026-11-23', excludeVisitId: 'v9' }, signal)
    expect(api.get).toHaveBeenCalledWith('/customer/appointments/slots', {
      params: { carIds: 'a,b', from: '2026-11-10', to: '2026-11-23', excludeVisitId: 'v9' }, signal,
    })
    await fetchSlots({ carIds: ['a'], from: '2026-11-10', to: '2026-11-23' }, signal)
    expect(api.get.mock.calls.at(-1)[1].params).not.toHaveProperty('excludeVisitId')
  })

  it('rescheduleMyVisit: PATCH /reschedule với { scheduledAt } nguyên văn, trả visit + previousVisitCode (AC-F20)', async () => {
    const payload = { visit: { visitId: 'v2', visitCode: 'APT-0002' }, previousVisitCode: 'APT-0001' }
    api.patch.mockResolvedValue(ok(payload))
    const result = await rescheduleMyVisit('v1', '2026-11-12T10:00:00+07:00')
    expect(api.patch).toHaveBeenCalledWith('/customer/appointments/v1/reschedule', { scheduledAt: '2026-11-12T10:00:00+07:00' })
    expect(result).toEqual(payload)
  })

  it('rescheduleVisitAsStaff: PATCH /appointments/:id/reschedule', async () => {
    api.patch.mockResolvedValue(ok({ visit: { visitId: 'v2' }, previousVisitCode: 'APT-0001' }))
    const result = await rescheduleVisitAsStaff('v1', '2026-11-12T13:00:00+07:00')
    expect(api.patch).toHaveBeenCalledWith('/appointments/v1/reschedule', { scheduledAt: '2026-11-12T13:00:00+07:00' })
    expect(result.previousVisitCode).toBe('APT-0001')
  })

  it('fetchStaffSlots: không lọc xe thì không gửi carIds; có thì nối bằng dấu phẩy; kèm excludeVisitId và signal', async () => {
    api.get.mockResolvedValue(ok({ days: [{ date: '2026-11-10', slots: [] }] }))
    const all = await fetchStaffSlots({ from: '2026-11-10', to: '2026-11-23' }, signal)
    expect(api.get).toHaveBeenCalledWith('/appointments/slots', { params: { from: '2026-11-10', to: '2026-11-23' }, signal })
    expect(all.days).toHaveLength(1)

    await fetchStaffSlots({ from: '2026-11-10', to: '2026-11-23', carIds: ['a', 'b'], excludeVisitId: 'v1' }, signal)
    expect(api.get).toHaveBeenLastCalledWith('/appointments/slots', {
      params: { from: '2026-11-10', to: '2026-11-23', carIds: 'a,b', excludeVisitId: 'v1' }, signal,
    })

    await fetchStaffSlots({ from: '2026-11-10', to: '2026-11-23', carIds: [] }, signal)
    expect(api.get.mock.calls.at(-1)[1].params).not.toHaveProperty('carIds')
  })

  it('searchCustomers: GET /appointments/customers?q= đã cắt khoảng trắng, trả mảng khách', async () => {
    api.get.mockResolvedValue(ok({ customers: [{ _id: 'c1', fullName: 'A', phone: '090', email: 'a@x.vn' }] }))
    const list = await searchCustomers('  Nguyễn ', signal)
    expect(api.get).toHaveBeenCalledWith('/appointments/customers', { params: { q: 'Nguyễn' }, signal })
    expect(list).toHaveLength(1)
  })

  it('searchCustomers: thân thiếu → mảng rỗng, không vỡ', async () => {
    api.get.mockResolvedValue({ data: { success: true } })
    expect(await searchCustomers('abc')).toEqual([])
  })

  it('createVisitForCustomer: POST /appointments, ghi chú rỗng không gửi (AC-F27)', async () => {
    api.post.mockResolvedValue(ok({ visit: { visitId: 'v7', status: 'CONFIRMED' } }))
    const visit = await createVisitForCustomer({ customerId: 'c1', carIds: ['a'], scheduledAt: '2026-11-12T10:00:00+07:00', notes: '  ' })
    expect(api.post).toHaveBeenCalledWith('/appointments', { customerId: 'c1', carIds: ['a'], scheduledAt: '2026-11-12T10:00:00+07:00' })
    expect(visit.status).toBe('CONFIRMED')

    await createVisitForCustomer({ customerId: 'c1', carIds: ['a'], scheduledAt: 'x', notes: ' khách đi cùng vợ ' })
    expect(api.post).toHaveBeenLastCalledWith('/appointments', { customerId: 'c1', carIds: ['a'], scheduledAt: 'x', notes: 'khách đi cùng vợ' })
  })

  it('changeVisitStatus hủy: gửi reasonCode + reason (đã cắt); ghi chú rỗng thì chỉ có reasonCode (AC-F23)', async () => {
    api.patch.mockResolvedValue(ok({ visit: { status: 'CANCELLED' } }))
    await changeVisitStatus('v1', { status: 'CANCELLED', reasonCode: 'OTHER', reason: '  xe hỏng ' })
    expect(api.patch).toHaveBeenCalledWith('/appointments/v1/status', { status: 'CANCELLED', reasonCode: 'OTHER', reason: 'xe hỏng' })
    await changeVisitStatus('v1', { status: 'CANCELLED', reasonCode: 'SHOWROOM_BUSY', reason: '   ' })
    expect(api.patch).toHaveBeenLastCalledWith('/appointments/v1/status', { status: 'CANCELLED', reasonCode: 'SHOWROOM_BUSY' })
  })

  it('fetchStaffVisits giữ true của cờ nhắc việc, không thêm khóa khác', async () => {
    api.get.mockResolvedValue(ok([]))
    await fetchStaffVisits({ needsReminderCall: true, page: 1, limit: 20 }, signal)
    expect(api.get).toHaveBeenCalledWith('/appointments', { params: { needsReminderCall: true, page: 1, limit: 20 }, signal })
  })

  it('không bắt lỗi ở các hàm mới: lỗi được ném nguyên vẹn, không thử lại (NFR-F04)', async () => {
    const error = { response: { status: 409, data: { code: 'APPOINTMENT_RESCHEDULE_NOT_ALLOWED' } } }
    api.patch.mockRejectedValue(error)
    await expect(rescheduleMyVisit('v1', 'x')).rejects.toBe(error)
    await expect(rescheduleVisitAsStaff('v1', 'x')).rejects.toBe(error)
    expect(api.patch).toHaveBeenCalledTimes(2)
  })
})
