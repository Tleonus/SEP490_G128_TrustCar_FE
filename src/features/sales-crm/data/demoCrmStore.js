/**
 * Dữ liệu CRM mẫu dùng khi BE chưa có API Lead / Lịch hẹn / Chốt đơn.
 *
 * - Lead và lịch hẹn mẫu được gắn với XE THẬT lấy từ /manage/cars, nên thao tác chốt đơn vẫn đổi trạng thái
 *   xe thật qua PATCH /manage/cars/:id/status.
 * - Lưu trong localStorage của trình duyệt (chỉ người đang dùng thấy). Không dùng localStorage được thì
 *   giữ trong bộ nhớ đến khi tải lại trang.
 * - Khi BE có route /manage/leads, /manage/appointments, repository sẽ tự dùng dữ liệu thật và bỏ qua file này.
 */

const STORAGE_KEY = 'trustcar.salesCrm.demo.v1'
const DAY_MS = 24 * 60 * 60 * 1000

let memoryStore = null

const SAMPLE_CUSTOMERS = [
  { fullName: 'Nguyễn Minh Anh', phone: '0903123456', email: 'minhanh.nguyen@example.com' },
  { fullName: 'Trần Quốc Bảo', phone: '0912456789', email: null },
  { fullName: 'Lê Thị Thu Hà', phone: '0987654321', email: 'thuha.le@example.com' },
  { fullName: 'Phạm Đức Huy', phone: '0934567890', email: null },
  { fullName: 'Võ Hoàng Nam', phone: '0978123456', email: 'hoangnam.vo@example.com' },
  { fullName: 'Đặng Ngọc Lan', phone: '0868234567', email: null },
  { fullName: 'Bùi Thanh Tùng', phone: '0398765432', email: null },
  { fullName: 'Hoàng Gia Linh', phone: '0707123456', email: 'gialinh.hoang@example.com' },
  { fullName: 'Đỗ Khánh Vy', phone: '0356789123', email: null },
]

// Lead đang thương lượng đứng đầu để nhận xe RESERVED (đã đặt cọc) nếu kho có.
const SEED_PLAN = [
  { stage: 'NEGOTIATING', appointment: 'TEST_DRIVE', source: 'Website', priority: 'HIGH' },
  { stage: 'NEGOTIATING', appointment: 'VIEWING', source: 'Khách vãng lai', priority: 'HIGH' },
  { stage: 'QUALIFIED', appointment: 'TEST_DRIVE', source: 'Facebook', priority: 'MEDIUM' },
  { stage: 'CONTACTED', appointment: 'TEST_DRIVE', source: 'Giới thiệu', priority: 'MEDIUM' },
  { stage: 'CONTACTED', appointment: null, source: 'Hotline', priority: 'MEDIUM' },
  { stage: 'CONTACTED', appointment: 'VIEWING', source: 'Website', priority: 'LOW' },
  { stage: 'NEW', appointment: null, source: 'Zalo', priority: 'LOW' },
  { stage: 'QUALIFIED', appointment: null, source: 'Website', priority: 'MEDIUM' },
]

const OUTCOME_BY_TYPE = {
  TEST_DRIVE: 'Khách hài lòng khi lái thử, đang cân nhắc phương án tài chính.',
  VIEWING: 'Khách đã xem xe trực tiếp, quan tâm lịch sử bảo dưỡng.',
}

function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

function readStore() {
  const local = storage()
  if (!local) return memoryStore
  try {
    const raw = local.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : memoryStore
  } catch {
    return memoryStore
  }
}

function writeStore(store) {
  memoryStore = store
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Trình duyệt chặn lưu trữ: vẫn dùng bản trong bộ nhớ.
  }
}

