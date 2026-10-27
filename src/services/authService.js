import api from './api'

// Re-export tất cả helper từ tokenStorage để các module khác import một chỗ
export { getToken, saveToken, clearToken, saveUser, getUser, clearUser } from '../utils/tokenStorage'

/**
 * POST /api/v1/auth/login
 * Backend trả về envelope:
 *   { success: true, message: '...', data: { user, accessToken, refreshToken } }
 *
 * Hàm này trả về res.data (toàn bộ envelope) để useAuthStore tự parse
 * → Store sẽ đọc data.data.accessToken và data.data.user
 */
export async function login(credentials) {
  console.log('[authService] 📡 Gọi POST /auth/login với email:', credentials.email)
  const res = await api.post('/auth/login', credentials)
  console.log('[authService] 📥 HTTP status:', res.status)
  console.log('[authService] 📥 res.data (full envelope):', res.data)
  // Trả về toàn bộ res.data để store quyết định cách parse
  return res.data
}

export function logout() {
  // Gọi API revoke token nếu backend có endpoint; hiện tại chỉ xóa local
  // await api.post('/auth/logout').catch(() => {})
  console.log('[authService] 🚪 logout() được gọi')
}
