/**
 * KAN-66 – Lớp gọi API cho màn chọn ảnh chia sẻ mạng xã hội.
 *
 * Endpoint có thật trên Backend (đã đối chiếu routes/carRoutes.js và carController.js):
 *  - GET  /manage/cars/:id            chi tiết xe kèm images[] (quyền car:read)
 *  - POST /manage/cars/:id/images     upload ảnh xe (field "images", multipart; quyền car:image_manage)
 *                                     trả { data: { images } }
 *
 * Endpoint ticket yêu cầu nhưng Backend CHƯA có:
 *  - PATCH /manage/cars/:id/social-image
 *    Model Car cũng chưa có trường socialImage (KAN-64 chỉ đọc nếu có, không có API ghi).
 *    Hàm setSocialImage vẫn gọi đúng endpoint đó và để lỗi thật nổi lên — không giả lập thành công.
 */

import api from '../../../services/api'

/** Chi tiết xe (kèm danh sách ảnh). */
export async function getManagedCar(carId) {
  const { data } = await api.get(`/manage/cars/${encodeURIComponent(carId)}`)
  return data?.data ?? null
}

/**
 * Upload một ảnh mới vào gallery của xe.
 * Không đặt làm ảnh chính (setFirstAsPrimary=false) để không đổi ảnh đại diện hiện tại.
 * @param {string} carId
 * @param {File} file
 * @returns {Promise<Array>} danh sách ảnh của xe sau khi upload
 */
export async function uploadCarImage(carId, file) {
  const form = new FormData()
  form.append('images', file)
  form.append('setFirstAsPrimary', 'false')
  const { data } = await api.post(`/manage/cars/${encodeURIComponent(carId)}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return data?.data?.images ?? []
}

/**
 * Lưu ảnh chia sẻ mạng xã hội.
 * Backend chưa có endpoint này — lời gọi sẽ nhận 404 cho đến khi Backend bổ sung.
 * @param {string} carId
 * @param {{ url: string, imageId?: string|null }} payload
 */
export async function setSocialImage(carId, { url, imageId = null }) {
  const { data } = await api.patch(`/manage/cars/${encodeURIComponent(carId)}/social-image`, {
    url,
    imageId,
  })
  return data?.data ?? null
}
