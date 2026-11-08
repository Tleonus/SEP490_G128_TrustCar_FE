import { describe, expect, it } from 'vitest'
import { buildPipeline, findOpenLead, getPipelineStage, isSellableStatus } from '../data/salesCrmMappers'
import { countByStage, filterAppointments, filterLeads, paginate, toSearchText } from './pipelineQuery'

const cars = [
  { _id: 'c1', vehicleCode: 'TC-2026-0001', make: 'KIA', model: 'Sonet', variant: 'Premium', licensePlate: '51K-123.45', price: 555000000, status: 'AVAILABLE' },
  { _id: 'c2', vehicleCode: 'TC-2026-0002', make: 'MAZDA', model: 'CX-5', licensePlate: '30A-999.99', price: 635000000, status: 'RESERVED' },
  { _id: 'c3', vehicleCode: 'TC-2026-0003', make: 'VINFAST', model: 'VF 3', price: 275000000, status: 'SOLD' },
]
const anh = { _id: 'u1', fullName: 'Nguyễn Minh Anh', phone: '0903123456' }
const lan = { _id: 'u2', fullName: 'Đặng Ngọc Lan', phone: '0868234567' }
const leads = [
  { _id: 'l1', leadCode: 'LD-0001', stage: 'CONTACTED', customer: anh, car: 'c1', updatedAt: '2026-11-01' },
  { _id: 'l2', leadCode: 'LD-0002', stage: 'CONTACTED', customer: lan, car: { _id: 'c2' }, updatedAt: '2026-11-05' },
  { _id: 'l3', leadCode: 'LD-0003', stage: 'NEGOTIATING', customer: lan, car: 'c1', updatedAt: '2026-11-03' },
  { _id: 'l4', leadCode: 'LD-0004', stage: 'WON', customer: anh, car: 'c3', updatedAt: '2026-10-01' },
  { _id: 'l5', leadCode: 'LD-0005', stage: 'QUALIFIED', customer: anh, car: 'missing', updatedAt: '2026-10-02' },
]
const appointments = [
  { _id: 'a1', appointmentCode: 'APT-0001', type: 'TEST_DRIVE', status: 'COMPLETED', customer: lan, car: 'c2', lead: 'l2', completedAt: '2026-11-04' },
  { _id: 'a2', appointmentCode: 'APT-0002', type: 'VIEWING', status: 'CANCELLED', customer: anh, car: 'c1', completedAt: null },
]

describe('getPipelineStage', () => {
  it('suy ra "Đã lái thử" từ QUALIFIED hoặc lịch lái thử đã hoàn thành', () => {
    expect(getPipelineStage('QUALIFIED')).toBe('TEST_DRIVEN')
    expect(getPipelineStage('CONTACTED', true)).toBe('TEST_DRIVEN')
    expect(getPipelineStage('CONTACTED')).toBe('CONTACTED')
    expect(getPipelineStage('NEGOTIATING', true)).toBe('NEGOTIATING')
    expect(getPipelineStage('WON', true)).toBe('WON')
    expect(getPipelineStage(undefined)).toBe('NEW')
  })
})

describe('buildPipeline', () => {
  const pipeline = buildPipeline({ cars, leads, appointments })

  it('ghép xe vào lead (id hoặc object) và sắp xếp lead mới cập nhật trước', () => {
    expect(pipeline.leads.map((lead) => lead.id)).toEqual(['l2', 'l3', 'l1', 'l5', 'l4'])
    expect(pipeline.leads[0].car).toMatchObject({ id: 'c2', status: 'RESERVED', title: 'MAZDA CX-5' })
    expect(pipeline.leads.find((lead) => lead.id === 'l5').car).toBeNull()
  })

  it('chỉ giữ lịch hẹn COMPLETED và đánh dấu lead đã lái thử', () => {
    expect(pipeline.appointments.map((item) => item.id)).toEqual(['a1'])
    expect(pipeline.leads.find((lead) => lead.id === 'l2').pipelineStage).toBe('TEST_DRIVEN')
  })

  it('lọc xe có thể chốt và gom khách hàng duy nhất', () => {
    expect(pipeline.sellableCars.map((car) => car.id)).toEqual(['c1', 'c2'])
    expect(pipeline.customers.map((customer) => customer.id)).toEqual(['u2', 'u1'])
  })

  it('đếm theo 4 giai đoạn chính', () => {
    expect(countByStage(pipeline.leads)).toEqual({ CONTACTED: 1, TEST_DRIVEN: 2, NEGOTIATING: 1, WON: 1 })
  })

  it('tìm lead đang mở theo khách + xe', () => {
    expect(findOpenLead(pipeline.leads, 'u2', 'c1')?.id).toBe('l3')
    expect(findOpenLead(pipeline.leads, 'u1', 'c3')).toBeNull()
  })
})

describe('filterLeads / filterAppointments', () => {
  const pipeline = buildPipeline({ cars, leads, appointments })

  it('tìm không dấu theo tên, SĐT, mã xe, biển số', () => {
    expect(filterLeads(pipeline.leads, { search: 'dang ngoc' }).map((lead) => lead.id)).toEqual(['l2', 'l3'])
    expect(filterLeads(pipeline.leads, { search: '0903 123' }).map((lead) => lead.id)).toEqual(['l1', 'l5', 'l4'])
    expect(filterLeads(pipeline.leads, { search: '51K12345' }).map((lead) => lead.id)).toEqual(['l3', 'l1'])
    expect(filterLeads(pipeline.leads, { search: 'tc-2026-0002' }).map((lead) => lead.id)).toEqual(['l2'])
  })

  it('lọc theo giai đoạn', () => {
    expect(filterLeads(pipeline.leads, { stage: 'TEST_DRIVEN' }).map((lead) => lead.id)).toEqual(['l2', 'l5'])
  })

  it('lọc lịch hẹn theo loại', () => {
    expect(filterAppointments(pipeline.appointments, { type: 'VIEWING' })).toEqual([])
    expect(filterAppointments(pipeline.appointments, { type: 'TEST_DRIVE', search: 'lan' })).toHaveLength(1)
  })
})

describe('tiện ích', () => {
  it('toSearchText bỏ dấu tiếng Việt', () => {
    expect(toSearchText('Đặng Ngọc Lan')).toBe('dang ngoc lan')
  })

  it('paginate giới hạn trang hợp lệ', () => {
    const items = Array.from({ length: 23 }, (_, index) => index)
    expect(paginate(items, 3, 10)).toEqual({ current: 3, items: [20, 21, 22] })
    expect(paginate(items, 9, 10).current).toBe(3)
    expect(paginate([], 2, 10)).toEqual({ current: 1, items: [] })
  })

  it('isSellableStatus chỉ nhận AVAILABLE và RESERVED', () => {
    expect(['AVAILABLE', 'RESERVED', 'SOLD', 'INCOMING'].map(isSellableStatus)).toEqual([true, true, false, false])
  })
})
