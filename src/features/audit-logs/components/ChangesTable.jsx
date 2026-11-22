import { useState } from 'react'
import { Tag } from 'antd'
import { diffChanges } from '../utils/diffChanges'
import { formatValue } from '../utils/formatValue'
import styles from '../styles/AuditLogs.module.css'

/** Một giá trị (văn bản thuần); chuỗi dài có "Xem thêm"/"Thu gọn". Phía vắng hiện "(không có)". */
function Value({ present, value }) {
  const [open, setOpen] = useState(false)
  if (!present) return <span className={styles.muted}>(không có)</span>
  const { text, full, truncated } = formatValue(value)
  return (
    <>
      <span className={styles.value}>{open ? full : text}</span>
      {truncated && (
        <button type="button" className={styles.more} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </>
  )
}

/**
 * Bảng "Trường / Trước / Sau" của một sự kiện. Dòng khác nhau có nền nhạt VÀ nhãn chữ "Đã đổi" (không chỉ dựa vào màu).
 * Không có thay đổi nào (`changes` null/rỗng) → không vẽ gì (cha chỉ hiện tóm tắt).
 *
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F07
 * @ears .sdd/features/system-audit-logs/SPEC.md#REQ-F13
 * @param {{ before?: *, after?: * }|null} changes
 */
export default function ChangesTable({ changes }) {
  const rows = diffChanges(changes)
  if (rows.length === 0) return null

  return (
    <table className={styles.changes}>
      <caption style={{ position: 'absolute', left: -9999 }}>Thay đổi trước và sau</caption>
      <thead>
        <tr><th scope="col">Trường</th><th scope="col">Trước</th><th scope="col">Sau</th></tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.field} className={row.changed ? styles.changedRow : undefined}>
            <th scope="row">
              {row.field}
              {row.changed && <> <Tag color="orange">Đã đổi</Tag></>}
            </th>
            <td><Value present={row.hasBefore} value={row.before} /></td>
            <td><Value present={row.hasAfter} value={row.after} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
