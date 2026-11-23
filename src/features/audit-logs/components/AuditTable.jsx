import { Pagination, Table } from 'antd'
import { PAGE_SIZE } from '../constants/auditConstants'
import ActionTag from './ActionTag'
import { actionTone } from '../utils/actionTone'
import { describeActor, eventLabel } from '../utils/auditLabels'
import { auditTimeParts, formatAuditTime } from '../utils/formatAuditTime'
import { formatValue } from '../utils/formatValue'
import styles from '../styles/AuditLogs.module.css'

const clean = (value) => (typeof value === 'string' ? value.trim() : '')

/** Người thực hiện: avatar chữ cái đầu + email (hệ thống: chữ nghiêng nhạt). */
function ActorCell({ actor }) {
  const info = describeActor(actor)
  const email = clean(actor?.email)
  const initial = info.system ? 'HT' : (email ? email[0] : '?')
  return (
    <div className={styles.actor}>
      <span className={styles.avatar} aria-hidden="true">{initial}</span>
      <span className={info.system ? styles.actorSystem : styles.actorEmail}>{info.text}</span>
    </div>
  )
}

/** Đối tượng: chip loại + mã (font mono); không có gì → "—". */
function TargetCell({ target }) {
  const model = clean(target?.model)
  const code = clean(target?.code)
  if (!model && !code) return <span className={styles.muted}>—</span>
  return (
    <div className={styles.target}>
      {model && <span className={styles.modelChip}>{formatValue(model).text}</span>}
      {code && <span className={styles.targetCode}>{formatValue(code).text}</span>}
    </div>
  )
}

function buildColumns(onOpen) {
  return [
    {
      title: 'Thời gian',
      key: 'time',
      width: 128,
      render: (_, row) => {
        const { date, clock } = auditTimeParts(row.createdAt)
        return (
          <button
            type="button"
            className={styles.timeButton}
            onClick={() => onOpen(row)}
            aria-label={`Xem chi tiết: ${eventLabel(row.eventType)} lúc ${formatAuditTime(row.createdAt)}`}
          >
            {date ? (
              <span className={styles.timeCell}>
                <span className={styles.timeClock}>{clock}</span>
                <span className={styles.timeDate}>{date}</span>
              </span>
            ) : <span className={styles.muted}>—</span>}
          </button>
        )
      },
    },
    {
      title: 'Sự kiện',
      key: 'event',
      width: 240,
      render: (_, row) => {
        const label = eventLabel(row.eventType)
        return (
          <div className={styles.eventCell}>
            <span className={styles.eventDot} style={{ background: actionTone(row.action).dot }} aria-hidden="true" />
            <div className={styles.eventBody}>
              <span className={`${styles.eventName} ${styles.wrap}`}>{label || '—'}</span>
              {label !== row.eventType && row.eventType && <span className={styles.eventCode}>{row.eventType}</span>}
            </div>
          </div>
        )
      },
    },
    // KAN-92: nhóm hành động do BE suy ra từ mã sự kiện
    { title: 'Hành động', key: 'action', width: 140, render: (_, row) => <ActionTag action={row.action} /> },
    { title: 'Người thực hiện', key: 'actor', width: 230, render: (_, row) => <ActorCell actor={row.actor} /> },
    { title: 'Đối tượng', key: 'target', width: 180, render: (_, row) => <TargetCell target={row.target} /> },
    {
      title: 'Tóm tắt',
      key: 'summary',
      render: (_, row) => {
        const { text, full } = formatValue(row.summary)
        return <span className={styles.summary} title={full}>{text}</span>
      },
    },
    { title: 'IP', key: 'ip', width: 130, render: (_, row) => <span className={styles.ip}>{formatValue(row.ipAddress).text}</span> },
  ]
}

/**
 * Bảng sự kiện (7 cột, KAN-92 thêm "Hành động") có phân trang 20 dòng. Mở chi tiết bằng nút ở cột "Thời gian" (Tab → Enter) hoặc bấm vào dòng.
 * Bảng cuộn ngang BÊN TRONG khung khi hẹp, không làm trang cuộn. Khung thẻ (tiêu đề, tổng số) do trang cha vẽ.
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F03
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F06
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F14
 * @param {object[]} items
 * @param {number} page
 * @param {number} total
 * @param {boolean} [loading]  Đang tải trang mới: dòng cũ vẫn hiện (phủ lớp chờ) và phân trang vẫn bấm được
 * @param {(page: number) => void} onPageChange
 * @param {(row: object) => void} onOpen
 */
export default function AuditTable({ items, page, total, loading = false, onPageChange, onOpen }) {
  return (
    <>
      <div className={styles.tableWrap} aria-busy={loading || undefined}>
        <Table
          className={styles.table}
          columns={buildColumns(onOpen)}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1180 }}
          size="middle"
          onRow={(row) => ({ onClick: (event) => { if (!event.target.closest('button')) onOpen(row) }, style: { cursor: 'pointer' } })}
        />
      </div>
      {total > PAGE_SIZE && (
        <div className={styles.cardFoot}>
          <Pagination current={page} pageSize={PAGE_SIZE} total={total} showSizeChanger={false} onChange={onPageChange} />
        </div>
      )}
    </>
  )
}
