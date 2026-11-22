import { useCallback, useMemo, useState } from 'react'
import { computeInstallment } from '../utils/installmentMath'
import { validateInput } from '../utils/installmentInput'

/**
 * Trạng thái nhập của trang "Tính trả góp" và kết quả suy ra. Không gọi mạng, không lưu trình duyệt.
 * `result` là `null` khi giá xe hoặc lãi suất chưa hợp lệ (không bao giờ hiện số sai).
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F04
 * @param {object} initial  Giá trị ban đầu (xem `initialInput`).
 */
export function useInstallment(initial) {
  const [values, setValues] = useState(initial)
  const setField = useCallback((name, value) => setValues((prev) => ({ ...prev, [name]: value })), [])
  const checked = useMemo(() => validateInput(values), [values])
  const result = useMemo(() => (checked.ok ? computeInstallment(checked.value) : null), [checked])
  return { values, setField, errors: checked.errors, result, input: checked.value }
}
