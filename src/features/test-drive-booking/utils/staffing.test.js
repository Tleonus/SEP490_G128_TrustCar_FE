import { describe, expect, it } from 'vitest'
import { assigneeText, canTakeAttendance, restaffSummary, staffingErrorMessage } from './staffing'

const axiosError = (status, code) => ({ response: { status, data: { code } } })

describe('staffing helpers', () => {
  it('quyền điểm danh: ADMIN hoặc nhân viên được bật cờ', () => {
    expect(canTakeAttendance({ roleName: 'ADMIN' })).toBe(true)
    expect(canTakeAttendance({ roleNames: ['SALES_STAFF', 'ADMIN'] })).toBe(true)
    expect(canTakeAttendance({ roleName: 'SALES_STAFF', canTakeAttendance: true })).toBe(true)
    expect(canTakeAttendance({ roleName: 'SALES_STAFF' })).toBe(false)
    expect(canTakeAttendance(null)).toBe(false)
  })

  it('thông báo lỗi theo mã BE', () => {
    expect(staffingErrorMessage(axiosError(409, 'APPOINTMENT_STAFF_BUSY'))).toMatch(/cùng khung giờ/)
    expect(staffingErrorMessage(axiosError(409, 'ATTENDANCE_DAY_CLOSED'))).toMatch(/Ngày đã qua/)
    expect(staffingErrorMessage(axiosError(403, 'ROLE_INSUFFICIENT'))).toMatch(/không có quyền/)
    expect(staffingErrorMessage({})).toMatch(/kết nối/)
  })

  it('tóm tắt kết quả xếp lại và tên người phụ trách', () => {
    expect(restaffSummary({ reassigned: [{}], unassigned: [{}, {}] })).toBe('đã chuyển 1 lượt sang người khác; 2 lượt đang thiếu nhân viên, cần gọi khách đổi giờ')
    expect(restaffSummary({})).toBe('')
    expect(assigneeText({ assignedTo: { fullName: 'An' } })).toBe('An')
    expect(assigneeText({ assignedTo: null })).toBe('Chưa có người phụ trách')
  })
})
