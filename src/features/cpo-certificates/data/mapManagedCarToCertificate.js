/**
 * Chuyển xe của khu quản trị (GET /manage/cars) thành một dòng chứng nhận.
 *
 * Xe không lưu ngày cấp; mã CPO có dạng CPO-YYYYMMDD-XXXX nên ngày cấp lấy từ phần ngày trong mã
 * (00:00 giờ Việt Nam). Số km để null: car.mileage là số người bán khai báo, không phải số km
 * đọc tại kiểm định, nên không được hiển thị như "số km xác nhận".
 */

const CODE_DATE = /^CPO-(\d{4})(\d{2})(\d{2})-/

/**
 * @param {string|null|undefined} certificateId
 * @returns {string|null} ISO date, hoặc null nếu mã không đúng định dạng.
 */
export function issuedAtFromCertificateId(certificateId) {
  const match = CODE_DATE.exec(certificateId || '')
  if (!match) return null
  const [, year, month, day] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00+07:00`)
  if (Number.isNaN(date.getTime())) return null // tháng/ngày ngoài khoảng, ví dụ 20261332
  // Ngày không tồn tại như 30/02 có thể bị cuộn sang tháng sau: so lại với chuỗi gốc.
  const roundTrip = new Date(date.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)
  return roundTrip === `${year}-${month}-${day}` ? date.toISOString() : null
}

/**
 * Chỉ lấy trường cần cho danh sách; VIN, biển số, giá sàn... của xe bị bỏ tại đây.
 * @param {object} car  Car từ /manage/cars.
 * @returns {import('../constants/cpoCertificateConstants').CertificateListItem}
 */
export function toCertificateListItem(car) {
  return {
    carId: car._id,
    vehicleCode: car.vehicleCode ?? null,
    certificateId: car.cpoCertificateId,
    issuedAt: issuedAtFromCertificateId(car.cpoCertificateId),
    carStatus: car.status,
    vehicle: {
      make: car.make ?? null,
      model: car.model ?? null,
      variant: car.variant ?? null,
      color: car.specifications?.color ?? null,
      year: car.year ?? null,
      mileage: null,
    },
  }
}
