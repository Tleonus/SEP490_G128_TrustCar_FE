// Dựng các hàng của bảng so sánh từ phản hồi API (đã có sẵn nhãn và định dạng).
// Chỉ đọc các trường có trong hợp đồng API-VEHICLE-COMPARE; không hiển thị dữ liệu nội bộ.
// Ref: .sdd/features/vehicle-comparison/SPEC.md (REQ-F13, F21, F22, F23)

import { formatMileage } from '../../../utils/format'
import {
  NOT_UPDATED,
  BODY_TYPE_LABEL,
  FUEL_TYPE_LABEL,
  TRANSMISSION_LABEL,
  DRIVE_TYPE_LABEL,
  OWNER_TYPE_LABEL,
  CONDITION_GRADE_LABEL,
  labelFor,
} from '../constants/compareLabels'

const numberFormat = new Intl.NumberFormat('vi-VN')

const isBlank = (value) => value == null || value === ''

// Ô văn bản: giá trị trống → "Chưa cập nhật".
const text = (value, format = String) => ({ text: isBlank(value) ? NOT_UPDATED : format(value) })
const withUnit = (unit) => (value) => `${numberFormat.format(value)} ${unit}`
const enumCell = (map) => (car, getter) => ({ text: labelFor(map, getter(car)) })

// Ô danh sách (tiện nghi): rỗng → "Chưa cập nhật".
const listCell = (value) => {
  const items = Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item) : []
  return { text: items.length ? items.join(', ') : NOT_UPDATED, items }
}

const spec = (car, key) => car.specifications?.[key]

const GROUPS = [
  {
    key: 'general',
    title: 'Thông tin chung',
    rows: [
      { key: 'bodyType', label: 'Kiểu dáng', cell: (car) => enumCell(BODY_TYPE_LABEL)(car, (c) => c.bodyType) },
      { key: 'year', label: 'Năm sản xuất', cell: (car) => text(car.year) },
      { key: 'mileage', label: 'Số km đã đi', cell: (car) => text(car.mileage, formatMileage) },
      { key: 'conditionGrade', label: 'Tình trạng', cell: (car) => enumCell(CONDITION_GRADE_LABEL)(car, (c) => c.conditionGrade) },
      { key: 'ownerType', label: 'Chủ sở hữu', cell: (car) => enumCell(OWNER_TYPE_LABEL)(car, (c) => c.ownerType) },
      { key: 'originCountry', label: 'Xuất xứ', cell: (car) => text(spec(car, 'originCountry')) },
      { key: 'color', label: 'Màu ngoại thất', cell: (car) => text(spec(car, 'color')) },
      { key: 'interiorColor', label: 'Màu nội thất', cell: (car) => text(spec(car, 'interiorColor')) },
    ],
  },
  {
    key: 'engine',
    title: 'Động cơ và vận hành',
    rows: [
      { key: 'fuelType', label: 'Nhiên liệu', cell: (car) => enumCell(FUEL_TYPE_LABEL)(car, (c) => c.fuelType) },
      { key: 'transmission', label: 'Hộp số', cell: (car) => enumCell(TRANSMISSION_LABEL)(car, (c) => c.transmission) },
      { key: 'driveType', label: 'Dẫn động', cell: (car) => enumCell(DRIVE_TYPE_LABEL)(car, (c) => c.driveType) },
      { key: 'engineDisplacementCC', label: 'Dung tích động cơ', cell: (car) => text(spec(car, 'engineDisplacementCC'), withUnit('cc')) },
      { key: 'horsePower', label: 'Công suất', cell: (car) => text(spec(car, 'horsePower'), withUnit('HP')) },
      { key: 'torqueNm', label: 'Mô-men xoắn', cell: (car) => text(spec(car, 'torqueNm'), withUnit('Nm')) },
      { key: 'fuelConsumption', label: 'Mức tiêu hao nhiên liệu', cell: (car) => text(spec(car, 'fuelConsumption'), withUnit('L/100km')) },
    ],
  },
  {
    key: 'seats',
    title: 'Chỗ ngồi',
    rows: [
      { key: 'numberOfSeats', label: 'Số chỗ ngồi', cell: (car) => text(spec(car, 'numberOfSeats'), withUnit('chỗ')) },
      { key: 'numberOfDoors', label: 'Số cửa', cell: (car) => text(spec(car, 'numberOfDoors'), withUnit('cửa')) },
    ],
  },
  {
    key: 'safety',
    title: 'An toàn và tiện nghi',
    rows: [
      { key: 'safetyRating', label: 'Đánh giá an toàn', cell: (car) => text(spec(car, 'safetyRating')) },
      { key: 'features', label: 'Tiện nghi', cell: (car) => listCell(spec(car, 'features')) },
    ],
  },
]

/**
 * Dựng các nhóm hàng cho danh sách xe (đúng thứ tự cột).
 * Mỗi hàng: { key, label, cells: [{ text, items? }] }.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F13
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F22
 */
export function buildRows(cars) {
  const list = Array.isArray(cars) ? cars : []
  return GROUPS.map((group) => ({
    key: group.key,
    title: group.title,
    rows: group.rows.map((row) => ({ key: row.key, label: row.label, cells: list.map((car) => row.cell(car)) })),
  }))
}

// Khóa so sánh của một ô: danh sách so không phụ thuộc thứ tự.
const compareKey = (cell) => (cell.items ? [...cell.items].sort().join('|') : cell.text)

/**
 * Hàng có khác biệt giữa các xe hay không (dùng cho công tắc "Chỉ hiện điểm khác biệt").
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F21
 */
export function isDifferent(row) {
  return new Set(row.cells.map(compareKey)).size > 1
}

/**
 * Giữ các hàng khác biệt và bỏ nhóm không còn hàng nào.
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F21
 */
export function onlyDifferences(groups) {
  return groups
    .map((group) => ({ ...group, rows: group.rows.filter(isDifferent) }))
    .filter((group) => group.rows.length > 0)
}
