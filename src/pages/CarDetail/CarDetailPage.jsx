import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Breadcrumb, Button, Modal, Form, Input, message } from 'antd'
import {
  CalendarOutlined,
  DashboardOutlined,
  CarOutlined,
  ThunderboltOutlined,
  PhoneOutlined,
  MessageOutlined,
  LeftOutlined,
  RightOutlined,
  SafetyCertificateFilled,
  CheckCircleFilled,
  TagFilled,
  CompassOutlined,
  AppstoreOutlined,
  SettingOutlined,
  StarFilled,
  ArrowDownOutlined,
} from '@ant-design/icons'
import { useCarDetail } from '../../hooks/useCarDetail'
import { formatPrice, formatMileage } from '../../utils/format'
import { getCarTitle, sortCarImages, getCarPriceComparison } from '../../utils/car'
import { BODY_TYPE_LABEL, FUEL_TYPE_LABEL, TRANSMISSION_LABEL, labelOf } from '../../utils/constants'
import { sendContactRequest } from '../../services/carService'
import CarCard from '../../components/car/CarCard'
import { LoadingState, ErrorState } from '../../components/common/StateBlock'
import CompareToggle from '../../features/vehicle-compare/components/CompareToggle'
import SaveCarButton from '../../features/saved-cars/components/SaveCarButton'
import TestDriveButton from '../../features/test-drive-booking/components/TestDriveButton'
import PublicCertificateSection from '../../features/cpo-certificates/components/PublicCertificateSection'
import ShareButtons from '../../features/car-share/components/ShareButtons'
import InstallmentWidget from '../../features/installment-calculator/components/InstallmentWidget'
import { trackEvent } from '../../utils/trackEvent'
import styles from './CarDetailPage.module.css'
import { CONTACT_INFO } from '../../config/contactInfo'

const OWNER_TYPE_LABEL = {
  INDIVIDUAL: 'Cá nhân đứng tên',
  COMPANY: 'Công ty / Doanh nghiệp',
}

