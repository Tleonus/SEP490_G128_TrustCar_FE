/**
 * KAN-35 – Bảng hoạt động gần đây: lead mới nhất và xe vừa chốt bán.
 *
 * Dùng Table của antd để có sẵn cuộn ngang trên màn hẹp và trạng thái rỗng.
 * Lead thiếu `customer` (BE chưa populate) thì lùi về `enquiry` — dữ liệu form liên hệ
 * được lưu ngay trên Lead, nên không cần gọi thêm API.
 */

import { Link } from 'react-router-dom'
import { Table, Tag, Tooltip } from 'antd'
import { getCarTitle, getCoverImage } from '../../../utils/car'
import { formatDate, formatMileage, formatPrice } from '../../../utils/format'
import { CAR_STATUS_LABEL } from '../../../utils/constants'
import { CAR_STATUS_META } from '../../inspection/constants/inspectionConstants'
import { soldDateOf } from '../utils/dashboardMetrics'
import styles from '../styles/AdminDashboardPage.module.css'

const LEAD_STAGE_LABEL = {
  NEW: 'Mới',
  CONTACTED: 'Đã liên hệ',
  QUALIFIED: 'Đủ điều kiện',
  NEGOTIATING: 'Thương lượng',
  WON: 'Chốt được',
  LOST: 'Không chốt',
}

const LEAD_STAGE_COLOR = {
  NEW: 'blue',
  CONTACTED: 'cyan',
  QUALIFIED: 'gold',
  NEGOTIATING: 'orange',
  WON: 'green',
  LOST: 'red',
}

function leadCustomerName(lead) {
  const fromCustomer = lead?.customer?.fullName || lead?.customer?.full_name
  if (fromCustomer) return fromCustomer
  return lead?.enquiry?.submittedName || lead?.enquiry?.full_name || 'Khách chưa có tên'
}

function leadPhone(lead) {
  return lead?.customer?.phone || lead?.enquiry?.submittedPhone || lead?.enquiry?.phone_number || '—'
}

function leadCarLabel(lead) {
  if (lead?.car?.vehicleCode) return lead.car.vehicleCode
  if (lead?.car && typeof lead.car === 'object') return getCarTitle(lead.car) || '—'
  return 'Chưa gắn xe'
}

const LEAD_COLUMNS = [
  {
    title: 'Mã lead',
    dataIndex: 'leadCode',
    key: 'leadCode',
    render: (code) => <span className={styles.mono}>{code || '—'}</span>,
  },
  {
    title: 'Khách hàng',
    key: 'customer',
    render: (_, lead) => (
      <div className={styles.cellStack}>
        <strong>{leadCustomerName(lead)}</strong>
        <span>{leadPhone(lead)}</span>
      </div>
    ),
  },
  {
    title: 'Xe quan tâm',
    key: 'car',
    render: (_, lead) => <span className={styles.mono}>{leadCarLabel(lead)}</span>,
  },
  {
    title: 'Trạng thái',
    key: 'stage',
    render: (_, lead) => (
      <Tag color={LEAD_STAGE_COLOR[lead?.stage] ?? 'default'}>
        {LEAD_STAGE_LABEL[lead?.stage] ?? lead?.stage ?? '—'}
      </Tag>
    ),
  },
  {
    title: 'Tạo lúc',
    key: 'createdAt',
    render: (_, lead) => <span>{formatDate(lead?.createdAt || lead?.updatedAt)}</span>,
  },
]

export function RecentLeadsTable({ leads, available }) {
  return (
    <section className={styles.tableBlock} aria-labelledby="recent-leads-title">
      <header className={styles.blockHead}>
        <div>
          <h2 id="recent-leads-title">Khách hàng tiềm năng mới nhất</h2>
          <p>
            {available
              ? 'Tối đa 10 lead mới nhất, sắp xếp theo thời điểm tạo.'
              : 'Backend chưa có route /leads trên môi trường này nên chưa hiển thị được lead.'}
          </p>
        </div>
        <Link to="/admin/sales" className={styles.viewAll}>Quản lý bán hàng</Link>
      </header>
      <Table
        rowKey={(lead) => lead?._id || lead?.id || lead?.leadCode}
        columns={LEAD_COLUMNS}
        dataSource={leads}
        pagination={false}
        size="middle"
        scroll={{ x: 640 }}
        locale={{ emptyText: available ? 'Chưa có lead nào.' : 'Chưa có dữ liệu lead.' }}
      />
    </section>
  )
}

