import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Select, Pagination } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useCars } from '../../hooks/useCars'
import { useDebounce } from '../../hooks/useDebounce'
import { BRANDS } from '../../mock/brands'
import { BODY_TYPES, SORT_OPTIONS, PAGE_SIZE } from '../../utils/constants'
import CarCard from '../../components/car/CarCard'
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateBlock'
import styles from './CarsPage.module.css'

export default function CarsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [brand, setBrand] = useState(searchParams.get('brand') || '')
  const [bodyType, setBodyType] = useState(searchParams.get('bodyType') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

  const debouncedKeyword = useDebounce(keyword, 400)

  const filters = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      brand: brand || undefined,
      bodyType: bodyType || undefined,
      priceFrom: searchParams.get('priceFrom') || undefined,
      priceTo: searchParams.get('priceTo') || undefined,
      sortBy: sortBy || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [debouncedKeyword, brand, bodyType, sortBy, page, searchParams],
  )

  const { items, total, loading, error } = useCars(filters)

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  function handlePageChange(nextPage) {
    setPage(nextPage)
    updateParam('page', String(nextPage))
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Danh sách xe</h1>
          <p className={styles.desc}>
            Tìm chiếc xe phù hợp với nhu cầu và ngân sách của bạn.
          </p>
        </div>

        <div className={styles.layout}>
          <aside className={styles.filters}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Từ khoá</span>
              <Input
                placeholder="Tên xe, mẫu xe..."
                prefix={<SearchOutlined />}
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                allowClear
              />
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Thương hiệu</span>
              <Select
                placeholder="Tất cả thương hiệu"
                value={brand || undefined}
                onChange={(val) => {
                  setBrand(val || '')
                  setPage(1)
                  updateParam('brand', val)
                }}
                allowClear
              >
                {BRANDS.map((b) => (
                  <Select.Option key={b.id} value={b.name}>
                    {b.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Loại xe</span>
              <Select
                placeholder="Tất cả loại xe"
                value={bodyType || undefined}
                onChange={(val) => {
                  setBodyType(val || '')
                  setPage(1)
                  updateParam('bodyType', val)
                }}
                allowClear
              >
                {BODY_TYPES.map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </aside>

          <div>
            <div className={styles.toolbar}>
              <span className={styles.resultCount}>
                {loading ? 'Đang tải...' : `${total} xe phù hợp`}
              </span>
              <Select
                value={sortBy || ''}
                onChange={(val) => {
                  setSortBy(val)
                  updateParam('sortBy', val)
                }}
                style={{ minWidth: 180 }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Select.Option>
                ))}
              </Select>
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
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>
                <div className={styles.pagination}>
                  <Pagination
                    current={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={handlePageChange}
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
