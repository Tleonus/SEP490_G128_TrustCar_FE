import { useState } from 'react'
import { Tag } from 'antd'
import { diffChanges } from '../utils/diffChanges'
import { formatValue } from '../utils/formatValue'
import styles from '../styles/AuditLogs.module.css'

/** Một giá trị (văn bản thuần); chuỗi dài có "Xem thêm"/"Thu gọn". Phía vắng hiện "(không có)". */
function Value({ present, value }) {
  const [open, setOpen] = useState(false)
  if (!present) return <span className={styles.paneEmpty}>(không có)</span>
  const { text, full, truncated } = formatValue(value)
  return (
    <div>
      <span className={styles.paneValue}>{open ? full : text}</span>
      {truncated && (
        <div>
          <button type="button" className={styles.more} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? 'Thu gọn' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  )
}

function Pane({ label, tone, present, value }) {
  return (
    <div className={`${styles.pane} ${tone}`}>
      <span className={styles.paneLabel}>{label}</span>
      <Value present={present} value={value} />
    </div>
  )
}

/**
 * Diff "Trước / Sau" của một sự kiện, mỗi trường một khối hai cột (đỏ = trước, xanh = sau).
 * Trường đã đổi có màu VÀ nhãn chữ "Đã đổi" (không chỉ dựa vào màu); trường giữ nguyên hiện xám kèm "Không đổi".
 * Không có thay đổi nào (`changes` null/rỗng) → không vẽ gì (cha hiện ghi chú).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F07
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F13
 * @param {{ before?: *, after?: * }|null} changes
 * @param {boolean} [onlyChanged]  Ẩn các trường không đổi
 */
export default function ChangesTable({ changes, onlyChanged = false }) {
  const all = diffChanges(changes)
  if (all.length === 0) return null
  const rows = onlyChanged ? all.filter((row) => row.changed) : all

  return (
    <ul className={styles.diffList} aria-label="Thay đổi trước và sau">
      {rows.map((row) => (
        <li key={row.field} className={styles.diffItem}>
          <div className={styles.diffName}>
            <span>{row.field}</span>
            {row.changed
              ? <Tag color="orange" style={{ marginInlineStart: 'auto', marginInlineEnd: 0 }}>Đã đổi</Tag>
              : <span className={styles.diffSame}>Không đổi</span>}
          </div>
          <div className={styles.diffPanes}>
            <Pane label="Trước" tone={row.changed ? styles.paneBefore : styles.paneUnchanged} present={row.hasBefore} value={row.before} />
            <Pane label="Sau" tone={row.changed ? styles.paneAfter : styles.paneUnchanged} present={row.hasAfter} value={row.after} />
          </div>
        </li>
      ))}
    </ul>
  )
}
