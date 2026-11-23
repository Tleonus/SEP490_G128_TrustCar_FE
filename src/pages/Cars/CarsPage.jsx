import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Select, Pagination, Button } from 'antd'
import { CloseOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { useCars } from '../../hooks/useCars'
import { useBrands } from '../../hooks/useCatalog'
import {
  BODY_TYPE_LABEL,
  FUEL_TYPE_LABEL,
  TRANSMISSION_LABEL,
  PRICE_RANGES,
  MILEAGE_OPTIONS,
  YEAR_OPTIONS,
  SORT_OPTIONS,
  PAGE_SIZE,
  parseSortOption,
  toOptions,
  labelOf,
} from '../../utils/constants'
import { formatPrice } from '../../utils/format'
import { parseSmartSearchQuery } from '../../utils/smartCarSearch'
import { trackEvent } from '../../utils/trackEvent'
import SmartCarSearchBox from '../../components/search/SmartCarSearchBox'
import CarCard from '../../components/car/CarCard'
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateBlock'
import styles from './CarsPage.module.css'

const FILTER_KEYS = [
  'make', 'bodyType', 'fuelType', 'transmission',
  'yearMin', 'yearMax', 'priceMin', 'priceMax', 'mileageMax',
]

const YEAR_SELECT_OPTIONS = YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))

function priceRangeIndex(min, max) {
  const idx = PRICE_RANGES.findIndex(
    (r) => String(r.min) === (min || '0') && String(r.max ?? '') === (max || ''),
  )
  return idx >= 0 ? String(idx) : undefined
}

