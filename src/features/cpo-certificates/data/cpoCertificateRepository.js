import { getManagedCarSummary, getPublicInspectionReport, listAllManagedCars } from '../api/cpoCertificateApi'
import { toCertificateListItem } from './mapManagedCarToCertificate'
import { queryCertificates } from './queryCertificates'

/**
 * Lớp truy cập dữ liệu chứng nhận CPO. Giao diện chỉ gọi 2 hàm ở đây.
 *
 * Danh sách: BE chưa có API liệt kê chứng nhận, nên lấy mọi xe từ /manage/cars, giữ xe có
 * cpoCertificateId rồi tìm kiếm, lọc, sắp xếp, phân trang trong bộ nhớ.
 * Chi tiết: trạng thái xe (khu quản trị) + báo cáo công khai.
 */

/** @param {ReturnType<import('../utils/certificateListParams').parseCertificateListParams>} query */
export async function listCertificates(query) {
  const cars = await listAllManagedCars()
  const certificates = cars.filter((car) => car.cpoCertificateId).map(toCertificateListItem)
  return queryCertificates(certificates, query)
}

/**
 * Chứng nhận của một xe. Hai yêu cầu chạy song song.
 * Báo cáo công khai chỉ có khi xe APPROVED_CPO/AVAILABLE; xe đã bán, đang giữ chỗ hoặc ngừng bán
 * nhận 404, khi đó vẫn trả report = null để trang hiện mã và trạng thái thay vì báo không tìm thấy.
 *
 * @param {string} carId
 * @returns {Promise<{ summary: object, report: import('../constants/cpoCertificateConstants').PublicInspectionReport|null }>}
 */
export async function getCertificateDetail(carId) {
  const [summary, report] = await Promise.all([
    getManagedCarSummary(carId),
    getPublicInspectionReport(carId).catch((error) => {
      if (error?.response?.status === 404) return null
      throw error
    }),
  ])
  if (!summary.certificateId && !report) throw Object.assign(new Error('Not found'), { response: { status: 404 } })
  return { summary, report: report ?? null }
}
