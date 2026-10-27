export const PRICE_RANGES = [
  { label: 'Dưới 500 triệu', min: 0, max: 500000000 },
  { label: '500 triệu - 1 tỷ', min: 500000000, max: 1000000000 },
  { label: '1 - 1.5 tỷ', min: 1000000000, max: 1500000000 },
  { label: 'Trên 1.5 tỷ', min: 1500000000, max: null },
]

export const BODY_TYPES = [
  { value: 'Sedan', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Hatchback', label: 'Hatchback' },
  { value: 'Bán tải', label: 'Bán tải' },
]

export const SORT_OPTIONS = [
  { value: '', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'year_desc', label: 'Năm sản xuất mới nhất' },
  { value: 'year_asc', label: 'Năm sản xuất cũ nhất' },
]

export const PAGE_SIZE = 9
