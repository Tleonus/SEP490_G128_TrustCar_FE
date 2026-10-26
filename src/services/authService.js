import api from './api'
import { saveToken, clearToken } from '../utils/tokenStorage'

export { getToken, saveToken, clearToken } from '../utils/tokenStorage'

// --- CẦN BACKEND XÁC NHẬN ---
// POST /auth/login { email, password } -> { token, user }
export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  if (data?.token) saveToken(data.token)
  return data
}

export function logout() {
  clearToken()
}
