import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Select, Pagination, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useCars } from '../../hooks/useCars'
import { useDebounce } from '../../hooks/useDebounce'
import { useBrands, useCarModels } from '../../hooks/useCatalog'
import {
  BODY_TYPE_LABEL,
  FUEL_TYPE_LABEL,
  TRANSMISSION_LABEL,
  PRICE_RANGES,
  MILEAGE_OPTIONS,
  YEAR_OPTIONS,
  SORT_OPTIONS,
  PAGE_SIZE,
  toOptions,
} from '../../utils/constants'
import CarCard from '../../components/car/CarCard'
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateBlock'
import styles from './CarsPage.module.css'

const FILTER_KEYS = [
  'brand_id', 'model_id', 'body_type', 'fuel_type', 'transmission',
  'year_from', 'year_to', 'price_min', 'price_max', 'mileage_max', 'sort',
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
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const debouncedKeyword = useDebounce(keyword, 400)

  const brands = useBrands()
  const brandId = searchParams.get('brand_id') || ''
  const models = useCarModels(brandId)
  const page = Number(searchParams.get('page')) || 1

  const filters = useMemo(() => {
    const result = { keyword: debouncedKeyword || undefined, page, page_size: PAGE_SIZE }
    FILTER_KEYS.forEach((key) => {
      result[key] = searchParams.get(key) || undefined
    })
    return result
  }, [debouncedKeyword, page, searchParams])

  const { items = [], total = 0, loading, error } = useCars(filters)

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
  }

  function handlePriceChange(idx) {
    const range = PRICE_RANGES[idx]
    updateParams({
      price_min: range && range.min ? String(range.min) : '',
      price_max: range && range.max ? String(range.max) : '',
    })
  }

  function resetFilters() {
    setKeyword('')
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

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Danh sách xe</h1>
          <p className={styles.desc}>Tìm chiếc xe phù hợp với nhu cầu và ngân sách của bạn.</p>
        </div>

        <div className={styles.layout}>
          <aside className={styles.filters} aria-label="Bộ lọc xe">
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Từ khoá</span>
              <Input
                placeholder="Hãng, dòng xe, phiên bản..."
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  if (searchParams.get('page')) updateParams({})
                }}
                aria-label="Từ khoá"
                allowClear
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Hãng xe</span>
              <Select
                {...selectProps('brand_id', 'Tất cả hãng')}
                onChange={(val) => updateParams({ brand_id: val, model_id: '' })}
                options={brands.map((b) => ({ value: b.brand_id, label: b.brand_name }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Dòng xe</span>
              <Select
                {...selectProps('model_id', brandId ? 'Tất cả dòng xe' : 'Chọn hãng trước')}
                disabled={!brandId}
                options={models.map((m) => ({ value: m.model_id, label: m.model_name }))}
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Kiểu dáng</span>
              <Select {...selectProps('body_type', 'Tất cả kiểu dáng')} options={toOptions(BODY_TYPE_LABEL)} />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Nhiên liệu</span>
              <Select {...selectProps('fuel_type', 'Tất cả nhiên liệu')} options={toOptions(FUEL_TYPE_LABEL)} />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Hộp số</span>
              <Select {...selectProps('transmission', 'Tất cả hộp số')} options={toOptions(TRANSMISSION_LABEL)} />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Năm sản xuất</span>
              <div className={styles.rangeRow}>
                <Select {...selectProps('year_from', 'Từ')} options={YEAR_SELECT_OPTIONS} />
                <Select {...selectProps('year_to', 'Đến')} options={YEAR_SELECT_OPTIONS} />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Khoảng giá</span>
              <Select
                placeholder="Tất cả mức giá"
                value={priceRangeIndex(searchParams.get('price_min'), searchParams.get('price_max'))}
                onChange={handlePriceChange}
                options={PRICE_RANGES.map((r, idx) => ({ value: String(idx), label: r.label }))}
                allowClear
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Số km đã đi</span>
              <Select
                {...selectProps('mileage_max', 'Không giới hạn')}
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
                {loading ? 'Đang tải...' : `${total} xe phù hợp`}
              </span>
              <Select
                value={searchParams.get('sort') || ''}
                onChange={(val) => updateParams({ sort: val })}
                options={SORT_OPTIONS}
                style={{ minWidth: 200 }}
                aria-label="Sắp xếp"
              />
            </div>

            {loading && <LoadingState text="Đang tải danh sách xe..." />}
            {!loading && error && <ErrorState message={error} />}
            {!loading && !error && items.length === 0 && (
              <EmptyState description="Không tìm thấy xe phù hợp với bộ lọc hiện tại." />
            )}
            {!loading && !error && items.length > 0 && (
              <>
                <div className={styles.grid}>
                  {items.map((car) => (
                    <CarCard key={car.stock_code} car={car} />
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
