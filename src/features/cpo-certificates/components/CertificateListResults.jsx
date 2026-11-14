import { Button, Grid, Table } from 'antd'
import { EyeOutlined, QrcodeOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { formatDate, formatMileage } from '../../../utils/format'
import { getCarTitle } from '../../../utils/car'
import CertificateStatusTag from './CertificateStatusTag'
import styles from '../styles/CpoCertificatesPage.module.css'

const detailPath = (item) => `/admin/chung-nhan/${encodeURIComponent(item.carId)}`

/**
 * Bảng chứng nhận (máy tính bảng ngang trở lên) hoặc danh sách thẻ (điện thoại).
 * @param {{ items: import('../constants/cpoCertificateConstants').CertificateListItem[], onShowQr: (item: object) => void }} props
 */
export default function CertificateListResults({ items, onShowQr }) {
  const screens = Grid.useBreakpoint()
  const navigate = useNavigate()

  const actions = (item) => (
    <div className={styles.rowActions}>
      <Button icon={<EyeOutlined />} onClick={() => navigate(detailPath(item))} className={styles.touch}>
        Chi tiết
      </Button>
      <Button icon={<QrcodeOutlined />} onClick={() => onShowQr(item)} className={styles.touch} aria-label={`Mã QR ${item.certificateId}`}>
        QR
      </Button>
    </div>
  )

  if (!screens.md) {
    return (
      <ul className={styles.cardList}>
        {items.map((item) => (
          <li key={item.carId} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cpoCode}>{item.certificateId}</span>
              <CertificateStatusTag status={item.carStatus} />
            </div>
            <div className={styles.carName}>{getCarTitle(item.vehicle)} {item.vehicle?.year}</div>
            <div className={styles.cardMeta}>
              <span>{item.vehicleCode}</span>
              <span>{formatMileage(item.vehicle?.mileage)}</span>
              <span>Cấp {formatDate(item.issuedAt)}</span>
            </div>
            {actions(item)}
          </li>
        ))}
      </ul>
    )
  }

  const columns = [
    {
      title: 'Mã CPO',
      dataIndex: 'certificateId',
      render: (value, item) => <Link to={detailPath(item)} className={styles.cpoCode}>{value}</Link>,
    },
    {
      title: 'Xe',
      key: 'vehicle',
      render: (_, item) => (
        <div>
          <div className={styles.carName}>{getCarTitle(item.vehicle)} {item.vehicle?.year}</div>
          <div className={styles.subText}>{item.vehicleCode}</div>
        </div>
      ),
    },
    { title: 'Số km xác nhận', key: 'mileage', render: (_, item) => formatMileage(item.vehicle?.mileage) },
    { title: 'Ngày cấp', dataIndex: 'issuedAt', render: (value) => formatDate(value) },
    { title: 'Trạng thái xe', dataIndex: 'carStatus', render: (value) => <CertificateStatusTag status={value} /> },
    { title: 'Thao tác', key: 'actions', render: (_, item) => actions(item) },
  ]

  return (
    <div className={styles.tableWrap}>
      <Table rowKey="carId" columns={columns} dataSource={items} pagination={false} scroll={{ x: 760 }} />
    </div>
  )
}
