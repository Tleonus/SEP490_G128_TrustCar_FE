import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Select, Pagination, Tag, Tooltip } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useAdminCars } from '../../hooks/useAdminCars'
import { useDebounce } from '../../hooks/useDebounce'
import { useBrands } from '../../hooks/useCatalog'
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateBlock'
import { formatPrice, formatMileage, formatDate } from '../../utils/format'
import { getCarTitle, getCoverImage, computeAging } from '../../utils/car'
import {
  CAR_STATUS_LABEL,
  CAR_STATUS_COLOR,
  AGING_LABEL,
  AGING_COLOR,
  ADMIN_SORT_OPTIONS,
  ADMIN_PAGE_SIZE,
  toOptions,
  labelOf,
  parseSortOption,
} from '../../utils/constants'
import styles from './AdminCarsPage.module.css'

export default function AdminCarsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('search') || '')
  const debouncedKeyword = useDebounce(keyword, 400)
  const brands = useBrands()

  const page = Number(searchParams.get('page')) || 1

  const filters = useMemo(() => {
    const result = {
      search: debouncedKeyword || undefined,
      status: searchParams.get('status') || undefined,
      make: searchParams.get('make') || undefined,
      page,
      limit: ADMIN_PAGE_SIZE,
    }
    const { sortBy, sortDir } = parseSortOption(searchParams.get('sort'))
    if (sortBy) {
      result.sortBy = sortBy
      result.sortDir = sortDir
    }
    return result
  }, [debouncedKeyword, page, searchParams])

  const { items = [], total = 0, loading, error } = useAdminCars(filters)

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next)
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
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý kho xe</h1>
        <p className={styles.desc}>Theo dõi toàn bộ xe trong kho và tình trạng tồn kho.</p>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tổng số xe khớp bộ lọc</span>
          <span className={styles.statValue}>{loading ? '—' : total}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <Input
          placeholder="Mã xe, VIN, biển số, hãng, dòng xe..."
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            if (searchParams.get('page')) updateParams({})
          }}
          allowClear
          className={styles.search}
        />
        <Select
          {...selectProps('status', 'Tất cả trạng thái')}
          options={toOptions(CAR_STATUS_LABEL)}
          style={{ minWidth: 170 }}
        />
        <Select
          {...selectProps('make', 'Tất cả hãng')}
          options={brands.map((b) => ({ value: b.value, label: b.label }))}
          style={{ minWidth: 150 }}
        />
        <Select
          value={searchParams.get('sort') || ''}
          onChange={(val) => updateParams({ sort: val })}
          options={ADMIN_SORT_OPTIONS}
          style={{ minWidth: 190 }}
        />
      </div>

      {loading && <LoadingState text="Đang tải danh sách xe..." />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState description="Không tìm thấy xe phù hợp với bộ lọc hiện tại." />
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Mã xe</th>
                  <th>Xe</th>
                  <th>Năm</th>
                  <th>Số km</th>
                  <th>Giá bán</th>
                  <th>Trạng thái</th>
                  <th>Ngày nhập kho</th>
                  <th>Số ngày tồn</th>
                  <th>Tình trạng tồn</th>
                </tr>
              </thead>
              <tbody>
                {items.map((car) => {
                  const cover = getCoverImage(car)
                  const image = typeof cover === 'string' ? cover : cover?.url
                  // daysInStock/agingCategory lưu trong DB có thể bị lệch (job cập nhật hàng ngày phía
                  // backend không được wire chạy) nên tính lại tại đây từ listedDate theo đúng công thức
                  // nghiệp vụ 0-30/31-60/60+ ngày.
                  const { daysInStock, agingCategory } = computeAging(car.listedDate)
                  return (
                  <tr key={car.vehicleCode || car._id}>
                    <td>
                      {image ? (
                        <img src={image} alt={getCarTitle(car)} className={styles.thumb} />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                    </td>
                    <td>{car.vehicleCode}</td>
                    <td>
                      <Tooltip title={`VIN: ${car.vin || '—'} · Biển số: ${car.licensePlate || '—'}`}>
                        {getCarTitle(car)}
                      </Tooltip>
                    </td>
                    <td>{car.year}</td>
                    <td>{formatMileage(car.mileage)}</td>
                    <td>{formatPrice(car.price)}</td>
                    <td>
                      <Tag color={CAR_STATUS_COLOR[car.status]}>{labelOf(CAR_STATUS_LABEL, car.status)}</Tag>
                    </td>
                    <td>{formatDate(car.listedDate)}</td>
                    <td>{daysInStock} ngày</td>
                    <td>
                      <Tag color={AGING_COLOR[agingCategory]}>{labelOf(AGING_LABEL, agingCategory)}</Tag>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.pagination}>
            <Pagination
              current={page}
              pageSize={ADMIN_PAGE_SIZE}
              total={total}
              onChange={(next) => updateParams({ page: String(next) })}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  )
}
