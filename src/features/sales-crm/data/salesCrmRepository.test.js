import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../api/salesCrmApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    isRouteMissing: actual.isRouteMissing,
    listAllManagedCars: vi.fn(),
    getManagedCar: vi.fn(),
    updateCarStatus: vi.fn(),
    listLeads: vi.fn(),
    listCompletedAppointments: vi.fn(),
    checkoutOrder: vi.fn(),
  }
})

const api = await import('../api/salesCrmApi')
const { loadSalesPipeline, submitCheckout, CheckoutError } = await import('./salesCrmRepository')
const { __resetDemoMemory, seedDemoCrm } = await import('./demoCrmStore')

const routeMissing = (method, url) => Object.assign(new Error('404'), {
  response: { status: 404, data: { message: `Route ${method} /api/v1${url} not found.` } },
})

const rawCars = [
  { _id: 'c1', vehicleCode: 'TC-2026-0001', make: 'KIA', model: 'Sonet', price: 555000000, status: 'AVAILABLE' },
  { _id: 'c2', vehicleCode: 'TC-2026-0002', make: 'MAZDA', model: 'CX-5', price: 635000000, status: 'RESERVED' },
  { _id: 'c3', vehicleCode: 'TC-2026-0003', make: 'VINFAST', model: 'VF 3', price: 275000000, status: 'SOLD' },
  { _id: 'c4', vehicleCode: 'TC-2026-0004', make: 'TOYOTA', model: 'Vios', price: 420000000, status: 'INCOMING' },
]

const formValues = {
  customerId: null,
  customerName: 'Khách Mới',
  phone: '0912345678',
  idNumber: '079201001234',
  email: '',
  carId: 'c1',
  paymentMethod: 'FULL',
  bankName: null,
  loanAmount: null,
  depositAmount: null,
  finalPrice: 550000000,
  handoverDate: '2099-01-01',
  contractNumber: 'HD-0001',
  note: '',
  contractConfirmed: true,
}
const carVM = (id, status) => ({ id, vehicleCode: `TC-${id}`, title: 'Xe', licensePlate: null, price: 555000000, status, year: null, image: null })

beforeEach(() => {
  vi.clearAllMocks()
  __resetDemoMemory()
  api.listAllManagedCars.mockResolvedValue(rawCars)
})

describe('seedDemoCrm', () => {
  it('chỉ gắn lead đang mở với xe Đang bán/Đã đặt cọc, ưu tiên xe đã đặt cọc cho lead thương lượng', () => {
    const store = seedDemoCrm(rawCars, new Date('2026-11-07T08:00:00'))
    const openLeads = store.leads.filter((lead) => lead.stage !== 'WON')
    expect(openLeads.map((lead) => lead.car)).toEqual(['c2', 'c1'])
    expect(openLeads[0].stage).toBe('NEGOTIATING')
    expect(store.leads.find((lead) => lead.stage === 'WON')?.car).toBe('c3')
    expect(store.appointments.every((item) => item.status === 'COMPLETED')).toBe(true)
  })
})

