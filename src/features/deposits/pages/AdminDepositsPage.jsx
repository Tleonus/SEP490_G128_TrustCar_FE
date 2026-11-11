import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Alert, Button, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Timeline, message,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../../store/useAuthStore'
import {
  cancelDeposit, completeDeposit, confirmDepositPayment, fetchDeposit, fetchDepositsForStaff, refundDeposit,
} from '../api/depositApi'
import {
  ACTIVE_DEPOSIT_STATUSES, DEPOSIT_STATUS, DEPOSIT_STATUS_META, PAYMENT_STATUS, PAYMENT_STATUS_META, STAFF_ROLES,
} from '../constants/depositConstants'
import { depositErrorMessage } from '../utils/depositErrors'
import { formatDateTime, formatVnd } from '../utils/depositFormat'
import { DepositStatusBadge, PaymentStatusBadge } from '../components/DepositStatusBadge'
import CountdownTimer from '../components/CountdownTimer'
import styles from '../styles/Deposit.module.css'

const PAGE_SIZE = 20

const ACTION_LABEL = {
  DEPOSIT_CREATED: 'Khách tạo đặt cọc, xe chuyển RESERVED',
  DEPOSIT_PAYMENT_CONFIRMED: 'Xác nhận đã nhận tiền cọc',
  DEPOSIT_COMPLETED: 'Xác nhận thanh toán đủ, xe chuyển SOLD',
  DEPOSIT_CANCELLED: 'Hủy lượt giữ xe',
  DEPOSIT_EXPIRED: 'Hết hạn giữ xe (hệ thống)',
  DEPOSIT_REFUNDED: 'Ghi nhận hoàn cọc',
  DEPOSIT_HOLD_RELEASED: 'Đóng lượt giữ do trạng thái xe đổi ngoài luồng',
}

/** Modal nhập chứng từ cho 3 thao tác của nhân viên. */
const ACTIONS = {
  confirm: {
    title: 'Xác nhận đã nhận tiền cọc',
    ok: 'Xác nhận đã nhận cọc',
    hint: (d) => <>Chỉ xác nhận sau khi đã kiểm tra nhận đủ <b>{formatVnd(d.depositAmount)}</b> với nội dung <b>{d.depositCode}</b>. Xe vẫn được giữ; khách cần thanh toán đủ trước {formatDateTime(d.expiresAt)}.</>,
    run: (d, v) => confirmDepositPayment(d.id, v),
    done: 'Đã xác nhận nhận tiền cọc.',
  },
  complete: {
    title: 'Xác nhận khách đã thanh toán đủ',
    ok: 'Xác nhận thanh toán đủ',
    hint: (d) => <>Khách đã thanh toán đủ giá trị xe (giá lúc đặt {formatVnd(d.carPrice)}; còn lại sau cọc {formatVnd(d.remainingAmount)}). Xe sẽ chuyển sang <b>Đã bán (SOLD)</b>. Hợp đồng/Sale Record vẫn lập theo quy trình chốt đơn hiện có.</>,
    run: (d, v) => completeDeposit(d.id, v),
    done: 'Đã hoàn tất. Xe chuyển sang Đã bán.',
  },
  refund: {
    title: 'Ghi nhận hoàn cọc',
    ok: 'Ghi nhận đã hoàn',
    hint: (d) => <>Lượt giữ đã kết thúc sau khi khách đã chuyển cọc <b>{formatVnd(d.depositAmount)}</b>. Nhập số tiền thực hoàn theo hợp đồng đặt cọc.</>,
    run: (d, v) => refundDeposit(d.id, v),
    done: 'Đã ghi nhận hoàn cọc.',
  },
}

/**
 * Quản lý đặt cọc cho ADMIN / SALES_STAFF: /admin/deposits
 * BE kiểm quyền cuối cùng; trang chặn sớm người không phải nhân viên.
 */
