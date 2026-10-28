const TOKEN_KEY = 'trustcar_token'
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
  } catch { }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch { }
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
  } catch { }
}

export function clearUser() {
  try {
    localStorage.removeItem(USER_KEY)
  } catch { }
}
