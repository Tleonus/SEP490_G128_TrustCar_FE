import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BulbFilled,
  CheckCircleFilled,
  CrownFilled,
  ExclamationCircleFilled,
  EyeInvisibleOutlined,
  InfoCircleFilled,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  RocketFilled,
  SafetyCertificateFilled,
  SketchOutlined,
  SwapOutlined,
  ThunderboltFilled,
  TrophyFilled,
} from '@ant-design/icons'
import AiDisclaimer from '../../../components/common/AiDisclaimer'
import { AI_DISCLAIMER_COMPARE_COMPACT } from '../../../constants/aiDisclaimer'
import { getCars } from '../../../services/carService'
import { formatMileage, formatPrice } from '../../../utils/format'
import { fetchCompareAiInsight } from '../api/compareApi'
import {
  AI_DISCLAIMER_TEXT,
  AI_PREFERENCE_MODES,
  CAR_LED_THEMES,
  buildLocalAiFallbackInsight,
  buildSuggestedMatchups,
  recommendSimilarCars,
  titleOfCar,
} from '../utils/compareInsights'
import styles from './CompareRecommendPanel.module.css'

const PREFERENCE_ICONS = {
  overall: <TrophyFilled />,
  economy: <SketchOutlined />,
  family: <SafetyCertificateFilled />,
  performance: <ThunderboltFilled />,
  likenew: <CrownFilled />,
}

/**
 * Hệ thống Gợi ý Thông minh:
 * 1. Phân tích nhanh & Gợi ý từ AI theo yêu cầu (On-Demand AI Advisor — chỉ chạy khi khách bấm nút,
 *    không có thanh điểm ảo hay % độ phù hợp vô căn cứ, kèm cảnh báo AI có thể sai).
 * 2. Gợi ý cặp xe đối thủ & xe tương tự từ kho xe Showroom.
 */
