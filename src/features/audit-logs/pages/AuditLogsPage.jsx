import { Skeleton } from 'antd'
import AuditDetailDrawer from '../components/AuditDetailDrawer'
import AuditFilters from '../components/AuditFilters'
import AuditNotice from '../components/AuditNotice'
import AuditTable from '../components/AuditTable'
import { PAGE_SIZE } from '../constants/auditConstants'
import { useAuditScreen } from '../hooks/useAuditScreen'
import { hasActiveFilters } from '../utils/buildAuditParams'
import styles from '../styles/AuditLogs.module.css'

/**
 * Trang "Nhật ký hoạt động" của quản trị viên (/admin/nhat-ky, bọc `AdminOnlyRoute`). Chỉ đọc: lọc, duyệt theo trang và
 * xem chi tiết một sự kiện. Quyết định quyền cuối cùng thuộc về BE (403 → thông báo, không hiện dữ liệu).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F01
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F02
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F09
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F10
 */
export default function AuditLogsPage() {
  const s = useAuditScreen()
  const { list } = s
  const canReset = hasActiveFilters(s.draft) || hasActiveFilters(s.applied)
  const filtering = hasActiveFilters(s.applied)
  const total = list.meta?.total ?? 0
  const known = list.status === 'success' || list.items.length > 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const showTable = list.items.length > 0 && list.status !== 'error'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>Quản trị · Bảo mật</p>
          <h1 className={styles.title}>Nhật ký hoạt động</h1>
          <p className={styles.desc}>Ai đã làm gì, lên đối tượng nào, lúc nào và từ đâu. Nhật ký chỉ để xem, không thể sửa hay xóa.</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>{filtering ? 'Kết quả lọc' : 'Tổng sự kiện'}</span>
            <span className={styles.statValue}>{known ? total.toLocaleString('vi-VN') : '—'}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Trang</span>
            <span className={styles.statValue}>{known ? `${s.page} / ${pages}` : '—'}</span>
          </div>
        </div>
      </header>

      <AuditFilters
        draft={s.draft}
        rangeError={s.rangeError}
        meta={s.meta}
        onChange={s.change}
        onApply={s.apply}
        onReset={s.reset}
        onRefresh={list.refresh}
        canReset={canReset}
        busy={list.status === 'loading'}
      />

      <section className={styles.card} aria-labelledby="audit-table-title">
        <div className={styles.cardHead}>
          <div>
            <h2 id="audit-table-title" className={styles.cardTitle}>Danh sách sự kiện</h2>
            <p className={styles.cardSub}>{filtering ? 'Đang áp dụng bộ lọc' : 'Toàn bộ nhật ký'} · Bấm vào một dòng để xem chi tiết</p>
          </div>
          {known && <span className={styles.countChip} aria-live="polite">{total.toLocaleString('vi-VN')} sự kiện</span>}
        </div>

        {list.status === 'loading' && list.items.length === 0 && (
          <div className={styles.loading}><Skeleton active paragraph={{ rows: 8 }} aria-busy="true" /></div>
        )}
        {list.status === 'error' && (
          <div className={styles.loading}><AuditNotice kind="error" error={list.error} onRetry={list.reload} /></div>
        )}
        {list.status === 'success' && list.items.length === 0 && (
          <div className={styles.empty}><AuditNotice kind="empty" /></div>
        )}
        {showTable && (
          <AuditTable
            items={list.items}
            page={s.page}
            total={total}
            loading={list.status === 'loading'}
            onPageChange={s.setPage}
            onOpen={s.openDetail}
          />
        )}
      </section>

      <AuditDetailDrawer row={s.openRow} detail={s.detail} onClose={s.closeDetail} />
    </div>
  )
}
