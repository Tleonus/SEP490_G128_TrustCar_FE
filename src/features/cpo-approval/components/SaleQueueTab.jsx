/**
 * KAN-56 – Tab "Chờ duyệt mở bán".
 *
 * Danh sách xe APPROVED_CPO (GET /manage/cars?status=APPROVED_CPO) và nút "Duyệt mở bán"
 * gọi PUT /inspections/cars/:id/approve-sale — endpoint thật, chỉ ADMIN gọi được.
 * Backend chuyển xe sang AVAILABLE và ghi listedDate nếu xe chưa có.
 * Không giả lập: nếu Backend từ chối (xe đã đổi trạng thái, 403, 404) thì báo lỗi thật.
 */

import { useMemo, useState } from 'react'
import { App, Button, Input, Popconfirm, Table, Tag } from 'antd'
import { CheckCircleOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useApprovalQueue } from '../hooks/useApprovalQueue'
import ApprovalCarDrawer from './ApprovalCarDrawer'
import { approveSale } from '../api/approvalApi'
import { approvalErrorMessage } from '../utils/approvalErrors'
import { useDebounce } from '../../../hooks/useDebounce'
import { ErrorState } from '../../../components/common/StateBlock'
import { getCarTitle, getCoverImage } from '../../../utils/car'
import { formatMileage, formatPrice } from '../../../utils/format'
import { CAR_STATUS_META } from '../../inspection/constants/inspectionConstants'
import { APPROVAL_PAGE_SIZE, SALE_QUEUE_STATUS } from '../constants/approvalConstants'
import styles from '../styles/ApprovalPage.module.css'

export default function SaleQueueTab() {
  const { notification } = App.useApp()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [openCarId, setOpenCarId] = useState(null)
  const [approvingId, setApprovingId] = useState(null)
  const debouncedKeyword = useDebounce(keyword, 400)

  const filters = useMemo(() => ({
    status: SALE_QUEUE_STATUS,
    search: debouncedKeyword || undefined,
    page,
    limit: APPROVAL_PAGE_SIZE,
  }), [debouncedKeyword, page])

  const { items, total, loading, error, reload } = useApprovalQueue(filters)
  const statusMeta = CAR_STATUS_META[SALE_QUEUE_STATUS]

  async function handleApprove(car) {
    setApprovingId(car._id)
    try {
      await approveSale(car._id)
      notification.success({
        message: 'Đã duyệt mở bán',
        description: `${car.vehicleCode || getCarTitle(car)} chuyển sang trạng thái Đang bán.`,
      })
      if (openCarId === car._id) setOpenCarId(null)
      reload()
    } catch (err) {
      notification.error({
        message: 'Duyệt mở bán không thành công',
        description: approvalErrorMessage(err),
      })
    } finally {
      setApprovingId(null)
    }
  }

  const columns = [
    {
      title: 'Xe',
      key: 'car',
      render: (_, car) => {
        const cover = getCoverImage(car)
        const image = typeof cover === 'string' ? cover : cover?.url
        return (
          <span className={styles.carCell}>
            {image
              ? <img src={image} alt="" className={styles.thumb} />
              : <span className={styles.thumbPlaceholder} aria-hidden="true" />}
            <span className={styles.carText}>
              <strong>{getCarTitle(car) || '—'}</strong>
              <span className={styles.subCell}>
                {car.vehicleCode || 'Chưa có mã'}
                {car.cpoCertificateId ? ` · CPO ${car.cpoCertificateId}` : ''}
              </span>
            </span>
          </span>
        )
      },
    },
    {
      title: 'Giá niêm yết',
      dataIndex: 'price',
      key: 'price',
      width: 160,
      render: (value) => formatPrice(value),
    },
    {
      title: 'ODO',
      dataIndex: 'mileage',
      key: 'mileage',
      width: 130,
      render: (value) => formatMileage(value),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 150,
      render: () => <Tag color={statusMeta.color}>{statusMeta.label}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 250,
      render: (_, car) => (
        <span className={styles.actionCell}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setOpenCarId(car._id)}>
            Xem chi tiết
          </Button>
          <Popconfirm
            title="Duyệt mở bán xe này?"
            description="Xe sẽ chuyển sang Đang bán và xuất hiện trên trang công khai."
            okText="Duyệt mở bán"
            cancelText="Huỷ"
            onConfirm={() => handleApprove(car)}
          >
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={approvingId === car._id}
              disabled={Boolean(approvingId) && approvingId !== car._id}
            >
              Duyệt mở bán
            </Button>
          </Popconfirm>
        </span>
      ),
    },
  ]

  return (
    <div className={styles.tabPane}>
      <div className={styles.toolbar}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo mã xe, hãng, mẫu xe..."
          value={keyword}
          onChange={(event) => { setKeyword(event.target.value); setPage(1) }}
          className={styles.search}
          aria-label="Tìm xe chờ duyệt mở bán"
        />
        <Button icon={<ReloadOutlined />} onClick={reload}>Tải lại</Button>
      </div>

      {error && <ErrorState message={error} />}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={error ? [] : items}
        loading={loading}
        locale={{ emptyText: loading ? ' ' : 'Không có xe nào đạt chuẩn CPO đang chờ mở bán.' }}
        pagination={{
          current: page,
          pageSize: APPROVAL_PAGE_SIZE,
          total,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />

      <ApprovalCarDrawer
        carId={openCarId}
        open={Boolean(openCarId)}
        onClose={() => setOpenCarId(null)}
        extra={openCarId && (
          <Popconfirm
            title="Duyệt mở bán xe này?"
            description="Xe sẽ chuyển sang Đang bán và xuất hiện trên trang công khai."
            okText="Duyệt mở bán"
            cancelText="Huỷ"
            onConfirm={() => handleApprove(items.find((car) => car._id === openCarId) || { _id: openCarId })}
          >
            <Button type="primary" icon={<CheckCircleOutlined />} loading={approvingId === openCarId}>
              Duyệt mở bán
            </Button>
          </Popconfirm>
        )}
      />
    </div>
  )
}
