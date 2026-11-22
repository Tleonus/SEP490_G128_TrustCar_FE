/**
 * Modal "Lịch sử giá" của một xe trong bảng kho xe của Admin.
 *
 * Giá được tính theo chính sách tồn kho: cứ 60 ngày kể từ ngày nhập kho, giá giảm thêm
 * 5% so với giá gốc (giá niêm yết). Các mốc đã qua hiện "Đã áp dụng", mốc kế tiếp hiện
 * "Sắp áp dụng" kèm số ngày còn lại.
 */

import { Alert, Modal, Tag, Timeline } from 'antd'
import {
  ArrowDownOutlined,
  ClockCircleOutlined,
  FieldTimeOutlined,
  HistoryOutlined,
  TagOutlined,
} from '@ant-design/icons'
import { buildPriceSchedule } from '../utils/buildPriceSchedule'
import { DROP_INTERVAL_DAYS, DROP_RATE } from '../constants/pricePolicyConstants'
import { formatPrice, formatDate } from '../../../utils/format'
import { getCarTitle } from '../../../utils/car'
import styles from '../styles/PriceHistoryModal.module.css'

const DROP_PERCENT = Math.round(DROP_RATE * 100)

export default function PriceHistoryModal({ open, car, onClose }) {
  const schedule = buildPriceSchedule(car)
  const { basePrice, entries, appliedCount, nextStep, daysInStock, daysToNextDrop, missingListedDate } = schedule
  const currentPrice = entries.find((entry) => entry.applied)?.price ?? null

  const items = entries.map((entry) => ({
    color: entry.applied ? 'blue' : 'gray',
    dot: entry.applied ? undefined : <ClockCircleOutlined />,
    children: (
      <article className={entry.applied ? styles.entry : styles.entryUpcoming}>
        <header className={styles.entryHead}>
          <strong className={styles.price}>{formatPrice(entry.price)}</strong>
          <Tag color={entry.applied ? 'blue' : 'default'}>
            {entry.applied ? 'Đã áp dụng' : 'Sắp áp dụng'}
          </Tag>
        </header>

        <p className={styles.meta}>
          {entry.step === 0
            ? 'Giá gốc khi nhập kho'
            : `Sau ${entry.step * DROP_INTERVAL_DAYS} ngày tồn kho · giảm ${formatPrice(entry.dropAmount)} (−${DROP_PERCENT}% giá gốc)`}
        </p>

        <p className={styles.meta}>
          {entry.effectiveDate ? (
            <>
              <FieldTimeOutlined aria-hidden="true" /> {formatDate(entry.effectiveDate)}
              {!entry.applied && daysToNextDrop != null && entry.step === nextStep?.step && (
                <> · còn {daysToNextDrop} ngày</>
              )}
            </>
          ) : 'Chưa xác định ngày áp dụng'}
        </p>

        {entry.totalPct > 0 && (
          <p className={styles.totalDrop}>
            <ArrowDownOutlined aria-hidden="true" /> Đã giảm tổng {formatPrice(entry.totalDrop)} ({entry.totalPct}%) so với giá gốc
          </p>
        )}
      </article>
    ),
  }))

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={(
        <span className={styles.modalTitle}>
          <HistoryOutlined className={styles.modalIcon} aria-hidden="true" /> Lịch sử giá
        </span>
      )}
      width={620}
      centered
      destroyOnHidden
      footer={null}
    >
      <div className={styles.head}>
        <strong className={styles.carName}>{getCarTitle(car) || 'Xe đang cập nhật'}</strong>
        <span className={styles.carCode}>Mã xe {car?.vehicleCode || '—'}</span>
      </div>

      <Alert
        type="info"
        showIcon
        icon={<TagOutlined />}
        title={`Chính sách: cứ ${DROP_INTERVAL_DAYS} ngày tồn kho giảm ${DROP_PERCENT}% giá gốc`}
        description="Mức giảm luôn tính trên giá gốc khi nhập kho, không cộng dồn theo giá đang bán."
        className={styles.policy}
      />

      {basePrice == null ? (
        <p className={styles.emptyNote}>Xe chưa có giá bán nên chưa dựng được lịch sử giá.</p>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Giá gốc</span>
              <strong>{formatPrice(basePrice)}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Giá theo chính sách hiện tại</span>
              <strong className={styles.currentPrice}>{formatPrice(currentPrice)}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Số đợt đã giảm</span>
              <strong>{appliedCount}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Số ngày tồn kho</span>
              <strong>{daysInStock == null ? '—' : `${daysInStock} ngày`}</strong>
            </div>
          </div>

          {missingListedDate && (
            <Alert
              type="warning"
              showIcon
              className={styles.warning}
              title="Xe chưa có ngày nhập kho"
              description="Không xác định được mốc giảm giá. Cập nhật ngày nhập kho để tính lịch sử giá."
            />
          )}

          <Timeline items={items} className={styles.timeline} />

          {nextStep && daysToNextDrop != null && (
            <p className={styles.nextNote}>
              Đợt giảm kế tiếp vào {formatDate(nextStep.effectiveDate)} — giá còn {formatPrice(nextStep.price)},
              tức giảm thêm {formatPrice(nextStep.dropAmount)}.
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
