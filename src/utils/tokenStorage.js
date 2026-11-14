const TOKEN_KEY = 'trustcar_token'
const REFRESH_TOKEN_KEY = 'trustcar_refresh_token'
const USER_KEY = 'trustcar_user'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch { /* localStorage may be unavailable in restricted browser contexts. */ }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch { /* localStorage may be unavailable in restricted browser contexts. */ }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveRefreshToken(token) {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch { /* localStorage may be unavailable in restricted browser contexts. */ }
}

export function clearRefreshToken() {
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  } catch { /* localStorage may be unavailable in restricted browser contexts. */ }
}

export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch { /* localStorage may be unavailable in restricted browser contexts. */ }
}

export function clearUser() {
  try {
    localStorage.removeItem(USER_KEY)
  } catch { /* localStorage may be unavailable in restricted browser contexts. */ }
}