describe('loadSalesPipeline', () => {
  it('dùng dữ liệu mẫu khi BE chưa có route lead/lịch hẹn', async () => {
    api.listLeads.mockRejectedValue(routeMissing('GET', '/manage/leads'))
    api.listCompletedAppointments.mockRejectedValue(routeMissing('GET', '/manage/appointments'))
    const pipeline = await loadSalesPipeline()
    expect(pipeline.source).toBe('demo')
    expect(pipeline.leads.length).toBeGreaterThan(0)
    expect(pipeline.sellableCars.map((car) => car.id)).toEqual(['c1', 'c2'])
  })

  it('dùng dữ liệu thật khi BE có route', async () => {
    api.listLeads.mockResolvedValue([{ _id: 'l1', leadCode: 'LD-9', stage: 'CONTACTED', customer: { _id: 'u1', fullName: 'A', phone: '0903123456' }, car: 'c1' }])
    api.listCompletedAppointments.mockResolvedValue([])
    const pipeline = await loadSalesPipeline()
    expect(pipeline.source).toBe('api')
    expect(pipeline.leads).toHaveLength(1)
  })

  it('không nuốt lỗi khác 404 route', async () => {
    api.listLeads.mockRejectedValue(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    api.listCompletedAppointments.mockResolvedValue([])
    await expect(loadSalesPipeline()).rejects.toThrow('500')
  })
})

describe('submitCheckout', () => {
  it('gọi POST /orders/checkout khi BE có route', async () => {
    api.getManagedCar.mockResolvedValue(rawCars[0])
    api.checkoutOrder.mockResolvedValue({ car: { ...rawCars[0], status: 'SOLD' } })
    const result = await submitCheckout(formValues, { car: carVM('c1', 'AVAILABLE') })
    expect(result.mode).toBe('api')
    expect(result.car.status).toBe('SOLD')
    expect(api.checkoutOrder).toHaveBeenCalledWith(expect.objectContaining({ carId: 'c1', finalPrice: 550000000 }))
    expect(api.updateCarStatus).not.toHaveBeenCalled()
  })

  it('dự phòng: xe Đang bán đi AVAILABLE → RESERVED → SOLD', async () => {
    api.getManagedCar.mockResolvedValue(rawCars[0])
    api.checkoutOrder.mockRejectedValue(routeMissing('POST', '/orders/checkout'))
    api.updateCarStatus.mockImplementation(async (id, status) => ({ ...rawCars[0], status }))
    const result = await submitCheckout(formValues, { car: carVM('c1', 'AVAILABLE') })
    expect(result).toMatchObject({ mode: 'status-fallback', car: { status: 'SOLD' } })
    expect(api.updateCarStatus.mock.calls.map(([, status]) => status)).toEqual(['RESERVED', 'SOLD'])
    expect(api.updateCarStatus.mock.calls[0][2]).not.toContain('079201001234')
  })

  it('dự phòng: xe Đã đặt cọc chỉ cần RESERVED → SOLD', async () => {
    api.getManagedCar.mockResolvedValue(rawCars[1])
    api.checkoutOrder.mockRejectedValue(routeMissing('POST', '/orders/checkout'))
    api.updateCarStatus.mockResolvedValue({ ...rawCars[1], status: 'SOLD' })
    await submitCheckout({ ...formValues, carId: 'c2', depositAmount: 50000000 }, { car: carVM('c2', 'RESERVED') })
    expect(api.updateCarStatus.mock.calls.map(([, status]) => status)).toEqual(['SOLD'])
  })

  it('chặn khi xe đã không còn bán được', async () => {
    api.getManagedCar.mockResolvedValue(rawCars[2])
    await expect(submitCheckout(formValues, { car: carVM('c3', 'AVAILABLE') })).rejects.toMatchObject({ code: 'CAR_NOT_SELLABLE' })
    expect(api.checkoutOrder).not.toHaveBeenCalled()
  })

  it('báo trạng thái đã đổi khi xe vừa chuyển sang Đã đặt cọc', async () => {
    api.getManagedCar.mockResolvedValue(rawCars[1])
    const error = await submitCheckout(formValues, { car: carVM('c2', 'AVAILABLE') }).catch((err) => err)
    expect(error).toBeInstanceOf(CheckoutError)
    expect(error.code).toBe('CAR_STATUS_CHANGED')
    expect(error.car.status).toBe('RESERVED')
  })

  it('báo lỗi một phần khi đã RESERVED nhưng SOLD thất bại, và cho tiếp tục ở lần sau', async () => {
    api.getManagedCar.mockResolvedValueOnce(rawCars[0])
    api.checkoutOrder.mockRejectedValue(routeMissing('POST', '/orders/checkout'))
    api.updateCarStatus
      .mockResolvedValueOnce({ ...rawCars[0], status: 'RESERVED' })
      .mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    const error = await submitCheckout(formValues, { car: carVM('c1', 'AVAILABLE') }).catch((err) => err)
    expect(error.code).toBe('PARTIAL_RESERVED')

    api.getManagedCar.mockResolvedValueOnce({ ...rawCars[0], status: 'RESERVED' })
    api.updateCarStatus.mockResolvedValueOnce({ ...rawCars[0], status: 'SOLD' })
    const result = await submitCheckout(formValues, { car: carVM('c1', 'AVAILABLE'), resumeReserved: true })
    expect(result.car.status).toBe('SOLD')
    expect(api.updateCarStatus.mock.calls.map(([, status]) => status)).toEqual(['RESERVED', 'SOLD', 'SOLD'])
  })
})