const pad4 = (value) => String(value).padStart(4, '0')
const isoDaysAgo = (now, days, hour = 10) => {
  const date = new Date(now.getTime() - days * DAY_MS)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

/** Tạo dữ liệu mẫu từ danh sách xe thật (object thô của /manage/cars). */
export function seedDemoCrm(cars, now = new Date()) {
  const carId = (car) => car._id ?? car.id
  const reserved = cars.filter((car) => car.status === 'RESERVED')
  const available = cars.filter((car) => car.status === 'AVAILABLE')
  const targets = [...reserved, ...available].slice(0, SEED_PLAN.length)
  const leads = []
  const appointments = []

  targets.forEach((car, index) => {
    const plan = SEED_PLAN[index]
    const customer = { _id: `demo-cus-${index + 1}`, ...SAMPLE_CUSTOMERS[index] }
    const lead = {
      _id: `demo-lead-${index + 1}`,
      leadCode: `LD-${pad4(index + 1)}`,
      stage: plan.stage,
      customer,
      car: carId(car),
      source: plan.source,
      priority: plan.priority,
      createdAt: isoDaysAgo(now, index * 2 + 6, 9),
      updatedAt: isoDaysAgo(now, index, 15),
      wonAt: null,
    }
    leads.push(lead)
    if (plan.appointment) {
      const sequence = appointments.length + 1
      appointments.push({
        _id: `demo-apt-${sequence}`,
        appointmentCode: `APT-${pad4(sequence)}`,
        type: plan.appointment,
        status: 'COMPLETED',
        customer,
        car: carId(car),
        lead: lead._id,
        scheduledAt: isoDaysAgo(now, index + 1, 9),
        completedAt: isoDaysAgo(now, index + 1, 10),
        outcome: OUTCOME_BY_TYPE[plan.appointment],
      })
    }
  })

  // Một lead đã chốt để bộ lọc "Đã chốt đơn" có dữ liệu, nếu kho có xe đã bán.
  const soldCar = cars.find((car) => car.status === 'SOLD')
  if (soldCar) {
    const index = SAMPLE_CUSTOMERS.length - 1
    leads.push({
      _id: `demo-lead-${leads.length + 1}`,
      leadCode: `LD-${pad4(leads.length + 1)}`,
      stage: 'WON',
      customer: { _id: `demo-cus-${index + 1}`, ...SAMPLE_CUSTOMERS[index] },
      car: carId(soldCar),
      source: 'Website',
      priority: 'MEDIUM',
      createdAt: isoDaysAgo(now, 20, 9),
      updatedAt: isoDaysAgo(now, 3, 16),
      wonAt: isoDaysAgo(now, 3, 16),
    })
  }

  return { version: 1, createdAt: now.toISOString(), leads, appointments, sales: [] }
}

/** Dữ liệu mẫu hiện có; tạo mới từ danh sách xe nếu chưa có. */
export function getDemoCrm(cars) {
  const existing = readStore()
  if (existing?.version === 1) return existing
  const store = seedDemoCrm(cars)
  writeStore(store)
  return store
}

export function resetDemoCrm(cars) {
  const store = seedDemoCrm(cars)
  writeStore(store)
  return store
}

function nextLeadCode(leads) {
  const max = leads.reduce((highest, lead) => {
    const number = Number(String(lead.leadCode ?? '').replace(/\D/g, ''))
    return Number.isFinite(number) && number > highest ? number : highest
  }, 0)
  return `LD-${pad4(max + 1)}`
}

function maskIdNumber(value) {
  return value ? `${'•'.repeat(Math.max(value.length - 4, 0))}${value.slice(-4)}` : null
}

/**
 * Ghi nhận đơn đã chốt vào dữ liệu mẫu: lead tương ứng → WON (tạo lead mới nếu khách mua trực tiếp),
 * lead khác cùng xe → LOST. CCCD/CMND chỉ lưu 4 số cuối.
 */
export function recordDemoSale(payload, now = new Date()) {
  const store = readStore()
  if (!store) return null
  const timestamp = now.toISOString()
  let leadId = payload.leadId
  let leads = store.leads.map((lead) => {
    if (lead._id === leadId) return { ...lead, stage: 'WON', wonAt: timestamp, updatedAt: timestamp }
    if (lead.car === payload.carId && lead.stage !== 'WON' && lead.stage !== 'LOST') {
      return { ...lead, stage: 'LOST', lostReason: 'Xe đã bán cho khách hàng khác.', updatedAt: timestamp }
    }
    return lead
  })

  if (!leadId || !leads.some((lead) => lead._id === leadId)) {
    leadId = `demo-lead-${now.getTime()}`
    leads = [...leads, {
      _id: leadId,
      leadCode: nextLeadCode(leads),
      stage: 'WON',
      customer: {
        _id: payload.customer.customerId ?? `demo-cus-${now.getTime()}`,
        fullName: payload.customer.fullName,
        phone: payload.customer.phone,
        email: payload.customer.email,
      },
      car: payload.carId,
      source: 'Chốt đơn trực tiếp',
      priority: 'MEDIUM',
      createdAt: timestamp,
      updatedAt: timestamp,
      wonAt: timestamp,
    }]
  }

  const sale = {
    _id: `demo-sale-${now.getTime()}`,
    contractNumber: payload.contractNumber,
    carId: payload.carId,
    vehicleCode: payload.vehicleCode,
    leadId,
    customerName: payload.customer.fullName,
    customerPhone: payload.customer.phone,
    idNumberMasked: maskIdNumber(payload.customer.idNumber),
    finalPrice: payload.finalPrice,
    payment: payload.payment,
    saleDate: payload.saleDate,
    handoverDate: payload.handoverDate,
    recordedAt: timestamp,
  }
  const next = { ...store, leads, sales: [...(store.sales ?? []), sale] }
  writeStore(next)
  return sale
}

/** Chỉ dùng cho kiểm thử. */
export function __resetDemoMemory() {
  memoryStore = null
}
