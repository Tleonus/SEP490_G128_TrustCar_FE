import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select, ConfigProvider, theme } from 'antd'
import {
  SearchOutlined,
  CloseOutlined,
  HistoryOutlined,
  ThunderboltFilled,
  FireFilled,
} from '@ant-design/icons'
import { getCars, getFeaturedCars } from '../../services/carService'
import { useDebounce } from '../../hooks/useDebounce'
import { PRICE_RANGES } from '../../utils/constants'
import { formatPrice } from '../../utils/format'
import { getCarTitle, getCoverImage } from '../../utils/car'
import {
  QUICK_SEARCH_PRESETS,
  parseSmartSearchQuery,
  buildSearchParamsFromSmartQuery,
  getKeywordSuggestions,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from '../../utils/smartCarSearch'
import suvThumb1 from '../../assets/cars/suv1.jpg'
import suvThumb2 from '../../assets/cars/suv2.jpg'
import sedanThumb1 from '../../assets/cars/sedan1.jpg'
import sedanThumb2 from '../../assets/cars/sedan2.jpg'
import pickupThumb from '../../assets/cars/pickup1.jpg'
import hatchbackThumb from '../../assets/cars/hatchback1.jpg'
import styles from './SmartCarSearchBox.module.css'

const LIGHT_THEME = { algorithm: theme.defaultAlgorithm }

const BODY_THUMB_MAP = {
  SUV: suvThumb1,
  MPV: suvThumb2,
  SEDAN: sedanThumb1,
  PICKUP: pickupThumb,
  HATCHBACK: hatchbackThumb,
}

function extractImageUrl(car) {
  if (!car) return ''
  const cover = getCoverImage(car)
  return typeof cover === 'string' ? cover : cover?.url || cover?.image_url || ''
}

export default function SmartCarSearchBox({
  variant = 'hero',
  brands = [],
  initialKeyword = '',
  onApplySearch,
}) {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const inputRef = useRef(null)

  const [keyword, setKeyword] = useState(initialKeyword)
  const [make, setMake] = useState(undefined)
  const [priceRangeIdx, setPriceRangeIdx] = useState(undefined)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [recentList, setRecentList] = useState(() => getRecentSearches())
  const [featuredCars, setFeaturedCars] = useState([])
  const [liveCars, setLiveCars] = useState([])

  const debouncedKeyword = useDebounce(keyword, 220)

  // Tải danh sách xe nổi bật ban đầu để có sẵn ảnh mini thật khi người dùng vừa bấm vào ô tìm kiếm
  useEffect(() => {
    let active = true
    getFeaturedCars(6)
      .then((res) => {
        if (active && Array.isArray(res.items)) {
          setFeaturedCars(res.items.slice(0, 6))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Đồng bộ từ khóa khi URL trên trang /xe thay đổi từ bên ngoài (vd nhấn nút Xoá bộ lọc)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKeyword(initialKeyword || '')
  }, [initialKeyword])

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    function handleOutsideClick(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Phân tích ngữ nghĩa thời gian thực từ câu người dùng đang gõ
  const smartParsed = useMemo(() => parseSmartSearchQuery(keyword), [keyword])

  // Danh sách từ khóa gợi ý thông minh
  const suggestions = useMemo(
    () => getKeywordSuggestions(keyword, brands),
    [keyword, brands]
  )

  // Truy vấn nhanh tối đa 4 xe khớp thực tế trong kho ngay từ ký tự đầu tiên
  useEffect(() => {
    const clean = debouncedKeyword.trim()
    if (clean.length < 1) {
      return undefined
    }

    let active = true
    const { params } = buildSearchParamsFromSmartQuery(clean)
    getCars({ ...params, limit: 4 })
      .then((res) => {
        if (active) setLiveCars((res.items || []).slice(0, 4))
      })
      .catch(() => {
        if (active) setLiveCars([])
      })

    return () => {
      active = false
    }
  }, [debouncedKeyword])

  const displayedCars =
    debouncedKeyword.trim().length >= 1 ? liveCars : featuredCars.slice(0, 4)

  // Chọn ảnh mini phù hợp cho từng gợi ý từ khóa (ưu tiên ảnh xe thực tế trong kho -> ảnh phân khúc)
  function getThumbForSuggestion(item, index = 0) {
    const pool = [...liveCars, ...featuredCars]
    const targetMake = item.params?.make?.toUpperCase()
    const targetModel = item.params?.search?.toLowerCase()
    const targetBody = item.params?.bodyType?.toUpperCase()

    if (targetModel) {
      const byModel = pool.find((c) =>
        String(c.model || '').toLowerCase().includes(targetModel)
      )
      const url = extractImageUrl(byModel)
      if (url) return url
    }

    if (targetMake) {
      const byMake = pool.find((c) => String(c.make || '').toUpperCase() === targetMake)
      const url = extractImageUrl(byMake)
      if (url) return url
    }

    if (targetBody && BODY_THUMB_MAP[targetBody]) {
      return BODY_THUMB_MAP[targetBody]
    }

    const fallbackList = [suvThumb1, sedanThumb1, suvThumb2, sedanThumb2, pickupThumb, hatchbackThumb]
    return fallbackList[index % fallbackList.length]
  }

  function executeSearchWithParams(nextParams, rawLabelToSave = '') {
    if (rawLabelToSave) {
      saveRecentSearch(rawLabelToSave)
      setRecentList(getRecentSearches())
    }
    setOpen(false)
    setActiveIndex(-1)

    if (typeof onApplySearch === 'function') {
      onApplySearch(nextParams)
      return
    }

    const qs = new URLSearchParams()
    Object.entries(nextParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.set(k, String(v))
      }
    })
    const queryStr = qs.toString()
    navigate(queryStr ? `/xe?${queryStr}` : '/xe')
  }

  function handleFormSubmit(event) {
    event?.preventDefault()
    const explicitOverrides = {}
    if (make) explicitOverrides.make = make
    if (priceRangeIdx !== undefined && PRICE_RANGES[priceRangeIdx]) {
      const range = PRICE_RANGES[priceRangeIdx]
      if (range.min) explicitOverrides.priceMin = String(range.min)
      if (range.max) explicitOverrides.priceMax = String(range.max)
    }

    const { params } = buildSearchParamsFromSmartQuery(keyword, explicitOverrides)
    executeSearchWithParams(params, keyword.trim())
  }

  function handleSelectSuggestion(item) {
    setKeyword(item.label)
    executeSearchWithParams(item.params, item.label)
  }

  function handleSelectRecent(text) {
    setKeyword(text)
    const { params } = buildSearchParamsFromSmartQuery(text)
    executeSearchWithParams(params, text)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (!open || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
    } else if (event.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault()
      handleSelectSuggestion(suggestions[activeIndex])
    }
  }

  function renderPopover() {
    if (!open) return null
    const hasTyped = keyword.trim().length > 0

    return (
      <div
        className={styles.popover}
        role="listbox"
        aria-label="Gợi ý tìm kiếm thông minh"
      >
        {/* Banner nhận diện ngữ nghĩa thông minh */}
        {hasTyped && smartParsed.recognizedTags.length > 0 && (
          <div
            className={styles.smartBanner}
            onClick={handleFormSubmit}
            role="option"
            aria-selected={false}
          >
            <div className={styles.smartBannerLeft}>
              <span className={styles.smartBannerTitle}>
                <ThunderboltFilled style={{ color: '#2563eb' }} />
                Gợi ý lọc nhanh:
              </span>
              {smartParsed.recognizedTags.map((tag) => (
                <span key={tag.key} className={styles.smartTag}>
                  {tag.label}
                </span>
              ))}
            </div>
            <span className={styles.smartBannerAction}>Lọc ngay &rarr;</span>
          </div>
        )}

        {/* Khi chưa gõ: Hiển thị Lịch sử tìm kiếm & Từ khóa tìm nhanh kèm ảnh mini */}
        {!hasTyped && (
          <>
            {recentList.length > 0 && (
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <span>
                    <HistoryOutlined /> Tìm kiếm gần đây
                  </span>
                  <button
                    type="button"
                    className={styles.clearHistoryBtn}
                    onClick={(e) => {
                      e.stopPropagation()
                      clearRecentSearches()
                      setRecentList([])
                    }}
                  >
                    Xoá
                  </button>
                </div>
                <div className={styles.presetPillsWrap}>
                  {recentList.map((text, idx) => (
                    <button
                      key={text}
                      type="button"
                      className={styles.presetPill}
                      onClick={() => handleSelectRecent(text)}
                    >
                      <img
                        src={getThumbForSuggestion({ params: { search: text } }, idx)}
                        alt=""
                        className={styles.presetThumb}
                      />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.sectionBlock}>
              <div className={styles.sectionHeader}>
                <span>
                  <FireFilled style={{ color: '#2563eb' }} /> Gợi ý tìm kiếm nhanh
                </span>
              </div>
              <div className={styles.presetPillsWrap}>
                {QUICK_SEARCH_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={styles.presetPill}
                    onClick={() => handleSelectSuggestion(preset)}
                  >
                    <img
                      src={getThumbForSuggestion(preset, idx)}
                      alt=""
                      className={styles.presetThumb}
                    />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Khi đang gõ: Danh sách gợi ý từ khóa / Dòng xe / Hãng xe kèm ảnh mini */}
        {hasTyped && suggestions.length > 0 && (
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <span>
                <FireFilled style={{ color: '#2563eb' }} /> Từ khóa & Dòng xe gợi ý
              </span>
            </div>
            <div className={styles.suggestionList}>
              {suggestions.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.suggestionItem} ${
                    idx === activeIndex ? styles.suggestionItemActive : ''
                  }`}
                  onClick={() => handleSelectSuggestion(item)}
                >
                  <span className={styles.suggestionMain}>
                    <img
                      src={getThumbForSuggestion(item, idx)}
                      alt=""
                      className={styles.suggestionThumb}
                    />
                    <span className={styles.suggestionTextCol}>
                      <span className={styles.suggestionLabel}>{item.label}</span>
                      <span className={styles.suggestionSubInline}>{item.subLabel}</span>
                    </span>
                  </span>
                  <span className={styles.suggestionSub}>Chọn &rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Xem trước xe thực tế trong kho có ảnh mini */}
        {displayedCars.length > 0 && (
          <div className={styles.sectionBlock}>
            <div className={styles.sectionHeader}>
              <span>
                {hasTyped
                  ? `Xe đang sẵn có phù hợp gợi ý (${displayedCars.length})`
                  : 'Xe nổi bật đang sẵn có tại Showroom'}
              </span>
            </div>
            <div className={styles.carPreviewList}>
              {displayedCars.map((car, idx) => {
                const code = car.vehicleCode || car._id
                const imgUrl =
                  extractImageUrl(car) ||
                  BODY_THUMB_MAP[String(car.bodyType || '').toUpperCase()] ||
                  (idx % 2 === 0 ? suvThumb1 : sedanThumb1)
                return (
                  <button
                    key={code}
                    type="button"
                    className={styles.carPreviewItem}
                    onClick={() => {
                      saveRecentSearch(getCarTitle(car))
                      setOpen(false)
                      navigate(`/xe/${encodeURIComponent(code)}`)
                    }}
                  >
                    <img src={imgUrl} alt="" className={styles.carThumb} />
                    <div className={styles.carInfo}>
                      <div className={styles.carTitle}>{getCarTitle(car)}</div>
                      <div className={styles.carMeta}>
                        <span className={styles.carPrice}>{formatPrice(car.price)}</span>
                        <span>&middot; {car.year}</span>
                        {car.cpoCertificateId && <span className={styles.cpoMini}>CPO</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── GIAO DIỆN TRÊN TRANG DANH SÁCH XE (/xe) ────────────────────────────────
  if (variant === 'catalog') {
    return (
      <div className={`${styles.wrapper} ${styles.catalogCard}`} ref={rootRef}>
        <form onSubmit={handleFormSubmit} role="search" aria-label="Tìm kiếm thông minh">
          <div className={`${styles.catalogBar} ${open ? styles.catalogBarFocused : ''}`}>
            <SearchOutlined className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              className={styles.catalogInput}
              placeholder="Tìm theo tên xe, hãng, đời xe, khoảng giá (VD: Mazda CX-5 dưới 800 triệu)..."
              value={keyword}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setKeyword(e.target.value)
                setOpen(true)
                setActiveIndex(-1)
              }}
              onKeyDown={handleKeyDown}
              aria-label="Từ khoá"
            />
            {keyword && (
              <button
                type="button"
                className={styles.clearBtn}
                aria-label="Xoá từ khóa"
                onClick={() => {
                  setKeyword('')
                  setLiveCars([])
                  executeSearchWithParams({ search: '' })
                  inputRef.current?.focus()
                }}
              >
                <CloseOutlined />
              </button>
            )}
            <button type="submit" className={styles.catalogSubmitBtn}>
              <SearchOutlined />
              <span>Tìm xe</span>
            </button>
          </div>
        </form>

        <div className={styles.catalogMetaRow}>
          <div className={styles.catalogQuickList}>
            <span className={styles.catalogQuickLabel}>Tìm nhanh:</span>
            {QUICK_SEARCH_PRESETS.slice(0, 5).map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={styles.catalogQuickChip}
                onClick={() => handleSelectSuggestion(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {smartParsed.recognizedTags.length > 0 && (
            <div className={styles.recognizedInline}>
              {smartParsed.recognizedTags.map((tag) => (
                <span key={tag.key} className={styles.recognizedBadge}>
                  <ThunderboltFilled /> {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {renderPopover()}
      </div>
    )
  }

  // ── GIAO DIỆN GỌN TRÊN BANNER TRANG CHỦ (HeroSection) ──────────────────────
  return (
    <div className={`${styles.wrapper} ${styles.heroWrapper}`} ref={rootRef}>
      <ConfigProvider theme={LIGHT_THEME}>
        <form
          className={styles.heroBar}
          onSubmit={handleFormSubmit}
          role="search"
          aria-label="Tìm xe"
        >
          <div className={`${styles.inputBox} ${open ? styles.inputBoxFocused : ''}`}>
            <SearchOutlined className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              className={styles.nativeInput}
              placeholder="Tìm tên xe, hãng, đời xe (VD: CX-5, Camry)..."
              value={keyword}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setKeyword(e.target.value)
                setOpen(true)
                setActiveIndex(-1)
              }}
              onKeyDown={handleKeyDown}
              aria-label="Tên xe"
            />
            {keyword && (
              <button
                type="button"
                className={styles.clearBtn}
                aria-label="Xoá từ khóa"
                onClick={() => {
                  setKeyword('')
                  setLiveCars([])
                  inputRef.current?.focus()
                }}
              >
                <CloseOutlined />
              </button>
            )}
          </div>

          <Select
            className={styles.heroSelect}
            placement="bottomLeft"
            listHeight={220}
            placeholder="Thương hiệu"
            value={make}
            onChange={setMake}
            options={brands.map((b) => ({ value: b.value, label: b.label }))}
            size="large"
            aria-label="Thương hiệu"
            allowClear
          />

          <Select
            className={styles.heroSelect}
            placement="bottomLeft"
            listHeight={220}
            placeholder="Khoảng giá"
            value={priceRangeIdx}
            onChange={setPriceRangeIdx}
            options={PRICE_RANGES.map((r, i) => ({ value: i, label: r.label }))}
            size="large"
            aria-label="Khoảng giá"
            allowClear
          />

          <button type="submit" className={styles.submitBtn}>
            <SearchOutlined />
            <span>Tìm xe</span>
          </button>
        </form>
      </ConfigProvider>

      {renderPopover()}
    </div>
  )
}
