/**
 * Gọi API ảnh xe (Backend đã có, routes/carRoutes.js):
 *  - GET    /manage/cars/:id/images     -> không có; dùng GET /manage/cars/:id để lấy images[]
 *  - POST   /manage/cars/:id/images     field "images" (tối đa 10 file/lần), quyền car:image_manage
 *                                      body setFirstAsPrimary=true -> ảnh đầu tiên thành ảnh chính
 *  - DELETE /manage/cars/:id/images/:imageId  quyền car:image_manage
 *
 * Backend KHÔNG có endpoint lưu "ảnh chia sẻ mạng xã hội" (social-image) và model Car không có
 * trường socialImage ghi được — nên FE dùng ảnh chính (isPrimary) trong gallery làm ảnh chia sẻ.
 */

import api from '../../../services/api'

const UPLOAD_TIMEOUT_MS = 60000

/** Chi tiết xe kèm images[] và các trường cần cho phần xem trước bài đăng. */
export async function getCarDetail(carId) {
  const { data } = await api.get(`/manage/cars/${encodeURIComponent(carId)}`)
  return data?.data ?? null
}

/**
 * Upload nhiều ảnh trong một request.
 * @param {string} carId
 * @param {File[]} files tối đa 10 file
 * @param {{ setFirstAsPrimary?: boolean }} [options]
 * @returns {Promise<Array>} images[] sau khi upload
 */
export async function uploadCarImages(carId, files, { setFirstAsPrimary = false } = {}) {
  const form = new FormData()
  files.forEach((file) => form.append('images', file))
  form.append('setFirstAsPrimary', String(Boolean(setFirstAsPrimary)))

  const { data } = await api.post(`/manage/cars/${encodeURIComponent(carId)}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  })
  return data?.data?.images ?? []
}

/**
 * Xoá một ảnh khỏi gallery. Nếu ảnh là ảnh chính, Backend tự nâng ảnh kế tiếp làm ảnh chính.
 * @param {string} carId
 * @param {string} imageId _id của ảnh trong mảng images
 * @returns {Promise<Array>} images[] còn lại
 */
export async function deleteCarImage(carId, imageId) {
  const { data } = await api.delete(
    `/manage/cars/${encodeURIComponent(carId)}/images/${encodeURIComponent(imageId)}`,
  )
  return data?.data?.images ?? []
}
