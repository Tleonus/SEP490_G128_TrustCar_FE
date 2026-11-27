import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AppstoreOutlined,
  CarOutlined,
  CheckOutlined,
  CloseOutlined,
  CompassOutlined,
  CrownFilled,
  SafetyCertificateOutlined,
  StarFilled,
  ThunderboltFilled,
  TrophyFilled,
} from '@ant-design/icons'
import { formatMileage, formatPrice } from '../../../utils/format'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelFor } from '../constants/compareLabels'
import { CAR_LED_THEMES, analyzeCars, enrichGroups } from '../utils/compareInsights'
import styles from './CompareTable.module.css'

const titleOf = (car) => [car.make, car.model].filter(Boolean).join(' ') || 'Xe'

const GROUP_ICONS = {
  general: <CompassOutlined />,
  engine: <ThunderboltFilled />,
  seats: <AppstoreOutlined />,
  safety: <SafetyCertificateOutlined />,
}

const GROUP_NUMBERS = {
  general: '01',
  engine: '02',
  seats: '03',
  safety: '04',
}

/**Các hàng có thông số định lượng để vẽ thanh tỷ lệ trực quan kiểu Mercedes Technical Data */
const BAR_ROW_KEYS = new Set([
  'horsePower',
  'torqueNm',
  'engineDisplacementCC',
  'mileage',
  'fuelConsumption',
])

/**
 * Bảng so sánh xe phong cách Mercedes-Benz Showroom Configurator & Technical Spec List:
 * - Header trưng bày xe sang trọng với khung ảnh rộng 16:9, dải 3 thông số cốt lõi (Đời · Odo · Động cơ)
 *   và các huy hiệu Điểm nhấn ưu thế (Key Highlights) ngay dưới giá bán.
 * - Bảng thông số dạng Editorial List (đường kẻ ngang thanh mảnh, phân mục rõ ràng,
 *   làm nổi bật thông số thắng cuộc với huy hiệu + thanh tỷ lệ trực quan).
 */
