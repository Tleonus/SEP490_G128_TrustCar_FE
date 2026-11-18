import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircleFilled,
  CrownFilled,
  FireFilled,
  PlusOutlined,
  RetweetOutlined,
  RocketFilled,
  SafetyCertificateFilled,
  SketchOutlined,
  SwapOutlined,
  ThunderboltFilled,
  TrophyFilled,
} from '@ant-design/icons'
import { getCars } from '../../../services/carService'
import { formatMileage, formatPrice } from '../../../utils/format'
import {
  PERSONA_MODES,
  buildPersonaRecommendations,
  buildSuggestedMatchups,
  recommendSimilarCars,
  titleOfCar,
} from '../utils/compareInsights'
import styles from './CompareRecommendPanel.module.css'

const PERSONA_ICONS = {
  overall: <TrophyFilled />,
  economy: <SketchOutlined />,
  performance: <ThunderboltFilled />,
  family: <SafetyCertificateFilled />,
  likenew: <CrownFilled />,
}

const SCORE_DIMENSIONS = [
  { key: 'value', label: 'Giá trị & Kinh tế', color: '#10b981' },
  { key: 'condition', label: 'Độ mới & Tình trạng', color: '#38bdf8' },
  { key: 'performance', label: 'Sức mạnh vận hành', color: '#f97316' },
  { key: 'economy', label: 'Tiết kiệm nhiên liệu', color: '#eab308' },
  { key: 'comfort', label: 'An toàn & Tiện nghi', color: '#a855f7' },
]

/**
 * Hệ thống Gợi ý Thông minh (AI Smart Advisor + Gợi ý xe tương tự & Cặp đấu đối thủ).
 */
