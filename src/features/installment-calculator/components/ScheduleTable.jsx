import { useState } from 'react'
import { Table } from 'antd'
import { TableOutlined } from '@ant-design/icons'
import { PAGE_SIZE } from '../constants/installmentConstants'
import { formatPrice } from '../../../utils/format'
import styles from '../styles/Installment.module.css'

const money = (value) => <span className={styles.money}>{formatPrice(value)}</span>

const COLUMNS = [
  {
    title: 'Kỳ hạn',
    dataIndex: 'period',
    key: 'period',
    width: 92,
    align: 'center',
    
    render: (period) => (
      <span className={styles.periodBadge}>
        Tháng {String(period).padStart(2, '0')}
      </span>
    ),
  },
  {
    title: 'Dư nợ đầu kỳ',
    dataIndex: 'opening',
    key: 'opening',
    width: '19%',
    align: 'right',
    render: money,
  },
  {
    title: 'Tiền gốc',
    dataIndex: 'principal',
    key: 'principal',
    width: '17%',
    align: 'right',
    render: money,
  },
  {
    title: 'Tiền lãi',
    dataIndex: 'interest',
    key: 'interest',
    width: '16%',
    align: 'right',
    render: (value) => <span className={styles.interestCell}>{formatPrice(value)}</span>,
  },
  {
    title: 'Tổng trả trong kỳ',
    dataIndex: 'payment',
    key: 'payment',
    width: '20%',
    align: 'right',
    
    render: (value) => <strong className={styles.paymentCell}>{formatPrice(value)}</strong>,
  },
  {
    title: 'Dư nợ cuối kỳ',
    dataIndex: 'closing',
    key: 'closing',
    width: '19%',
    align: 'right',
    render: (value) => <span className={styles.money}>{formatPrice(value)}</span>,
  },
]

/**
 * Lịch trả nợ từng kỳ, 12 kỳ mỗi trang; bảng cuộn ngang bên trong khung để trang không tràn ở điện thoại.
 *
 * @ears .sdd/features/installment-calculator/SPEC.md#REQ-F07
 * @param {{ rows: Array<object>, termMonths?: number }} props
 */
export default function ScheduleTable({ rows, termMonths }) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const [page, setPage] = useState(1)
  const activePage = Math.min(page, totalPages)

  const startPeriod = (activePage - 1) * PAGE_SIZE + 1
  const endPeriod = Math.min(activePage * PAGE_SIZE, rows.length)

  return (
    <section className={styles.card} aria-label="Lịch trả nợ">
      <div className={styles.cardHead}>
        <div className={styles.titleRow}>
          <h2 className={styles.cardTitle}><TableOutlined /> Lịch trả nợ</h2>
          <span className={styles.rangeTag}>
            Tháng {startPeriod}–{endPeriod} / {termMonths ?? rows.length}
          </span>
        </div>

        <div className={styles.scheduleTools}>
          {totalPages > 1 && (
            <div className={styles.yearTabs} role="tablist" aria-label="Chọn nhanh năm trả góp">
              {Array.from({ length: totalPages }, (_, index) => {
                const yr = index + 1
                const isActive = activePage === yr
                return (
                  <button
                    key={yr}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={isActive ? `${styles.yearTab} ${styles.yearTabActive}` : styles.yearTab}
                    onClick={() => setPage(yr)}
                  >
                    Năm {yr}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <Table
        className={styles.table}
        size="small"
        tableLayout="fixed"
        rowKey="period"
        columns={COLUMNS}
        dataSource={rows}
        pagination={{
          current: activePage,
          pageSize: PAGE_SIZE,
          onChange: (nextPage) => setPage(nextPage),
          showSizeChanger: false,
          hideOnSinglePage: true,
        }}
        scroll={{ x: 760 }}
      />
    </section>
  )
}
