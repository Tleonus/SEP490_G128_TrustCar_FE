import { create } from 'zustand'
import {
  getToken,
  saveToken,
  clearToken,
  getRefreshToken,
  saveRefreshToken,
  clearRefreshToken,
  saveUser,
  getUser,
  clearUser,
  login as loginApi,
  googleSignIn as googleSignInApi,
  logout as logoutApi,
} from '../services/authService'

function extractSession(responseData) {
  const payload = responseData?.data ?? responseData
  return {
    token: payload?.accessToken || payload?.token,
    refreshToken: payload?.refreshToken,
    user: payload?.user,
  }
}

export const useAuthStore = create((set) => ({
  token: getToken(),
  refreshToken: getRefreshToken(),
  user: getUser(),             // khởi tạo từ localStorage
  isAuthenticated: Boolean(getToken()) && Boolean(getUser()),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      // loginApi gọi POST /auth/login, axios trả về res.data
      // Backend response shape: { success: true, data: { user, accessToken, refreshToken } }
      const responseData = await loginApi(credentials)
      console.log('[AuthStore] 📦 Raw response từ authService:', responseData)

      // Hỗ trợ cả 2 cấu trúc: data thẳng hoặc data.data (wrapped)
      const { token, refreshToken, user } = extractSession(responseData)

      if (!token) {
        throw new Error('Không tìm thấy accessToken trong response của API')
      }
      if (!user) {
        throw new Error('Không tìm thấy user trong response của API')
      }

      // Lưu vào localStorage
      saveToken(token)
      saveRefreshToken(refreshToken)
      saveUser(user)

      // Cập nhật Zustand store
      set({ token, refreshToken, user, isAuthenticated: true, loading: false, error: null })
      console.log('[AuthStore] ✅ Đăng nhập thành công, isAuthenticated = true, roleName =', user.roleName)
      return true

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      set({ loading: false, error: message })
      return false
    }
  },

  googleLogin: async (idToken) => {
    set({ loading: true, error: null })
    try {
      const responseData = await googleSignInApi(idToken)
      const { token, refreshToken, user } = extractSession(responseData)
      if (!token || !user) throw new Error('Google sign-in không trả về đủ thông tin phiên')

      saveToken(token)
      saveRefreshToken(refreshToken)
      saveUser(user)
      set({ token, refreshToken, user, isAuthenticated: true, loading: false, error: null })
      return user
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Đăng nhập Google thất bại.'
      set({ loading: false, error: message })
      return null
    }
  },

  updateUser: (user) => {
    saveUser(user)
    set({ user })
  },

  logout: async () => {
    // Xoá phiên local ngay để giao diện đăng xuất tức thì, không phải chờ server.
    const token = getToken()
    clearToken()
    clearRefreshToken()
    clearUser()
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false })
    if (!token) return
    try {
      await logoutApi(token) // thu hồi phiên phía server
    } catch {
      // Server lỗi hoặc token đã hết hạn: phiên local đã xoá, bỏ qua.
    }
  },
}))
