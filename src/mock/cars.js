import sedan1 from '../assets/cars/sedan1.jpg'
import sedan2 from '../assets/cars/sedan2.jpg'
import suv1 from '../assets/cars/suv1.jpg'
import suv2 from '../assets/cars/suv2.jpg'
import hatchback1 from '../assets/cars/hatchback1.jpg'
import pickup1 from '../assets/cars/pickup1.jpg'

// Dữ liệu mẫu theo bảng Car + Car Image (ERD). KHÔNG phải dữ liệu thật từ MongoDB.
// Cố ý không có floor_price, original_price, aging_category, inventory_type, import_date:
// đây là trường nội bộ (floor_price chỉ ADMIN xem), trang public không được nhận.

function images(stockCode, urls) {
  return urls.map((url, index) => ({
    image_id: `${stockCode}-${index + 1}`,
    stock_code: stockCode,
    image_url: url,
    caption: null,
    display_order: index + 1,
    is_cover: index === 0,
  }))
}

function car(data) {
  return {
    plate_number: null,
    drive_type: null,
    engine_capacity: null,
    fuel_consumption: null,
    interior_colour: null,
    origin: null,
    key_equipment: null,
    is_featured: false,
    status: 'available',
    ...data,
    images: images(data.stock_code, data.images),
  }
}

