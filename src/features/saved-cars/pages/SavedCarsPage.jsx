import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Popconfirm, Segmented, Select, message } from 'antd'
import {
  ArrowDownOutlined,
  BellFilled,
  CarOutlined,
  CheckCircleFilled,
  ClearOutlined,
  HeartFilled,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltFilled,
  WalletOutlined,
} from '@ant-design/icons'
import { useSavedCarsStore } from '../store/useSavedCarsStore'
import { useSavedCarPrices } from '../hooks/useSavedCarPrices'
import SavedCarItem from '../components/SavedCarItem'
import PriceAlertModal from '../components/PriceAlertModal'
import {
  MAX_ACCOUNT_SAVED_CARS,
  MAX_GUEST_SAVED_CARS,
  formatCompactPrice,
  formatRelativeTime,
  getPriceChange,
  hasUnseenAlert,
  isPriceDropped,
  isTargetReached,
} from '../utils/savedCars'
import styles from './SavedCarsPage.module.css'

const FILTERS = {
  all: () => true,
  dropped: isPriceDropped,
  alerts: (item) => item.alert.enabled,
  unavailable: (item) => item.status === 'UNAVAILABLE',
}

const SORTERS = {
  recent: (a, b) => b.savedAt - a.savedAt,
  drop: (a, b) => getPriceChange(b).percent - getPriceChange(a).percent,
  priceAsc: (a, b) => (a.currentPrice ?? Infinity) - (b.currentPrice ?? Infinity),
  priceDesc: (a, b) => (b.currentPrice ?? -Infinity) - (a.currentPrice ?? -Infinity),
}

function StatCard({ icon, tone, label, value, hint }) {
  return (
    <div className={`${styles.stat} ${styles[tone]}`}>
      <span className={styles.statIcon} aria-hidden="true">{icon}</span>
      <div className={styles.statCopy}>
        <span className={styles.statLabel}>{label}</span>
        <strong className={styles.statValue}>{value}</strong>
        {hint && <span className={styles.statHint}>{hint}</span>}
      </div>
    </div>
  )
}

function SavedCarsLoading() {
  return (
    <div className={styles.loadingList} role="status" aria-label="Đang tải xe đã lưu">
      {[0, 1].map((row) => (
        <div key={row} className={styles.loadingCard} aria-hidden="true">
          <div className={styles.loadingMedia} />
          <div className={styles.loadingBody}>
            <span className={[styles.skeleton, styles.skeletonTitle].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonMeta].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonPrice].join(' ')} />
            <span className={[styles.skeleton, styles.skeletonFooter].join(' ')} />
          </div>
        </div>
      ))}
    </div>
  )
}

function WishlistLoadError() {
  return (
    <div className={styles.loadError} role="alert">
      <InfoCircleOutlined />
      <div>
        <h2>Không tải được danh sách xe</h2>
        <p>Thử tải lại trang để kết nối lại với tài khoản của bạn.</p>
      </div>
      <Button onClick={() => window.location.reload()}>Tải lại</Button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyArt} aria-hidden="true">
        <HeartFilled />
      </div>
      <h2>Chưa có xe nào được lưu</h2>
      <p>Lưu xe từ danh sách để xem lại thông tin và giá tại đây.</p>
      <div className={styles.emptyActions}>
        <Link to="/xe"><Button type="primary" size="large" icon={<CarOutlined />}>Khám phá kho xe</Button></Link>
      </div>
    </div>
  )
}

