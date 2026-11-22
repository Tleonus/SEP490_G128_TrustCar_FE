import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Result, Switch, message } from 'antd'
import {
  CrownFilled,
  DeleteOutlined,
  PlusCircleOutlined,
  TrophyFilled,
} from '@ant-design/icons'
import { LoadingState, ErrorState } from '../../../components/common/StateBlock'
import { useCompareStore } from '../store/useCompareStore'
import { useComparison } from '../hooks/useComparison'
import { COMPARE_ERROR } from '../utils/compareErrors'
import { buildRows, isDifferent, onlyDifferences } from '../utils/compareRows'
import { analyzeCars } from '../utils/compareInsights'
import { MAX_COMPARE, MIN_COMPARE } from '../constants/compareConstants'
import CompareTable from '../components/CompareTable'
import CompareRecommendPanel from '../components/CompareRecommendPanel'
import styles from './ComparePage.module.css'

const CATEGORY_TABS = [
  { key: 'all', label: 'Tất cả hạng mục' },
  { key: 'general', label: 'Thông tin chung' },
  { key: 'engine', label: 'Động cơ & Vận hành' },
  { key: 'seats', label: 'Chỗ ngồi' },
  { key: 'safety', label: 'An toàn & Tiện nghi' },
]

function Notice({ status = 'info', title, subTitle, actionLabel = 'Xem danh sách xe', selectedItems = [], onClear }) {
  return (
    <div className={styles.noticeCard}>
      <Result
        status={status}
        title={title}
        subTitle={subTitle}
        extra={
          <div className={styles.noticeActions}>
            <Link to="/xe">
              <Button type="primary" size="large">
                {actionLabel}
              </Button>
            </Link>
            {selectedItems.length > 0 && (
              <Button size="large" onClick={onClear}>
                Xóa xe đã chọn ({selectedItems.length})
              </Button>
            )}
          </div>
        }
      />
      {selectedItems.length === 1 && (
        <div className={styles.singleSelectedHint}>
          <span>
            Đã chọn 1 xe: <strong>{selectedItems[0].title}</strong> — Hãy bấm{' '}
            <strong>"Thêm vào so sánh"</strong> ở danh sách gợi ý bên dưới để bắt đầu ngay.
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Trang so sánh xe phong cách Showroom Spotlight sang trọng & tinh tế.
 * Gọi API đúng một lần theo danh sách chọn tại lúc mở trang; bỏ xe tại trang không gọi lại.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F12
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F13
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F14
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F15
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F16
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F17
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F18
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F19
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F20
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F21
 */
export default function ComparePage() {
  const items = useCompareStore((state) => state.items)
  const toggle = useCompareStore((state) => state.toggle)
  const remove = useCompareStore((state) => state.remove)
  const prune = useCompareStore((state) => state.prune)
  const clear = useCompareStore((state) => state.clear)

  // Ảnh chụp danh sách tại lúc mở trang: chỉ gọi API khi đủ số xe tối thiểu.
  const [activeIds, setActiveIds] = useState(() =>
    items.length >= MIN_COMPARE ? items.map((item) => item.id) : [],
  )
  const { status, data, error, retry } = useComparison(activeIds)

  const [differencesOnly, setDifferencesOnly] = useState(false)
  const [highlightWinners, setHighlightWinners] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')

  const errorKind = error?.kind
  useEffect(() => {
    if (status === 'success' && data?.unavailableIds?.length) prune(data.unavailableIds)
  }, [status, data, prune])

  useEffect(() => {
    if (status !== 'error') return
    if (errorKind === COMPARE_ERROR.NOT_ENOUGH) prune(error.unavailableIds)
    else if (errorKind === COMPARE_ERROR.INVALID) clear()
  }, [status, errorKind, error, prune, clear])

  const selectedIds = useMemo(() => new Set(items.map((item) => item.id)), [items])
  const cars = useMemo(
    () => (data?.cars ?? []).filter((car) => selectedIds.has(String(car._id).toLowerCase())),
    [data, selectedIds],
  )

  const allGroups = useMemo(() => buildRows(cars), [cars])
  const groups = useMemo(
    () => (differencesOnly ? onlyDifferences(allGroups) : allGroups),
    [allGroups, differencesOnly],
  )

  const analysis = useMemo(() => analyzeCars(cars), [cars])

  const stats = useMemo(() => {
    let totalRows = 0
    let diffRows = 0
    const groupDiffMap = {}
    allGroups.forEach((g) => {
      let gDiff = 0
      g.rows.forEach((r) => {
        totalRows += 1
        if (isDifferent(r)) {
          diffRows += 1
          gDiff += 1
        }
      })
      groupDiffMap[g.key] = gDiff
    })
    const topCar = analysis.find((a) => a.isTopOverall) ?? analysis[0] ?? null
    return { totalRows, diffRows, groupDiffMap, topCar }
  }, [allGroups, analysis])

  const handleAddRecommendedCar = useCallback(
    (car) => {
      const res = toggle(car)
      if (res === 'added') {
        const nextItems = useCompareStore.getState().items
        if (nextItems.length >= MIN_COMPARE) {
          setActiveIds(nextItems.map((item) => item.id))
          message.success(`Đã thêm ${car.make || ''} ${car.model || ''} vào bàn cân so sánh!`)
        } else {
          message.info('Đã chọn 1 xe! Hãy chọn thêm 1 xe nữa để bắt đầu so sánh.')
        }
      } else if (res === 'full') {
        message.warning(`Chỉ so sánh tối đa ${MAX_COMPARE} xe. Bạn có thể bấm "Đổi" để thế chỗ.`)
      }
    },
    [toggle],
  )

  const handleReplaceCar = useCallback(
    (oldId, newCar) => {
      if (oldId) remove(oldId)
      const res = toggle(newCar)
      if (res === 'added') {
        const nextItems = useCompareStore.getState().items
        if (nextItems.length >= MIN_COMPARE) {
          setActiveIds(nextItems.map((item) => item.id))
          message.success(`Đã đổi sang ${newCar.make || ''} ${newCar.model || ''} để so sánh!`)
        }
      }
    },
    [remove, toggle],
  )

  const handleApplyMatchup = useCallback(
    (pairCars) => {
      clear()
      pairCars.forEach((c) => toggle(c))
      const nextItems = useCompareStore.getState().items
      if (nextItems.length >= MIN_COMPARE) {
        setActiveIds(nextItems.map((item) => item.id))
        message.success('Đã nạp cặp xe đối thủ vào bàn cân Showroom!')
      }
    },
    [clear, toggle],
  )

  const handleClearAll = useCallback(() => {
    clear()
    setActiveIds([])
  }, [clear])

  let content
  if (status === 'idle') {
    content = (
      <>
        <Notice
          title="Chọn ít nhất 2 xe để so sánh"
          subTitle="Hãy chọn xe từ danh sách kho xe hoặc chọn ngay các cặp xe gợi ý bên dưới."
          selectedItems={items}
          onClear={handleClearAll}
        />
        <CompareRecommendPanel
          mode="inventory"
          cars={items}
          canAddMore={items.length < MAX_COMPARE}
          onAddCar={handleAddRecommendedCar}
          onReplaceCar={handleReplaceCar}
          onApplyMatchup={handleApplyMatchup}
        />
      </>
    )
  } else if (status === 'loading') {
    content = <LoadingState text="Đang tải bảng so sánh..." />
  } else if (status === 'error') {
    if (errorKind === COMPARE_ERROR.NETWORK) {
      content = <ErrorState message={error.message} onRetry={retry} />
    } else if (errorKind === COMPARE_ERROR.NOT_ENOUGH) {
      content = (
        <>
          <Notice
            status="warning"
            title={error.message}
            subTitle="Xe bạn chọn có thể đã được bán hoặc gỡ khỏi website."
            selectedItems={items}
            onClear={handleClearAll}
          />
          <CompareRecommendPanel
            mode="inventory"
            cars={items}
            canAddMore={items.length < MAX_COMPARE}
            onAddCar={handleAddRecommendedCar}
            onReplaceCar={handleReplaceCar}
            onApplyMatchup={handleApplyMatchup}
          />
        </>
      )
    } else if (errorKind === COMPARE_ERROR.INVALID) {
      content = <Notice status="warning" title={error.message} />
    } else {
      content = <Notice status="warning" title={error.message} actionLabel="Về danh sách xe" />
    }
  } else if (cars.length < MIN_COMPARE) {
    content = (
      <>
        <Notice
          title="Chọn ít nhất 2 xe để so sánh"
          subTitle="Hãy chọn thêm xe từ kho xe hoặc bấm 'Thêm vào so sánh' ở phần gợi ý bên dưới."
          selectedItems={items}
          onClear={handleClearAll}
        />
        <CompareRecommendPanel
          mode="inventory"
          cars={cars}
          canAddMore={items.length < MAX_COMPARE}
          onAddCar={handleAddRecommendedCar}
          onReplaceCar={handleReplaceCar}
          onApplyMatchup={handleApplyMatchup}
        />
      </>
    )
  } else {
    const unavailable = data.unavailableIds?.length ?? 0
    content = (
      <>
        {unavailable > 0 && (
          <Alert
            type="warning"
            showIcon
            className={styles.alert}
            title={`${unavailable} xe không còn bán và đã được bỏ khỏi so sánh.`}
          />
        )}

        {/* KHỐI TƯ VẤN CHỌN XE THEO NHU CẦU */}
        <CompareRecommendPanel
          mode="advisor"
          cars={cars}
          analysis={analysis}
          canAddMore={cars.length < MAX_COMPARE}
          onAddCar={handleAddRecommendedCar}
          onReplaceCar={handleReplaceCar}
          onApplyMatchup={handleApplyMatchup}
        />

        {/* THANH ĐIỀU KHIỂN TINH GỌN */}
        <div className={styles.controlDeck}>
          <div className={styles.toolbar}>
            <div className={styles.switchGroup}>
              <label className={styles.switch}>
                <Switch
                  checked={differencesOnly}
                  onChange={setDifferencesOnly}
                  aria-label="Chỉ hiện điểm khác biệt"
                />
                <span className={styles.switchLabelText}>
                  Chỉ hiện điểm khác biệt ({stats.diffRows})
                </span>
              </label>

              <label className={styles.switch}>
                <Switch
                  checked={highlightWinners}
                  onChange={setHighlightWinners}
                  aria-label="Tô sáng thông số vượt trội"
                />
                <span className={styles.switchLabelText}>
                  <TrophyFilled className={styles.trophyIcon} /> Làm nổi bật ưu thế từng xe
                </span>
              </label>
            </div>

            <div className={styles.toolbarActions}>
              {cars.length < MAX_COMPARE && (
                <Link to="/xe" className={styles.addMore}>
                  <PlusCircleOutlined /> Thêm xe thứ {cars.length + 1}
                </Link>
              )}
              <button type="button" className={styles.clearBtn} onClick={handleClearAll}>
                <DeleteOutlined /> Xóa tất cả
              </button>
            </div>
          </div>

          <div className={styles.categoryNav} role="tablist" aria-label="Nhóm thông số">
            {CATEGORY_TABS.map((tab) => {
              const active = activeCategory === tab.key
              const diffCount =
                tab.key === 'all' ? stats.diffRows : stats.groupDiffMap[tab.key] ?? 0
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.catBtn} ${active ? styles.catBtnActive : ''}`}
                  onClick={() => setActiveCategory(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className={styles.catCount}>{diffCount} khác biệt</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* BẢNG SO SÁNH KHUNG 3D ÁNH ĐÈN SHOWROOM */}
        {groups.length === 0 ? (
          <Alert
            type="info"
            showIcon
            className={styles.sameAlert}
            title="Các xe giống nhau ở mọi thông số đang hiển thị."
          />
        ) : (
          <CompareTable
            cars={cars}
            groups={groups}
            onRemove={remove}
            analysis={analysis}
            highlightWinners={highlightWinners}
            activeCategory={activeCategory}
          />
        )}

        {/* GỢI Ý XE TƯƠNG TỰ TỪ KHO XE */}
        <CompareRecommendPanel
          mode="inventory"
          cars={cars}
          analysis={analysis}
          canAddMore={cars.length < MAX_COMPARE}
          onAddCar={handleAddRecommendedCar}
          onReplaceCar={handleReplaceCar}
          onApplyMatchup={handleApplyMatchup}
        />
      </>
    )
  }

  return (
    <div className="container">
      <div className={styles.page}>
        {/* HERO BANNER ÁNH ĐÈN CHIẾU SHOWROOM SANG TRỌNG */}
        <header className={styles.heroBanner}>
          <div className={styles.heroLedTop} aria-hidden="true" />
          <div className={styles.spotlightBeams} aria-hidden="true" />

          <div className={styles.heroContent}>
            <div className={styles.heroLeft}>
              <span className={styles.heroEyebrow}>
                TRUSTCAR EXECUTIVE SHOWROOM • SO SÁNH CHUYÊN SÂU
              </span>
              <h1 className={styles.title}>So sánh xe</h1>
              <p className={styles.heroSubtitle}>
                Đối chiếu chi tiết thông số kỹ thuật, trang bị an toàn và nhận gợi ý mẫu xe phù hợp
                nhất với nhu cầu sử dụng của bạn.
              </p>
            </div>

            {cars.length >= MIN_COMPARE && (
              <div className={styles.heroStats}>
                <div className={styles.statCard}>
                  <span className={styles.statVal}>
                    {cars.length}/{MAX_COMPARE}
                  </span>
                  <span className={styles.statLabel}>Xe đang đối chiếu</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statVal}>{stats.diffRows}</span>
                  <span className={styles.statLabel}>Thông số khác biệt</span>
                </div>
                {stats.topCar && (
                  <div className={`${styles.statCard} ${styles.statCardGold}`}>
                    <span className={styles.statCrown}>
                      <CrownFilled /> ĐỀ XUẤT TỔNG THỂ ({stats.topCar.scores.overall}/100)
                    </span>
                    <span className={styles.statTopName}>{stats.topCar.title}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {content}
      </div>
    </div>
  )
}
