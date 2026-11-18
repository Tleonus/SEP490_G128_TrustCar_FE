import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { App, Button, Input, Select, Pagination, Tag, Tooltip } from 'antd'
import { FacebookFilled, HistoryOutlined, PictureOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons'
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
import Icon from '../../features/vehicle-intake/components/VehicleIntakeIcon'
import OrderCheckoutModal from '../../features/sales-crm/components/OrderCheckoutModal'
import { isSellableStatus, toCarVM } from '../../features/sales-crm/data/salesCrmMappers'
import CarImagesModal from '../../features/car-images/components/CarImagesModal'
import CaptionComposerModal from '../../features/marketing-caption/components/CaptionComposerModal'
import PriceHistoryModal from '../../features/price-policy/components/PriceHistoryModal'
import { ADMIN_PATHS } from '../../router/paths'
import styles from './AdminCarsPage.module.css'

/** Ảnh chính của xe (Backend coi ảnh chính là ảnh dùng khi chia sẻ), dùng cho modal bài đăng. */
function primaryImageUrl(car) {
  const cover = getCoverImage(car)
  return (typeof cover === 'string' ? cover : cover?.url) || null
}

export default function AdminCarsPage() {
  const { notification } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [checkoutCar, setCheckoutCar] = useState(null)
  // Xe đang mở modal nhập ảnh / tạo bài đăng Facebook / xem lịch sử giá.
  const [imageCar, setImageCar] = useState(null)
  const [postCar, setPostCar] = useState(null)
  const [historyCar, setHistoryCar] = useState(null)
  const keyword = searchParams.get('search') || ''
  const debouncedKeyword = useDebounce(keyword, 400)
  const brands = useBrands()

  const requestedPage = Number(searchParams.get('page'))
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1

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

  const { items = [], total = 0, loading, error, reload } = useAdminCars(filters)

  // Sau khi chốt đơn: xe chuyển SOLD, tải lại bảng để cập nhật trạng thái (trang công khai chỉ hiện xe AVAILABLE).
  function handleCheckoutSuccess(result) {
    setCheckoutCar(null)
    notification.success({
      title: `Đã chốt đơn ${result.vehicleCode || ''}`.trim(),
      description: 'Xe đã chuyển sang trạng thái "Đã bán" và được gỡ khỏi danh sách mở bán công khai.',
      placement: 'topRight',
    })
    reload()
  }

  function updateParams(changes) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
    if (!('page' in changes)) next.delete('page')
    setSearchParams(next, { replace: 'search' in changes })
  }

  function selectProps(key, placeholder) {
    return {
      placeholder,
      'aria-label': placeholder,
      value: searchParams.get(key) || undefined,
      onChange: (val) => updateParams({ [key]: val }),
      allowClear: true,
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>QUẢN LÝ SHOWROOM</span>
          <h1 className={styles.title}>Quản lý kho xe</h1>
          <p className={styles.desc}>Theo dõi toàn bộ xe trong kho và tình trạng tồn kho.</p>
        </div>
        <Link to={ADMIN_PATHS.vehicleIntake} className={styles.primaryAction}>
          <Icon name="plus" size={18} />Nhập xe & Thẩm định
        </Link>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Tổng số xe khớp bộ lọc</span>
          <span className={styles.statValue}>{loading || error ? '—' : total}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <Input
          placeholder="Mã xe, VIN, biển số, hãng, dòng xe..."
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => updateParams({ search: e.target.value })}
          aria-label="Tìm kiếm xe trong kho"
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
          aria-label="Sắp xếp kho xe"
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
            <table className={styles.table} aria-label="Danh sách xe trong kho">
              <thead>
                <tr>
                  <th className={styles.colImage} aria-label="Ảnh xe"></th>
                  <th>Xe</th>
                  <th className={styles.colYear}>Năm / Số km</th>
                  <th className={styles.colPrice}>Giá bán</th>
                  <th className={styles.colStatus}>Trạng thái</th>
                  {/* Gộp ngày nhập kho + số ngày tồn + tình trạng tồn vào một cột để bảng vừa
                      khung nhìn, không phải cuộn ngang mới thấy hết thông tin tồn kho. */}
                  <th className={styles.agingCol}>Tồn kho</th>
                  <th className={styles.actionCol}>Thao tác</th>
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
                    <td className={styles.colImage}>
                      {image ? (
                        <img src={image} alt={getCarTitle(car)} className={styles.thumb} />
                      ) : (
                        <div className={styles.thumbPlaceholder} />
                      )}
                    </td>
                    <td className={styles.carCol}>
                      <Tooltip title={`VIN: ${car.vin || '—'} · Biển số: ${car.licensePlate || '—'}`}>
                        <span className={styles.carName}>{getCarTitle(car)}</span>
                      </Tooltip>
                      <span className={styles.carCode}>{car.vehicleCode}</span>
                    </td>
                    <td className={styles.colYear}>
                      <span className={styles.cellPrimary}>{car.year || '—'}</span>
                      <span className={styles.cellSecondary}>{formatMileage(car.mileage)}</span>
                    </td>
                    <td className={styles.colPrice}>{formatPrice(car.price)}</td>
                    <td className={styles.colStatus}>
                      <Tag color={CAR_STATUS_COLOR[car.status]}>{labelOf(CAR_STATUS_LABEL, car.status)}</Tag>
                    </td>
                    <td className={styles.agingCol}>
                      <div className={styles.agingCell}>
                        <Tag color={AGING_COLOR[agingCategory]}>{labelOf(AGING_LABEL, agingCategory)}</Tag>
                        <span className={styles.agingMeta}>
                          {daysInStock} ngày · {formatDate(car.listedDate)}
                        </span>
                      </div>
                    </td>
                    <td className={styles.actionCol}>
                      <div className={styles.actionGroup}>
                        {/* Thay màn "Ảnh chia sẻ mạng xã hội" cũ (cần endpoint Backend chưa có):
                            ảnh chính trong gallery do Backend dùng làm ảnh chia sẻ. */}
                        <Button
                          size="small"
                          icon={<PictureOutlined />}
                          onClick={() => setImageCar(car)}
                          aria-label={`Nhập ảnh cho xe ${car.vehicleCode || getCarTitle(car)}`}
                        >
                          Nhập ảnh xe
                        </Button>
                        <Button
                          size="small"
                          icon={<HistoryOutlined />}
                          onClick={() => setHistoryCar(car)}
                          aria-label={`Xem lịch sử giá xe ${car.vehicleCode || getCarTitle(car)}`}
                        >
                          Lịch sử giá
                        </Button>
                        <Button
                          size="small"
                          icon={<FacebookFilled />}
                          onClick={() => setPostCar(car)}
                          aria-label={`Tạo bài đăng Facebook cho xe ${car.vehicleCode || getCarTitle(car)}`}
                        >
                          Tạo bài đăng
                        </Button>
                        {isSellableStatus(car.status) && (
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<ShoppingCartOutlined />}
                            onClick={() => setCheckoutCar(toCarVM(car))}
                            aria-label={`Chốt đơn xe ${car.vehicleCode || getCarTitle(car)}`}
                          >
                            Chốt đơn
                          </Button>
                        )}
                      </div>
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

      <OrderCheckoutModal
        open={checkoutCar !== null}
        context={checkoutCar ? { car: checkoutCar } : null}
        onClose={() => setCheckoutCar(null)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Nhập ảnh xe: chọn/kéo-thả file, upload thẳng vào gallery (POST /manage/cars/:id/images).
          key theo _id để state ảnh được khởi tạo lại đúng xe mỗi lần mở modal. */}
      <CarImagesModal
        key={imageCar?._id || 'no-image-car'}
        open={imageCar !== null}
        car={imageCar}
        onClose={() => setImageCar(null)}
        onImagesChange={reload}
      />

      {/* Lịch sử giá theo chính sách tồn kho (60 ngày giảm 5% giá gốc). */}
      <PriceHistoryModal
        key={historyCar?._id || 'no-history-car'}
        open={historyCar !== null}
        car={historyCar}
        onClose={() => setHistoryCar(null)}
      />

      {/* Tạo bài đăng Facebook: caption tự soạn khi mở, ảnh lấy từ ảnh chính trong gallery. */}
      <CaptionComposerModal
        key={postCar?._id || 'no-post-car'}
        open={postCar !== null}
        car={postCar}
        imageUrl={primaryImageUrl(postCar)}
        onClose={() => setPostCar(null)}
      />
    </div>
  )
}