export default function CompareRecommendPanel({
  mode = 'all',
  cars = [],
  canAddMore = true,
  onAddCar,
  onReplaceCar,
  onApplyMatchup,
}) {
  const showAdvisor = mode === 'all' || mode === 'advisor'
  const showInventory = mode === 'all' || mode === 'inventory'

  const [activePreference, setActivePreference] = useState('overall')
  const [aiStatus, setAiStatus] = useState('idle') // 'idle' | 'loading' | 'success'
  const [aiInsight, setAiInsight] = useState(null)
  const [isAiExpanded, setIsAiExpanded] = useState(false)
  const abortRef = useRef(null)

  const [poolCars, setPoolCars] = useState([])
  const [poolLoaded, setPoolLoaded] = useState(false)
  const loadingPool = showInventory && !poolLoaded
  const [swapTargetIndex, setSwapTargetIndex] = useState(0)

  const carIdsKey = useMemo(
    () => cars.map((c) => String(c?._id || c?.id || '')).filter(Boolean).join(','),
    [cars],
  )

  // Khi danh sách xe đang so sánh thay đổi, đóng kết quả AI cũ để không hiển thị lệch xe
  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setAiStatus('idle')
    setAiInsight(null)
    setIsAiExpanded(false)
  }, [carIdsKey])

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  useEffect(() => {
    if (!showInventory) return undefined
    let mounted = true
    getCars({ limit: 12 })
      .then((res) => {
        if (mounted) setPoolCars(res?.items ?? [])
      })
      .catch(() => {
        if (mounted) setPoolCars([])
      })
      .finally(() => {
        if (mounted) setPoolLoaded(true)
      })
    return () => {
      mounted = false
    }
  }, [showInventory])

  const requestAiAnalysis = useCallback(
    async (prefKey = activePreference) => {
      const ids = cars.map((c) => String(c?._id || c?.id || '')).filter(Boolean)
      if (ids.length < 2) return

      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setAiStatus('loading')
      setIsAiExpanded(true)

      try {
        const result = await fetchCompareAiInsight(ids, prefKey, controller.signal)
        if (controller.signal.aborted) return
        setAiInsight(result)
        setAiStatus('success')
      } catch {
        if (controller.signal.aborted) return
        // Fallback an toàn dựa trên thông số thực tế nếu mạng gián đoạn
        const fallback = buildLocalAiFallbackInsight(cars, prefKey)
        setAiInsight(fallback)
        setAiStatus('success')
      }
    },
    [cars, activePreference],
  )

  const handleSelectPreference = (prefKey) => {
    setActivePreference(prefKey)
    // Nếu khung gợi ý AI đã được người dùng mở sẵn thì tự động cập nhật theo tiêu chí mới
    if (isAiExpanded && (aiStatus === 'success' || aiStatus === 'loading')) {
      requestAiAnalysis(prefKey)
    }
  }

  const handleCloseAiPanel = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setIsAiExpanded(false)
    if (aiStatus === 'loading') setAiStatus('idle')
  }

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

  const activePrefMeta =
    AI_PREFERENCE_MODES.find((m) => m.key === activePreference) ?? AI_PREFERENCE_MODES[0]

  return (
    <div className={styles.wrapper}>
      {/* PHẦN 1: PHÂN TÍCH NHANH & GỢI Ý TỪ AI THEO YÊU CẦU (CHỈ GỌI KHI NGƯỜI DÙNG BẤM NÚT) */}
      {showAdvisor && cars.length >= 2 && (
        <section className={styles.advisorSection} aria-label="Gợi ý tham khảo từ AI">
          <div className={styles.ledBorderTop} />

          {/* THANH KÍCH HOẠT AI GỌN ĐẸP */}
          <div className={styles.aiTriggerDeck}>
            <div className={styles.advisorTitleGroup}>
              <div className={styles.badgeRow}>
                <span className={styles.aiBadge}>
                  <RocketFilled /> TRỢ LÝ AI • PHÂN TÍCH NHANH
                </span>
                <span className={styles.onDemandTag}>Chỉ gợi ý khi bạn muốn tham khảo</span>
              </div>

              <h2 className={styles.advisorTitle}>
                Phân tích nhanh & Gợi ý chọn xe từ AI
              </h2>
              <p className={styles.advisorSub}>
                Chọn nhu cầu bạn ưu tiên rồi bấm nút <strong>"Gợi ý từ AI"</strong> để xem bản tóm tắt
                ưu/nhược điểm và sự đánh đổi giữa {cars.length} mẫu xe dựa trên thông số niêm yết.
              </p>
            </div>

            <div className={styles.ctaCluster}>
              {!isAiExpanded ? (
                <button
                  type="button"
                  className={styles.aiTriggerBtn}
                  onClick={() => requestAiAnalysis(activePreference)}
                >
                  <BulbFilled className={styles.aiTriggerIcon} />
                  <span>Gợi ý từ AI</span>
                </button>
              ) : (
                <div className={styles.aiActiveActions}>
                  <button
                    type="button"
                    className={styles.aiRefreshBtn}
                    disabled={aiStatus === 'loading'}
                    onClick={() => requestAiAnalysis(activePreference)}
                  >
                    {aiStatus === 'loading' ? <LoadingOutlined /> : <ReloadOutlined />}
                    <span>{aiStatus === 'loading' ? 'Đang phân tích...' : 'Phân tích lại'}</span>
                  </button>
                  <button
                    type="button"
                    className={styles.aiHideBtn}
                    onClick={handleCloseAiPanel}
                  >
                    <EyeInvisibleOutlined />
                    <span>Thu gọn gợi ý AI</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* THANH CHỌN GÓC NHÌN ƯU TIÊN */}
          <div className={styles.preferenceBar}>
            <span className={styles.prefBarLabel}>Góc nhìn bạn muốn AI phân tích:</span>
            <div className={styles.personaTabs} role="tablist" aria-label="Góc nhìn phân tích AI">
              {AI_PREFERENCE_MODES.map((pref) => {
                const active = pref.key === activePreference
                return (
                  <button
                    key={pref.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`${styles.personaBtn} ${active ? styles.personaBtnActive : ''}`}
                    onClick={() => handleSelectPreference(pref.key)}
                  >
                    <span className={styles.personaIcon}>{PREFERENCE_ICONS[pref.key]}</span>
                    <span>{pref.label}</span>
                  </button>
                )
              })}
            </div>
            <p className={styles.prefFocusHint}>{activePrefMeta.desc}</p>
          </div>

          {/* DÒNG NHẮC NHỞ NGẮN KHI CHƯA BẤM NÚT (KAN-77: dùng chung AiDisclaimer) */}
          {!isAiExpanded && (
            <AiDisclaimer
              variant="strip"
              surface="dark"
              text={AI_DISCLAIMER_COMPARE_COMPACT}
            />
          )}

          {/* TRẠNG THÁI ĐANG TẢI KHI NGƯỜI DÙNG VỪA BẤM NÚT GỢI Ý TỪ AI */}
          {isAiExpanded && aiStatus === 'loading' && (
            <div className={styles.aiLoadingCard} role="status" aria-live="polite">
              <div className={styles.aiLoadingSpinner}>
                <LoadingOutlined spin />
              </div>
              <div className={styles.aiLoadingTextGroup}>
                <div className={styles.aiLoadingTitle}>
                  AI đang đối chiếu nhanh thông số của {cars.length} mẫu xe...
                </div>
                <div className={styles.aiLoadingSub}>
                  Đang tổng hợp chênh lệch giá bán, năm sản xuất, số Odo, vận hành và trang bị theo góc
                  nhìn <strong>"{activePrefMeta.label}"</strong>.
                </div>
              </div>
            </div>
          )}

          {/* KẾT QUẢ PHÂN TÍCH NHANH & GỢI Ý TỪ AI */}
          {isAiExpanded && aiStatus === 'success' && aiInsight && (
            <div className={styles.aiResultContainer}>
              {/* HỘP CẢNH BÁO AI CÓ THỂ SAI — DÙNG CHUNG SITE-WIDE (KAN-77) */}
              <AiDisclaimer
                variant="banner"
                surface="dark"
                text={aiInsight.disclaimer || AI_DISCLAIMER_TEXT}
              />

              {/* KHỐI TÓM TẮT NHANH & GỢI Ý THEO NHU CẦU */}
              <div className={styles.aiOverviewGrid}>
                <div className={styles.aiSummaryCard}>
                  <div className={styles.aiBoxHeader}>
                    <InfoCircleFilled className={styles.aiBoxIcon} />
                    <span>Tóm tắt đối chiếu nhanh</span>
                  </div>
                  <p className={styles.aiBoxText}>{aiInsight.summary}</p>
                </div>

                <div className={styles.aiRecommendCard}>
                  <div className={styles.aiBoxHeader}>
                    <BulbFilled className={styles.aiBoxIconGold} />
                    <span>
                      Gợi ý tham khảo theo góc nhìn: {aiInsight.preferenceLabel || activePrefMeta.label}
                    </span>
                  </div>
                  <p className={styles.aiBoxText}>{aiInsight.recommendation}</p>
                </div>
              </div>

              {aiInsight.missingDataNote && (
                <div className={styles.missingDataAlert}>
                  <ExclamationCircleFilled />
                  <span>{aiInsight.missingDataNote}</span>
                </div>
              )}

              {/* PHÂN TÍCH ƯU / NHƯỢC ĐIỂM THỰC TẾ CỦA TỪNG XE (KHÔNG CÓ THANH ĐIỂM HAY % PHÙ HỢP) */}
              <div
                className={styles.aiCarCardsGrid}
                style={{ '--car-cols': Math.min(cars.length, 3) }}
              >
                {cars.map((car, index) => {
                  const theme = CAR_LED_THEMES[index % CAR_LED_THEMES.length]
                  const insightForCar =
                    aiInsight.carInsights?.find(
                      (item) => String(item.carId).toLowerCase() === String(car._id).toLowerCase(),
                    ) ?? aiInsight.carInsights?.[index]
                  const imgUrl = primaryImageOf(car)

                  return (
                    <article
                      key={car._id || index}
                      className={styles.aiCarCard}
                      style={{
                        '--car-primary': theme.primary,
                        '--car-glow': theme.glow,
                        '--car-border': theme.border,
                      }}
                    >
                      <div className={styles.aiCarCardTop}>
                        <div className={styles.aiCarThumb}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={titleOfCar(car)} />
                          ) : (
                            <div className={styles.noPhoto}>TrustCar</div>
                          )}
                        </div>
                        <div className={styles.aiCarMeta}>
                          <span className={styles.aiCarSlotBadge}>{theme.badge}</span>
                          <h3 className={styles.aiCarName}>
                            {titleOfCar(car)} {car.year ? `(${car.year})` : ''}
                          </h3>
                          <div className={styles.aiCarPrice}>{formatPrice(car.price)}</div>
                        </div>
                      </div>

                      {/* ƯU ĐIỂM THỰC TẾ */}
                      <div className={styles.aiPointBlock}>
                        <div className={styles.aiPointHeadingPositive}>
                          <CheckCircleFilled /> Lợi thế nổi bật trên thông số
                        </div>
                        <ul className={styles.aiPointList}>
                          {(insightForCar?.strengths ?? []).map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>

                      {/* ĐIỂM CẦN CÂN NHẮC / ĐÁNH ĐỔI */}
                      <div className={styles.aiPointBlock}>
                        <div className={styles.aiPointHeadingNeutral}>
                          <InfoCircleFilled /> Điểm cần lưu ý & đối chiếu thêm
                        </div>
                        <ul className={styles.aiPointListMuted}>
                          {(insightForCar?.considerations ?? []).map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </div>

                      {/* GỢI Ý ĐỐI TƯỢNG PHÙ HỢP */}
                      {insightForCar?.bestFor && (
                        <div className={styles.aiBestForBox}>
                          <span className={styles.aiBestForLabel}>Gợi ý tham khảo:</span>
                          <p className={styles.aiBestForText}>{insightForCar.bestFor}</p>
                        </div>
                      )}

                      <div className={styles.aiCarFooter}>
                        <Link to={`/xe/${car._id}`} className={styles.aiCarDetailLink}>
                          Xem chi tiết mẫu xe này →
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* PHẦN 2: CẶP ĐẤU ĐỐI THỦ GỢI Ý SẴN (KHI CHƯA ĐỦ 2 XE) */}
      {showInventory && cars.length < 2 && suggestedMatchups.length > 0 && (
        <section className={styles.matchupSection} aria-label="Gợi ý cặp xe so sánh">
          <div className={styles.sectionHeadRow}>
            <div>
              <span className={styles.sectionBadge}>⚡ GỢI Ý CẶP XE CÙNG PHÂN KHÚC</span>
              <h2 className={styles.sectionTitle}>Gợi ý các cặp đấu đối thủ đáng so sánh nhất</h2>
              <p className={styles.sectionDesc}>
                Chỉ cần 1 chạm để nạp ngay 2 mẫu xe cùng phân khúc vào bàn cân Showroom.
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
              <span className={styles.sectionBadge}>🔥 GỢI Ý XE TƯƠNG TỰ TỪ KHO XE</span>
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
                          onClick={() => onReplaceCar?.(cars[swapTargetIndex]?._id, car)}
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
