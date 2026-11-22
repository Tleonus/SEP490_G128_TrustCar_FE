import { Table } from 'antd'
import { PAGE_SIZE } from '../constants/installmentConstants'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const money = (value) => formatPrice(value)

const COLUMNS = [
  { title: 'Kỳ', dataIndex: 'period', key: 'period', width: 64, align: 'center' },
  { title: 'Dư nợ đầu kỳ', dataIndex: 'opening', key: 'opening', align: 'right', render: money },
  { title: 'Gốc', dataIndex: 'principal', key: 'principal', align: 'right', render: money },
  { title: 'Lãi', dataIndex: 'interest', key: 'interest', align: 'right', render: money },
  { title: 'Tổng trả', dataIndex: 'payment', key: 'payment', align: 'right', render: money },
  { title: 'Dư nợ cuối kỳ', dataIndex: 'closing', key: 'closing', align: 'right', render: money },
]

/**
 * Lịch trả nợ từng kỳ, 12 kỳ mỗi trang; bảng cuộn ngang bên trong khung để trang không tràn ở điện thoại.
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F07
 * @param {{ rows: Array<object> }} props
 */
export default function ScheduleTable({ rows }) {
  return (
    <section className={styles.card} aria-label="Lịch trả nợ">
      <h2 className={styles.cardTitle}>Lịch trả nợ</h2>
      <Table
        className={styles.table}
        size="middle"
        rowKey="period"
        columns={COLUMNS}
        dataSource={rows}
        pagination={{ pageSize: PAGE_SIZE, showSizeChanger: false, hideOnSinglePage: true }}
        scroll={{ x: 720 }}
      />
    </section>
  )
}
