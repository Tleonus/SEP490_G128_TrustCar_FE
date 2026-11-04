// Phân loại lỗi tải dữ liệu chứng nhận thành các trạng thái giao diện.

export const CERT_ERROR = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK: 'NETWORK',
})

const COPY = {
  [CERT_ERROR.UNAUTHORIZED]: {
    title: 'Phiên đăng nhập đã hết hạn',
    message: 'Vui lòng đăng nhập lại để tiếp tục quản lý chứng nhận.',
  },
  [CERT_ERROR.FORBIDDEN]: {
    title: 'Không có quyền truy cập',
    message: 'Chỉ tài khoản Quản trị viên hoặc Nhân viên kinh doanh được xem chứng nhận CPO.',
  },
  [CERT_ERROR.NOT_FOUND]: {
    title: 'Không tìm thấy chứng nhận',
    message: 'Xe không tồn tại, chưa được cấp chứng nhận hoặc không còn báo cáo công khai.',
  },
  [CERT_ERROR.NETWORK]: {
    title: 'Không thể tải dữ liệu',
    message: 'Kết nối tới máy chủ gặp sự cố. Vui lòng thử lại.',
  },
}

/**
 * @param {unknown} error  Lỗi axios (hoặc lỗi bất kỳ).
 * @returns {{ kind: string, title: string, message: string, retryable: boolean }}
 */
export function classifyCertificateError(error) {
  const status = error?.response?.status
  let kind = CERT_ERROR.NETWORK
  if (status === 401) kind = CERT_ERROR.UNAUTHORIZED
  else if (status === 403) kind = CERT_ERROR.FORBIDDEN
  else if (status === 404) kind = CERT_ERROR.NOT_FOUND
  return { kind, ...COPY[kind], retryable: kind === CERT_ERROR.NETWORK }
}
