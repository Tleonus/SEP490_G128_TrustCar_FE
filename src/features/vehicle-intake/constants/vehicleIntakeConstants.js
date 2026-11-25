export const vehicleInspectionCriteria = [
  {
    id: 'chassis',
    number: '01',
    title: 'Khung gầm không tai nạn / đâm đụng',
    shortTitle: 'Khung gầm',
    hint: 'Kiểm tra dấu vết sửa chữa, lệch khung và mối hàn bất thường.',
    icon: 'frame',
  },
  {
    id: 'engine',
    number: '02',
    title: 'Động cơ & Hộp số nguyên bản',
    shortTitle: 'Động cơ & Hộp số',
    hint: 'Đối chiếu số máy, tình trạng vận hành và lịch sử bảo dưỡng.',
    icon: 'engine',
  },
  {
    id: 'flood',
    number: '03',
    title: 'Không ngập nước / Thủy kích',
    shortTitle: 'Ngập nước / Thủy kích',
    hint: 'Quan sát khoang nội thất, chân giắc và các điểm oxy hóa.',
    icon: 'water',
  },
  {
    id: 'odometer',
    number: '04',
    title: 'Số km chuẩn, không tua ODO',
    shortTitle: 'ODO & Số km',
    hint: 'Đối chiếu dữ liệu ECU, lịch sử dịch vụ và số km hiển thị.',
    icon: 'gauge',
  },
  {
    id: 'safety',
    number: '05',
    title: 'Hệ thống điện & An toàn hoạt động tốt',
    shortTitle: 'Điện & An toàn',
    hint: 'Test đèn, túi khí, cảm biến, phanh và các tính năng hỗ trợ lái.',
    icon: 'shield',
  },
];

export const initialVehicleIntake = {
  licensePlate: '',
  vin: '',
  brand: '',
  model: '',
  year: '',
  mileage: '',
  transmission: 'automatic',
  fuel: 'gasoline',
  ownership: 'company',
  listedPrice: '',
  floorPrice: '',
  marketPrice: '',
  bodyType: '',
  numberOfSeats: '',
  exteriorColor: '',
  interiorColor: '',
};

// Giá trị khớp enum BodyType ở Backend (appConstants.js).
export const BODY_TYPE_OPTIONS = Object.freeze([
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'MPV', label: 'MPV' },
  { value: 'PICKUP', label: 'Bán tải' },
  { value: 'COUPE', label: 'Coupe' },
  { value: 'CONVERTIBLE', label: 'Mui trần (Convertible)' },
  { value: 'WAGON', label: 'Wagon' },
  { value: 'VAN', label: 'Van' },
  { value: 'MINIVAN', label: 'Minivan' },
]);

export const initialInspectionChecks = {
  chassis: false,
  engine: false,
  flood: false,
  odometer: false,
  safety: false,
};
