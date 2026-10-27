const TOKEN_KEY = 'trustcar_token'

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
  } catch {
    /* localStorage không khả dụng */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* localStorage không khả dụng */
  }
}
