/**
 * KAN-55 – Màn danh sách xe cần kiểm định: /admin/inspection
 *
 * Dữ liệu thật từ GET /api/v1/manage/cars (quyền car:read – cả ADMIN và SALES_STAFF đều
 * có quyền này), lọc 3 trạng thái DRAFT, UNDER_INSPECTION, REJECTED bằng cách gửi lặp
 * tham số `status`. Không có dữ liệu mẫu: nếu Backend không trả xe nào thì hiện empty state.
 */

import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Select, Table, Tag, Tooltip } from 'antd'
import { FileSearchOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useInspectionQueue } from '../hooks/useInspectionQueue'
import { useDebounce } from '../../../hooks/useDebounce'
import { ErrorState } from '../../../components/common/StateBlock'
import { getCarTitle, getCoverImage } from '../../../utils/car'
import { formatMileage } from '../../../utils/format'
import { ADMIN_PATHS } from '../../../router/paths'
import { CAR_STATUS_META, QUEUE_CAR_STATUSES, QUEUE_PAGE_SIZE } from '../constants/inspectionConstants'
import styles from '../styles/InspectionQueuePage.module.css'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Cần kiểm định (nháp, đang kiểm định, không đạt)' },
  ...QUEUE_CAR_STATUSES.map((status) => ({
    value: status,
    label: CAR_STATUS_META[status]?.label || status,
  })),
]

export default function InspectionQueuePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const keyword = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || 'ALL'
  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const debouncedKeyword = useDebounce(keyword, 400)

  const filters = useMemo(() => ({
    statuses: statusFilter === 'ALL' ? QUEUE_CAR_STATUSES : [statusFilter],
    search: debouncedKeyword || undefined,
    page,
    limit: QUEUE_PAGE_SIZE,
  }), [debouncedKeyword, page, statusFilter])

  const { items, total, loading, error, reload } = useInspectionQueue(filters)

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value && value !== 'ALL') next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next, { replace: 'search' in changes })
  }

  const columns = [
    {
      title: 'Mã xe',
      dataIndex: 'vehicleCode',
      key: 'vehicleCode',
      width: 150,
      render: (value, car) => (
        <span className={styles.codeCell}>
          <strong>{value || '—'}</strong>
          {car.licensePlate && <span className={styles.subCell}>{car.licensePlate}</span>}
        </span>
      ),
    },
    {
      title: 'Tên xe',
      key: 'title',
      render: (_, car) => {
        const cover = getCoverImage(car)
        const image = typeof cover === 'string' ? cover : cover?.url
        return (
          <span className={styles.titleCell}>
            {image
              ? <img src={image} alt={getCarTitle(car)} className={styles.thumb} />
              : <span className={styles.thumbPlaceholder} aria-hidden="true" />}
            <span>
              <Tooltip title={`VIN: ${car.vin || '—'}`}>{getCarTitle(car)}</Tooltip>
              <span className={styles.subCell}>
                {car.year || '—'} · {formatMileage(car.mileage)}
              </span>
            </span>
          </span>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 190,
      render: (status) => {
        const meta = CAR_STATUS_META[status] || { label: status, color: 'default' }
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: 'Người tạo',
      key: 'createdBy',
      width: 180,
      // /manage/cars populate createdBy với 'fullName email' (carService.getCars).
      render: (_, car) => car.createdBy?.fullName || car.createdBy?.email || '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_, car) => {
        const carKey = car._id || car.vehicleCode
        const label = car.status === 'UNDER_INSPECTION' ? 'Tiếp tục biên bản' : 'Lập biên bản'
        return (
          <Button
            type="primary"
            ghost
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => navigate(`${ADMIN_PATHS.inspection}/${encodeURIComponent(carKey)}`)}
            aria-label={`${label} xe ${car.vehicleCode || getCarTitle(car)}`}
          >
            {label}
          </Button>
        )
      },
    },
  ]

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>QUẢN LÝ SHOWROOM</span>
          <h1 className={styles.title}>Kiểm định xe</h1>
          <p className={styles.desc}>
            Danh sách xe cần lập biên bản kiểm định CPO: bản nháp, đang kiểm định và kiểm định không đạt.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>Tải lại</Button>
      </header>

      <div className={styles.toolbar}>
        <Input
          className={styles.search}
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo mã xe, VIN, biển số, hãng, dòng xe..."
          aria-label="Tìm xe cần kiểm định"
          value={keyword}
          onChange={(event) => updateParams({ search: event.target.value })}
        />
        <Select
          className={styles.statusSelect}
          aria-label="Lọc theo trạng thái"
          value={statusFilter}
          options={STATUS_OPTIONS}
          onChange={(value) => updateParams({ status: value })}
        />
      </div>

      <p className={styles.count} aria-live="polite">
        {loading ? 'Đang tải danh sách xe…' : `${total} xe cần kiểm định`}
      </p>

      {error
        ? <ErrorState message={error} onRetry={reload} />
        : (
          <div className={styles.tableWrap}>
            <Table
              rowKey={(car) => car._id || car.vehicleCode}
              columns={columns}
              dataSource={items}
              loading={loading}
              size="middle"
              pagination={{
                current: page,
                pageSize: QUEUE_PAGE_SIZE,
                total,
                showSizeChanger: false,
                hideOnSinglePage: true,
                onChange: (next) => updateParams({ page: String(next) }),
              }}
              locale={{
                emptyText: (
                  <div className={styles.empty}>
                    <p>Không có xe nào cần kiểm định với bộ lọc hiện tại.</p>
                    <Link to={ADMIN_PATHS.inventory}>Xem toàn bộ kho xe</Link>
                  </div>
                ),
              }}
              scroll={{ x: 860 }}
            />
          </div>
        )}
    </div>
  )
}
