import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Alert, Button, Card, Form, Input, Radio, Space, Steps, Typography,
} from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import {
  fetchPublicServices, fetchServiceSlots, createServiceAppointment,
} from '../api/servicesApi'
import {
  SERVICE_NOTES_MAX, SERVICE_PLATE_MAX, SERVICE_PLATE_MIN, SERVICE_PLATE_REGEX,
  SERVICE_SLOT_DAYS, SERVICE_SLOT_REASON_LABEL,
} from '../constants/servicesConstants'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import styles from '../styles/ServiceBookingPage.module.css'

const { Title, Paragraph, Text } = Typography

const formatPrice = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
const slotTime = (iso) => iso.slice(11, 16)
const slotDate = (iso) => iso.slice(0, 10)

/** YYYY-MM-DD cho ngày VN "hôm nay" và sau N ngày. */
function vnDateRange(now = new Date(), days = SERVICE_SLOT_DAYS) {
  const fmt = (date) => {
    const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000)
    return vn.toISOString().slice(0, 10)
  }
  return { from: fmt(now), to: fmt(new Date(now.getTime() + days * 24 * 60 * 60 * 1000)) }
}

/**
 * KAN-96: wizard đặt lịch dịch vụ.
 * Bước 1 — Xác nhận gói · Bước 2 — Chọn khung giờ · Bước 3 — Nhập biển số + ghi chú → gửi.
 */
