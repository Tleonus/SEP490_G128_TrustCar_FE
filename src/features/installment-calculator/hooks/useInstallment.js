import { useCallback, useMemo, useState } from 'react'
import { computeInstallment } from '../utils/installmentMath'
import { validateInput } from '../utils/installmentInput'
import { DEFAULT_RULES } from '../utils/loanConfig'

/**
 * Trạng thái nhập của trang "Tính trả góp" và kết quả suy ra. Không lưu trình duyệt.
 * `result` là `null` khi giá xe hoặc lãi suất chưa hợp lệ (không bao giờ hiện số sai).
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F04
 * @param {object|Function} initial  Giá trị ban đầu (xem `initialInput`).
 * @param {{ downMin: number, terms: number[] }} [rules]  Trả trước tối thiểu và thời hạn theo cấu hình admin.
 */
export function useInstallment(initial, rules = DEFAULT_RULES) {
  const [values, setValues] = useState(initial)
  const setField = useCallback((name, value) => setValues((prev) => ({ ...prev, [name]: value })), [])
  const setFields = useCallback((patch) => setValues((prev) => ({ ...prev, ...patch })), [])
  const checked = useMemo(() => validateInput(values, rules), [values, rules])
  const result = useMemo(() => (checked.ok ? computeInstallment(checked.value) : null), [checked])
  return { values, setField, setFields, errors: checked.errors, result, input: checked.value }
}