export default function CompareRecommendPanel({
  mode = 'all',
  cars = [],
  analysis = [],
  canAddMore = true,
  onAddCar,
  onReplaceCar,
  onApplyMatchup,
}) {
  const showAdvisor = mode === 'all' || mode === 'advisor'
  const showInventory = mode === 'all' || mode === 'inventory'
  const [activePersona, setActivePersona] = useState('overall')
  const [poolCars, setPoolCars] = useState([])
  const [loadingPool, setLoadingPool] = useState(false)
  const [swapTargetIndex, setSwapTargetIndex] = useState(0)

  useEffect(() => {
    if (!showInventory) return undefined
    let mounted = true
    setLoadingPool(true)
    getCars({ limit: 12 })
      .then((res) => {
        if (mounted) setPoolCars(res?.items ?? [])
      })
      .catch(() => {
        if (mounted) setPoolCars([])
      })
      .finally(() => {
        if (mounted) setLoadingPool(false)
      })
    return () => {
      mounted = false
    }
  }, [showInventory])

  const personaMap = useMemo(() => buildPersonaRecommendations(analysis), [analysis])
  const currentPersonaRec = personaMap[activePersona] ?? personaMap.overall

  const similarRecommendations = useMemo(
    () => recommendSimilarCars(cars, poolCars, 4),
    [cars, poolCars],
  )

  const suggestedMatchups = useMemo(
    () => (cars.length < 2 ? buildSuggestedMatchups(poolCars, 3) : []),
    [cars.length, poolCars],
  )

  const primaryImageOf = (car) => {
    if (car?.primaryImageUrl) return car.primaryImageUrl
    if (Array.isArray(car?.images) && car.images.length > 0) {
      const primary = car.images.find((img) => img?.isPrimary) ?? car.images[0]
      return typeof primary === 'string' ? primary : primary?.url
    }
    return null
  }

  return (
    <div className={styles.wrapper}>
      {/* PHẦN 1: AI SMART ADVISOR & PERSONA VERDICT (HIỂN THỊ KHI ĐANG SO SÁNH >= 2 XE) */}
      {showAdvisor && analysis.length >= 2 && currentPersonaRec?.winner && (
        <section className={styles.advisorSection} aria-label="Gợi ý chọn xe theo nhu cầu">
          <div className={styles.ledBorderTop} />
          <div className={styles.advisorHeader}>
            <div className={styles.advisorTitleGroup}>
              <span className={styles.aiBadge}>
                <RocketFilled /> AI SMART RECOMMEND
              </span>
              <h2 className={styles.advisorTitle}>
                Tư vấn chọn xe tối ưu theo nhu cầu của bạn
              </h2>
              <p className={styles.advisorSub}>
                Chọn tiêu chí bạn ưu tiên nhất — hệ thống sẽ phân tích thông số và đề xuất mẫu xe phù hợp nhất.
              </p>
            </div>

            <div className={styles.personaTabs} role="tablist" aria-label="Tiêu chí ưu tiên">
              {PERSONA_MODES.map((mode) => {
                const active = mode.key === activePersona
                return (
                  <button
                    key={mode.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`${styles.personaBtn} ${active ? styles.personaBtnActive : ''}`}
                    onClick={() => setActivePersona(mode.key)}
                  >
                    <span className={styles.personaIcon}>{PERSONA_ICONS[mode.key]}</span>
                    <span>{mode.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.advisorGrid}>
            {/* THẺ XE CHIẾN THẮNG THEO NHU CẦU */}
            <div
              className={styles.winnerCard}
              style={{
                '--winner-primary': currentPersonaRec.winner.theme.primary,
                '--winner-glow': currentPersonaRec.winner.theme.glow,
              }}
            >
              <div className={styles.winnerRibbon}>
                <CrownFilled /> {currentPersonaRec.persona.badge} • ĐỀ XUẤT SỐ #1
              </div>

              <div className={styles.winnerTop}>
                <div className={styles.winnerThumb}>
                  {primaryImageOf(currentPersonaRec.winner.car) ? (
                    <img
                      src={primaryImageOf(currentPersonaRec.winner.car)}
                      alt={currentPersonaRec.winner.title}
                    />
                  ) : (
                    <div className={styles.noPhoto}>TrustCar</div>
                  )}
                  <span className={styles.winnerRankTag}>{currentPersonaRec.winner.theme.badge}</span>
                </div>

                <div className={styles.winnerMeta}>
                  <div className={styles.winnerName}>{currentPersonaRec.winner.title}</div>
                  <div className={styles.winnerPrice}>
                    {formatPrice(currentPersonaRec.winner.car.price)}
                  </div>
                  <p className={styles.personaDesc}>{currentPersonaRec.persona.desc}</p>
                </div>

                <div className={styles.matchCircle}>
                  <span className={styles.matchNumber}>{currentPersonaRec.winner.matchScore}%</span>
                  <span className={styles.matchLabel}>ĐỘ PHÙ HỢP</span>
                </div>
              </div>

              <div className={styles.reasonsBlock}>
                <div className={styles.reasonsHeading}>
                  <FireFilled /> Lý do nổi bật nên chọn mẫu xe này:
                </div>
                <div className={styles.reasonPills}>
                  {currentPersonaRec.winner.highlights.map((hl) => (
                    <span
                      key={hl.type}
                      className={`${styles.reasonPill} ${styles[`pill_${hl.color}`] || ''}`}
                    >
                      <CheckCircleFilled /> {hl.text}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.winnerFooter}>
                <div className={styles.runnerUpInfo}>
                  {currentPersonaRec.runnerUp && (
                    <span>
                      Theo sát: <strong>{currentPersonaRec.runnerUp.title}</strong> (
                      {currentPersonaRec.runnerUp.matchScore}% phù hợp)
                    </span>
                  )}
                </div>
                <Link
                  to={`/xe/${currentPersonaRec.winner.car._id}`}
                  className={styles.winnerCta}
                >
                  Xem chi tiết xe đề xuất →
                </Link>
              </div>
            </div>

            {/* BẢNG CHẤM ĐIỂM ĐA CHIỀU 5 TRỤ CỘT */}
            <div className={styles.radarBox}>
              <div className={styles.radarHeader}>
                <h3>Biểu đồ đối chiếu 5 tiêu chí cốt lõi</h3>
                <div className={styles.carLegend}>
                  {analysis.map((item) => (
                    <span
                      key={item.id}
                      className={styles.legendItem}
                      style={{ '--dot-color': item.theme.glow }}
                    >
                      <i className={styles.legendDot} />
                      {item.car.make} {item.car.model}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.dimensionList}>
                {SCORE_DIMENSIONS.map((dim) => (
                  <div key={dim.key} className={styles.dimensionItem}>
                    <div className={styles.dimensionLabelRow}>
                      <span className={styles.dimensionName}>{dim.label}</span>
                      <div className={styles.dimensionScores}>
                        {analysis.map((item) => (
                          <span
                            key={item.id}
                            className={styles.dimScoreBadge}
                            style={{
                              color: item.theme.glow,
                              borderColor: item.theme.border,
                              background: item.theme.softBg,
                            }}
                          >
                            {item.scores[dim.key]}đ
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.multiBarGroup}>
                      {analysis.map((item) => (
                        <div key={item.id} className={styles.barTrack}>
                          <div
                            className={styles.barFill}
                            style={{
                              width: `${item.scores[dim.key]}%`,
                              background: item.theme.gradient,
                              boxShadow: `0 0 10px ${item.theme.primary}`,
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PHẦN 2: CẶP ĐẤU ĐỐI THỦ GỢI Ý SẴN (KHI CHƯA ĐỦ 2 XE) */}
      {showInventory && cars.length < 2 && suggestedMatchups.length > 0 && (
        <section className={styles.matchupSection} aria-label="Gợi ý cặp xe so sánh">
          <div className={styles.sectionHeadRow}>
            <div>
              <span className={styles.sectionBadge}>⚡ QUICK BATTLE MATCHUPS</span>
              <h2 className={styles.sectionTitle}>Gợi ý các cặp đấu đối thủ đáng so sánh nhất</h2>
              <p className={styles.sectionDesc}>
                Chỉ cần 1 chạm để nạp ngay 2 mẫu xe cùng phân khúc vào bàn cân 3D LED.
              </p>
            </div>
          </div>

          <div className={styles.matchupGrid}>
            {suggestedMatchups.map((pair) => {
              const [carA, carB] = pair.cars
              return (
                <div key={pair.id} className={styles.matchupCard}>
                  <div className={styles.matchupTag}>{pair.tag}</div>
                  <div className={styles.matchupPair}>
                    <div className={styles.matchupCar}>
                      <div className={styles.matchupImg}>
                        {primaryImageOf(carA) ? (
                          <img src={primaryImageOf(carA)} alt={titleOfCar(carA)} />
                        ) : (
                          <span>Xe #1</span>
                        )}
                      </div>
                      <div className={styles.matchupCarName}>{titleOfCar(carA)}</div>
                      <div className={styles.matchupCarPrice}>{formatPrice(carA.price)}</div>
                    </div>

                    <div className={styles.vsOrb}>VS</div>

                    <div className={styles.matchupCar}>
                      <div className={styles.matchupImg}>
                        {primaryImageOf(carB) ? (
                          <img src={primaryImageOf(carB)} alt={titleOfCar(carB)} />
                        ) : (
                          <span>Xe #2</span>
                        )}
                      </div>
                      <div className={styles.matchupCarName}>{titleOfCar(carB)}</div>
                      <div className={styles.matchupCarPrice}>{formatPrice(carB.price)}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.matchupBtn}
                    onClick={() => onApplyMatchup?.(pair.cars)}
                  >
                    <ThunderboltFilled /> So sánh cặp đấu này ngay
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* PHẦN 3: GỢI Ý XE TƯƠNG TỰ ĐÁNG SO SÁNH TỪ SHOWROOM */}
      {showInventory && !loadingPool && similarRecommendations.length > 0 && (
        <section className={styles.similarSection} aria-label="Đề xuất xe tương tự từ kho xe">
          <div className={styles.sectionHeadRow}>
            <div>
              <span className={styles.sectionBadge}>🔥 SMART INVENTORY RECOMMEND</span>
              <h2 className={styles.sectionTitle}>
                {cars.length >= 2
                  ? 'Đề xuất đối thủ cùng tầm giá & phân khúc đáng đặt lên bàn cân'
                  : 'Gợi ý các mẫu xe nổi bật sẵn sàng so sánh'}
              </h2>
              <p className={styles.sectionDesc}>
                Được lọc tự động dựa trên kiểu dáng, tầm ngân sách và năm sản xuất tương đương.
              </p>
            </div>

            {!canAddMore && cars.length >= 3 && (
              <div className={styles.swapSelector}>
                <span>Đổi thế chỗ cho:</span>
                <select
                  value={swapTargetIndex}
                  onChange={(e) => setSwapTargetIndex(Number(e.target.value))}
                  aria-label="Chọn vị trí xe muốn đổi"
                >
                  {cars.map((c, idx) => (
                    <option key={c._id} value={idx}>
                      Xe #{idx + 1}: {titleOfCar(c)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className={styles.similarGrid}>
            {similarRecommendations.map(({ car, reasonTag, reasonColor, fuelLabel, bodyLabel }) => {
              const imgUrl = primaryImageOf(car)
              return (
                <article key={car._id} className={styles.simCard}>
                  <div className={styles.simPhotoWrap}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={titleOfCar(car)} className={styles.simPhoto} />
                    ) : (
                      <div className={styles.noPhoto}>TrustCar</div>
                    )}
                    <span className={`${styles.simReasonBadge} ${styles[`tag_${reasonColor}`] || ''}`}>
                      {reasonTag}
                    </span>
                    {car.year && <span className={styles.simYearBadge}>{car.year}</span>}
                  </div>

                  <div className={styles.simBody}>
                    <Link to={`/xe/${car._id}`} className={styles.simTitle}>
                      {titleOfCar(car)}
                    </Link>
                    <div className={styles.simPrice}>{formatPrice(car.price)}</div>

                    <div className={styles.simSpecs}>
                      <span>{bodyLabel}</span>
                      <span>•</span>
                      <span>{fuelLabel}</span>
                      {car.mileage != null && (
                        <>
                          <span>•</span>
                          <span>{formatMileage(car.mileage)}</span>
                        </>
                      )}
                    </div>

                    <div className={styles.simActions}>
                      {canAddMore ? (
                        <button
                          type="button"
                          className={styles.simAddBtn}
                          onClick={() => onAddCar?.(car)}
                        >
                          <PlusOutlined /> Thêm vào so sánh
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.simSwapBtn}
                          onClick={() => onReplaceCar?.( cars[swapTargetIndex]?._id, car)}
                        >
                          <SwapOutlined /> Đổi với Xe #{swapTargetIndex + 1}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
