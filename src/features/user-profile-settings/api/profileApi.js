import api from '../../../services/api'

// Gọi API hồ sơ (BE: API-PROFILE v1.0.0). Dùng axios `api` nên tự gắn Bearer token và làm mới token khi hết hạn.
// Không bắt lỗi: lỗi axios được ném lên cho hook phân loại bằng classifyProfileError.
// Không tự thử lại lệnh ghi (NFR-F02).

/**
 * Hồ sơ của chính tài khoản đang đăng nhập.
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F02
 * @returns {Promise<object>} DTO: { id, email, role, fullName, phone, address, dateOfBirth, gender, editableFields, createdAt }
 */
export async function fetchProfile(signal) {
  const response = await api.get('/profile', { signal })
  return response.data.data
}

/**
 * Sửa hồ sơ; `patch` chỉ gồm các trường đã đổi (buildPatch).
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F06
 * @returns {Promise<object>} hồ sơ sau khi cập nhật (cùng DTO với fetchProfile)
 */
export async function updateProfile(patch) {
  const response = await api.patch('/profile', patch)
  return response.data.data
}

/**
 * Cài đặt của khách (hiện chỉ có marketingConsent).
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F13
 * @returns {Promise<{ marketingConsent: boolean }>}
 */
export async function fetchSettings(signal) {
  const response = await api.get('/profile/settings', { signal })
  return response.data.data
}

/**
 * @ears .sdd/features/user-profile-settings/SPEC.md#REQ-F14
 * @param {{ marketingConsent: boolean }} settings
 * @returns {Promise<{ marketingConsent: boolean }>} giá trị server đã lưu
 */
export async function updateSettings({ marketingConsent }) {
  const response = await api.patch('/profile/settings', { marketingConsent })
  return response.data.data
}