const SOLD_COLUMNS = [
  {
    title: 'Xe',
    key: 'car',
    render: (_, car) => {
      const cover = getCoverImage(car)
      const image = typeof cover === 'string' ? cover : cover?.url
      const title = getCarTitle(car) || 'Xe chưa có tên'
      return (
        <div className={styles.carCell}>
          {image
            ? <img src={image} alt="" width="72" height="48" loading="lazy" className={styles.carThumb} />
            : <div className={styles.carThumbEmpty} aria-hidden="true" />}
          <div className={styles.cellStack}>
            <strong>{title}</strong>
            <span className={styles.mono}>{car?.vehicleCode || '—'}</span>
          </div>
        </div>
      )
    },
  },
  {
    title: 'Giá bán',
    key: 'price',
    render: (_, car) => <span className={styles.price}>{formatPrice(car?.price)}</span>,
  },
  {
    title: 'Ngày bán',
    key: 'soldAt',
    render: (_, car) => {
      const date = soldDateOf(car)
      const label = date ? formatDate(date) : '—'
      // Xe cũ có thể chỉ có statusChangedAt; nói rõ để không hiểu nhầm là ngày chốt hợp đồng.
      const note = !car?.soldAt && date ? 'Ngày đổi trạng thái (xe chưa lưu ngày bán)' : null
      return note ? <Tooltip title={note}><span className={styles.softText}>{label} *</span></Tooltip> : <span>{label}</span>
    },
  },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (_, car) => <Tag color="green">{CAR_STATUS_LABEL[car?.status] ?? car?.status}</Tag>,
  },
]

export function RecentSoldTable({ cars }) {
  return (
    <section className={styles.tableBlock} aria-labelledby="recent-sold-title">
      <header className={styles.blockHead}>
        <div>
          <h2 id="recent-sold-title">Xe vừa chốt bán</h2>
          <p>5 xe chuyển sang trạng thái Đã bán gần nhất.</p>
        </div>
        <Link to="/admin/inventory?status=SOLD" className={styles.viewAll}>Xem kho xe</Link>
      </header>
      <Table
        rowKey={(car) => car?._id || car?.vehicleCode}
        columns={SOLD_COLUMNS}
        dataSource={cars}
        pagination={false}
        size="middle"
        scroll={{ x: 640 }}
        locale={{ emptyText: 'Chưa có xe nào được chốt bán.' }}
      />
    </section>
  )
}

const NEW_COLUMNS = [
  {
    title: 'Xe',
    key: 'car',
    render: (_, car) => {
      const cover = getCoverImage(car)
      const image = typeof cover === 'string' ? cover : cover?.url
      const title = getCarTitle(car) || 'Xe chưa có tên'
      return (
        <div className={styles.carCell}>
          {image
            ? <img src={image} alt="" width="72" height="48" loading="lazy" className={styles.carThumb} />
            : <div className={styles.carThumbEmpty} aria-hidden="true" />}
          <div className={styles.cellStack}>
            <strong>{title}</strong>
            <span className={styles.mono}>
              {car?.vehicleCode || '—'}
              {car?.year ? ` · ${car.year}` : ''}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    title: 'Giá bán',
    key: 'price',
    render: (_, car) => <span className={styles.price}>{formatPrice(car?.price)}</span>,
  },
  {
    title: 'Số km',
    key: 'mileage',
    render: (_, car) => <span>{formatMileage(car?.mileage)}</span>,
  },
  {
    title: 'Trạng thái',
    key: 'status',
    render: (_, car) => {
      const meta = CAR_STATUS_META[car?.status]
      return <Tag color={meta?.color ?? 'default'}>{meta?.label ?? CAR_STATUS_LABEL[car?.status] ?? car?.status ?? '—'}</Tag>
    },
  },
  {
    title: 'Ngày nhập kho',
    key: 'listedDate',
    render: (_, car) => <span>{formatDate(car?.listedDate || car?.createdAt)}</span>,
  },
]

export function RecentNewCarsTable({ cars }) {
  return (
    <section className={styles.tableBlock} aria-labelledby="recent-new-title">
      <header className={styles.blockHead}>
        <div>
          <h2 id="recent-new-title">Xe mới nhập gần đây</h2>
          <p>5 xe vào kho gần nhất, sắp xếp theo ngày nhập kho mới nhất.</p>
        </div>
        <Link to="/admin/inventory" className={styles.viewAll}>Xem tất cả xe</Link>
      </header>
      <Table
        rowKey={(car) => car?._id || car?.vehicleCode}
        columns={NEW_COLUMNS}
        dataSource={cars}
        pagination={false}
        size="middle"
        scroll={{ x: 760 }}
        locale={{ emptyText: 'Chưa có xe nào trong kho.' }}
      />
    </section>
  )
}
