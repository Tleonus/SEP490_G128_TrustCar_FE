import { useState } from 'react'
import { searchCustomers } from '../api/appointmentApi'
import { isSearchable, makeLatest } from '../utils/latest'

const IDLE = { status: 'idle', items: [], error: null }

/**
 * Tìm khách có tài khoản khi nhân viên chủ động gửi (từ khóa ≥ 3 ký tự). Mỗi lần gửi có số thứ tự; chỉ phản hồi
 * của lần gửi MỚI NHẤT được ghi vào trạng thái, phản hồi cũ đến sau bị bỏ (FA17).
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F35
 * @returns {{ search: { status: 'idle'|'loading'|'success'|'error', items: object[], error: object|null }, runSearch: (query: string) => Promise<void> }}
 */
export function useCustomerSearch() {
  const [latest] = useState(makeLatest)
  const [search, setSearch] = useState(IDLE)

  async function runSearch(query) {
    if (!isSearchable(query)) return
    const token = latest.next()
    setSearch({ status: 'loading', items: [], error: null })
    try {
      const items = await searchCustomers(query)
      if (latest.isCurrent(token)) setSearch({ status: 'success', items, error: null })
    } catch (error) {
      if (latest.isCurrent(token)) setSearch({ status: 'error', items: [], error })
    }
  }

  return { search, runSearch }
}
