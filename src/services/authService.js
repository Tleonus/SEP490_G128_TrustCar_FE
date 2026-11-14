import api from './api'

// Re-export tất cả helper từ tokenStorage để các module khác import một chỗ
export {
  getToken,
  saveToken,
  clearToken,
  getRefreshToken,
  saveRefreshToken,
  clearRefreshToken,
  saveUser,
  getUser,
  clearUser,
} from '../utils/tokenStorage'

/**
 * POST /api/v1/auth/login
 * Backend trả về envelope:
 *   { success: true, message: '...', data: { user, accessToken, refreshToken } }
 *
 * Hàm này trả về res.data (toàn bộ envelope) để useAuthStore tự parse
 * → Store sẽ đọc data.data.accessToken và data.data.user
 */
export async function login(credentials) {
  const res = await api.post('/auth/login', credentials)
  return res.data
}

export async function register(payload) {
  const res = await api.post('/auth/register', payload)
  return res.data
}

export async function googleSignIn(idToken) {
  const res = await api.post('/auth/google', { idToken })
  return res.data
}

export async function completeProfile(payload) {
  const res = await api.patch('/auth/complete-profile', payload)
  return res.data
}

export async function forgotPassword(email) {
  const res = await api.post('/auth/forgot-password', { email })
  return res.data
}

export async function resetPassword(payload) {
  const res = await api.post('/auth/reset-password', payload)
  return res.data
}

export async function changePassword(payload) {
  const res = await api.patch('/auth/change-password', payload)
  return res.data
}

export async function refreshToken(refreshTokenValue) {
  const res = await api.post('/auth/refresh', { refreshToken: refreshTokenValue })
  return res.data
}

// Nhận token truyền vào vì phiên local có thể đã bị xoá trước khi request được gửi.
export async function logout(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined
  const res = await api.post('/auth/logout', null, { headers, timeout: 5000 })
  return res.data
}
