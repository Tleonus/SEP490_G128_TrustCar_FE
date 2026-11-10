import { useState } from 'react'
import { Alert, Button, Input, Skeleton } from 'antd'
import { classifyAppointmentError } from '../utils/appointmentErrors'
import { isSearchable } from '../utils/latest'
import { CUSTOMER_SEARCH_LIMIT, CUSTOMER_SEARCH_MIN_CHARS } from '../constants/testDriveConstants'
import styles from '../styles/StaffBooking.module.css'

/**
 * Bước 1 của "Đặt hộ khách": tìm khách có tài khoản theo tên, SĐT hoặc email. Chỉ tìm khi nhân viên bấm nút hoặc
 * nhấn Enter và từ khóa đủ dài (không tìm theo từng phím gõ). Hiện tên, SĐT, email để chọn đúng người.
 *
 * @ears .sdd/features/test-drive-booking/SPEC.md#REQ-F35
 * @param {{ status: 'idle'|'loading'|'success'|'error', items: object[], error: object|null }} search
 * @param {(query: string) => void} onSearch
 * @param {(customer: object) => void} onChoose
 */
export default function CustomerSearch({ search, onSearch, onChoose }) {
  const [query, setQuery] = useState('')
  const [tooShort, setTooShort] = useState(false)

  const submit = () => {
    const valid = isSearchable(query)
    setTooShort(!valid)
    if (valid) onSearch(query.trim())
  }

  return (
    <section className={styles.search} aria-label="Tìm khách hàng">
      <label className={styles.label} htmlFor="td-customer-q">Tìm khách (tên, số điện thoại hoặc email)</label>
      <Input.Search
        id="td-customer-q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onSearch={submit}
        enterButton="Tìm"
        loading={search.status === 'loading'}
        allowClear
        placeholder={`Nhập ít nhất ${CUSTOMER_SEARCH_MIN_CHARS} ký tự rồi bấm Tìm`}
      />
      {tooShort && <p className={styles.warn}>Hãy nhập ít nhất {CUSTOMER_SEARCH_MIN_CHARS} ký tự.</p>}

      {search.status === 'loading' && <Skeleton active paragraph={{ rows: 2 }} title={false} aria-busy="true" />}

      {search.status === 'error' && (
        <Alert
          type="error"
          showIcon
          message={classifyAppointmentError(search.error, {}, { audience: 'staff', newEndpoint: true }).message}
          action={<Button size="small" onClick={submit}>Thử lại</Button>}
        />
      )}

      {search.status === 'success' && search.items.length === 0 && (
        <p className={styles.hint}>Khách chưa có tài khoản, hãy yêu cầu đăng ký trước.</p>
      )}

      {search.status === 'success' && search.items.length > 0 && (
        <ul className={styles.results} aria-label="Kết quả tìm khách">
          {search.items.slice(0, CUSTOMER_SEARCH_LIMIT).map((customer) => (
            <li key={customer._id}>
              <button
                type="button"
                className={styles.customer}
                onClick={() => onChoose(customer)}
                aria-label={`Chọn khách ${customer.fullName}, ${customer.phone}`}
              >
                <span className={styles.name}>{customer.fullName}</span>
                <span>{customer.phone}</span>
                <span className={styles.sub}>{customer.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
