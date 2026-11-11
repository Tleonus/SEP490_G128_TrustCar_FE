import api from '../../../services/api.js';

const TRANSMISSION_MAP = Object.freeze({
  automatic: 'AUTOMATIC',
  manual: 'MANUAL',
  cvt: 'CVT',
  hybrid: 'CVT',
  dct: 'DCT',
});

const FUEL_TYPE_MAP = Object.freeze({
  gasoline: 'GASOLINE',
  diesel: 'DIESEL',
  hybrid: 'HYBRID',
  electric: 'ELECTRIC',
  lpg: 'LPG',
});

const ERROR_CODE_MESSAGES = Object.freeze({
  VIN_DUPLICATE: 'Số khung (VIN) này đã tồn tại trong hệ thống.',
  PLATE_DUPLICATE: 'Biển số xe này đang tồn tại trong kho xe hoạt động.',
  MILEAGE_DECREASED: 'Số km (ODO) không được nhỏ hơn số km đã ghi nhận của xe.',
  MILEAGE_DECREASE: 'Số km (ODO) không được nhỏ hơn số km đã ghi nhận của xe.',
  VALIDATION_ERROR: 'Dữ liệu hồ sơ xe không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.',
  TOKEN_MISSING: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  TOKEN_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  TOKEN_INVALID: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Tài khoản hiện tại không có quyền lưu hồ sơ nhập xe.',
  ROLE_INSUFFICIENT: 'Tài khoản hiện tại không có quyền lưu hồ sơ nhập xe.',
});

const DEFAULT_ERROR_MESSAGE = 'Chưa lưu được hồ sơ. Vui lòng kiểm tra kết nối và thử lại.';

// Lưu lại carId theo cặp (VIN, biển số) trong phiên hiện tại để hỗ trợ cập nhật / lưu lại biên bản
// ngay trên cùng màn hình mà không bị lỗi trùng VIN/biển số ở lần bấm lưu tiếp theo.
const savedCarIdsByIdentity = new Map();

export function resetIntakeSessionCache() {
  savedCarIdsByIdentity.clear();
}

export function normalizePlateInput(plate) {
  return String(plate || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function mapIntakeToCreateCarDto(payload = {}) {
  const price = Number(payload.listedPrice);
  const floorPrice = Number(payload.floorPrice);
  const year = Number(payload.year);
  const mileage = Number(payload.mileage);
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';
  const rawTransmission = String(payload.transmission || '').trim().toLowerCase();
  const rawFuel = String(payload.fuel || '').trim().toLowerCase();

  return {
    vin: String(payload.vin || '').trim().toUpperCase(),
    licensePlate: normalizePlateInput(payload.licensePlate),
    make: String(payload.brand || '').trim().toUpperCase(),
    model: String(payload.model || '').trim(),
    year,
    mileage,
    price,
    listedPrice: price,
    floorPrice,
    transmission: TRANSMISSION_MAP[rawTransmission] || 'AUTOMATIC',
    fuelType: FUEL_TYPE_MAP[rawFuel] || 'GASOLINE',
    inventoryType: payload.ownership === 'consignment' ? 'CONSIGNMENT' : 'OWNED',
    ownerType: payload.ownership === 'company' ? 'COMPANY' : 'INDIVIDUAL',
    ...(notes ? { internalNotes: notes } : {}),
  };
}

export function mapIntakeToQuickInspectDto(payload = {}) {
  const checks = payload.checklist || {};
  const notes = typeof payload.notes === 'string' ? payload.notes.trim() : '';

  return {
    criteria: {
      noMajorAccident: Boolean(checks.chassis),
      noWaterDamage: Boolean(checks.flood),
      engineGearboxIntact: Boolean(checks.engine),
      verifiedOdo: Boolean(checks.odometer),
      electricalSystemPassed: Boolean(checks.safety),
    },
    odo: Number(payload.mileage) || 0,
    notes,
  };
}

export function getIntakeErrorMessage(error) {
  const code = error?.response?.data?.code;
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code];
  }
  return DEFAULT_ERROR_MESSAGE;
}

/**
 * Lưu hồ sơ nhập xe và biên bản thẩm định 5 tiêu chí lên Backend thật:
 * 1. Tạo xe mới qua POST /manage/cars (hoặc cập nhật qua PUT /manage/cars/:id nếu xe vừa được tạo trong phiên).
 * 2. Ghi nhận biên bản thẩm định 5 tiêu chí qua POST /inspections/cars/:id/inspect.
 */
export async function saveVehicleIntake(payload, { apiClient = api, existingCarId = null } = {}) {
  const carDto = mapIntakeToCreateCarDto(payload);
  const inspectDto = mapIntakeToQuickInspectDto(payload);
  const identityKey = `${carDto.vin}:${carDto.licensePlate}`;
  let carId = existingCarId || savedCarIdsByIdentity.get(identityKey) || null;
  let carRecord = null;

  try {
    if (!carId) {
      const createResponse = await apiClient.post('/manage/cars', carDto);
      carRecord = createResponse?.data?.data ?? null;
      carId = carRecord?._id || carRecord?.id || null;
      if (!carId) {
        throw new Error('Không nhận được mã định danh xe từ hệ thống.');
      }
      savedCarIdsByIdentity.set(identityKey, String(carId));
    } else {
      const updateResponse = await apiClient.put(`/manage/cars/${encodeURIComponent(carId)}`, carDto);
      carRecord = updateResponse?.data?.data ?? null;
    }

    const inspectResponse = await apiClient.post(
      `/inspections/cars/${encodeURIComponent(carId)}/inspect`,
      inspectDto,
    );
    const inspectData = inspectResponse?.data?.data ?? {};

    return {
      car: inspectData.car ?? carRecord,
      inspectionRecord: inspectData.inspectionRecord ?? null,
    };
  } catch (error) {
    if (error && typeof error === 'object') {
      error.userMessage = getIntakeErrorMessage(error);
    }
    throw error;
  }
}