export default function ServiceBookingPage() {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState({ status: 'loading', data: null, error: null })
  const [slots, setSlots] = useState({ status: 'idle', data: null, error: null })
  const [step, setStep] = useState(0)
  const [chosenSlot, setChosenSlot] = useState(null)
  const [submission, setSubmission] = useState({ status: 'idle', error: null, result: null })
  const [form] = Form.useForm()

  useEffect(() => {
    const controller = new AbortController()
    fetchPublicServices(controller.signal)
      .then((items) => {
        const match = items.find((item) => item.id === serviceId)
        if (!match) {
          setService({ status: 'error', data: null, error: new Error('Không tìm thấy gói dịch vụ.') })
          return
        }
        setService({ status: 'ready', data: match, error: null })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setService({ status: 'error', data: null, error })
      })
    return () => controller.abort()
  }, [serviceId])

  // Chỉ tải slot khi bước 2 mở lần đầu, hoặc khi người dùng quay lại từ bước 3.
  useEffect(() => {
    if (step !== 1 || slots.status !== 'idle') return
    const controller = new AbortController()
    const { from, to } = vnDateRange()
    setSlots({ status: 'loading', data: null, error: null })
    fetchServiceSlots({ from, to }, controller.signal)
      .then((data) => setSlots({ status: 'ready', data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setSlots({ status: 'error', data: null, error })
      })
    return () => controller.abort()
  }, [step, slots.status])

  const bookingDisabled = service.status !== 'ready'

  const stepsNode = (
    <Steps
      current={step}
      items={[
        { title: 'Xác nhận gói' },
        { title: 'Chọn khung giờ' },
        { title: 'Thông tin xe' },
      ]}
      className={styles.steps}
    />
  )

  if (service.status === 'loading') return <div className={styles.page}>{stepsNode}<LoadingState /></div>
  if (service.status === 'error') {
    return (
      <div className={styles.page}>
        {stepsNode}
        <ErrorState
          message={service.error?.response?.data?.message || service.error?.message || 'Không mở được gói dịch vụ.'}
          onRetry={() => setService({ status: 'loading', data: null, error: null })}
        />
        <Link to="/dich-vu">← Quay lại danh sách dịch vụ</Link>
      </div>
    )
  }

  // ── Bước 1 — xác nhận gói ───────────────────────────────────────────────
  if (step === 0) {
    const pkg = service.data
    return (
      <div className={styles.page}>
        {stepsNode}
        <Card className={styles.card}>
          <Title level={3}>{pkg.serviceName}</Title>
          <Text type="secondary">Mã gói: {pkg.code}</Text>
          <Paragraph className={styles.description}>{pkg.description}</Paragraph>
          <div className={styles.priceRow}>
            <div><Text type="secondary">Thời lượng dự kiến</Text><br /><Text strong>{pkg.estimatedDuration} phút</Text></div>
            <div><Text type="secondary">Giá tham khảo</Text><br /><Text strong className={styles.price}>{formatPrice(pkg.referencePrice)}</Text></div>
          </div>
          <Alert
            type="info"
            showIcon
            message="Giá hiện thị là giá tham khảo. Chi phí cuối cùng do kỹ thuật viên xác nhận tại showroom sau khi kiểm tra xe."
            className={styles.notice}
          />
          <Space className={styles.actions}>
            <Button onClick={() => navigate('/dich-vu')}>Quay lại</Button>
            <Button type="primary" size="large" disabled={bookingDisabled} onClick={() => setStep(1)}>
              Tiếp tục chọn khung giờ
            </Button>
          </Space>
        </Card>
      </div>
    )
  }

  // ── Bước 2 — chọn khung giờ ─────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className={styles.page}>
        {stepsNode}
        <Card className={styles.card}>
          <Title level={4}>Chọn khung giờ bạn muốn đến</Title>
          <Paragraph type="secondary">Các khung giờ cố định: 08:00, 10:00, 13:00, 15:00. Chỉ hiện các khung còn trống.</Paragraph>

          {slots.status === 'loading' && <LoadingState text="Đang tải khung giờ..." />}
          {slots.status === 'error' && (
            <ErrorState
              message={slots.error?.response?.data?.message || 'Không tải được khung giờ.'}
              onRetry={() => setSlots({ status: 'idle', data: null, error: null })}
            />
          )}
          {slots.status === 'ready' && (
            <SlotGrid
              data={slots.data}
              value={chosenSlot}
              onChange={setChosenSlot}
            />
          )}

          <Space className={styles.actions}>
            <Button onClick={() => setStep(0)}>Quay lại</Button>
            <Button type="primary" size="large" disabled={!chosenSlot} onClick={() => setStep(2)}>
              Tiếp tục
            </Button>
          </Space>
        </Card>
      </div>
    )
  }

  // ── Bước 3 — nhập biển số + xác nhận ────────────────────────────────────
  const onFinish = async (values) => {
    setSubmission({ status: 'loading', error: null, result: null })
    try {
      const result = await createServiceAppointment({
        serviceId: service.data.id,
        scheduledAt: chosenSlot,
        serviceVehiclePlate: values.plate.trim().toUpperCase(),
        notes: values.notes,
      })
      setSubmission({ status: 'success', error: null, result })
    } catch (error) {
      setSubmission({ status: 'error', error, result: null })
    }
  }

  if (submission.status === 'success') {
    return (
      <div className={styles.page}>
        {stepsNode}
        <Card className={styles.card}>
          <div className={styles.successIcon}><CheckCircleOutlined /></div>
          <Title level={3}>Đã đặt lịch dịch vụ</Title>
          <Paragraph>
            Mã đặt lịch <Text strong>{submission.result.appointmentCode}</Text>. Showroom sẽ liên hệ xác nhận trước giờ hẹn.
          </Paragraph>
          <Space>
            <Button onClick={() => navigate('/lich-hen?tab=service')} type="primary">Xem trong Lịch hẹn</Button>
            <Button onClick={() => navigate('/dich-vu')}>Đặt gói khác</Button>
          </Space>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {stepsNode}
      <Card className={styles.card}>
        <Title level={4}>Thông tin xe và xác nhận</Title>
        <Paragraph type="secondary">
          Gói: <Text strong>{service.data.serviceName}</Text> · Khung giờ: <Text strong>{chosenSlot ? `${slotDate(chosenSlot)} lúc ${slotTime(chosenSlot)}` : ''}</Text>
        </Paragraph>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="plate"
            label="Biển số xe"
            rules={[
              { required: true, message: 'Vui lòng nhập biển số xe.' },
              {
                validator: (_, value) => {
                  const normalised = String(value || '').trim().toUpperCase()
                  if (!normalised) return Promise.resolve()
                  if (normalised.length < SERVICE_PLATE_MIN || normalised.length > SERVICE_PLATE_MAX) {
                    return Promise.reject(new Error(`Biển số dài ${SERVICE_PLATE_MIN}-${SERVICE_PLATE_MAX} ký tự.`))
                  }
                  if (!SERVICE_PLATE_REGEX.test(normalised)) {
                    return Promise.reject(new Error('Biển số chỉ chứa chữ cái, số, dấu chấm và dấu gạch ngang.'))
                  }
                  return Promise.resolve()
                },
              },
            ]}
            extra="Ví dụ: 51K-123.45"
          >
            <Input placeholder="51K-123.45" maxLength={SERVICE_PLATE_MAX} />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú (tuỳ chọn)"
            rules={[{ max: SERVICE_NOTES_MAX, message: `Tối đa ${SERVICE_NOTES_MAX} ký tự.` }]}
          >
            <Input.TextArea rows={3} maxLength={SERVICE_NOTES_MAX} showCount placeholder="Vd: Xe dính nhựa đường, cần tẩy kỹ" />
          </Form.Item>

          {submission.status === 'error' && (
            <Alert
              className={styles.notice}
              type="error"
              showIcon
              message={submission.error?.response?.data?.message || 'Không đặt được lịch. Vui lòng thử lại.'}
            />
          )}

          <Space className={styles.actions}>
            <Button onClick={() => setStep(1)} disabled={submission.status === 'loading'}>Quay lại</Button>
            <Button type="primary" size="large" htmlType="submit" loading={submission.status === 'loading'}>
              Xác nhận đặt lịch
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}

function SlotGrid({ data, value, onChange }) {
  const days = useMemo(() => {
    if (!data?.days) return []
    return data.days.map((day) => ({
      date: day.date,
      slots: day.slots.filter((slot) => slot.available || !['PAST'].includes(slot.reason)),
    })).filter((day) => day.slots.length > 0)
  }, [data])

  if (days.length === 0) {
    return <Alert type="warning" showIcon message="Hiện không còn khung giờ trống trong 2 tuần tới." />
  }

  return (
    <Radio.Group
      className={styles.slotGrid}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {days.map((day) => (
        <div key={day.date} className={styles.day}>
          <Text strong>{formatDateHeader(day.date)}</Text>
          <div className={styles.slotRow}>
            {day.slots.map((slot) => (
              <Radio.Button
                key={slot.start}
                value={slot.start}
                disabled={!slot.available}
                className={styles.slotButton}
                title={slot.available ? '' : (SERVICE_SLOT_REASON_LABEL[slot.reason] || 'Không khả dụng')}
              >
                {slot.start.slice(11, 16)}
                {!slot.available && (
                  <span className={styles.slotReason}>{SERVICE_SLOT_REASON_LABEL[slot.reason] || ''}</span>
                )}
              </Radio.Button>
            ))}
          </div>
        </div>
      ))}
    </Radio.Group>
  )
}

function formatDateHeader(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const weekday = date.toLocaleDateString('vi-VN', { weekday: 'long', timeZone: 'UTC' })
  return `${weekday}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}
