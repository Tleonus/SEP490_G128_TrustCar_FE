import { useEffect, useState } from 'react'
import { fetchVnpayPolicy } from '../api/depositApi'

const DISABLED = Object.freeze({ enabled: false, timeoutMinutes: 15 })

/**
 * KAN-99 – cổng VNPay đã được cấu hình trên backend chưa?
 *
 * `GET /deposits/vnpay-policy` trả `enabled: false` khi `.env` thiếu
 * VNPAY_TMN_CODE / VNPAY_HASH_SECRET / VNPAY_RETURN_URL (bản BE cũ trả 503
 * DEPOSIT_VNPAY_NOT_CONFIGURED — hook chấp nhận cả hai). Tắt thì FE ẩn lựa
 * chọn VNPay thay vì để khách bấm rồi nhận lỗi.
 */
export default function useVnpayPolicy() {
  const [policy, setPolicy] = useState(DISABLED)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchVnpayPolicy()
        if (cancelled || !data) return
        setPolicy({ enabled: Boolean(data.enabled), timeoutMinutes: data.timeoutMinutes ?? 15 })
      } catch {
        /* 503 = chưa cấu hình; giữ trạng thái tắt */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return policy
}
