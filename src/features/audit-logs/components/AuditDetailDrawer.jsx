import { Descriptions, Drawer, Skeleton } from 'antd'
import { describeActor, describeTarget, eventLabel } from '../utils/auditLabels'
import { diffChanges } from '../utils/diffChanges'
import { formatAuditTime } from '../utils/formatAuditTime'
import { formatValue, prettyJson } from '../utils/formatValue'
import AuditNotice from './AuditNotice'
import ChangesTable from './ChangesTable'
import styles from '../styles/AuditLogs.module.css'

const plain = (value) => <span className={styles.wrap}>{formatValue(value).full}</span>

/** Thông tin có sẵn ngay từ dòng danh sách (hiện trước khi chi tiết tải xong). */
function summaryItems(row) {
  const actor = describeActor(row.actor)
  const actorId = row.actor?.id ? ` (id: ${row.actor.id})` : ''
  const targetId = row.target?.id ? ` (id: ${row.target.id})` : ''
  return [
    { key: 'code', label: 'Mã sự kiện', children: plain(row.eventType) },
    { key: 'time', label: 'Thời gian', children: formatAuditTime(row.createdAt) },
    { key: 'actor', label: 'Người thực hiện', children: plain(`${actor.text}${actorId}`) },
    { key: 'target', label: 'Đối tượng', children: plain(`${describeTarget(row.target)}${targetId}`) },
    { key: 'summary', label: 'Tóm tắt', children: plain(row.summary) },
    { key: 'ip', label: 'Địa chỉ IP', children: plain(row.ipAddress) },
  ]
}

function DetailBody({ data }) {
  const hasChanges = diffChanges(data.changes).length > 0
  return (
    <>
      <h3 className={styles.sectionTitle}>Thay đổi (trước / sau)</h3>
      {hasChanges
        ? <ChangesTable changes={data.changes} />
        : <p className={styles.muted}>Sự kiện này không ghi lại thay đổi chi tiết.</p>}

      <h3 className={styles.sectionTitle}>Dữ liệu bổ sung (metadata)</h3>
      <pre className={styles.json} tabIndex={0} aria-label="Dữ liệu bổ sung của sự kiện">{prettyJson(data.metadata)}</pre>

      <h3 className={styles.sectionTitle}>Trình duyệt (user agent)</h3>
      <p className={styles.wrap}>{formatValue(data.userAgent).full}</p>
    </>
  )
}

/**
 * Drawer chi tiết một sự kiện: phần tóm tắt hiện ngay từ dòng đã chọn, phần thay đổi/metadata/user agent đến từ
 * `GET /:id` (đang tải → khung chờ; lỗi → thông báo kèm "Thử lại" mà không đóng Drawer; 404 → "Không tìm thấy sự kiện").
 * Mọi giá trị là văn bản thuần. Esc/nút đóng gọi `onClose` (cha trả focus về dòng đã mở).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F07
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F08
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F13
 * @param {object|null} row     Dòng đang mở (null: đóng)
 * @param {{ status: string, data: object|null, error: object|null, retry: () => void }} detail
 * @param {() => void} onClose
 */
export default function AuditDetailDrawer({ row, detail, onClose }) {
  return (
    <Drawer
      open={Boolean(row)}
      onClose={onClose}
      size={560}
      destroyOnHidden
      title={row ? eventLabel(row.eventType) : ''}
      styles={{ wrapper: { maxWidth: '100vw' } }}
    >
      {row && (
        <div className={styles.detailBlock}>
          <Descriptions column={1} size="small" items={summaryItems(row)} />
          {detail.status === 'loading' && <Skeleton active paragraph={{ rows: 5 }} aria-busy="true" />}
          {detail.status === 'error' && <AuditNotice kind="error" error={detail.error} onRetry={detail.retry} title="Không thể tải chi tiết sự kiện" />}
          {detail.status === 'success' && <DetailBody data={detail.data} />}
        </div>
      )}
    </Drawer>
  )
}
