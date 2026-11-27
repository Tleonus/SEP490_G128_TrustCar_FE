import { useEffect, useState } from 'react'
import { fetchLoanSettings } from '../api/loanSettingsApi'
import { FALLBACK_CONFIG, normalizeLoanSettings } from '../utils/loanConfig'

/**
 * Cấu hình trả góp do admin đặt (ngân hàng, lãi, trả trước tối thiểu, thời hạn). Trả ngay cấu hình dự phòng,
 * rồi thay bằng số của máy chủ khi tải xong; máy chủ lỗi → giữ dự phòng (`failed: true`), trang vẫn tính được.
 * @returns {{ config: import('../utils/loanConfig').LoanConfig, loading: boolean, failed: boolean }}
 */
export function useLoanSettings() {
  const [state, setState] = useState({ config: FALLBACK_CONFIG, loading: true, failed: false })

  useEffect(() => {
    let active = true
    fetchLoanSettings()
      .then((raw) => { if (active) setState({ config: normalizeLoanSettings(raw), loading: false, failed: false }) })
      .catch(() => { if (active) setState({ config: FALLBACK_CONFIG, loading: false, failed: true }) })
    return () => { active = false }
  }, [])

  return state
}
