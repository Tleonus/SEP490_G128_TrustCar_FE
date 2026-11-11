import { useEffect, useState } from 'react'

/**
 * Tải dữ liệu mỗi khi `key` đổi; kết quả của lần gọi cũ bị bỏ qua nên không ghi đè dữ liệu mới.
 * @param {() => Promise<any>} loader
 * @param {string} key  Chuỗi đại diện cho tham số và lần làm mới. null thì không tải.
 */
export function useAsyncResource(loader, key) {
  const [state, setState] = useState({ data: null, loading: key !== null, error: null })

  useEffect(() => {
    if (key === null) {
      // Không có tham số hợp lệ thì bỏ dữ liệu cũ, tránh hiện kết quả của tham số trước đó.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ data: null, loading: false, error: null })
      return undefined
    }
    let active = true
    setState((current) => ({ ...current, loading: true, error: null }))
    loader()
      .then((data) => { if (active) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (active) setState({ data: null, loading: false, error }) })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