export default function CarDetailPage() {
  const { stockCode } = useParams()
  const navigate = useNavigate()
  const { car, similarCars, loading, error } = useCarDetail(stockCode)
  const [activeImage, setActiveImage] = useState(0)
  const thumbsRef = useRef(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form] = Form.useForm()

  // KAN-97: ghi nhận VIEW_CAR cho lead scoring (1 lần/khi mở trang, fire-and-forget).
  useEffect(() => {
    if (!car?._id) return
    trackEvent('VIEW_CAR', { carId: car._id, metadata: { stockCode } })
  }, [car?._id, stockCode])

  if (loading) return <div className="container"><LoadingState text="Đang tải thông tin xe..." /></div>
  if (error) return <div className="container"><ErrorState message={error} onRetry={() => navigate(0)} /></div>
  if (!car) return null

  const title = getCarTitle(car)
  const images = sortCarImages(car.images)
  const current = images[activeImage]
  const hasManyImages = images.length > 1
  const specs = car.specifications || {}
  const priceComp = getCarPriceComparison(car)

  function selectImage(idx) {
    setActiveImage(idx)
    const strip = thumbsRef.current
    const thumb = strip?.children[idx]
    if (strip && thumb) {
      strip.scrollTo({
        left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
        behavior: 'smooth',
      })
    }
  }
  const goPrev = () => selectImage((activeImage - 1 + images.length) % images.length)
  const goNext = () => selectImage((activeImage + 1) % images.length)

  const quickPillars = [
    {
      key: 'year',
      icon: <CalendarOutlined />,
      label: 'Năm sản xuất',
      value: car.year ? `Đời ${car.year}` : 'Đang cập nhật',
    },
    {
      key: 'mileage',
      icon: <DashboardOutlined />,
      label: 'Số ODO đã đi',
      value: formatMileage(car.mileage),
    },
    {
      key: 'transmission',
      icon: <SettingOutlined />,
      label: 'Hộp số',
      value: labelOf(TRANSMISSION_LABEL, car.transmission),
    },
    {
      key: 'fuel',
      icon: <ThunderboltOutlined />,
      label: 'Nhiên liệu',
      value: labelOf(FUEL_TYPE_LABEL, car.fuelType),
    },
  ]

  const specItems = [
    { icon: <CalendarOutlined />, label: 'Năm sản xuất', value: car.year },
    { icon: <DashboardOutlined />, label: 'Số km đã đi', value: formatMileage(car.mileage) },
    { icon: <SettingOutlined />, label: 'Hộp số', value: labelOf(TRANSMISSION_LABEL, car.transmission) },
    { icon: <ThunderboltOutlined />, label: 'Nhiên liệu', value: labelOf(FUEL_TYPE_LABEL, car.fuelType) },
    { icon: <CarOutlined />, label: 'Kiểu dáng', value: labelOf(BODY_TYPE_LABEL, car.bodyType) },
    { icon: <AppstoreOutlined />, label: 'Số chỗ ngồi', value: specs.numberOfSeats ? `${specs.numberOfSeats} chỗ` : null },
    { icon: <CompassOutlined />, label: 'Hệ dẫn động', value: car.driveType },
    {
      icon: <ThunderboltOutlined />,
      label: 'Dung tích động cơ',
      value: specs.engineDisplacementCC ? `${specs.engineDisplacementCC} cc` : null,
    },
    {
      icon: <ThunderboltOutlined />,
      label: 'Công suất cực đại',
      value: specs.horsePower ? `${specs.horsePower} HP` : null,
    },
    {
      icon: <DashboardOutlined />,
      label: 'Mức tiêu hao nhiên liệu',
      value: specs.fuelConsumption ? `${specs.fuelConsumption} L/100km` : null,
    },
    { icon: <StarFilled />, label: 'Màu ngoại thất', value: specs.color },
    { icon: <StarFilled />, label: 'Màu nội thất', value: specs.interiorColor },
    { icon: <CompassOutlined />, label: 'Xuất xứ', value: specs.originCountry },
    {
      icon: <SafetyCertificateFilled />,
      label: 'Hình thức đăng ký',
      value: car.ownerType ? OWNER_TYPE_LABEL[car.ownerType] || car.ownerType : null,
    },
    {
      icon: <SafetyCertificateFilled />,
      label: 'Phân hạng chất lượng',
      value: car.conditionGrade ? `Hạng ${car.conditionGrade}` : null,
    },
    { icon: <TagFilled />, label: 'Mã định danh xe', value: car.vehicleCode },
  ].filter((s) => s.value != null && s.value !== '')

  async function handleSendContact(values) {
    setSending(true)
    try {
      await sendContactRequest({ vehicleCode: car.vehicleCode, ...values })
      message.success('Đã gửi yêu cầu tư vấn. TrustCar sẽ liên hệ với bạn sớm nhất.')
      setContactOpen(false)
      form.resetFields()
    } catch {
      message.error('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau hoặc gọi hotline.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container">
      <div className={styles.page}>
        {/* Thanh điều hướng & Huy hiệu định danh 3D */}
        <div className={styles.topBar}>
          <Breadcrumb
            className={styles.breadcrumb}
            items={[
              { title: <Link to="/">Trang chủ</Link> },
              { title: <Link to="/xe">Danh sách xe</Link> },
              { title },
            ]}
          />
          <div className={styles.topMetaPills}>
            {car.vehicleCode && (
              <span className={styles.codePill}>
                <TagFilled /> Mã xe: <strong>{car.vehicleCode}</strong>
              </span>
            )}
            <span className={styles.statusPill}>
              <span className={styles.statusDot} /> Sẵn sàng giao ngay
            </span>
          </div>
        </div>

        {/* Bố cục Showroom 3D 2 cột cân đối */}
        <div className={styles.layout}>
          {/* CỘT TRÁI: SÂN KHẤU HÌNH ẢNH 3D + THÔNG SỐ KỸ THUẬT + SO SÁNH GIÁ TRỊ */}
          <div className={styles.leftColumn}>
            {/* Khối 1: Sân khấu trưng bày ảnh xe 3D */}
            <section className={styles.galleryStageCard} aria-label="Hình ảnh chi tiết xe">
              <div className={styles.ledStripTop} aria-hidden="true" />
              <div className={styles.gallery}>
                <div className={styles.mainImgWrap}>
                  <div className={styles.stageSpotlight} aria-hidden="true" />

                  <div className={styles.stageFloatingBadges}>
                    {car.bodyType && (
                      <span className={styles.stageBodyBadge}>
                        {labelOf(BODY_TYPE_LABEL, car.bodyType)}
                      </span>
                    )}
                    {car.year && <span className={styles.stageYearBadge}>SX {car.year}</span>}
                  </div>

                  {car.cpoCertificateId && (
                    <span className={styles.stageCpoBadge} title={`Chứng nhận ${car.cpoCertificateId}`}>
                      <SafetyCertificateFilled /> Đạt chuẩn CPO
                    </span>
                  )}

                  {current ? (
                    <img src={current.url} alt={current.caption || title} className={styles.mainImg} />
                  ) : (
                    <div className={styles.emptyStage}>
                      <CarOutlined className={styles.emptyStageIcon} />
                      <span>Hình ảnh thực tế tại Showroom đang được cập nhật</span>
                    </div>
                  )}

                  {hasManyImages && (
                    <>
                      <button
                        type="button"
                        className={`${styles.navBtn} ${styles.navPrev}`}
                        onClick={goPrev}
                        aria-label="Ảnh trước"
                      >
                        <LeftOutlined />
                      </button>
                      <button
                        type="button"
                        className={`${styles.navBtn} ${styles.navNext}`}
                        onClick={goNext}
                        aria-label="Ảnh tiếp theo"
                      >
                        <RightOutlined />
                      </button>
                      <span className={styles.counter} aria-live="polite">
                        Góc chụp {activeImage + 1} / {images.length}
                      </span>
                    </>
                  )}
                </div>

                {hasManyImages && (
                  <div className={styles.thumbs} ref={thumbsRef}>
                    {images.map((img, idx) => (
                      <button
                        type="button"
                        key={img._id || img.publicId || idx}
                        className={`${styles.thumb} ${idx === activeImage ? styles.thumbActive : ''}`}
                        onClick={() => selectImage(idx)}
                        aria-label={`Xem ảnh ${idx + 1}`}
                        aria-pressed={idx === activeImage}
                      >
                        <img src={img.url} alt="" className={styles.thumbImg} />
                      </button>
                    ))}
                  </div>
                )}

                {/* 4 trụ cột thông số nổi bật 3D ngay dưới sân khấu ảnh */}
                <div className={styles.quickPillarsGrid}>
                  {quickPillars.map((pillar) => (
                    <div key={pillar.key} className={styles.pillarCard3D}>
                      <span className={styles.pillarIcon}>{pillar.icon}</span>
                      <div className={styles.pillarContent}>
                        <span className={styles.pillarLabel}>{pillar.label}</span>
                        <strong className={styles.pillarValue}>{pillar.value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Khối 2: Bảng phân tích độ chênh lệch tiết kiệm khi mua xe cũ vs xe mới */}
            {priceComp && (
              <section className={styles.valueCompareCard3D} aria-label="So sánh chi phí mua xe cũ và xe mới">
                <div className={styles.sectionCardHead}>
                  <div>
                    <span className={styles.sectionEyebrow3D}>BÀI TOÁN KINH TẾ THÔNG MINH</span>
                    <h2 className={styles.sectionTitle3D}>
                      Chênh lệch chi phí: Mua xe lướt TrustCar vs Mua xe mới
                    </h2>
                  </div>
                  <span className={styles.savingHighlightPill}>
                    <ArrowDownOutlined /> Tiết kiệm {priceComp.savingPercent}% chi phí
                  </span>
                </div>

                <div className={styles.compareColumns3D}>
                  <div className={styles.compareColNew}>
                    <span className={styles.compareColTag}>KHI MUA XE MỚI LĂN BÁNH</span>
                    <del className={styles.compareColStrikePrice}>
                      {formatPrice(priceComp.newCarPrice)}
                    </del>
                    <p className={styles.compareColNote}>
                      Bao gồm giá niêm yết hãng + 10–12% lệ phí trước bạ lần đầu, phí biển số và khấu hao mạnh ngay năm đầu tiên.
                    </p>
                  </div>

                  <div className={styles.compareColUsed}>
                    <span className={styles.compareColTagGold}>KHI MUA TẠI TRUSTCAR</span>
                    <div className={styles.compareColActivePrice}>
                      {formatPrice(priceComp.usedPrice)}
                    </div>
                    <p className={styles.compareColNote}>
                      Xe đã qua kiểm định chất lượng, sang tên chỉ mất 2% thuế trước bạ và giữ giá ổn định hơn nhiều so với xe mới.
                    </p>
                  </div>
                </div>

                <div className={styles.savingSummaryStrip}>
                  <div className={styles.savingSummaryText}>
                    <CheckCircleFilled className={styles.savingSummaryIcon} />
                    <span>
                      Khoản tiền bạn giữ lại được ngay khi chọn chiếc <strong>{title}</strong> này:
                    </span>
                  </div>
                  <strong className={styles.savingSummaryAmount}>
                    + {formatPrice(priceComp.savingAmount)}
                  </strong>
                </div>
              </section>
            )}

            {/* Khối 3: Ma trận thông số kỹ thuật 3D */}
            <section className={styles.sectionCard3D} aria-label="Thông số kỹ thuật chi tiết">
              <div className={styles.sectionCardHead}>
                <div>
                  <span className={styles.sectionEyebrow3D}>THÔNG SỐ KỸ THUẬT</span>
                  <h2 className={styles.sectionTitle3D}>Cấu hình & Hồ sơ chi tiết</h2>
                </div>
              </div>

              <div className={styles.specsGrid}>
                {specItems.map((s) => (
                  <div className={styles.specItem} key={s.label}>
                    <span className={styles.specIconBox}>{s.icon}</span>
                    <div className={styles.specTextWrap}>
                      <span className={styles.specLabel}>{s.label}</span>
                      <span className={styles.specValue}>{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Khối 4: Trang bị nổi bật */}
            {Array.isArray(specs.features) && specs.features.length > 0 && (
              <section className={styles.sectionCard3D}>
                <div className={styles.sectionCardHead}>
                  <div>
                    <span className={styles.sectionEyebrow3D}>TIỆN NGHI & AN TOÀN</span>
                    <h2 className={styles.sectionTitle3D}>Trang bị nổi bật trên xe</h2>
                  </div>
                </div>
                <ul className={styles.featureTagsList}>
                  {specs.features.map((item) => (
                    <li key={item} className={styles.featureTag3D}>
                      <CheckCircleFilled className={styles.featureCheckIcon} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Khối 5: Mô tả tình trạng xe */}
            {car.description && (
              <section className={styles.sectionCard3D}>
                <div className={styles.sectionCardHead}>
                  <div>
                    <span className={styles.sectionEyebrow3D}>ĐÁNH GIÁ THỰC TẾ</span>
                    <h2 className={styles.sectionTitle3D}>Tình trạng & Lịch sử bảo dưỡng</h2>
                  </div>
                </div>
                <p className={styles.descText}>{car.description}</p>
              </section>
            )}
          </div>

          {/* CỘT PHẢI: BẢNG GIÁ 3D + GIÁ XE MỚI GẠCH NGANG + CTA + CPO + TRẢ GÓP */}
          <aside className={styles.rightColumn} aria-label="Giá bán và công cụ tài chính">
            <div className={styles.info}>
              <div className={styles.ledStripTop} aria-hidden="true" />

              <div className={styles.infoBadgeRow}>
                {car.make && <span className={styles.brandChip}>{car.make}</span>}
                {car.bodyType && (
                  <span className={styles.typeChip}>{labelOf(BODY_TYPE_LABEL, car.bodyType)}</span>
                )}
                {car.ownerType && (
                  <span className={styles.ownerChip}>
                    {OWNER_TYPE_LABEL[car.ownerType] || car.ownerType}
                  </span>
                )}
              </div>

              <h1 className={styles.title}>{title}</h1>

              {/* Hộp Giá Bán 3D & Giá Xe Mới Gạch Ngang */}
              <div className={styles.priceBoard3D}>
                <div className={styles.priceBoardHeader}>
                  <span className={styles.priceLabel}>GIÁ ƯU ĐÃI TẠI TRUSTCAR</span>
                  {priceComp && (
                    <span className={styles.discountBadge3D}>
                      Tiết kiệm {priceComp.savingPercent}%
                    </span>
                  )}
                </div>

                <div className={styles.price}>{formatPrice(car.price)}</div>

                {priceComp && (
                  <>
                    <div className={styles.newCarPriceRow}>
                      <span className={styles.newCarPriceLabel}>Giá xe mới lăn bánh:</span>
                      <del className={styles.newCarPriceStrike}>
                        {formatPrice(priceComp.newCarPrice)}
                      </del>
                    </div>

                    <div className={styles.savingsBanner3D}>
                      <div className={styles.savingsTopRow}>
                        <span className={styles.savingsTitle}>
                          <ArrowDownOutlined /> Chênh lệch tiết kiệm khi mua xe cũ
                        </span>
                        <strong className={styles.savingsValue}>
                          -{formatPrice(priceComp.savingAmount)}
                        </strong>
                      </div>

                      <div className={styles.savingsBarTrack} aria-hidden="true">
                        <div
                          className={styles.savingsBarUsed}
                          style={{ width: `${priceComp.usedPercent}%` }}
                          title={`Giá mua tại TrustCar: ${priceComp.usedPercent}%`}
                        />
                        <div
                          className={styles.savingsBarSaved}
                          style={{ width: `${priceComp.savingPercent}%` }}
                          title={`Tiết kiệm: ${priceComp.savingPercent}%`}
                        />
                      </div>

                      <div className={styles.savingsLegend}>
                        <span className={styles.legendUsed}>
                          <i /> Giá xe cũ ({priceComp.usedPercent}%)
                        </span>
                        <span className={styles.legendSaved}>
                          <i /> Bạn tiết kiệm được {formatPrice(priceComp.savingAmount)} ({priceComp.savingPercent}%)
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Cam kết Showroom 3D */}
              <div className={styles.guaranteesGrid}>
                <div className={styles.guaranteeChip}>
                  <CheckCircleFilled /> Kiểm định đa điểm
                </div>
                <div className={styles.guaranteeChip}>
                  <CheckCircleFilled /> Pháp lý minh bạch
                </div>
                <div className={styles.guaranteeChip}>
                  <CheckCircleFilled /> Hỗ trợ sang tên
                </div>
              </div>

              {/* Cụm nút hành động 3D */}
              <div className={styles.ctaPrimaryWrap}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PhoneOutlined />}
                  href={CONTACT_INFO.phoneHref}
                  block
                  className={styles.callHeroBtn}
                >
                  Gọi tư vấn ngay: {CONTACT_INFO.phoneDisplay}
                </Button>
              </div>

              <div className={styles.ctaRow}>
                <Button size="large" icon={<MessageOutlined />} onClick={() => setContactOpen(true)} block>
                  Yêu cầu tư vấn
                </Button>
                <TestDriveButton car={car} />
                <SaveCarButton car={car} variant="detail" />
                <CompareToggle car={car} variant="detail" />
              </div>

              {/* KAN-67: chia sẻ Facebook / Zalo / Copy link, dùng link Backend /share/car/:code */}
              <ShareButtons car={car} />
            </div>

            {/* SCR-M05: chứng nhận CPO (trang đích của mã QR); hiện khi xe có cpoCertificateId */}
            <PublicCertificateSection
              carKey={car.vehicleCode || car._id}
              vehicleCode={car.vehicleCode}
              cpoCertificateId={car.cpoCertificateId ?? null}
            />

            {/* KAN-62: ước tính trả góp theo giá xe; tự ẩn khi xe chưa có giá hợp lệ */}
            <InstallmentWidget price={car.price} />
          </aside>
        </div>

        {similarCars.length > 0 && (
          <div className={styles.similar}>
            <div className="section-head" style={{ marginBottom: 0 }}>
              <div className="section-eyebrow">Có thể bạn quan tâm</div>
              <h2 className="section-title">Xe tương tự cùng phân khúc</h2>
            </div>
            <div className={styles.similarGrid}>
              {similarCars.map((similarCar) => (
                <CarCard key={similarCar.vehicleCode || similarCar._id} car={similarCar} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Yêu cầu tư vấn"
        open={contactOpen}
        onCancel={() => setContactOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSendContact}>
          <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nguyễn Văn A" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="phone_number"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0' },
            ]}
          >
            <Input placeholder="09xxxxxxxx" inputMode="tel" maxLength={10} />
          </Form.Item>
          <Form.Item name="request_content" label="Lời nhắn">
            <Input.TextArea rows={3} placeholder="Tôi muốn xem xe này..." maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={sending} block>
            Gửi yêu cầu
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
