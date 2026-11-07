import { getCarTitle, getCoverImage } from '../../../utils/car'
import { PIPELINE_STAGE, SELLABLE_CAR_STATUSES } from '../constants/salesCrmConstants'

/**
 * Chuyển dữ liệu thô (API hoặc dữ liệu mẫu) thành view model cho màn Quản lý bán hàng.
 * Lead/Appointment từ BE có thể populate `customer`, `car` thành object hoặc chỉ là ObjectId.
 */

/** @typedef {{ id: string, vehicleCode: string|null, title: string, licensePlate: string|null, price: number|null, status: string|null, year: number|null, image: string|null }} CarVM */
/** @typedef {{ id: string|null, fullName: string, phone: string, email: string|null }} CustomerVM */

export function idOf(value) {
  if (value == null) return null
  if (typeof value === 'string') return value
  return value._id ?? value.id ?? null
}

/** @returns {CarVM|null} */
export function toCarVM(car) {
  if (!car || typeof car !== 'object') return null
  const cover = getCoverImage(car)
  return {
    id: idOf(car),
    vehicleCode: car.vehicleCode ?? null,
    title: getCarTitle(car) || 'Xe đang cập nhật thông tin',
    licensePlate: car.licensePlate ?? null,
    price: typeof car.price === 'number' ? car.price : null,
    status: car.status ?? null,
    year: car.year ?? null,
    image: (typeof cover === 'string' ? cover : cover?.url) ?? null,
  }
}

/** @returns {CustomerVM|null} */
export function toCustomerVM(customer) {
  if (!customer || typeof customer !== 'object') return null
  return {
    id: idOf(customer),
    fullName: customer.fullName ?? '',
    phone: customer.phone ?? '',
    email: customer.email ?? null,
  }
}

export function isSellableStatus(status) {
  return SELLABLE_CAR_STATUSES.includes(status)
}

/**
 * Giai đoạn hiển thị. BE không có "Đã lái thử" nên suy ra từ stage QUALIFIED hoặc lịch lái thử đã hoàn thành.
 * WON/LOST/NEGOTIATING giữ nguyên vì đã ở sau bước lái thử trong phễu bán hàng.
 */
export function getPipelineStage(stage, hasCompletedTestDrive = false) {
  if (stage === 'WON' || stage === 'LOST' || stage === 'NEGOTIATING') return stage
  if (stage === 'QUALIFIED' || hasCompletedTestDrive) return PIPELINE_STAGE.TEST_DRIVEN
  if (stage === 'CONTACTED') return PIPELINE_STAGE.CONTACTED
  return PIPELINE_STAGE.NEW
}

function resolveCar(rawCar, carsById) {
  const carId = idOf(rawCar)
  return { carId, car: carsById.get(carId) ?? toCarVM(rawCar) }
}

export function toAppointmentVM(raw, carsById) {
  const { carId, car } = resolveCar(raw.car, carsById)
  return {
    id: idOf(raw),
    code: raw.appointmentCode ?? null,
    type: raw.type ?? null,
    status: raw.status ?? null,
    customer: toCustomerVM(raw.customer),
    carId,
    car,
    leadId: idOf(raw.lead),
    scheduledAt: raw.scheduledAt ?? null,
    completedAt: raw.completedAt ?? null,
    outcome: raw.outcome ?? null,
  }
}

function hasCompletedTestDrive(lead, appointments) {
  return appointments.some((appointment) => {
    if (appointment.type !== 'TEST_DRIVE' || appointment.status !== 'COMPLETED') return false
    if (appointment.leadId) return appointment.leadId === lead.id
    return appointment.customer?.id === lead.customer?.id && appointment.carId === lead.carId
  })
}

export function toLeadVM(raw, carsById, appointments = []) {
  const { carId, car } = resolveCar(raw.car, carsById)
  const lead = {
    id: idOf(raw),
    code: raw.leadCode ?? null,
    stage: raw.stage ?? 'NEW',
    customer: toCustomerVM(raw.customer),
    carId,
    car,
    source: raw.source ?? null,
    priority: raw.priority ?? null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? null,
    wonAt: raw.wonAt ?? null,
  }
  lead.pipelineStage = getPipelineStage(lead.stage, hasCompletedTestDrive(lead, appointments))
  return lead
}

function byNewest(field) {
  return (a, b) => new Date(b[field] ?? 0).getTime() - new Date(a[field] ?? 0).getTime()
}

/** Danh sách khách hàng duy nhất (theo id, rồi theo SĐT) từ lead và lịch hẹn. */
export function collectCustomers(leads, appointments) {
  const map = new Map()
  for (const item of [...leads, ...appointments]) {
    const customer = item.customer
    if (!customer?.fullName) continue
    const key = customer.id ?? customer.phone
    if (!map.has(key)) map.set(key, customer)
  }
  return [...map.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, 'vi'))
}

/**
 * Ghép xe, lead, lịch hẹn thành dữ liệu cho màn hình.
 * @param {{ cars: object[], leads: object[], appointments: object[] }} raw
 */
export function buildPipeline({ cars, leads, appointments }) {
  const carVMs = cars.map(toCarVM).filter(Boolean)
  const carsById = new Map(carVMs.map((car) => [car.id, car]))
  const appointmentVMs = appointments
    .map((item) => toAppointmentVM(item, carsById))
    .filter((item) => item.status === 'COMPLETED')
    .sort(byNewest('completedAt'))
  const leadVMs = leads
    .map((item) => toLeadVM(item, carsById, appointmentVMs))
    .sort(byNewest('updatedAt'))
  return {
    cars: carVMs,
    sellableCars: carVMs.filter((car) => isSellableStatus(car.status)),
    leads: leadVMs,
    appointments: appointmentVMs,
    customers: collectCustomers(leadVMs, appointmentVMs),
  }
}

/** Lead đang mở (chưa WON/LOST) của đúng khách và xe, để gắn leadId khi chốt đơn không đi từ lead. */
export function findOpenLead(leads, customerId, carId) {
  if (!customerId || !carId) return null
  return leads.find((lead) => lead.customer?.id === customerId && lead.carId === carId
    && lead.stage !== 'WON' && lead.stage !== 'LOST') ?? null
}