export default function CompareTable({
  cars,
  groups,
  onRemove,
  analysis: externalAnalysis,
  highlightWinners = true,
  activeCategory = 'all',
}) {
  const carAnalysis = useMemo(
    () => (externalAnalysis?.length ? externalAnalysis : analyzeCars(cars)),
    [externalAnalysis, cars],
  )

  const richGroups = useMemo(() => {
    const enriched = enrichGroups(groups, cars)
    if (!activeCategory || activeCategory === 'all') return enriched
    return enriched.filter((g) => g.key === activeCategory)
  }, [groups, cars, activeCategory])

  const minPrice = useMemo(() => {
    const prices = cars.map((c) => c.price).filter((p) => typeof p === 'number' && p > 0)
    return prices.length >= 2 && new Set(prices).size > 1 ? Math.min(...prices) : null
  }, [cars])

  return (
    <div className={styles.showroomFrame}>
      <div className={styles.ledStripTop} aria-hidden="true" />

      <div className={styles.scroll} role="region" aria-label="Bảng so sánh xe" tabIndex={0}>
        <table className={styles.table} style={{ '--cols': cars.length }}>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                <span className={styles.srOnly}>Thuộc tính</span>
                <div className={styles.cornerBox}>
                  <span className={styles.cornerBadge}>TECHNICAL DATA</span>
                  <div className={styles.cornerTitle}>Đối chiếu thông số &amp; điểm nhấn</div>
                  <p className={styles.cornerHint}>
                    Thiết kế theo chuẩn danh mục thông số kỹ thuật hạng sang. Các hạng mục vượt trội được đánh dấu trực quan.
                  </p>
                  <div className={styles.legendStack}>
                    <span className={styles.legendChipWin}>
                      <TrophyFilled /> Điểm nhấn vượt trội
                    </span>
                    <span className={styles.legendChipDiff}>
                      <i /> Thông số khác biệt
                    </span>
                  </div>
                </div>
              </th>

              {cars.map((car, index) => {
                const theme = CAR_LED_THEMES[index % CAR_LED_THEMES.length]
                const info = carAnalysis[index]
                const isBestPrice = minPrice != null && car.price === minPrice
                const winCount = info?.highlights?.length ?? 0
                const hp = car.specifications?.horsePower
                const fuel = labelFor(FUEL_TYPE_LABEL, car.fuelType)
                const trans = labelFor(TRANSMISSION_LABEL, car.transmission)
                const body = labelFor(BODY_TYPE_LABEL, car.bodyType)

                return (
                  <th
                    scope="col"
                    className={styles.carHead}
                    key={car._id}
                    style={{
                      '--car-primary': theme.primary,
                      '--car-glow': theme.glow,
                      '--car-soft': theme.softBg,
                      '--car-border': theme.border,
                      '--car-gradient': theme.gradient,
                    }}
                  >
                    <div className={styles.podiumCard}>
                      {/* Hàng nhãn định danh trên cùng */}
                      <div className={styles.podiumTopRow}>
                        <div className={styles.podiumBadges}>
                          <span className={styles.slotBadge}>{theme.badge}</span>
                          {car.year && <span className={styles.yearPill}>{car.year}</span>}
                          {body && body !== 'Chưa cập nhật' && (
                            <span className={styles.bodyPill}>{body}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className={styles.removeIconBtn}
                          aria-label={`Bỏ ${titleOf(car)} khỏi so sánh`}
                          title="Bỏ mẫu xe này khỏi so sánh"
                          onClick={() => onRemove(car._id)}
                        >
                          <CloseOutlined />
                        </button>
                      </div>

                      {/* Khung ảnh xe tỷ lệ 16:9 sắc nét kiểu Mercedes Showroom */}
                      <Link to={`/xe/${car.vehicleCode || car._id}`} className={styles.photoLink}>
                        <div className={styles.photo}>
                          {car.primaryImageUrl ? (
                            <img src={car.primaryImageUrl} alt={titleOf(car)} loading="eager" />
                          ) : (
                            <div className={styles.photoPlaceholder}>
                              <CarOutlined />
                              <span>TrustCar Studio</span>
                            </div>
                          )}
                          <div className={styles.photoGradient} aria-hidden="true" />
                          <div className={styles.photoFloatingTags}>
                            {isBestPrice && (
                              <span className={styles.bestPriceOverlay}>
                                <CrownFilled /> GIÁ TỐT NHẤT
                              </span>
                            )}
                            {winCount > 0 && (
                              <span className={styles.winCountOverlay}>
                                <TrophyFilled /> {winCount} điểm nhấn ưu thế
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Định danh thương hiệu & tên dòng xe */}
                      <div className={styles.identityBlock}>
                        <span className={styles.brandKicker}>{car.make || 'TRUSTCAR CPO'}</span>
                        <Link to={`/xe/${car.vehicleCode || car._id}`} className={styles.name}>
                          {titleOf(car)}
                        </Link>
                        <div className={styles.variant}>
                          {car.variant || 'Phiên bản tiêu chuẩn · Đã kiểm định CPO'}
                        </div>
                      </div>

                      {/* Giá niêm yết */}
                      <div className={styles.priceBlock}>
                        <div className={styles.priceRow}>
                          <span className={styles.priceLabel}>Giá niêm yết</span>
                          <span className={styles.price}>{formatPrice(car.price)}</span>
                        </div>
                        {info?.marketSavings > 0 && (
                          <div className={styles.marketSaveTag}>
                            Tiết kiệm hơn thị trường {formatPrice(info.marketSavings)}
                          </div>
                        )}
                      </div>

                      {/* Dải 3 thông số cốt lõi (Mercedes Key Figures Strip) */}
                      <div className={styles.keyFiguresStrip} aria-label="Thông số cốt lõi">
                        <div className={styles.keyFigureItem}>
                          <span className={styles.keyFigureVal}>
                            {car.mileage != null ? formatMileage(car.mileage) : '—'}
                          </span>
                          <span className={styles.keyFigureLabel}>Số Odo</span>
                        </div>
                        <div className={styles.keyFigureItem}>
                          <span className={styles.keyFigureVal}>
                            {hp ? `${hp} HP` : (fuel !== 'Chưa cập nhật' ? fuel : '—')}
                          </span>
                          <span className={styles.keyFigureLabel}>
                            {hp ? 'Công suất' : 'Nhiên liệu'}
                          </span>
                        </div>
                        <div className={styles.keyFigureItem}>
                          <span className={styles.keyFigureVal}>
                            {trans !== 'Chưa cập nhật' ? trans.replace('Số ', '') : '—'}
                          </span>
                          <span className={styles.keyFigureLabel}>Hộp số</span>
                        </div>
                      </div>

                      {/* Điểm nhấn nổi bật của mẫu xe (Standout Highlights) */}
                      <div className={styles.highlightsBox}>
                        <span className={styles.highlightsTitle}>ĐIỂM NHẤN CỦA XE</span>
                        {info?.highlights?.length > 0 ? (
                          <div className={styles.headerHighlights}>
                            {info.highlights.slice(0, 3).map((h) => (
                              <span key={h.type} className={styles.miniAdvantage}>
                                <StarFilled /> {h.short}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={styles.neutralHighlight}>
                            Cấu hình cân bằng trong tầm giá
                          </span>
                        )}
                      </div>

                      {/* Nút thao tác */}
                      <div className={styles.headActions}>
                        <Link to={`/xe/${car.vehicleCode || car._id}`} className={styles.detailLink}>
                          Xem chi tiết xe →
                        </Link>
                      </div>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {richGroups.map((group) => (
              <Fragment key={group.key}>
                <tr
                  className={styles.groupRow}
                  style={{
                    '--group-accent': group.theme?.accent || '#1d4ed8',
                  }}
                >
                  <th scope="colgroup" colSpan={cars.length + 1}>
                    <div className={styles.groupBanner}>
                      <span className={styles.groupNumber}>
                        {GROUP_NUMBERS[group.key] || '•'}
                      </span>
                      <span className={styles.groupIcon}>{GROUP_ICONS[group.key]}</span>
                      <span className={styles.groupTitleText}>{group.title}</span>
                      <span className={styles.groupLine} aria-hidden="true" />
                      <span
                        className={`${styles.groupDiffCount} ${
                          group.diffCount > 0 ? styles.groupHasDiff : styles.groupAllSame
                        }`}
                      >
                        {group.diffCount > 0
                          ? `${group.diffCount} thông số khác biệt`
                          : 'Tương đồng 100%'}
                      </span>
                    </div>
                  </th>
                </tr>

                {group.rows.map((row) => {
                  const showMetricBar = BAR_ROW_KEYS.has(row.key) && row.hasDiff
                  const validNums = showMetricBar
                    ? row.cells.map((c) => c.rawValue).filter((v) => typeof v === 'number' && v > 0)
                    : []
                  const maxNum = validNums.length >= 2 ? Math.max(...validNums) : null

                  return (
                    <tr
                      key={row.key}
                      className={`${styles.dataRow} ${
                        row.hasDiff ? styles.rowDiff : styles.rowSame
                      }`}
                    >
                      <th scope="row" className={styles.label}>
                        <div className={styles.labelWrap}>
                          <span className={styles.labelText}>{row.label}</span>
                          {row.hasDiff && <span className={styles.diffTag}>Khác biệt</span>}
                        </div>
                      </th>

                      {row.cells.map((cell, index) => {
                        const theme = CAR_LED_THEMES[index % CAR_LED_THEMES.length]
                        const showWin = highlightWinners && cell.isWinner
                        const uniqueSet = new Set(cell.uniqueItems ?? [])
                        const barPct =
                          maxNum && typeof cell.rawValue === 'number' && cell.rawValue > 0
                            ? Math.max(18, Math.round((cell.rawValue / maxNum) * 100))
                            : null

                        return (
                          <td
                            key={cars[index]?._id ?? index}
                            className={`${styles.cell} ${showWin ? styles.cellWinner : ''}`}
                            style={{
                              '--car-primary': theme.primary,
                              '--car-glow': theme.glow,
                              '--car-soft': theme.softBg,
                              '--car-gradient': theme.gradient,
                            }}
                          >
                            <div className={styles.cellContent}>
                              {cell.items?.length ? (
                                <div className={styles.featureListWrap}>
                                  {showWin && cell.winnerLabel && (
                                    <div className={styles.winnerBadgeRow}>
                                      <span className={styles.winnerBadge}>
                                        <TrophyFilled /> {cell.winnerLabel} ({cell.items.length} trang bị)
                                      </span>
                                    </div>
                                  )}
                                  <ul className={styles.tags}>
                                    {cell.items.map((item) => {
                                      const isUnique = uniqueSet.has(item)
                                      return (
                                        <li
                                          key={item}
                                          className={
                                            isUnique ? styles.tagUnique : styles.tagShared
                                          }
                                          title={
                                            isUnique
                                              ? 'Điểm nhấn trang bị riêng biệt trên mẫu xe này'
                                              : 'Trang bị tiêu chuẩn có trên các xe'
                                          }
                                        >
                                          {isUnique ? (
                                            <StarFilled className={styles.tagStar} />
                                          ) : (
                                            <CheckOutlined className={styles.tagCheck} />
                                          )}
                                          <span>{item}</span>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              ) : (
                                <>
                                  <div className={styles.valueLine}>
                                    <span
                                      className={`${styles.cellValueText} ${
                                        cell.text === 'Chưa cập nhật' ? styles.mutedText : ''
                                      }`}
                                    >
                                      {cell.text}
                                    </span>
                                    {showWin && cell.winnerLabel && (
                                      <span className={styles.winnerBadge}>
                                        <TrophyFilled /> {cell.winnerLabel}
                                      </span>
                                    )}
                                  </div>

                                  {barPct != null && (
                                    <div className={styles.metricBarTrack} aria-hidden="true">
                                      <div
                                        className={`${styles.metricBarFill} ${
                                          showWin ? styles.metricBarFillWin : ''
                                        }`}
                                        style={{ width: `${barPct}%` }}
                                      />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.ledStripBottom} aria-hidden="true" />
    </div>
  )
}
