/**
 * KAN-98 — trạng thái trang xác thực chứng nhận.
 * Tách ra khỏi component để kiểm thử được trong môi trường node (không jsdom).
 *
 * verified  → hash hợp lệ, có tóm tắt.
 * notfound  → hash sai hoặc hết hạn (404).
 * error     → lỗi khác (mạng, 500).
 */

export const initialVerifyState = { status: 'loading', summary: null }

export const verifyReducer = (state, action) => {
  switch (action.type) {
    case 'reset':
      return initialVerifyState
    case 'verified':
      return { status: 'verified', summary: action.summary }
    case 'notfound':
      return { status: 'notfound', summary: null }
    case 'error':
      return { status: 'error', summary: null }
    default:
      return state
  }
}

/** Phân loại lỗi axios thành hành động reducer. */
export const actionForError = (error) => (
  error?.response?.status === 404 ? { type: 'notfound' } : { type: 'error' }
)
