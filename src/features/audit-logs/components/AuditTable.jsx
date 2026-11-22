import { Pagination, Table } from 'antd'
import { PAGE_SIZE } from '../constants/auditConstants'
import { describeActor, describeTarget, eventLabel } from '../utils/auditLabels'
import { formatAuditTime } from '../utils/formatAuditTime'
import { formatValue } from '../utils/formatValue'
import styles from '../styles/AuditLogs.module.css'

/** Một ô chữ thuần (mọi giá trị đi qua `formatValue`, render bằng JSX thường). */
const Text = ({ value }) => <span className={styles.wrap}>{formatValue(value).text}</span>

function buildColumns(onOpen) {
  return [
    {
      title: 'Thời gian',
      key: 'time',
      width: 170,
      render: (_, row) => (
        <button type="button" className={styles.timeButton} onClick={() => onOpen(row)} aria-label={`Xem chi tiết: ${eventLabel(row.eventType)} lúc ${formatAuditTime(row.createdAt)}`}>
          {formatAuditTime(row.createdAt)}
        </button>
      ),
    },
    {
      title: 'Sự kiện',
      key: 'event',
      width: 210,
      render: (_, row) => {
        const label = eventLabel(row.eventType)
        return (
          <div className={styles.stack}>
            <strong className={styles.wrap}>{label}</strong>
            {label !== row.eventType && <span className={styles.code}>{row.eventType}</span>}
          </div>
        )
      },
    },
    {
      title: 'Người thực hiện',
      key: 'actor',
      width: 200,
      render: (_, row) => {
        const actor = describeActor(row.actor)
        return <span className={actor.system ? styles.muted : styles.wrap}>{actor.text}</span>
      },
    },
    { title: 'Đối tượng', key: 'target', width: 170, render: (_, row) => <Text value={describeTarget(row.target)} /> },
    { title: 'Tóm tắt', key: 'summary', render: (_, row) => <Text value={row.summary} /> },
    { title: 'IP', key: 'ip', width: 120, render: (_, row) => <Text value={row.ipAddress} /> },
  ]
}

/**
 * Bảng sự kiện (6 cột) có phân trang 20 dòng. Mở chi tiết bằng nút ở cột "Thời gian" (Tab → Enter) hoặc bấm vào dòng.
 * Bảng cuộn ngang BÊN TRONG khung khi hẹp, không làm trang cuộn.
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
          columns={buildColumns(onOpen)}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 960 }}
          size="middle"
          onRow={(row) => ({ onClick: (event) => { if (!event.target.closest('button')) onOpen(row) }, style: { cursor: 'pointer' } })}
        />
      </div>
      <Pagination
        current={page}
        pageSize={PAGE_SIZE}
        total={total}
        showSizeChanger={false}
        hideOnSinglePage
        onChange={onPageChange}
        style={{ alignSelf: 'flex-end' }}
      />
    </>
  )
}
