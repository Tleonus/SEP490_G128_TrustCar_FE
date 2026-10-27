import { create } from 'zustand'
import { getToken, saveToken, clearToken, login as loginApi } from '../services/authService'

export const useAuthStore = create((set) => ({
  token: getToken(),
  user: null,
  isAuthenticated: Boolean(getToken()),
  loading: false,
  error: null,

  login: async (credentials) => {
    set({ loading: true, error: null })
    try {
      const data = await loginApi(credentials)
      saveToken(data.token)
      set({ token: data.token, user: data.user, isAuthenticated: true, loading: false })
      return true
    } catch (err) {
      const message =
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      set({ loading: false, error: message })
      return false
    }
  },

  logout: () => {
    clearToken()
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
