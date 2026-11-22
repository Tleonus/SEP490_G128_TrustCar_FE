import { Fragment, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from 'antd'
import {
  AppstoreOutlined,
  CarOutlined,
  CloseOutlined,
  CompassOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  ThunderboltFilled,
  TrophyFilled,
} from '@ant-design/icons'
import { formatPrice } from '../../../utils/format'
import { CAR_LED_THEMES, analyzeCars, enrichGroups } from '../utils/compareInsights'
import styles from './CompareTable.module.css'

const titleOf = (car) => [car.make, car.model].filter(Boolean).join(' ') || 'Xe'

const GROUP_ICONS = {
  general: <CompassOutlined />,
  engine: <ThunderboltFilled />,
  seats: <AppstoreOutlined />,
  safety: <SafetyCertificateOutlined />,
}

/**
 * Bảng so sánh khung 3D ánh đèn chiếu Showroom (Showroom Spotlight):
 * - Thiết kế sang trọng với ánh đèn rọi trần dịu nhẹ trên từng khoang xe.
 * - Tô sáng tinh tế các dòng có sự khác biệt và các thông số chiếm ưu thế.
 *
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F13
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F20
 * @ears .sdd/features/vehicle-comparison/SPEC.md#REQ-F22
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
      {/* Dải đèn LED hắt trần Showroom mảnh & tinh tế */}
      <div className={styles.ledStripTop} aria-hidden="true" />

      <div className={styles.scroll} role="region" aria-label="Bảng so sánh xe" tabIndex={0}>
        <table className={styles.table} style={{ '--cols': cars.length }}>
          <thead>
            <tr>
              <th scope="col" className={styles.corner}>
                <span className={styles.srOnly}>Thuộc tính</span>
                <div className={styles.cornerBox}>
                  <span className={styles.cornerBadge}>SHOWROOM COMPARE</span>
                  <div className={styles.cornerTitle}>Thông số kỹ thuật</div>
                  <p className={styles.cornerHint}>
                    Đối chiếu trực tiếp từng hạng mục. Các thông số vượt trội được đánh dấu nổi bật.
                  </p>
                  <div className={styles.legendStack}>
                    <span className={styles.legendChipDiff}>
                      <i /> Có sự khác biệt
                    </span>
                    <span className={styles.legendChipWin}>
                      <TrophyFilled /> Ưu thế vượt trội
                    </span>
                  </div>
                </div>
              </th>

              {cars.map((car, index) => {
                const theme = CAR_LED_THEMES[index % CAR_LED_THEMES.length]
                const info = carAnalysis[index]
                const isBestPrice = minPrice != null && car.price === minPrice

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
                      {/* Đèn rọi Spotlight từ trần xuống xe */}
                      <div className={styles.spotlightFixture} aria-hidden="true" />
                      <div className={styles.spotlightCone} aria-hidden="true" />

                      <div className={styles.podiumTopRow}>
                        <span className={styles.slotBadge}>{theme.badge}</span>
                        {car.year && <span className={styles.yearPill}>Đời {car.year}</span>}
                      </div>

                      <div className={styles.photo}>
                        {car.primaryImageUrl ? (
                          <img src={car.primaryImageUrl} alt={titleOf(car)} />
                        ) : (
                          <CarOutlined />
                        )}
                        {isBestPrice && (
                          <span className={styles.bestPriceOverlay}>GIÁ TỐT NHẤT</span>
                        )}
                      </div>

                      <div className={styles.name}>{titleOf(car)}</div>
                      {car.variant && <div className={styles.variant}>{car.variant}</div>}

                      <div className={styles.priceBlock}>
                        <div className={styles.price}>{formatPrice(car.price)}</div>
                        {info?.marketSavings > 0 && (
                          <div className={styles.marketSaveTag}>
                            Tốt hơn thị trường {formatPrice(info.marketSavings)}
                          </div>
                        )}
                      </div>

                      {info?.highlights?.length > 0 && (
                        <div className={styles.headerHighlights}>
                          {info.highlights.slice(0, 2).map((h) => (
                            <span key={h.type} className={styles.miniAdvantage}>
                              <StarFilled /> {h.short}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={styles.headActions}>
                        <Link to={`/xe/${car._id}`} className={styles.detailLink}>
                          <Button size="small" type="primary" className={styles.detailBtn}>
                            Xem chi tiết
                          </Button>
                        </Link>
                        <Button
                          size="small"
                          className={styles.removeBtn}
                          icon={<CloseOutlined />}
                          aria-label={`Bỏ ${titleOf(car)} khỏi so sánh`}
                          onClick={() => onRemove(car._id)}
                        >
                          Bỏ
                        </Button>
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
                    '--group-accent': group.theme?.accent || '#c9a227',
                    '--group-gradient': group.theme?.gradient,
                  }}
                >
                  <th scope="colgroup" colSpan={cars.length + 1}>
                    <div className={styles.groupBanner}>
                      <span className={styles.groupIcon}>{GROUP_ICONS[group.key]}</span>
                      <span className={styles.groupTitleText}>{group.title}</span>
                      <span
                        className={`${styles.groupDiffCount} ${
                          group.diffCount > 0 ? styles.groupHasDiff : styles.groupAllSame
                        }`}
                      >
                        {group.diffCount > 0
                          ? `${group.diffCount} điểm khác biệt`
                          : 'Tương đồng'}
                      </span>
                    </div>
                  </th>
                </tr>

                {group.rows.map((row) => (
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
                            {showWin && cell.winnerLabel && (
                              <div className={styles.winnerBadgeRow}>
                                <span className={styles.winnerBadge}>
                                  <TrophyFilled /> {cell.winnerLabel}
                                </span>
                              </div>
                            )}

                            {cell.items?.length ? (
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
                                          ? 'Trang bị riêng biệt trên mẫu xe này'
                                          : 'Trang bị chung'
                                      }
                                    >
                                      {isUnique && <StarFilled className={styles.tagStar} />}
                                      {item}
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : (
                              <span
                                className={`${styles.cellValueText} ${
                                  cell.text === 'Chưa cập nhật' ? styles.mutedText : ''
                                }`}
                              >
                                {cell.text}
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.ledStripBottom} aria-hidden="true" />
    </div>
  )
}
