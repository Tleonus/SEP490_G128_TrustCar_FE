import {
  checkoutOrder,
  getManagedCar,
  isRouteMissing,
  listAllManagedCars,
  listCompletedAppointments,
  listLeads,
  updateCarStatus,
} from '../api/salesCrmApi'
import { buildPipeline, isSellableStatus, toCarVM } from './salesCrmMappers'
import { getDemoCrm, recordDemoSale, resetDemoCrm } from './demoCrmStore'
import { buildCheckoutPayload, buildStatusReason } from '../utils/checkoutValidation'

/**
 * Lớp truy cập dữ liệu cho Quản lý bán hàng. Giao diện chỉ gọi các hàm trong file này.
 *
 * source = 'api'  : BE có route Lead/Lịch hẹn → dùng dữ liệu thật.
 * source = 'demo' : BE trả 404 "Route ... not found" → dùng dữ liệu CRM mẫu gắn với xe thật (demoCrmStore).
 */

/** @returns {Promise<ReturnType<typeof buildPipeline> & { source: 'api'|'demo' }>} */
export async function loadSalesPipeline() {
  const cars = await listAllManagedCars()
  try {
    const [leads, appointments] = await Promise.all([listLeads(), listCompletedAppointments()])
    return { source: 'api', ...buildPipeline({ cars, leads, appointments }) }
  } catch (error) {
    if (!isRouteMissing(error)) throw error
    const store = getDemoCrm(cars)
    return { source: 'demo', ...buildPipeline({ cars, leads: store.leads, appointments: store.appointments }) }
  }
}

/** Tạo lại dữ liệu CRM mẫu từ kho xe hiện tại. */
export async function resetDemoPipeline() {
  const cars = await listAllManagedCars()
  const store = resetDemoCrm(cars)
  return { source: 'demo', ...buildPipeline({ cars, leads: store.leads, appointments: store.appointments }) }
}

export class CheckoutError extends Error {
  /**
   * @param {'CAR_NOT_SELLABLE'|'CAR_STATUS_CHANGED'|'PARTIAL_RESERVED'} code
   * @param {string} message
   * @param {import('./salesCrmMappers').CarVM} [car] Trạng thái xe mới nhất.
   */
  constructor(code, message, car) {
    super(message)
    this.name = 'CheckoutError'
    this.code = code
    this.car = car
  }
}

/**
 * Chốt đơn bán xe.
 * 1. Đọc lại xe từ BE: chặn nếu không còn AVAILABLE/RESERVED hoặc trạng thái đã đổi so với lúc mở form.
 * 2. Gọi POST /orders/checkout.
 * 3. Nếu BE chưa có route này: chuyển trạng thái xe thật AVAILABLE → RESERVED → SOLD (state machine GBR-05),
 *    lý do đổi trạng thái ghi tóm tắt đơn vào ActivityLog; ghi đơn vào dữ liệu CRM mẫu.
 *
 * @param {object} values Giá trị form (createEmptyCheckoutValues).
 * @param {{ car: import('./salesCrmMappers').CarVM, leadId?: string|null, appointmentId?: string|null, resumeReserved?: boolean }} context
 *   resumeReserved: lần trước đã chuyển AVAILABLE → RESERVED nhưng chưa sang SOLD; cho phép tiếp tục.
 * @returns {Promise<{ mode: 'api'|'status-fallback', car: import('./salesCrmMappers').CarVM }>}
 */
export async function submitCheckout(values, { car, leadId = null, appointmentId = null, resumeReserved = false }) {
  const latest = toCarVM(await getManagedCar(car.id))
  if (!latest || !isSellableStatus(latest.status)) {
    throw new CheckoutError('CAR_NOT_SELLABLE', 'Xe không còn ở trạng thái có thể chốt đơn.', latest ?? car)
  }
  const resuming = resumeReserved && car.status === 'AVAILABLE' && latest.status === 'RESERVED'
  if (latest.status !== car.status && !resuming) {
    throw new CheckoutError('CAR_STATUS_CHANGED', 'Trạng thái xe vừa thay đổi. Vui lòng kiểm tra lại thông tin đơn.', latest)
  }

  // Payload dựng theo trạng thái xe lúc mở form (tiền cọc = 0 nếu xe Đang bán).
  const payload = buildCheckoutPayload(values, { car: { ...latest, status: car.status }, leadId, appointmentId })

  try {
    const result = await checkoutOrder(payload)
    return { mode: 'api', car: toCarVM(result?.car) ?? { ...latest, status: 'SOLD' } }
  } catch (error) {
    if (!isRouteMissing(error)) throw error
  }

  const reason = buildStatusReason(payload)
  if (latest.status === 'AVAILABLE') {
    await updateCarStatus(latest.id, 'RESERVED', reason)
  }
  let soldCar
  try {
    soldCar = await updateCarStatus(latest.id, 'SOLD', reason)
  } catch (error) {
    if (latest.status === 'AVAILABLE') {
      throw new CheckoutError(
        'PARTIAL_RESERVED',
        'Xe đã chuyển sang "Đã đặt cọc" nhưng chưa chuyển được sang "Đã bán". Bấm xác nhận lại để hoàn tất.',
        { ...latest, status: 'RESERVED' },
      )
    }
    throw error
  }
  recordDemoSale(payload)
  return { mode: 'status-fallback', car: toCarVM(soldCar) ?? { ...latest, status: 'SOLD' } }
}
