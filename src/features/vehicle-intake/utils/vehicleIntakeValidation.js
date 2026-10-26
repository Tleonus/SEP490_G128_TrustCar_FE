export function validateVehicleIntake(car, currentYear = new Date().getFullYear()) {
  const nextErrors = {};
  if (!/^\d{2}[A-Z]{1,2}[-\s]?\d{3,5}(\.\d{2})?$/i.test(car.licensePlate.trim())) nextErrors.licensePlate = 'Nhập biển số dạng 51H-123.45';
  if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(car.vin.trim())) nextErrors.vin = 'VIN phải gồm đúng 17 ký tự';
  ['brand', 'model', 'year', 'mileage', 'listedPrice', 'floorPrice'].forEach((field) => {
    if (!String(car[field]).trim()) nextErrors[field] = 'Thông tin bắt buộc';
  });
  if (car.year && (Number(car.year) < 1990 || Number(car.year) > currentYear)) nextErrors.year = `Năm sản xuất từ 1990 đến ${currentYear}`;
  if (car.mileage && Number(car.mileage) < 0) nextErrors.mileage = 'Số km không hợp lệ';
  if (car.listedPrice && car.floorPrice && Number(car.floorPrice) > Number(car.listedPrice)) nextErrors.floorPrice = 'Giá sàn không được lớn hơn giá niêm yết';
  return nextErrors;
}
