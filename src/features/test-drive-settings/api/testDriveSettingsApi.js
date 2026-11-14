import api from '../../../services/api'

// Cấu hình khung giờ lái thử nằm trong base-settings: /public/base-settings và /admin/base-settings.

export async function getPublicTestDriveSettings() {
  const { data } = await api.get('/public/base-settings')
  return data?.data?.testDrive
}

export async function getAdminTestDriveSettings() {
  const { data } = await api.get('/admin/base-settings')
  return data?.data?.testDrive
}

/**
 * PUT bắt buộc có đủ contact, businessHours và testDrive, nên đọc lại bản mới nhất ngay trước khi lưu
 * và chỉ đè các trường vừa sửa, để không ghi đè thay đổi của quản trị viên khác.
 * @param {object} changes  Các trường testDrive đã thay đổi trên form.
 */
export async function saveTestDriveSettings(changes) {
  const { data: current } = await api.get('/admin/base-settings')
  const { contact, businessHours, testDrive } = current?.data ?? {}
  const { data } = await api.put('/admin/base-settings', { contact, businessHours, testDrive: { ...testDrive, ...changes } })
  return data?.data?.testDrive
}