export default function AdminDepositsPage() {
  const user = useAuthStore((s) => s.user)
  const isStaff = STAFF_ROLES.includes(user?.roleName)
  const isAdmin = user?.roleName === 'ADMIN'

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [reviewOnly, setReviewOnly] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [action, setAction] = useState(null) // { type, deposit }
  const [busy, setBusy] = useState(false)
  const [form] = Form.useForm()

  const load = useCallback(async () => {
    if (!isStaff) return
    setLoading(true)
    try {
      const params = { page, limit: PAGE_SIZE, activeOnly, reviewRequired: reviewOnly }
      if (status) params.status = status
      if (paymentStatus) params.paymentStatus = paymentStatus
      if (code.trim()) params.depositCode = code.trim()
      const data = await fetchDepositsForStaff(params)
      setItems(data.items)
      setTotal(data.meta?.total ?? data.items.length)
    } catch (err) {
      message.error(depositErrorMessage(err, 'Không thể tải danh sách đặt cọc.'))
    } finally {
      setLoading(false)
    }
  }, [isStaff, page, status, paymentStatus, activeOnly, reviewOnly, code])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  if (!isStaff) return <Navigate to="/" replace />

  async function openDetail(record) {
    setDetail(record)
    try {
      setDetail(await fetchDeposit(record.id))
    } catch (err) {
      message.error(depositErrorMessage(err))
    }
  }

  function openAction(type, deposit) {
    form.resetFields()
    if (type === 'refund') form.setFieldsValue({ refundAmount: deposit.depositAmount })
    setAction({ type, deposit })
  }

  async function submitAction(values) {
    const cfg = ACTIONS[action.type]
    setBusy(true)
    try {
      const updated = await cfg.run(action.deposit, values)
      message.success(cfg.done)
      setAction(null)
      if (detail?.id === updated?.id) setDetail(updated)
    } catch (err) {
      message.error(depositErrorMessage(err))
    } finally {
      setBusy(false)
      load()
    }
  }

  async function handleCancel(record) {
    try {
      const updated = await cancelDeposit(record.id, 'Nhân viên hủy lượt giữ xe.')
      message.success(`Đã hủy ${record.depositCode}.`)
      if (detail?.id === updated?.id) setDetail(updated)
    } catch (err) {
      message.error(depositErrorMessage(err))
    } finally {
      load()
    }
  }

  const actionButtons = (r, size = 'small') => (
    <Space wrap>
      {r.status === DEPOSIT_STATUS.PENDING_PAYMENT && r.holdActive && (
        <Button size={size} type="primary" onClick={() => openAction('confirm', r)}>Xác nhận nhận cọc</Button>
      )}
      {ACTIVE_DEPOSIT_STATUSES.includes(r.status) && r.holdActive && (
        <Button size={size} onClick={() => openAction('complete', r)}>Xác nhận thanh toán đủ</Button>
      )}
      {isAdmin && r.paymentStatus === PAYMENT_STATUS.REFUND_PENDING && (
        <Button size={size} onClick={() => openAction('refund', r)}>Ghi nhận hoàn cọc</Button>
      )}
      {r.holdActive && (
        <Popconfirm
          title="Hủy lượt giữ xe?"
          description={r.paymentStatus === PAYMENT_STATUS.DEPOSIT_PAID ? 'Khách đã chuyển cọc – lượt cọc sẽ chuyển sang Chờ hoàn cọc.' : 'Xe sẽ được mở bán lại.'}
          okText="Hủy giữ xe"
          cancelText="Không"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleCancel(r)}
        >
          <Button size={size} danger>Hủy</Button>
        </Popconfirm>
      )}
    </Space>
  )

  const columns = [
    {
      title: 'Mã đặt cọc',
      dataIndex: 'depositCode',
      render: (v, r) => (
        <div>
          <Button type="link" style={{ padding: 0 }} onClick={() => openDetail(r)}><b>{v}</b></Button>
          <div className={styles.muted}>{formatDateTime(r.createdAt)}</div>
        </div>
      ),
    },
    { title: 'Xe', dataIndex: 'carTitle', render: (v, r) => (<div>{v}<div className={styles.muted}>{r.carVehicleCode}</div></div>) },
    { title: 'Khách hàng', dataIndex: 'customer', render: (c) => (c ? (<div>{c.fullName}<div className={styles.muted}>{c.phone}</div></div>) : '—') },
    { title: 'Tiền cọc', dataIndex: 'depositAmount', align: 'right', render: formatVnd },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s, r) => (
        <Space orientation="vertical" size={2}>
          <DepositStatusBadge status={s} />
          <PaymentStatusBadge status={r.paymentStatus} />
          {r.holdActive && <CountdownTimer compact expiresAt={r.expiresAt} onExpire={load} />}
          {r.reviewRequired && <span className={styles.muted}>⚠ Cần đối soát</span>}
        </Space>
      ),
    },
    { title: 'Thao tác', key: 'actions', render: (_, r) => actionButtons(r) },
  ]

  const cfg = action ? ACTIONS[action.type] : null

  return (
    <div>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Quản lý đặt cọc giữ xe</h1>
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>Tải lại</Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 220 }}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1) }}
          options={[{ value: '', label: 'Mọi trạng thái giữ xe' }, ...Object.entries(DEPOSIT_STATUS_META).map(([value, m]) => ({ value, label: m.label }))]}
        />
        <Select
          style={{ width: 200 }}
          value={paymentStatus}
          onChange={(v) => { setPaymentStatus(v); setPage(1) }}
          options={[{ value: '', label: 'Mọi trạng thái thanh toán' }, ...Object.entries(PAYMENT_STATUS_META).map(([value, m]) => ({ value, label: m.label }))]}
        />
        <Input.Search placeholder="Mã đặt cọc (DC-...)" allowClear style={{ width: 220 }} onSearch={(v) => { setCode(v); setPage(1) }} />
        <span><Switch checked={activeOnly} onChange={(v) => { setActiveOnly(v); setPage(1) }} /> Đang giữ xe</span>
        <span><Switch checked={reviewOnly} onChange={(v) => { setReviewOnly(v); setPage(1) }} /> Cần đối soát</span>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ current: page, pageSize: PAGE_SIZE, total, onChange: setPage, showSizeChanger: false }}
      />

      <Drawer open={Boolean(detail)} onClose={() => setDetail(null)} size={520} title={detail ? `Đặt cọc ${detail.depositCode}` : ''}>
        {detail && (
          <>
            <div className={styles.badgeRow} style={{ marginBottom: 12 }}>
              <DepositStatusBadge status={detail.status} />
              <PaymentStatusBadge status={detail.paymentStatus} />
            </div>
            {detail.reviewRequired && <Alert type="warning" showIcon title="Cần đối soát" description={detail.reviewNote} style={{ marginBottom: 12 }} />}
            {detail.holdActive && <div style={{ marginBottom: 12 }}><CountdownTimer expiresAt={detail.expiresAt} onExpire={() => openDetail(detail)} label="Thời hạn giữ xe còn lại" /></div>}
            <dl className={styles.detailGrid}>
              <dt>Xe</dt><dd>{detail.carTitle} ({detail.carVehicleCode})</dd>
              <dt>Khách hàng</dt><dd>{detail.customer ? `${detail.customer.fullName} · ${detail.customer.phone}${detail.customer.email ? ` · ${detail.customer.email}` : ''}` : '—'}</dd>
              <dt>Giá xe lúc đặt</dt><dd>{formatVnd(detail.carPrice)}</dd>
              <dt>Tiền cọc</dt><dd>{formatVnd(detail.depositAmount)}</dd>
              <dt>Còn lại sau cọc</dt><dd>{formatVnd(detail.remainingAmount)}</dd>
              <dt>Tạo lúc</dt><dd>{formatDateTime(detail.createdAt)}</dd>
              <dt>Bắt đầu giữ xe</dt><dd>{formatDateTime(detail.reservedAt)}</dd>
              <dt>Hạn giữ xe</dt><dd>{formatDateTime(detail.expiresAt)}</dd>
              <dt>Nhận cọc</dt><dd>{formatDateTime(detail.paidAt)}{detail.paymentReference ? ` · ${detail.paymentReference}` : ''}</dd>
              <dt>Thanh toán đủ</dt><dd>{formatDateTime(detail.completedAt)}{detail.fullPaymentReference ? ` · ${detail.fullPaymentReference}` : ''}</dd>
              <dt>Hủy / hết hạn</dt><dd>{formatDateTime(detail.cancelledAt)}{detail.cancelReason ? ` · ${detail.cancelReason}` : ''}</dd>
              <dt>Hoàn cọc</dt><dd>{detail.refundedAt ? `${formatVnd(detail.refundAmount)} · ${formatDateTime(detail.refundedAt)}` : '—'}</dd>
            </dl>
            <div style={{ marginBottom: 16 }}>{actionButtons(detail, 'middle')}</div>
            <h3 style={{ marginBottom: 12 }}>Lịch sử</h3>
            <Timeline
              items={(detail.history || []).map((h) => ({
                content: (
                  <>
                    <b>{ACTION_LABEL[h.action] || h.action}</b>
                    <div className={styles.muted}>{formatDateTime(h.at)}{h.actorId ? '' : ' · hệ thống'}{h.note ? ` · ${h.note}` : ''}</div>
                  </>
                ),
              }))}
            />
          </>
        )}
      </Drawer>

      <Modal
        title={cfg?.title}
        open={Boolean(action)}
        onCancel={() => setAction(null)}
        okText={cfg?.ok}
        confirmLoading={busy}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        {action && <p style={{ marginBottom: 12 }}>{cfg.hint(action.deposit)}</p>}
        <Form form={form} layout="vertical" onFinish={submitAction} preserve={false}>
          {action?.type === 'refund' ? (
            <>
              <Form.Item name="refundAmount" label="Số tiền hoàn (VND)" rules={[{ required: true, message: 'Nhập số tiền hoàn' }]}>
                <InputNumber min={0} max={action.deposit.depositAmount} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="refundReference" label="Mã giao dịch hoàn" rules={[{ max: 100 }]}><Input /></Form.Item>
            </>
          ) : (
            <Form.Item name="paymentReference" label="Mã giao dịch / số chứng từ" rules={[{ max: 100 }]}>
              <Input placeholder="VD: FT2631512345" />
            </Form.Item>
          )}
          <Form.Item name="note" label="Ghi chú" rules={[{ max: 500 }]}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
