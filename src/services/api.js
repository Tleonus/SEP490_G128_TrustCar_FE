import axios from 'axios'
import { getToken, saveToken, getRefreshToken, clearToken, clearRefreshToken } from '../utils/tokenStorage'

import { API_BASE_URL } from '../config/apiConfig';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const originalRequest = error.config
      const refreshToken = getRefreshToken()
      // Đăng xuất bị 401 thì không refresh rồi gọi lại: phiên local đã xoá, chỉ làm chậm.
      const isAuthRequest = ['/auth/login', '/auth/refresh', '/auth/logout'].some((path) => originalRequest?.url?.includes(path))

      if (refreshToken && !originalRequest?._retry && !isAuthRequest) {
        originalRequest._retry = true
        try {
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
          const nextToken = refreshResponse.data?.data?.accessToken
          if (nextToken) {
            saveToken(nextToken)
            originalRequest.headers.Authorization = `Bearer ${nextToken}`
            return api(originalRequest)
          }
        } catch {
          // Refresh thất bại: xoá phiên local và để request gốc reject.
        }
      }

      clearToken()
      clearRefreshToken()
    }
    return Promise.reject(error)
  }
)

export default api
