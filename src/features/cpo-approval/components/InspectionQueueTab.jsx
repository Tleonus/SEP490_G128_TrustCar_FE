/**
 * KAN-56 – Tab "Chờ duyệt thẩm định".
 *
 * Danh sách xe UNDER_INSPECTION là dữ liệu thật (GET /manage/cars?status=UNDER_INSPECTION).
 * Hai thao tác ticket yêu cầu KHÔNG có API trên Backend:
 *   - PUT /inspections/:id/approve
 *   - PUT /inspections/:id/reject
 * Backend hiện tự chấm điểm ngay khi Sale gửi biên bản (POST /inspections/:id/submit),
 * nên không có hàng chờ duyệt biên bản. Nút "Duyệt"/"Trả lại" được giữ đúng vị trí ticket
 * mô tả nhưng ở trạng thái vô hiệu, kèm giải thích — không giả lập duyệt thành công.
 */

import { useMemo, useState } from 'react'
import { Alert, Button, Input, Table, Tag, Tooltip } from 'antd'
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useApprovalQueue } from '../hooks/useApprovalQueue'
import ApprovalCarDrawer from './ApprovalCarDrawer'
import { useDebounce } from '../../../hooks/useDebounce'
import { ErrorState } from '../../../components/common/StateBlock'
import { getCarTitle, getCoverImage } from '../../../utils/car'
import { formatMileage } from '../../../utils/format'
import { CAR_STATUS_META } from '../../inspection/constants/inspectionConstants'
import { APPROVAL_PAGE_SIZE, INSPECTION_QUEUE_STATUS } from '../constants/approvalConstants'
import styles from '../styles/ApprovalPage.module.css'

const MISSING_API_HINT = 'Backend chưa có API duyệt/trả lại biên bản (PUT /inspections/:id/approve và /reject). Hiện biên bản được chấm tự động khi Sale gửi.'

export default function InspectionQueueTab() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [openCarId, setOpenCarId] = useState(null)
  const debouncedKeyword = useDebounce(keyword, 400)

  const filters = useMemo(() => ({
    status: INSPECTION_QUEUE_STATUS,
    search: debouncedKeyword || undefined,
    page,
    limit: APPROVAL_PAGE_SIZE,
  }), [debouncedKeyword, page])

  const { items, total, loading, error, reload } = useApprovalQueue(filters)
  const statusMeta = CAR_STATUS_META[INSPECTION_QUEUE_STATUS]

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
              <span className={styles.subCell}>{car.vehicleCode || 'Chưa có mã'} · {formatMileage(car.mileage)}</span>
            </span>
          </span>
        )
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 170,
      render: () => <Tag color={statusMeta.color}>{statusMeta.label}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 290,
      render: (_, car) => (
        <span className={styles.actionCell}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setOpenCarId(car._id)}>
            Xem chi tiết
          </Button>
          <Tooltip title={MISSING_API_HINT}>
            <Button size="small" type="primary" disabled>Duyệt</Button>
          </Tooltip>
          <Tooltip title={MISSING_API_HINT}>
            <Button size="small" danger disabled>Trả lại</Button>
          </Tooltip>
        </span>
      ),
    },
  ]

  return (
    <div className={styles.tabPane}>
      <Alert
        type="warning"
        showIcon
        title="Chưa thể duyệt biên bản từ màn này"
        description="Backend hiện tự chấm điểm biên bản ngay khi Sale gửi (POST /inspections/:id/submit): đạt thì xe thành Đạt chuẩn CPO, không đạt thì Kiểm định không đạt. Hai API PUT /inspections/:id/approve và PUT /inspections/:id/reject chưa tồn tại, nên nút Duyệt và Trả lại tạm vô hiệu cho đến khi Backend bổ sung. Danh sách xe bên dưới là dữ liệu thật."
      />

      <div className={styles.toolbar}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo mã xe, hãng, mẫu xe..."
          value={keyword}
          onChange={(event) => { setKeyword(event.target.value); setPage(1) }}
          className={styles.search}
          aria-label="Tìm xe đang kiểm định"
        />
        <Button icon={<ReloadOutlined />} onClick={reload}>Tải lại</Button>
      </div>

      {error && <ErrorState message={error} />}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={error ? [] : items}
        loading={loading}
        locale={{ emptyText: loading ? ' ' : 'Không có xe nào đang kiểm định.' }}
        pagination={{
          current: page,
          pageSize: APPROVAL_PAGE_SIZE,
          total,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />

      <ApprovalCarDrawer carId={openCarId} open={Boolean(openCarId)} onClose={() => setOpenCarId(null)} />
    </div>
  )
}
