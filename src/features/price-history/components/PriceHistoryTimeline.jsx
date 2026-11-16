/**
 * KAN-45 – Block "Lịch sử giá" trong trang chi tiết xe của Admin (/admin/inventory/:id).
 *
 * Dữ liệu là mảng `car.priceHistory` mà trang đã tải sẵn qua GET /manage/cars/:id — Backend
 * populate `priceHistory.changedBy` (fullName, email) ở carService.getCarById, nên không cần
 * gọi thêm API nào.
 *
 * Props:
 *  - priceHistory: mảng car.priceHistory
 *  - loading:      true khi trang cha còn đang tải xe → hiện Skeleton
 *  - currentPrice: car.price, để cảnh báo nếu lịch sử lệch với giá hiện tại
 */

import { Empty, Skeleton, Tag, Timeline, Tooltip } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  HistoryOutlined,
  MinusOutlined,
  PlusCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { buildPriceHistoryEntries, formatVnd } from '../utils/priceHistoryTimeline'
import { EMPTY_TEXT, TREND_COLOR } from '../constants/priceHistoryConstants'
import styles from '../styles/PriceHistoryTimeline.module.css'

const pctFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })

const TREND_META = {
  up: { icon: <ArrowUpOutlined />, label: 'Tăng giá', tagColor: 'success' },
  down: { icon: <ArrowDownOutlined />, label: 'Giảm giá', tagColor: 'error' },
  same: { icon: <MinusOutlined />, label: 'Giữ nguyên', tagColor: 'default' },
  initial: { icon: <PlusCircleOutlined />, label: 'Giá ban đầu', tagColor: 'processing' },
}

function EntryContent({ item }) {
  const meta = TREND_META[item.trend]
  const changeClass = item.trend === 'up'
    ? styles.changeUp
    : item.trend === 'down'
      ? styles.changeDown
      : styles.changeNeutral

  return (
    <article className={styles.entry}>
      <header className={styles.entryHead}>
        <time className={styles.time} dateTime={item.changedAt ? new Date(item.changedAt).toISOString() : undefined}>
          {item.changedAtText}
        </time>
        <Tag color={meta.tagColor} icon={meta.icon} className={styles.trendTag}>
          {meta.label}
        </Tag>
      </header>

      <div className={styles.prices}>
        {item.oldPriceText && (
          <>
            <span className={styles.oldPrice} aria-label={`Giá cũ ${item.oldPriceText}`}>
              {item.oldPriceText}
            </span>
            <span className={styles.arrow} aria-hidden="true">→</span>
          </>
        )}
        <strong className={styles.newPrice} aria-label={`Giá mới ${item.newPriceText}`}>
          {item.newPriceText}
        </strong>
      </div>

      {item.deltaText && item.trend !== 'same' && (
        <p className={changeClass}>
          {item.deltaText}
          {item.deltaPct != null && (
            <span className={styles.pct}>
              ({item.deltaPct > 0 ? '+' : '−'}{pctFormatter.format(Math.abs(item.deltaPct))}%)
            </span>
          )}
        </p>
      )}

      <dl className={styles.meta}>
        <div className={styles.metaRow}>
          <dt>Lý do</dt>
          <dd>{item.reason}</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>Người thực hiện</dt>
          <dd className={styles.user}>
            <UserOutlined aria-hidden="true" /> {item.changedBy}
          </dd>
        </div>
      </dl>
    </article>
  )
}

export default function PriceHistoryTimeline({ priceHistory, loading, currentPrice }) {
  const entries = buildPriceHistoryEntries(priceHistory)
  const latest = entries[0]
  const first = entries.at(-1)
  const totalDelta = latest && first && entries.length > 1 && latest.newPrice != null && first.newPrice != null
    ? latest.newPrice - first.newPrice
    : null
  // Lịch sử là append-only; nếu mốc mới nhất khác car.price thì có thay đổi giá
  // không đi qua carService (ví dụ sửa thẳng DB). Báo cho người xem thay vì im lặng.
  const mismatch = latest && currentPrice != null && latest.newPrice != null && latest.newPrice !== Number(currentPrice)

  return (
    <section className={styles.block} aria-labelledby="price-history-title">
      <header className={styles.blockHead}>
        <div>
          <h2 id="price-history-title">
            <HistoryOutlined aria-hidden="true" /> Lịch sử giá
          </h2>
          <p>Các lần điều chỉnh giá của xe, mới nhất lên đầu.</p>
        </div>
        {!loading && entries.length > 1 && (
          <div className={styles.summary}>
            <span className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Số lần đổi giá</span>
              <strong>{entries.length - 1}</strong>
            </span>
            {totalDelta != null && (
              <Tooltip title={`Từ ${formatVnd(first.newPrice)} xuống/lên ${formatVnd(latest.newPrice)}`}>
                <span className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Chênh lệch từ giá đầu</span>
                  <strong className={totalDelta < 0 ? styles.changeDown : totalDelta > 0 ? styles.changeUp : styles.changeNeutral}>
                    {totalDelta > 0 ? '+' : totalDelta < 0 ? '−' : ''}{formatVnd(Math.abs(totalDelta))}
                  </strong>
                </span>
              </Tooltip>
            )}
          </div>
        )}
      </header>

      {loading ? (
        <div className={styles.skeleton} aria-busy="true" role="status">
          {[0, 1, 2].map((row) => (
            <div key={row} className={styles.skeletonRow}>
              <Skeleton.Avatar active size={14} shape="circle" />
              <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 2, width: ['70%', '50%'] }} />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={EMPTY_TEXT} />
      ) : (
        <>
          {mismatch && (
            <p className={styles.warning} role="note">
              Giá hiện tại của xe ({formatVnd(Number(currentPrice))}) khác mốc mới nhất trong lịch sử.
              Có thể giá đã được đổi không qua chức năng sửa giá.
            </p>
          )}
          <Timeline
            className={styles.timeline}
            items={entries.map((item) => ({
              key: item.key,
              color: TREND_COLOR[item.trend],
              content: <EntryContent item={item} />,
            }))}
          />
        </>
      )}
    </section>
  )
}
