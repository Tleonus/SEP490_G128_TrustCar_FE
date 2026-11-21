import { useEffect, useState } from 'react'
import { App, Button, Card, Empty, List, Pagination, Popconfirm, Skeleton, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import {
  cancelMyServiceAppointment, fetchMyServiceAppointments,
} from '../api/servicesApi'
import { SERVICE_STATUS } from '../constants/servicesConstants'
import styles from '../styles/MyServiceAppointmentsTab.module.css'

const { Text } = Typography

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
const PAGE_SIZE = 10

/**
 * KAN-96: tab "Dịch vụ" trong /lich-hen — liệt kê lịch dịch vụ của khách, huỷ được khi còn PENDING/CONFIRMED.
 */
export default function MyServiceAppointmentsTab() {
  const { message } = App.useApp()
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ status: 'loading', items: [], meta: null, error: null })
  const [cancelling, setCancelling] = useState(null)

  const load = () => {
    const controller = new AbortController()
    setState((prev) => ({ ...prev, status: 'loading', error: null }))
    fetchMyServiceAppointments({ page, limit: PAGE_SIZE }, controller.signal)
      .then(({ items, meta }) => setState({ status: 'ready', items, meta, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', items: [], meta: null, error })
      })
    return () => controller.abort()
  }
  useEffect(load, [page])

  const onCancel = async (record) => {
    setCancelling(record.id)
    try {
      await cancelMyServiceAppointment(record.id)
      message.success('Đã huỷ lịch dịch vụ.')
      load()
    } catch (error) {
      message.error(error?.response?.data?.message || 'Không huỷ được lịch.')
    } finally {
      setCancelling(null)
    }
  }

  if (state.status === 'loading') return <Skeleton active paragraph={{ rows: 6 }} />
  if (state.status === 'error') {
    return (
      <div className={styles.error}>
        <Text type="danger">{state.error?.response?.data?.message || 'Không tải được danh sách lịch dịch vụ.'}</Text>
        <Button type="link" onClick={load}>Thử lại</Button>
      </div>
    )
  }
  if (state.items.length === 0) {
    return (
      <Empty description="Bạn chưa đặt lịch dịch vụ nào">
        <Link to="/dich-vu"><Button type="primary">Xem các gói dịch vụ</Button></Link>
      </Empty>
    )
  }

  return (
    <>
      <List
        className={styles.list}
        itemLayout="vertical"
        dataSource={state.items}
        renderItem={(item) => {
          const status = SERVICE_STATUS[item.status] ?? { label: item.status, color: 'default' }
          const canCancel = ['PENDING', 'CONFIRMED'].includes(item.status)
          return (
            <List.Item key={item.id}>
              <Card className={styles.card}>
                <div className={styles.header}>
                  <div>
                    <Text strong>{item.service?.serviceName || 'Dịch vụ'}</Text>
                    <Tag color="blue" className={styles.code}>{item.service?.code}</Tag>
                    <Tag color={status.color}>{status.label}</Tag>
                  </div>
                  <Text type="secondary">{item.appointmentCode}</Text>
                </div>
                <div className={styles.row}>
                  <div>
                    <Text type="secondary">Thời gian</Text>
                    <div><Text strong>{formatSlot(item.scheduledAt)}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary">Biển số xe</Text>
                    <div><Text strong>{item.vehiclePlate || '—'}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary">Giá tham khảo</Text>
                    <div><Text strong className={styles.price}>{formatPrice(item.service?.referencePrice || 0)}</Text></div>
                  </div>
                </div>
                {item.notes && <Text type="secondary" className={styles.notes}>Ghi chú: {item.notes}</Text>}
                {item.cancellation && (
                  <Text type="danger" className={styles.cancelled}>
                    Đã huỷ: {item.cancellation.reason || 'không rõ lý do'}
                  </Text>
                )}
                {canCancel && (
                  <div className={styles.actions}>
                    <Popconfirm
                      title="Huỷ lịch dịch vụ này?"
                      okText="Huỷ lịch"
                      cancelText="Giữ lại"
                      onConfirm={() => onCancel(item)}
                    >
                      <Button danger loading={cancelling === item.id}>Huỷ lịch</Button>
                    </Popconfirm>
                  </div>
                )}
              </Card>
            </List.Item>
          )
        }}
      />
      {state.meta && state.meta.total > PAGE_SIZE && (
        <Pagination
          current={state.meta.page}
          pageSize={PAGE_SIZE}
          total={state.meta.total}
          onChange={setPage}
          showSizeChanger={false}
          className={styles.pagination}
        />
      )}
    </>
  )
}

/** '2026-12-01T08:00:00+07:00' → 'Thứ ba, 01/12 lúc 08:00'. */
function formatSlot(iso) {
  if (!iso) return ''
  const dayPart = iso.slice(0, 10)
  const timePart = iso.slice(11, 16)
  const [y, m, d] = dayPart.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const weekday = date.toLocaleDateString('vi-VN', { weekday: 'long', timeZone: 'UTC' })
  return `${weekday}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')} lúc ${timePart}`
}
