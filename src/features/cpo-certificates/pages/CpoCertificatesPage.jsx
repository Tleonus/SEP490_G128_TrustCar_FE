import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Empty, Pagination, Skeleton } from 'antd'
import CertificateListToolbar from '../components/CertificateListToolbar'
import CertificateListResults from '../components/CertificateListResults'
import CertificateQrModal from '../components/CertificateQrModal'
import CertificateErrorState from '../components/CertificateErrorState'
import { useCertificateList } from '../hooks/useCertificateQueries'
import { applyCertificateListChanges, parseCertificateListParams } from '../utils/certificateListParams'
import styles from '../styles/CpoCertificatesPage.module.css'

/** Danh sách chứng nhận CPO (ADMIN, SALES_STAFF). Bộ lọc, sắp xếp, trang đều nằm trên URL. */
export default function CpoCertificatesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => parseCertificateListParams(searchParams), [searchParams])
  const { data, loading, error, reload } = useCertificateList(query)
  const [qrTarget, setQrTarget] = useState(null)

  const updateParams = (changes) => setSearchParams(applyCertificateListChanges(searchParams, changes))
  const filtered = Boolean(query.search || query.status || query.issuedFrom || query.issuedTo)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chứng nhận CPO</h1>
        <p className={styles.desc}>Tra cứu chứng nhận đã cấp, xem kết quả kiểm định và tạo mã QR, tem in cho xe.</p>
      </header>

      <CertificateListToolbar query={query} onChange={updateParams} />

      {loading && (
        <div className={styles.skeleton} aria-busy="true" aria-label="Đang tải danh sách chứng nhận">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} active title={false} paragraph={{ rows: 2 }} />
          ))}
        </div>
      )}

      {!loading && error && <CertificateErrorState error={error} onRetry={reload} />}

      {!loading && !error && data?.items.length === 0 && (
        <Empty
          className={styles.empty}
          description={filtered ? 'Không có chứng nhận nào khớp bộ lọc.' : 'Chưa có chứng nhận CPO nào được cấp.'}
        />
      )}

      {!loading && !error && data?.items.length > 0 && (
        <>
          <p className={styles.count}>{data.total} chứng nhận</p>
          <CertificateListResults items={data.items} onShowQr={setQrTarget} />
          <div className={styles.pagination}>
            <Pagination
              current={data.page}
              pageSize={data.limit}
              total={data.total}
              showSizeChanger={false}
              onChange={(page) => updateParams({ page })}
              hideOnSinglePage
            />
          </div>
        </>
      )}

      <CertificateQrModal certificate={qrTarget} onClose={() => setQrTarget(null)} />
    </div>
  )
}
