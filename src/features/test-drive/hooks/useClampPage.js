import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Trang hiện tại vừa hết dữ liệu (ví dụ xử lý xong dòng cuối) thì về trang cuối còn dữ liệu,
 * tránh hiện "không có lịch" trong khi các trang trước vẫn còn.
 */
export function useClampPage({ loading, error, data }, page) {
  const [searchParams, setSearchParams] = useSearchParams()
  const isPastEnd = !loading && !error && data?.items.length === 0 && page > 1

  useEffect(() => {
    if (!isPastEnd) return
    const next = new URLSearchParams(searchParams)
    if (data.totalPages > 1) next.set('page', String(data.totalPages))
    else next.delete('page')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPastEnd])
}
