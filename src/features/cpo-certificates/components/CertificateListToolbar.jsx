import { useEffect, useState } from 'react'
import { Button, Input, Select } from 'antd'
import { ClearOutlined, SearchOutlined } from '@ant-design/icons'
import { useDebounce } from '../../../hooks/useDebounce'
import { CERT_SORT_OPTIONS, CERT_STATUS_FILTER_OPTIONS, DEFAULT_CERT_SORT } from '../constants/cpoCertificateConstants'
import styles from '../styles/CpoCertificatesPage.module.css'

/**
 * Tìm kiếm (mã CPO, mã xe, hãng, dòng), lọc trạng thái + ngày cấp, sắp xếp.
 * Mọi giá trị đọc/ghi qua URL bởi trang cha (onChange nhận khoá URL: q, status, from, to, sort).
 *
 * @param {{ query: ReturnType<import('../utils/certificateListParams').parseCertificateListParams>, onChange: (changes: object) => void }} props
 */
export default function CertificateListToolbar({ query, onChange }) {
  const [keyword, setKeyword] = useState(query.search)
  const debounced = useDebounce(keyword, 400)

  // Đồng bộ ô tìm kiếm khi URL đổi từ bên ngoài (nút Back, Xoá bộ lọc).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKeyword(query.search)
  }, [query.search])

  useEffect(() => {
    if (debounced.trim() !== query.search) onChange({ q: debounced.trim() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const hasFilters = Boolean(query.search || query.status || query.issuedFrom || query.issuedTo || query.sort !== DEFAULT_CERT_SORT)

  return (
    <div className={styles.toolbar}>
      <Input
        size="large"
        placeholder="Mã CPO, mã xe, hãng, dòng xe..."
        prefix={<SearchOutlined />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        allowClear
        maxLength={100}
        className={styles.search}
        aria-label="Tìm chứng nhận"
      />
      <Select
        size="large"
        placeholder="Tất cả trạng thái xe"
        value={query.status || undefined}
        onChange={(value) => onChange({ status: value })}
        options={CERT_STATUS_FILTER_OPTIONS}
        allowClear
        className={styles.select}
        aria-label="Lọc theo trạng thái xe"
      />
      <label className={styles.dateField}>
        <span>Cấp từ</span>
        <Input
          size="large"
          type="date"
          value={query.issuedFrom}
          max={query.issuedTo || undefined}
          onChange={(e) => onChange({ from: e.target.value })}
        />
      </label>
      <label className={styles.dateField}>
        <span>đến</span>
        <Input
          size="large"
          type="date"
          value={query.issuedTo}
          min={query.issuedFrom || undefined}
          onChange={(e) => onChange({ to: e.target.value })}
        />
      </label>
      <Select
        size="large"
        value={query.sort}
        onChange={(value) => onChange({ sort: value })}
        options={CERT_SORT_OPTIONS}
        className={styles.select}
        aria-label="Sắp xếp"
      />
      {hasFilters && (
        <Button
          size="large"
          icon={<ClearOutlined />}
          onClick={() => {
            setKeyword('')
            onChange({ q: '', status: '', from: '', to: '', sort: DEFAULT_CERT_SORT })
          }}
        >
          Xoá bộ lọc
        </Button>
      )}
    </div>
  )
}