export const MOCK_CARS = [
  car({
    stock_code: 'TC-0001', model_id: 'toyota-camry', vin: 'MR0BA3CD100000001', variant: '2.5Q',
    manufacturing_year: 2021, mileage_km: 32000, fuel_type: 'gasoline', transmission: 'automatic',
    drive_type: 'FWD', engine_capacity: '2.5L', fuel_consumption: '7.5L/100km',
    exterior_colour: 'Đen', interior_colour: 'Nâu', seats: 5, origin: 'Nhập khẩu Thái Lan',
    key_equipment: ['Toyota Safety Sense', 'Ghế da chỉnh điện', 'Cửa sổ trời'],
    listed_price: 950000000, is_featured: true, listed_date: '2026-09-02',
    images: [sedan1, sedan2],
    condition_description: 'Một đời chủ, xe gia đình sử dụng giữ gìn, bảo dưỡng định kỳ đầy đủ tại hãng.',
  }),
  car({
    stock_code: 'TC-0002', model_id: 'ford-everest', vin: 'MNCBXXMAWBNA00002', variant: 'Titanium 2.0L 4x4',
    manufacturing_year: 2022, mileage_km: 18000, fuel_type: 'diesel', transmission: 'automatic',
    drive_type: '4WD', engine_capacity: '2.0L Bi-Turbo', exterior_colour: 'Trắng', seats: 7,
    origin: 'Nhập khẩu Thái Lan', key_equipment: ['Camera 360', 'Cảm biến va chạm', 'Cốp điện'],
    listed_price: 1250000000, is_featured: true, listed_date: '2026-09-10',
    images: [suv1, suv2],
    condition_description: '7 chỗ, máy dầu tiết kiệm, khung gầm vững chắc phù hợp gia đình đi xa.',
  }),
  car({
    stock_code: 'TC-0003', model_id: 'hyundai-accent', vin: 'MALC381CBLM000003', variant: '1.4 AT',
    manufacturing_year: 2020, mileage_km: 45000, fuel_type: 'gasoline', transmission: 'automatic',
    engine_capacity: '1.4L', exterior_colour: 'Bạc', seats: 5, origin: 'Lắp ráp trong nước',
    listed_price: 468000000, is_featured: true, listed_date: '2026-08-21',
    images: [sedan2, sedan1],
    condition_description: 'Bản đủ, máy êm số mượt, tiết kiệm nhiên liệu, phù hợp di chuyển trong thành phố.',
  }),
  car({
    stock_code: 'TC-0004', model_id: 'peugeot-3008', vin: 'VF3MCYHZRMS000004', variant: 'GT Line',
    manufacturing_year: 2021, mileage_km: 27000, fuel_type: 'gasoline', transmission: 'automatic',
    engine_capacity: '1.6L Turbo', exterior_colour: 'Xám', seats: 5, origin: 'Lắp ráp trong nước',
    key_equipment: ['i-Cockpit', 'Đèn LED', 'Cốp điện'],
    listed_price: 899000000, is_featured: true, listed_date: '2026-09-15',
    images: [suv2, suv1],
    condition_description: 'Thiết kế Pháp sang trọng, nội thất i-Cockpit, vận hành êm ái.',
  }),
  car({
    stock_code: 'TC-0005', model_id: 'vinfast-lux-a', vin: 'RLLV1A2B3LH000005', variant: 'Premium',
    manufacturing_year: 2020, mileage_km: 38000, fuel_type: 'gasoline', transmission: 'automatic',
    drive_type: 'RWD', engine_capacity: '2.0L Turbo', exterior_colour: 'Đỏ', seats: 5,
    origin: 'Lắp ráp trong nước', key_equipment: ['6 túi khí', 'Ghế da'],
    listed_price: 620000000, is_featured: true, listed_date: '2026-08-30',
    images: [sedan1, suv1],
    condition_description: 'Động cơ bản quyền BMW, khung thân chắc chắn, trang bị an toàn 6 túi khí.',
  }),
  car({
    stock_code: 'TC-0006', model_id: 'mercedes-c200', vin: 'RLMWC2048KV000006', variant: 'Exclusive',
    manufacturing_year: 2019, mileage_km: 42000, fuel_type: 'gasoline', transmission: 'automatic',
    drive_type: 'RWD', engine_capacity: '1.5L Turbo', exterior_colour: 'Đen', interior_colour: 'Be',
    seats: 5, origin: 'Lắp ráp trong nước', key_equipment: ['Da Nappa', 'COMAND Online'],
    listed_price: 1150000000, is_featured: true, listed_date: '2026-09-05',
    images: [sedan2, sedan1],
    condition_description: 'Sang trọng, nội thất bọc da Nappa, bảo dưỡng tại hãng đầy đủ.',
  }),
  car({
    stock_code: 'TC-0007', model_id: 'kia-seltos', vin: 'RNYSP81BAMC000007', variant: '1.4 Premium',
    manufacturing_year: 2022, mileage_km: 15000, fuel_type: 'gasoline', transmission: 'automatic',
    engine_capacity: '1.4L Turbo', exterior_colour: 'Cam', seats: 5, origin: 'Lắp ráp trong nước',
    listed_price: 650000000, is_featured: true, listed_date: '2026-09-20',
    images: [suv1, suv2],
    condition_description: 'Thiết kế trẻ trung năng động, phù hợp khách hàng mua xe lần đầu.',
  }),
  car({
    stock_code: 'TC-0008', model_id: 'toyota-vios', vin: 'MR2B29F30M1000008', variant: '1.5G CVT',
    manufacturing_year: 2021, mileage_km: 29000, fuel_type: 'gasoline', transmission: 'cvt',
    engine_capacity: '1.5L', exterior_colour: 'Trắng', seats: 5, origin: 'Lắp ráp trong nước',
    listed_price: 478000000, is_featured: true, listed_date: '2026-09-08',
    images: [hatchback1, sedan1],
    condition_description: 'Xe gia đình đi kỹ, máy móc nguyên bản, nội thất còn mới.',
  }),
  car({
    stock_code: 'TC-0009', model_id: 'ford-ranger', vin: 'MNCLMFF80MW000009', variant: 'Wildtrak 2.0L 4x4',
    manufacturing_year: 2021, mileage_km: 33000, fuel_type: 'diesel', transmission: 'automatic',
    drive_type: '4WD', engine_capacity: '2.0L Bi-Turbo', exterior_colour: 'Xanh', seats: 5,
    origin: 'Nhập khẩu Thái Lan', listed_price: 899000000, listed_date: '2026-09-12',
    images: [pickup1, suv1],
    condition_description: 'Bán tải mạnh mẽ, thùng sau rộng, vừa kinh doanh vừa đi gia đình.',
  }),
  car({
    stock_code: 'TC-0010', model_id: 'hyundai-tucson', vin: 'MALJ381CBLM000010', variant: '2.0 AT Đặc biệt',
    manufacturing_year: 2020, mileage_km: 41000, fuel_type: 'gasoline', transmission: 'automatic',
    engine_capacity: '2.0L', exterior_colour: 'Bạc', seats: 5, origin: 'Lắp ráp trong nước',
    listed_price: 745000000, listed_date: '2026-08-25',
    images: [suv2, suv1],
    condition_description: 'Vận hành ổn định, không gian rộng, hồ sơ bảo dưỡng rõ ràng.',
  }),
  car({
    stock_code: 'TC-0011', model_id: 'vinfast-fadil', vin: 'RLLH1A2B3MH000011', variant: 'Plus',
    manufacturing_year: 2021, mileage_km: 24000, fuel_type: 'gasoline', transmission: 'cvt',
    engine_capacity: '1.4L', exterior_colour: 'Vàng', seats: 5, origin: 'Lắp ráp trong nước',
    listed_price: 335000000, listed_date: '2026-09-18',
    images: [hatchback1, sedan2],
    condition_description: 'Nhỏ gọn linh hoạt, tiết kiệm nhiên liệu, chi phí bảo dưỡng thấp.',
  }),
  car({
    stock_code: 'TC-0012', model_id: 'kia-cerato', vin: 'RNYB541BAKC000012', variant: '1.6 AT Deluxe',
    manufacturing_year: 2019, mileage_km: 52000, fuel_type: 'gasoline', transmission: 'automatic',
    engine_capacity: '1.6L', exterior_colour: 'Xám', seats: 5, origin: 'Lắp ráp trong nước',
    listed_price: 489000000, listed_date: '2026-08-15',
    images: [sedan1, sedan2],
    condition_description: 'Vận hành bền bỉ, nội thất rộng, thiết kế thể thao.',
  }),
]
