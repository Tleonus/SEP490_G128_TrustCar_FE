import { create } from 'zustand'
import { getToken, saveToken, clearToken, saveUser, getUser, clearUser, login as loginApi } from '../services/authService'

export const useAuthStore = create((set) => ({
  token: getToken(),
  user: getUser(),             // khởi tạo từ localStorage
  isAuthenticated: Boolean(getToken()) && Boolean(getUser()),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null })
    console.log('[AuthStore] 🔐 Bắt đầu đăng nhập với:', credentials.email)

    try {
      // loginApi gọi POST /auth/login, axios trả về res.data
      // Backend response shape: { success: true, data: { user, accessToken, refreshToken } }
      const responseData = await loginApi(credentials)
      console.log('[AuthStore] 📦 Raw response từ authService:', responseData)

      // Hỗ trợ cả 2 cấu trúc: data thẳng hoặc data.data (wrapped)
      const payload = responseData?.data ?? responseData
      const token   = payload?.accessToken || payload?.token
      const user    = payload?.user

      console.log('[AuthStore] 🪙 Token nhận được:', token ? `${token.slice(0,20)}...` : 'KHÔNG CÓ TOKEN')
      console.log('[AuthStore] 👤 User nhận được:', user)

      if (!token) {
        throw new Error('Không tìm thấy accessToken trong response của API')
      }
      if (!user) {
        throw new Error('Không tìm thấy user trong response của API')
      }

      // Lưu vào localStorage
      saveToken(token)
      saveUser(user)

      // Cập nhật Zustand store
      set({ token, user, isAuthenticated: true, loading: false, error: null })
      console.log('[AuthStore] ✅ Đăng nhập thành công, isAuthenticated = true, role =', user.role)
      return true

    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      console.error('[AuthStore] ❌ Lỗi đăng nhập:', message)
      set({ loading: false, error: message })
      return false
    }
  },

  logout: () => {
    clearToken()
    clearUser()
    set({ token: null, user: null, isAuthenticated: false })
    console.log('[AuthStore] 🚪 Đã đăng xuất, localStorage đã xóa')
  },
}))