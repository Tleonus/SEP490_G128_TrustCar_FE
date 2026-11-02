import api from './api'

// Backend thật (TrustCar-BE-Develop): /api/v1/manage/cars (yêu cầu đăng nhập + quyền car:read,
// cả role ADMIN và SALES_STAFF đều có quyền này - xem ROLE_PERMISSIONS trong appConstants.js).
// Khác với /public/cars: trả về TẤT CẢ trạng thái xe (INCOMING, MAINTENANCE, AVAILABLE, RESERVED,
// SOLD, DELISTED), không chỉ AVAILABLE - dùng cho màn quản trị kho xe (SCR-M03).
//
// Car (manage) có thêm các trường tồn kho thật trên schema: listedDate, daysInStock, agingCategory
// (FRESH | SLOW | STAGNANT - BE tự tính sẵn, FE không tính lại).
//
// carService.getCars (BE) nhận các query: page, limit, status, make, model, year, search, sortBy, sortDir.
// KHÔNG hỗ trợ: priceMin/priceMax, lọc theo agingCategory hoặc khoảng ngày tồn kho
// (xem mục "API/field còn thiếu" trong báo cáo cuối).
//
// Response envelope (sendPaginated): { success, message, data: Car[], meta: { page, limit, total, totalPages, hasNext, hasPrev } }

function unwrapList(data) {
  return {
    items: data?.data ?? [],
    total: data?.meta?.total ?? 0,
    page: data?.meta?.page ?? 1,
    limit: data?.meta?.limit ?? 10,
    totalPages: data?.meta?.totalPages ?? 1,
  }
}

export async function getAdminCars(params = {}) {
  const { data } = await api.get('/manage/cars', { params })
  return unwrapList(data)
}
