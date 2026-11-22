import { Skeleton } from 'antd'
import AuditDetailDrawer from '../components/AuditDetailDrawer'
import AuditFilters from '../components/AuditFilters'
import AuditNotice from '../components/AuditNotice'
import AuditTable from '../components/AuditTable'
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

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Nhật ký hoạt động</h1>
        <p className={styles.desc}>Ai đã làm gì, lên đối tượng nào, lúc nào và từ đâu. Nhật ký chỉ để xem, không thể sửa hay xóa.</p>
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

      {list.status === 'success' && <p className={styles.summary} aria-live="polite">Tổng cộng {list.meta?.total ?? 0} sự kiện.</p>}
      {list.status === 'loading' && list.items.length === 0 && <Skeleton active paragraph={{ rows: 8 }} aria-busy="true" />}
      {list.status === 'error' && <AuditNotice kind="error" error={list.error} onRetry={list.reload} />}
      {list.status === 'success' && list.items.length === 0 && <AuditNotice kind="empty" />}
      {list.items.length > 0 && list.status !== 'error' && (
        <AuditTable
          items={list.items}
          page={s.page}
          total={list.meta?.total ?? 0}
          loading={list.status === 'loading'}
          onPageChange={s.setPage}
          onOpen={s.openDetail}
        />
      )}

      <AuditDetailDrawer row={s.openRow} detail={s.detail} onClose={s.closeDetail} />
    </div>
  )
}