export default function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawSearch = searchParams.get('search') || ''

  const brands = useBrands()
  const page = Number(searchParams.get('page')) || 1

  const filters = useMemo(() => {
    const smart = parseSmartSearchQuery(rawSearch)
    const result = {
      search: smart.hasStructuredFilters
        ? smart.cleanSearch || undefined
        : rawSearch.trim() || undefined,
      page,
      limit: PAGE_SIZE,
    }

    FILTER_KEYS.forEach((key) => {
      result[key] = searchParams.get(key) || undefined
    })

    // Bổ sung thông minh từ câu tìm kiếm nếu người dùng chưa chọn cứng ở bộ lọc bên trái
    if (!result.make && smart.make) result.make = smart.make
    if (!result.bodyType && smart.bodyType) result.bodyType = smart.bodyType
    if (!result.fuelType && smart.fuelType) result.fuelType = smart.fuelType
    if (!result.transmission && smart.transmission) result.transmission = smart.transmission
    if (!result.yearMin && smart.yearMin) result.yearMin = String(smart.yearMin)
    if (!result.yearMax && smart.yearMax) result.yearMax = String(smart.yearMax)
    if (!result.priceMin && smart.priceMin !== undefined) result.priceMin = String(smart.priceMin)
    if (!result.priceMax && smart.priceMax !== undefined) result.priceMax = String(smart.priceMax)

    const { sortBy, sortDir } = parseSortOption(searchParams.get('sort'))
    if (sortBy) {
      result.sortBy = sortBy
      result.sortDir = sortDir
    }
    return result
  }, [rawSearch, page, searchParams])

  const { items = [], total = 0, loading, error } = useCars(filters)

  // KAN-97: ghi FILTER_APPLY khi bộ lọc đổi, debounce 800ms để không spam khi
  // người dùng gõ chữ hoặc sửa nhiều ô liên tiếp.
  const filterSignature = useMemo(() => JSON.stringify({ ...filters, page: undefined }), [filters])
  const firstFilterRef = useRef(true)
  useEffect(() => {
    if (firstFilterRef.current) { firstFilterRef.current = false; return }
    const timer = setTimeout(() => {
      trackEvent('FILTER_APPLY', { metadata: { filters: filterSignature.slice(0, 500) } })
    }, 800)
    return () => clearTimeout(timer)
  }, [filterSignature])

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') next.set(key, String(value))
      else next.delete(key)
    })
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  function handleSmartSearchApply(smartParams = {}) {
    const next = new URLSearchParams()
    const currentSort = searchParams.get('sort')
    if (currentSort) next.set('sort', currentSort)

    Object.entries(smartParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        next.set(k, String(v))
      }
    })
    setSearchParams(next)
  }

  function handlePriceChange(idx) {
    const range = PRICE_RANGES[idx]
    updateParams({
      priceMin: range && range.min ? String(range.min) : '',
      priceMax: range && range.max ? String(range.max) : '',
    })
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams())
  }

  function selectProps(key, placeholder) {
    return {
      placeholder,
      value: searchParams.get(key) || undefined,
      onChange: (val) => updateParams({ [key]: val }),
      allowClear: true,
    }
  }

  // Tạo danh sách thẻ bộ lọc đang kích hoạt để hiển thị trực quan
  const activeFilterChips = useMemo(() => {
    const chips = []
    if (rawSearch) {
      chips.push({
        key: 'search',
        label: `Từ khóa: "${rawSearch}"`,
        onRemove: () => updateParams({ search: '' }),
      })
    }
    const makeVal = searchParams.get('make')
    if (makeVal) {
      const brandLabel = brands.find((b) => b.value === makeVal)?.label || makeVal
      chips.push({
        key: 'make',
        label: `Hãng: ${brandLabel}`,
        onRemove: () => updateParams({ make: '' }),
      })
    }
    const bodyVal = searchParams.get('bodyType')
    if (bodyVal) {
      chips.push({
        key: 'bodyType',
        label: `Kiểu dáng: ${labelOf(BODY_TYPE_LABEL, bodyVal)}`,
        onRemove: () => updateParams({ bodyType: '' }),
      })
    }
    const fuelVal = searchParams.get('fuelType')
    if (fuelVal) {
      chips.push({
        key: 'fuelType',
        label: `Nhiên liệu: ${labelOf(FUEL_TYPE_LABEL, fuelVal)}`,
        onRemove: () => updateParams({ fuelType: '' }),
      })
    }
    const transVal = searchParams.get('transmission')
    if (transVal) {
      chips.push({
        key: 'transmission',
        label: `Hộp số: ${labelOf(TRANSMISSION_LABEL, transVal)}`,
        onRemove: () => updateParams({ transmission: '' }),
      })
    }
    const yMin = searchParams.get('yearMin')
    const yMax = searchParams.get('yearMax')
    if (yMin || yMax) {
      chips.push({
        key: 'year',
        label: yMin && yMax && yMin === yMax ? `Năm SX: ${yMin}` : `Năm SX: ${yMin || '...'} - ${yMax || '...'}`,
        onRemove: () => updateParams({ yearMin: '', yearMax: '' }),
      })
    }
    const pMin = searchParams.get('priceMin')
    const pMax = searchParams.get('priceMax')
    if (pMin || pMax) {
      const idx = priceRangeIndex(pMin, pMax)
      const priceLabel =
        idx !== undefined
          ? PRICE_RANGES[idx].label
          : `${pMin ? formatPrice(Number(pMin)) : '0 đ'} - ${pMax ? formatPrice(Number(pMax)) : 'Trở lên'}`
      chips.push({
        key: 'price',
        label: `Giá: ${priceLabel}`,
        onRemove: () => updateParams({ priceMin: '', priceMax: '' }),
      })
    }
    const mMax = searchParams.get('mileageMax')
    if (mMax) {
      const mLabel = MILEAGE_OPTIONS.find((o) => String(o.value) === mMax)?.label || `Dưới ${mMax} km`
      chips.push({
        key: 'mileageMax',
        label: `ODO: ${mLabel}`,
        onRemove: () => updateParams({ mileageMax: '' }),
      })
    }
    return chips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, brands, rawSearch])

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Kho xe đã kiểm định CPO</h1>
          <p className={styles.desc}>
            Tìm kiếm thông minh theo tên xe, hãng, kiểu dáng, năm sản xuất hoặc ngân sách của bạn.
          </p>
        </div>

        {/* THANH TÌM KIẾM THÔNG MINH CÓ GỢI Ý TỪ KHOÁ & XEM TRƯỚC XE */}
        <SmartCarSearchBox
          variant="catalog"
          brands={brands}
          initialKeyword={rawSearch}
          onApplySearch={handleSmartSearchApply}
        />

        <div className={styles.layout}>
          <aside className={styles.filters} aria-label="Bộ lọc xe">
            <div className={styles.filterHeader}>
              <span className={styles.filterHeaderTitle}>
                <FilterOutlined /> Bộ lọc chi tiết
              </span>
              {activeFilterChips.length > 0 && (
                <button type="button" className={styles.resetLinkBtn} onClick={resetFilters}>
                  <ReloadOutlined /> Đặt lại
                </button>
              )}
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Hãng xe</span>
              <Select
                {...selectProps('make', 'Tất cả hãng')}
                options={brands.map((b) => ({ value: b.value, label: b.label }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Kiểu dáng</span>
              <Select {...selectProps('bodyType', 'Tất cả kiểu dáng')} options={toOptions(BODY_TYPE_LABEL)} />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Nhiên liệu</span>
              <Select {...selectProps('fuelType', 'Tất cả nhiên liệu')} options={toOptions(FUEL_TYPE_LABEL)} />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Hộp số</span>
              <Select {...selectProps('transmission', 'Tất cả hộp số')} options={toOptions(TRANSMISSION_LABEL)} />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Năm sản xuất</span>
              <div className={styles.rangeRow}>
                <Select {...selectProps('yearMin', 'Từ')} options={YEAR_SELECT_OPTIONS} />
                <Select {...selectProps('yearMax', 'Đến')} options={YEAR_SELECT_OPTIONS} />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Khoảng giá</span>
              <Select
                placeholder="Tất cả mức giá"
                value={priceRangeIndex(searchParams.get('priceMin'), searchParams.get('priceMax'))}
                onChange={handlePriceChange}
                options={PRICE_RANGES.map((r, idx) => ({ value: String(idx), label: r.label }))}
                allowClear
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Số km đã đi</span>
              <Select
                {...selectProps('mileageMax', 'Không giới hạn')}
                options={MILEAGE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
              />
            </div>

            <Button onClick={resetFilters} block>
              Xoá bộ lọc
            </Button>
          </aside>

          <div>
            <div className={styles.toolbar}>
              <span className={styles.resultCount} aria-live="polite">
                {loading ? 'Đang tải...' : `Tìm thấy ${total} xe phù hợp`}
              </span>
              <Select
                value={searchParams.get('sort') || ''}
                onChange={(val) => updateParams({ sort: val })}
                options={SORT_OPTIONS}
                style={{ minWidth: 210 }}
                aria-label="Sắp xếp"
              />
            </div>

            {activeFilterChips.length > 0 && (
              <div className={styles.activeChipsBar}>
                <span className={styles.activeChipsLabel}>Đang lọc:</span>
                {activeFilterChips.map((chip) => (
                  <span key={chip.key} className={styles.activeChip}>
                    <span>{chip.label}</span>
                    <button
                      type="button"
                      className={styles.activeChipClose}
                      onClick={chip.onRemove}
                      aria-label={`Bỏ lọc ${chip.label}`}
                    >
                      <CloseOutlined />
                    </button>
                  </span>
                ))}
                <button type="button" className={styles.clearAllChipsBtn} onClick={resetFilters}>
                  Xoá tất cả
                </button>
              </div>
            )}

            {loading && <LoadingState text="Đang tải danh sách xe..." />}
            {!loading && error && <ErrorState message={error} />}
            {!loading && !error && items.length === 0 && (
              <EmptyState description="Không tìm thấy xe phù hợp với bộ lọc hiện tại. Hãy thử xoá bớt điều kiện lọc hoặc chọn gợi ý từ khóa phía trên." />
            )}
            {!loading && !error && items.length > 0 && (
              <>
                <div className={styles.grid}>
                  {items.map((car) => (
                    <CarCard key={car.vehicleCode || car._id} car={car} />
                  ))}
                </div>
                <div className={styles.pagination}>
                  <Pagination
                    current={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={(next) => updateParams({ page: String(next) })}
                    showSizeChanger={false}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