/** Trang xe đã lưu: theo dõi giá, cảnh báo giảm giá và so sánh nhanh. */
export default function SavedCarsPage() {
  const items = useSavedCarsStore((state) => state.items)
  const loading = useSavedCarsStore((state) => state.loading)
  const loadError = useSavedCarsStore((state) => state.error)
  const isAuthenticatedMode = useSavedCarsStore((state) => state.isAuthenticatedMode)
  const maxSavedCars = isAuthenticatedMode ? MAX_ACCOUNT_SAVED_CARS : MAX_GUEST_SAVED_CARS
  const setAlert = useSavedCarsStore((state) => state.setAlert)
  const remove = useSavedCarsStore((state) => state.remove)
  const restore = useSavedCarsStore((state) => state.restore)
  const clear = useSavedCarsStore((state) => state.clear)
  const markAlertsSeen = useSavedCarsStore((state) => state.markAlertsSeen)
  const { status, failed, refresh } = useSavedCarPrices()

  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [editing, setEditing] = useState(null)

  const stats = useMemo(() => {
    const dropped = items.filter(isPriceDropped)
    return {
      total: items.length,
      dropped: dropped.length,
      savings: dropped.reduce((sum, item) => Math.max(0, sum + getPriceChange(item).amount), 0),
      alerts: items.filter((item) => item.alert.enabled).length,
      reached: items.filter(isTargetReached).length,
      unavailable: items.filter((item) => item.status === 'UNAVAILABLE').length,
      lastChecked: items.reduce((max, item) => Math.max(max, item.checkedAt ?? 0), 0),
    }
  }, [items])

  const unseen = useMemo(() => items.filter(hasUnseenAlert), [items])
  const visible = useMemo(() => items.filter(FILTERS[filter]).sort(SORTERS[sort]), [items, filter, sort])

  // Khi rời trang, đánh dấu các thông báo đã xem để badge ở header tắt.
  useEffect(() => () => useSavedCarsStore.getState().markAlertsSeen(), [])

  function handleRemove(item) {
    remove(item.id)
    message.open({
      type: 'info',
      key: `removed-${item.id}`,
      content: (
        <span>
          Đã bỏ lưu {item.title}.{' '}
          <button type="button" className={styles.undo} onClick={async () => {
            const restored = await restore(item)
            if (restored === true) message.destroy(`removed-${item.id}`)
            else if (restored === 'full') message.warning('Danh sách đã đạt giới hạn ' + maxSavedCars + ' xe.')
            else message.error('Không thể khôi phục xe đã lưu. Vui lòng thử lại.')
          }}>
            Hoàn tác
          </button>
        </span>
      ),
      duration: 5,
    })
  }

  function handleSaveAlert(alert) {
    setAlert(editing.id, alert)
    message.success(alert.enabled ? 'Đã bật cảnh báo giảm giá.' : 'Đã tắt cảnh báo cho xe này.')
    setEditing(null)
  }

  const filterOptions = [
    { value: 'all', label: `Tất cả (${stats.total})` },
    { value: 'dropped', label: `Đang giảm giá (${stats.dropped})` },
    { value: 'alerts', label: `Đang theo dõi (${stats.alerts})` },
    ...(stats.unavailable ? [{ value: 'unavailable', label: `Không còn bán (${stats.unavailable})` }] : []),
  ]

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div>
              <h1>Xe bạn đã lưu</h1>
              <p>Theo dõi giá và quay lại với những lựa chọn bạn đang cân nhắc.</p>
            </div>
            {items.length > 0 && (
              <div className={styles.heroActions}>
                <span className={styles.syncNote}>
                  {status === 'loading' ? 'Đang cập nhật giá...' : `Cập nhật ${formatRelativeTime(stats.lastChecked)}`}
                </span>
                <Button icon={<ReloadOutlined spin={status === 'loading'} />} onClick={refresh} disabled={status === 'loading'} className={styles.heroPrimaryBtn}>
                  Cập nhật giá
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container">
        {items.length === 0 ? (
          loading ? <SavedCarsLoading /> : loadError ? <WishlistLoadError /> : <EmptyState />
        ) : (
          <div className={styles.contentStack}>
            <div className={styles.stats}>
              <StatCard icon={<HeartFilled />} tone="rose" label="Xe đã lưu" value={stats.total} hint={'Tối đa ' + maxSavedCars + ' xe'} />
              <StatCard icon={<ArrowDownOutlined />} tone="green" label="Đang giảm giá" value={stats.dropped} hint="So với giá lúc lưu" />
              <StatCard icon={<WalletOutlined />} tone="blue" label="Có thể tiết kiệm" value={stats.savings > 0 ? formatCompactPrice(stats.savings) : '0 ₫'} hint="Tổng mức giảm hiện tại" />
              <StatCard icon={<BellFilled />} tone="blue" label="Cảnh báo đang bật" value={stats.alerts} hint={stats.reached ? `${stats.reached} xe đã chạm giá mục tiêu` : 'Nhận thông báo tự động'} />
            </div>

            {/* Hàng 2: Thông báo biến động giá (nếu có) */}
            {unseen.length > 0 && (
              <div className={styles.dropBanner} role="status">
                <span className={styles.dropIcon}><ThunderboltFilled /></span>
                <div className={styles.dropCopy}>
                  <strong>{unseen.length} xe trong danh sách của bạn vừa có thông báo giá tốt!</strong>
                  <div className={styles.dropChips}>
                    {unseen.slice(0, 3).map((item) => {
                      const diff = getPriceChange(item).amount
                      return (
                        <span key={item.id}>
                          {item.title} {diff > 0 && <b>-{formatCompactPrice(diff)}</b>}
                        </span>
                      )
                    })}
                    {unseen.length > 3 && <span>+{unseen.length - 3} xe khác</span>}
                  </div>
                </div>
                <div className={styles.dropActions}>
                  <Button type="primary" onClick={() => setFilter('dropped')}>Xem xe giảm giá</Button>
                  <Button onClick={markAlertsSeen}>Đánh dấu đã xem</Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className={styles.warnBanner}>
                <InfoCircleOutlined /> Không cập nhật được giá mới từ máy chủ. Đang hiển thị giá lần cập nhật gần nhất.
              </div>
            )}
            {status === 'success' && failed > 0 && (
              <div className={styles.warnBanner}>
                <InfoCircleOutlined /> Chưa cập nhật được giá của {failed} xe. Đang hiển thị giá lần cập nhật gần nhất.
              </div>
            )}

            <div className={styles.toolbarCard}>
              <Segmented value={filter} onChange={setFilter} options={filterOptions} className={styles.segmented} />
              <div className={styles.toolbarRight}>
                <Select
                  value={sort}
                  onChange={setSort}
                  className={styles.sort}
                  aria-label="Sắp xếp"
                  options={[
                    { value: 'recent', label: 'Mới lưu gần đây' },
                    { value: 'drop', label: 'Giảm giá nhiều nhất' },
                    { value: 'priceAsc', label: 'Giá thấp đến cao' },
                    { value: 'priceDesc', label: 'Giá cao đến thấp' },
                  ]}
                />
                <Popconfirm
                  title="Xóa toàn bộ danh sách xe đã lưu?"
                  description="Tất cả xe và thiết lập cảnh báo giá sẽ bị xóa khỏi trình duyệt."
                  okText="Xóa tất cả"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => {
                    clear()
                    setFilter('all')
                    message.info('Đã xóa toàn bộ danh sách xe đã lưu.')
                  }}
                >
                  <Button icon={<ClearOutlined />} danger>Xóa tất cả</Button>
                </Popconfirm>
              </div>
            </div>

            {/* Hàng 4: Bố cục 2 cột thẳng hàng tuyệt đối ở cạnh trên */}
            <div className={styles.layout}>
              <main className={styles.main}>
                {visible.length === 0 ? (
                  <div className={styles.filterEmpty}>
                    <CheckCircleFilled />
                    <p>Không có xe nào trong danh mục lọc này.</p>
                    <Button onClick={() => setFilter('all')}>Xem tất cả xe đã lưu</Button>
                  </div>
                ) : (
                  <div className={styles.list}>
                    {visible.map((item) => (
                      <SavedCarItem key={item.id} item={item} onEditAlert={setEditing} onRemove={handleRemove} />
                    ))}
                  </div>
                )}
              </main>

              <aside className={styles.aside}>
                <div className={styles.panel}>
                  <h2>
                    <span className={styles.panelIcon}><BellFilled /></span>
                    Nhật ký biến động giá
                  </h2>
                  {items.filter((item) => getPriceChange(item).direction !== 'flat' && item.status === 'AVAILABLE').length === 0 ? (
                    <p className={styles.panelEmpty}>Chưa có biến động giá. Hệ thống sẽ ghi nhận tại đây ngay khi xe bạn lưu thay đổi giá niêm yết.</p>
                  ) : (
                    <ul className={styles.timeline}>
                      {items
                        .filter((item) => getPriceChange(item).direction !== 'flat' && item.status === 'AVAILABLE')
                        .sort((a, b) => (b.history.at(-1)?.at ?? 0) - (a.history.at(-1)?.at ?? 0))
                        .slice(0, 6)
                        .map((item) => {
                          const change = getPriceChange(item)
                          return (
                            <li key={item.id} className={styles[change.direction]}>
                              <span className={styles.dot} />
                              <div>
                                <strong>{item.title}</strong>
                                <span>
                                  {change.direction === 'down' ? 'Giảm' : 'Tăng'} {formatCompactPrice(Math.abs(change.amount))}
                                  {' · '}{formatRelativeTime(item.history.at(-1)?.at)}
                                </span>
                              </div>
                            </li>
                          )
                        })}
                    </ul>
                  )}
                </div>

                <div className={`${styles.panel} ${styles.tips}`}>
                  <h2>
                    <span className={styles.panelIcon}><SafetyCertificateOutlined /></span>
                    Cách cảnh báo hoạt động
                  </h2>
                  <ol>
                    <li>Giá lúc bạn lưu được ghi lại làm mốc so sánh ban đầu.</li>
                    <li>Mỗi lần mở trang, TrustCar tự động đồng bộ giá mới nhất và vẽ biểu đồ biến động.</li>
                    <li>Đặt giá mục tiêu theo % hoặc số tiền để nhận huy hiệu báo ngay khi giá chạm ngưỡng.</li>
                  </ol>
                  <p className={styles.tipNote}>
                    Danh sách được lưu ngay trên trình duyệt. Xe đã bán sẽ được tự động đánh dấu &ldquo;Không còn bán&rdquo;.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

      <PriceAlertModal item={editing} open={Boolean(editing)} onClose={() => setEditing(null)} onSave={handleSaveAlert} />
    </div>
  )
}
