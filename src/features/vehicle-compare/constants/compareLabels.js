// Nhãn hiển thị theo enum của BE (chữ hoa). Khác với src/utils/constants.js (khóa chữ thường của dữ liệu mẫu).
// Ref: .sdd/features/vehicle-comparison/SPEC.md (REQ-F22, mục 5)

export const NOT_UPDATED = 'Chưa cập nhật'

export const BODY_TYPE_LABEL = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  PICKUP: 'Bán tải',
  VAN: 'Van',
  COUPE: 'Coupe',
  CONVERTIBLE: 'Mui trần',
  WAGON: 'Wagon',
  MPV: 'MPV',
}

export const FUEL_TYPE_LABEL = {
  GASOLINE: 'Xăng',
  DIESEL: 'Dầu diesel',
  HYBRID: 'Hybrid',
  ELECTRIC: 'Điện',
  LPG: 'LPG',
}

export const TRANSMISSION_LABEL = {
  MANUAL: 'Số sàn',
  AUTOMATIC: 'Số tự động',
  CVT: 'CVT',
  DCT: 'Ly hợp kép (DCT)',
}

export const DRIVE_TYPE_LABEL = {
  FWD: 'Cầu trước (FWD)',
  RWD: 'Cầu sau (RWD)',
  AWD: 'Toàn thời gian (AWD)',
  '4WD': '4 bánh (4WD)',
}

export const OWNER_TYPE_LABEL = {
  COMPANY: 'Công ty',
  INDIVIDUAL: 'Cá nhân',
}

export const CONDITION_GRADE_LABEL = {
  A: 'A – Rất tốt',
  B: 'B – Tốt',
  C: 'C – Khá',
  D: 'D – Kém',
}

/**
 * Nhãn của một giá trị enum: rỗng → "Chưa cập nhật", giá trị lạ → hiện nguyên văn.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F22
 */
export function labelFor(map, value) {
  if (value == null || value === '') return NOT_UPDATED
  return map[value] ?? String(value)
}
