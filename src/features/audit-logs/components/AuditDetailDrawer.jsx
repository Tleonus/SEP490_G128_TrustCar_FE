import { useState } from 'react'
import { Drawer, Skeleton, Switch } from 'antd'
import { CodeOutlined, DesktopOutlined, InfoCircleOutlined, SwapOutlined } from '@ant-design/icons'
import ActionTag from './ActionTag'
import AuditNotice from './AuditNotice'
import ChangesTable from './ChangesTable'
import { describeActor, describeTarget, eventLabel } from '../utils/auditLabels'
import { diffChanges } from '../utils/diffChanges'
import { formatAuditTime } from '../utils/formatAuditTime'
import { formatValue, prettyJson } from '../utils/formatValue'
import styles from '../styles/AuditLogs.module.css'

const full = (value) => formatValue(value).full

function Panel({ id, icon, title, extra, children }) {
  return (
    <section className={styles.panel} aria-labelledby={id}>
      <div className={styles.panelHead}>
        <h3 id={id} className={styles.panelTitle}>{icon} {title}</h3>
        {extra}
      </div>
      {children}
    </section>
  )
}

/** Thông tin có sẵn ngay từ dòng danh sách (hiện trước khi chi tiết tải xong). */
function GeneralInfo({ row }) {
  const actor = describeActor(row.actor)
  return (
    <Panel id="audit-detail-general" icon={<InfoCircleOutlined aria-hidden="true" />} title="Thông tin chung">
      <dl className={styles.info}>
        <dt>Người thực hiện</dt>
        <dd className={actor.system ? styles.muted : undefined}>{actor.text}</dd>
        {row.actor?.id && (<><dt>Mã người dùng</dt><dd className={styles.mono}>{full(row.actor.id)}</dd></>)}
        <dt>Đối tượng</dt>
        <dd>{describeTarget(row.target)}</dd>
        {row.target?.id && (<><dt>Mã đối tượng</dt><dd className={styles.mono}>{full(row.target.id)}</dd></>)}
        <dt>Tóm tắt</dt>
        <dd>{full(row.summary)}</dd>
        <dt>Địa chỉ IP</dt>
        <dd className={styles.mono}>{full(row.ipAddress)}</dd>
      </dl>
    </Panel>
  )
}

function DetailBody({ data }) {
  const [onlyChanged, setOnlyChanged] = useState(false)
  const rows = diffChanges(data.changes)
  const changedCount = rows.filter((row) => row.changed).length
  const canFilter = changedCount > 0 && changedCount < rows.length

  const toggle = canFilter && (
    <label className={styles.diffToggle}>
      <Switch size="small" checked={onlyChanged} onChange={setOnlyChanged} />
      Chỉ trường đã đổi
    </label>
  )

  return (
    <>
      <Panel id="audit-detail-changes" icon={<SwapOutlined aria-hidden="true" />} title="Thay đổi (trước / sau)" extra={toggle}>
        {rows.length > 0 ? (
          <>
            <p className={styles.panelNote}>{changedCount} / {rows.length} trường có thay đổi</p>
            <ChangesTable changes={data.changes} onlyChanged={canFilter && onlyChanged} />
          </>
        ) : <p className={styles.diffNote}>Sự kiện này không ghi lại thay đổi chi tiết.</p>}
      </Panel>

      <Panel id="audit-detail-meta" icon={<CodeOutlined aria-hidden="true" />} title="Dữ liệu bổ sung (metadata)">
        <pre className={styles.json} tabIndex={0} aria-label="Dữ liệu bổ sung của sự kiện">{prettyJson(data.metadata)}</pre>
      </Panel>

      <Panel id="audit-detail-ua" icon={<DesktopOutlined aria-hidden="true" />} title="Trình duyệt (user agent)">
        <p className={`${styles.wrap} ${styles.mono}`} style={{ margin: 0, fontSize: 12.5, color: '#334155' }}>{full(data.userAgent)}</p>
      </Panel>
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
      size={600}
      destroyOnHidden
      title={row ? eventLabel(row.eventType) : ''}
      styles={{ wrapper: { maxWidth: '100vw' }, body: { padding: 18, background: '#f6f8fb' } }}
    >
      {row && (
        <div className={styles.detail}>
          <div className={styles.detailTop}>
            <ActionTag action={row.action} />
            <span className={styles.detailTime}>{formatAuditTime(row.createdAt) || '—'}</span>
            {row.eventType && <span className={styles.detailCode}>{row.eventType}</span>}
          </div>
          <GeneralInfo row={row} />
          {detail.status === 'loading' && <div className={styles.panel}><Skeleton active paragraph={{ rows: 5 }} aria-busy="true" /></div>}
          {detail.status === 'error' && <AuditNotice kind="error" error={detail.error} onRetry={detail.retry} title="Không thể tải chi tiết sự kiện" />}
          {detail.status === 'success' && <DetailBody data={detail.data} />}
        </div>
      )}
    </Drawer>
  )
}
