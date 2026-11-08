import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, App, Button, ConfigProvider, Input, Pagination, Segmented, Select, Tag, Tooltip } from 'antd'
import { CheckCircleOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import OrderCheckoutModal from '../components/OrderCheckoutModal'
import { useSalesPipeline } from '../hooks/useSalesPipeline'
import { isSellableStatus } from '../data/salesCrmMappers'
import { countByStage, filterAppointments, filterLeads, paginate } from '../utils/pipelineQuery'
import {
  APPOINTMENT_TYPE_COLOR,
  APPOINTMENT_TYPE_LABEL,
  PIPELINE_STAGE_COLOR,
  PIPELINE_STAGE_LABEL,
  PIPELINE_SUMMARY_STAGES,
  SALES_PAGE_SIZE,
  SALES_TABS,
  SALES_THEME,
} from '../constants/salesCrmConstants'
import { LoadingState, ErrorState, EmptyState } from '../../../components/common/StateBlock'
import Icon from '../../vehicle-intake/components/VehicleIntakeIcon'
import { CAR_STATUS_COLOR, CAR_STATUS_LABEL, labelOf, toOptions } from '../../../utils/constants'
import { formatDate, formatPrice } from '../../../utils/format'
import styles from '../styles/SalesCrmPage.module.css'

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

function formatDateTime(value) {
  return value ? dateTimeFormatter.format(new Date(value)) : '—'
}

const STAGE_TONE = {
  CONTACTED: styles.toneBlue,
  TEST_DRIVEN: styles.toneTeal,
  NEGOTIATING: styles.toneOrange,
  WON: styles.toneGreen,
}

function CustomerCell({ customer }) {
  if (!customer) return <span className={styles.muted}>—</span>
  return (
    <div className={styles.stack}>
      <strong>{customer.fullName}</strong>
      <span className={styles.muted}>{customer.phone || '—'}</span>
    </div>
  )
}

function CarCell({ car }) {
  if (!car) return <span className={styles.muted}>Xe không còn trong kho</span>
  return (
    <div className={styles.stack}>
      <span className={styles.carTitle}>{car.title}</span>
      <span className={styles.muted}>{[car.vehicleCode, car.licensePlate].filter(Boolean).join(' · ')}</span>
    </div>
  )
}

function CarStatusTag({ car }) {
  if (!car?.status) return <span className={styles.muted}>—</span>
  return <Tag color={CAR_STATUS_COLOR[car.status]}>{labelOf(CAR_STATUS_LABEL, car.status)}</Tag>
}

function CheckoutAction({ car, stage, onClick }) {
  if (stage === 'WON') {
    return <span className={styles.doneLabel}><CheckCircleOutlined aria-hidden="true" /> Đã chốt</span>
  }
  if (stage === 'LOST') return <span className={styles.muted}>—</span>
  const blocked = !car || !isSellableStatus(car.status)
  const button = (
    <Button size="small" type="primary" ghost icon={<ShoppingCartOutlined />} disabled={blocked} onClick={onClick}>
      Chốt đơn
    </Button>
  )
  if (!blocked) return button
  const reason = car
    ? `Xe đang ở trạng thái "${labelOf(CAR_STATUS_LABEL, car.status)}", chỉ chốt đơn được xe Đang bán hoặc Đã đặt cọc.`
    : 'Không tìm thấy xe trong kho.'
  return <Tooltip title={reason}><span className={styles.disabledWrap}>{button}</span></Tooltip>
}

function LeadTable({ leads, onCheckout }) {
  return (
    <table className={styles.table} aria-label="Danh sách khách hàng tiềm năng">
      <thead>
        <tr>
          <th>Mã lead</th>
          <th>Khách hàng</th>
          <th>Xe quan tâm</th>
          <th>Giá niêm yết</th>
          <th>Trạng thái xe</th>
          <th>Giai đoạn</th>
          <th>Nguồn</th>
          <th>Cập nhật</th>
          <th className={styles.actionCol}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr key={lead.id}>
            <td className={styles.code}>{lead.code || '—'}</td>
            <td><CustomerCell customer={lead.customer} /></td>
            <td><CarCell car={lead.car} /></td>
            <td>{lead.car ? formatPrice(lead.car.price) : '—'}</td>
            <td><CarStatusTag car={lead.car} /></td>
            <td>
              <Tag color={PIPELINE_STAGE_COLOR[lead.pipelineStage]}>{PIPELINE_STAGE_LABEL[lead.pipelineStage]}</Tag>
            </td>
            <td>{lead.source || '—'}</td>
            <td>{formatDate(lead.updatedAt)}</td>
            <td className={styles.actionCol}>
              <CheckoutAction car={lead.car} stage={lead.pipelineStage} onClick={() => onCheckout({ lead })} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function AppointmentTable({ appointments, wonLeadIds, onCheckout }) {
  return (
    <table className={styles.table} aria-label="Danh sách lịch hẹn đã hoàn thành">
      <thead>
        <tr>
          <th>Mã lịch hẹn</th>
          <th>Loại</th>
          <th>Khách hàng</th>
          <th>Xe</th>
          <th>Hoàn thành lúc</th>
          <th>Kết quả</th>
          <th>Trạng thái xe</th>
          <th className={styles.actionCol}>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((appointment) => (
          <tr key={appointment.id}>
            <td className={styles.code}>{appointment.code || '—'}</td>
            <td>
              <Tag color={APPOINTMENT_TYPE_COLOR[appointment.type]}>{labelOf(APPOINTMENT_TYPE_LABEL, appointment.type)}</Tag>
            </td>
            <td><CustomerCell customer={appointment.customer} /></td>
            <td><CarCell car={appointment.car} /></td>
            <td>{formatDateTime(appointment.completedAt)}</td>
            <td className={styles.outcome}>
              {appointment.outcome ? <Tooltip title={appointment.outcome}><span>{appointment.outcome}</span></Tooltip> : '—'}
            </td>
            <td><CarStatusTag car={appointment.car} /></td>
            <td className={styles.actionCol}>
              <CheckoutAction
                car={appointment.car}
                stage={wonLeadIds.has(appointment.leadId) ? 'WON' : null}
                onClick={() => onCheckout({ appointment })}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const LEAD_STAGE_OPTIONS = toOptions(PIPELINE_STAGE_LABEL)
const APPOINTMENT_TYPE_OPTIONS = toOptions({ TEST_DRIVE: APPOINTMENT_TYPE_LABEL.TEST_DRIVE, VIEWING: APPOINTMENT_TYPE_LABEL.VIEWING })

export default function SalesCrmPage() {
  const { notification } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkoutContext, setCheckoutContext] = useState(null)
  const pipeline = useSalesPipeline()

  const tab = searchParams.get('tab') === SALES_TABS.APPOINTMENTS ? SALES_TABS.APPOINTMENTS : SALES_TABS.LEADS
  const search = searchParams.get('search') || ''
  const stage = searchParams.get('stage') || null
  const type = searchParams.get('type') || null
  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const stageCounts = useMemo(() => countByStage(pipeline.leads), [pipeline.leads])
  const wonLeadIds = useMemo(
    () => new Set(pipeline.leads.filter((lead) => lead.stage === 'WON').map((lead) => lead.id)),
    [pipeline.leads],
  )
  const filtered = useMemo(() => (tab === SALES_TABS.LEADS
    ? filterLeads(pipeline.leads, { stage, search })
    : filterAppointments(pipeline.appointments, { type, search })), [tab, pipeline.leads, pipeline.appointments, stage, type, search])
  const pageData = paginate(filtered, page, SALES_PAGE_SIZE)

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next, { replace: 'search' in changes })
  }

  function handleTabChange(value) {
    updateParams({ tab: value === SALES_TABS.LEADS ? null : value, stage: null, type: null })
  }

  function handleStageCard(value) {
    updateParams({ tab: null, type: null, stage: stage === value && tab === SALES_TABS.LEADS ? null : value })
  }

  function handleCheckoutSuccess(result) {
    setCheckoutContext(null)
    notification.success({
      title: `Đã chốt đơn ${result.vehicleCode || ''}`.trim(),
      description: `Xe đã chuyển sang trạng thái "Đã bán" và được gỡ khỏi danh sách mở bán công khai.${result.customerName ? ` Khách hàng: ${result.customerName}.` : ''}`,
      placement: 'topRight',
    })
    pipeline.reload()
  }

  const isLeadsTab = tab === SALES_TABS.LEADS
  const ready = !pipeline.loading && !pipeline.error

  return (
    <ConfigProvider theme={SALES_THEME}>
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>QUẢN LÝ BÁN HÀNG</span>
          <h1 className={styles.title}>Quản lý bán hàng</h1>
          <p className={styles.desc}>Theo dõi khách hàng tiềm năng, lịch hẹn đã hoàn thành và chốt đơn bán xe.</p>
        </div>
        <button type="button" className={styles.primaryAction} onClick={() => setCheckoutContext({})}>
          <Icon name="plus" size={18} />Chốt đơn mới
        </button>
      </div>

      {pipeline.source === 'demo' && (
        <Alert
          type="info"
          showIcon
          className={styles.demoAlert}
          title="Đang dùng dữ liệu CRM mẫu"
          description="Backend chưa có API khách hàng tiềm năng và lịch hẹn. Khách hàng, lịch hẹn ở đây là dữ liệu mẫu gắn với xe thật trong kho; thao tác chốt đơn vẫn chuyển trạng thái xe thật sang Đã bán."
          action={(
            <Button size="small" icon={<ReloadOutlined />} onClick={pipeline.resetDemo} disabled={pipeline.loading}>
              Tạo lại dữ liệu mẫu
            </Button>
          )}
        />
      )}

      <div className={styles.statRow}>
        {PIPELINE_SUMMARY_STAGES.map((value) => {
          const active = isLeadsTab && stage === value
          return (
            <button
              key={value}
              type="button"
              className={`${styles.statCard} ${STAGE_TONE[value]} ${active ? styles.statCardActive : ''}`}
              aria-pressed={active}
              onClick={() => handleStageCard(value)}
            >
              <span className={styles.statLabel}>{PIPELINE_STAGE_LABEL[value]}</span>
              <span className={styles.statValue}>{ready ? stageCounts[value] : '—'}</span>
            </button>
          )
        })}
        <div className={`${styles.statCard} ${styles.statInfo}`}>
          <span className={styles.statLabel}>Xe sẵn sàng chốt đơn</span>
          <span className={styles.statValue}>{ready ? pipeline.sellableCars.length : '—'}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <Segmented
          value={tab}
          onChange={handleTabChange}
          className={styles.tabs}
          options={[
            { value: SALES_TABS.LEADS, label: `Khách hàng tiềm năng${ready ? ` (${pipeline.leads.length})` : ''}` },
            { value: SALES_TABS.APPOINTMENTS, label: `Lịch hẹn đã hoàn thành${ready ? ` (${pipeline.appointments.length})` : ''}` },
          ]}
        />
        <div className={styles.filters}>
          <Input
            placeholder="Tên khách, SĐT, mã lead, mã xe, biển số..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => updateParams({ search: e.target.value })}
            aria-label="Tìm kiếm khách hàng hoặc xe"
            allowClear
            className={styles.search}
          />
          {isLeadsTab ? (
            <Select
              placeholder="Tất cả giai đoạn"
              aria-label="Lọc theo giai đoạn"
              value={stage ?? undefined}
              onChange={(value) => updateParams({ stage: value })}
              options={LEAD_STAGE_OPTIONS}
              allowClear
              style={{ minWidth: 190 }}
            />
          ) : (
            <Select
              placeholder="Tất cả loại lịch hẹn"
              aria-label="Lọc theo loại lịch hẹn"
              value={type ?? undefined}
              onChange={(value) => updateParams({ type: value })}
              options={APPOINTMENT_TYPE_OPTIONS}
              allowClear
              style={{ minWidth: 190 }}
            />
          )}
        </div>
      </div>

      {pipeline.loading && <LoadingState text="Đang tải dữ liệu bán hàng..." />}
      {!pipeline.loading && pipeline.error && <ErrorState message={pipeline.error} onRetry={pipeline.reload} />}
      {ready && filtered.length === 0 && (
        <EmptyState
          description={isLeadsTab
            ? 'Không có khách hàng tiềm năng phù hợp với bộ lọc hiện tại.'
            : 'Không có lịch hẹn đã hoàn thành phù hợp với bộ lọc hiện tại.'}
        />
      )}
      {ready && filtered.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            {isLeadsTab ? (
              <LeadTable leads={pageData.items} onCheckout={setCheckoutContext} />
            ) : (
              <AppointmentTable appointments={pageData.items} wonLeadIds={wonLeadIds} onCheckout={setCheckoutContext} />
            )}
          </div>
          {filtered.length > SALES_PAGE_SIZE && (
            <div className={styles.pagination}>
              <Pagination
                current={pageData.current}
                pageSize={SALES_PAGE_SIZE}
                total={filtered.length}
                onChange={(next) => updateParams({ page: String(next) })}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}

      <OrderCheckoutModal
        open={checkoutContext !== null}
        context={checkoutContext}
        onClose={() => setCheckoutContext(null)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
    </ConfigProvider>
  )
}
