/**
 * KAN-35 – Hook tải dữ liệu cho trang Tổng quan điều hành.
 *
 * Một lần gọi cho cả trang; mọi số liệu tính từ cùng một tập xe nên các thẻ KPI, biểu đồ
 * và bảng luôn khớp nhau (khác với gọi 4 API đếm riêng lẻ).
 */

import { useCallback, useEffect, useState } from 'react'
import { loadDashboardData } from '../api/dashboardApi'

/** Lỗi sang thông báo tiếng Việt. */
function dashboardErrorMessage(error) {
  const status = error?.response?.status
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (status === 403) return 'Bạn không có quyền xem số liệu tổng quan.'
  if (status >= 500) return 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  if (error?.code === 'ERR_NETWORK') return 'Không kết nối được máy chủ. Kiểm tra lại kết nối mạng.'
  return 'Không tải được số liệu tổng quan. Vui lòng thử lại.'
}

export function useDashboardData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)

    loadDashboardData()
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (!active) return
        setData(null)
        setError(dashboardErrorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return {
    cars: data?.cars ?? [],
    leads: data?.leads ?? [],
    leadsAvailable: data?.leadsAvailable ?? true,
    partial: data?.partial ?? false,
    carTotal: data?.total ?? 0,
    loading,
    error,
    reload,
  }
}

export default useDashboardData
