import { useState } from 'react'
import { Image } from 'antd'
import {
  PhoneOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  MailOutlined,
  FacebookFilled,
  MessageFilled,
  TikTokOutlined,
  ExportOutlined,
  CameraOutlined,
  ArrowRightOutlined,
  ExpandOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useContactInfo } from '../../../config/contactInfo'
import showroomImg1 from '../../../assets/Contacts/contact_1.jpg'
import showroomImg2 from '../../../assets/Contacts/contact_2.jpg'
import showroomImg3 from '../../../assets/Contacts/contact_3.jpg'
import styles from './ContactCtaSection.module.css'

export default function ContactCtaSection() {
  const navigate = useNavigate()
  const contactInfo = useContactInfo()
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  const showroomPhotos = [
    {
      id: 'facade',
      badge: 'KHUNG ẢNH 01 · MẶT TIỀN',
      title: 'Mặt tiền Showroom Trust Car Auto',
      desc: 'Không gian mặt tiền đón khách và trưng bày các dòng xe sang tại Cầu Giấy, Hà Nội.',
      src: contactInfo.showroomImageUrl || showroomImg1,
      fallbackSrc: showroomImg1,
      href: contactInfo.mapUrl,
    },
    {
      id: 'yard',
      badge: 'KHUNG ẢNH 02 · SÂN BÃI',
      title: 'Khuôn viên & Bãi xe ngoài trời',
      desc: 'Sân bãi rộng rãi, thuận tiện xem xe thực tế, kiểm tra ngoại thất và lái thử.',
      src: showroomImg2,
      fallbackSrc: showroomImg2,
      href: contactInfo.mapUrl,
    },
    {
      id: 'indoor',
      badge: 'KHUNG ẢNH 03 · KHU TRƯNG BÀY',
      title: 'Không gian trưng bày — "Xe là phải chất"',
      desc: 'Khu vực bảo quản và trưng bày các mẫu xe đã qua kiểm định 150+ hạng mục.',
      src: showroomImg3,
      fallbackSrc: showroomImg3,
      href: contactInfo.zaloUrl,
    },
  ]

  const currentPhoto = showroomPhotos[activeSlideIndex] || showroomPhotos[0]

  const socialLinks = [
    {
      key: 'zalo',
      label: 'Zalo Tư Vấn',
      sub: contactInfo.phoneDisplay,
      href: contactInfo.zaloUrl,
      icon: <span className={styles.zaloText}>Zalo</span>,
      colorClass: styles.socialZalo,
      external: true,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      sub: 'Fanpage chính thức',
      href: contactInfo.facebookUrl,
      icon: <FacebookFilled />,
      colorClass: styles.socialFacebook,
      external: true,
    },
    {
      key: 'messenger',
      label: 'Messenger',
      sub: 'Nhắn tin 24/7',
      href: contactInfo.messengerUrl,
      icon: <MessageFilled />,
      colorClass: styles.socialMessenger,
      external: true,
    },
    {
      key: 'tiktok',
      label: 'TikTok',
      sub: contactInfo.tiktokHandle || '@hieu_xeluot',
      href: contactInfo.tiktokUrl,
      icon: <TikTokOutlined />,
      colorClass: styles.socialTiktok,
      external: true,
    },
    {
      key: 'hotline',
      label: 'Hotline',
      sub: contactInfo.phoneDisplay,
      href: contactInfo.phoneHref,
      icon: <PhoneOutlined />,
      colorClass: styles.socialPhone,
      external: false,
    },
    {
      key: 'email',
      label: 'Email',
      sub: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
      icon: <MailOutlined />,
      colorClass: styles.socialEmail,
      external: false,
    },
  ]

  return (
    <section className={styles.cta}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>
            <EnvironmentOutlined /> VỊ TRÍ SHOWROOM &amp; KẾT NỐI ĐA KÊNH
          </span>
          <h2 className={styles.title}>Ghé thăm Showroom TrustCar &amp; Liên hệ tư vấn</h2>
          <p className={styles.desc}>
            Trải nghiệm trực tiếp không gian trưng bày xe đã qua kiểm định tại{' '}
            <strong>{contactInfo.showroomAddress}</strong> hoặc kết nối nhanh qua các kênh mạng xã hội chính thức.
          </p>
        </div>

        <div className={styles.bentoGrid}>
          {/* LEFT: 3D FRAMED SHOWROOM IMAGE SHOWCASE */}
          <div className={styles.frameColumn}>
            <div className={styles.showroomFrame3D}>
              <span className={`${styles.corner} ${styles.cornerTL}`} aria-hidden="true" />
              <span className={`${styles.corner} ${styles.cornerTR}`} aria-hidden="true" />
              <span className={`${styles.corner} ${styles.cornerBL}`} aria-hidden="true" />
              <span className={`${styles.corner} ${styles.cornerBR}`} aria-hidden="true" />

              <div className={styles.frameHeaderBar}>
                <span className={styles.frameTag}>
                  <CameraOutlined /> {currentPhoto.badge} ({activeSlideIndex + 1}/{showroomPhotos.length})
                </span>
                <div className={styles.frameHeaderActions}>
                  <button
                    type="button"
                    className={styles.frameZoomBtn}
                    onClick={() => setPreviewOpen(true)}
                  >
                    <ExpandOutlined /> Xem ảnh lớn
                  </button>
                  <a
                    href={currentPhoto.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.frameLinkTag}
                  >
                    Mở liên kết <ExportOutlined />
                  </a>
                </div>
              </div>

              <a
                href={currentPhoto.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.frameCanvas}
                title={`Xem vị trí ${contactInfo.showroomDisplay} trên Google Maps`}
              >
                <img
                  src={currentPhoto.src}
                  alt={`${currentPhoto.title} — ${contactInfo.showroomDisplay}`}
                  className={styles.frameImg}
                  onError={(e) => {
                    if (e.currentTarget.src !== currentPhoto.fallbackSrc) {
                      e.currentTarget.src = currentPhoto.fallbackSrc
                    }
                  }}
                />
                <div className={styles.frameVignette} />
                <div className={styles.framePhotoOverlay}>
                  <span className={styles.framePhotoBadge}>
                    <EnvironmentOutlined /> {contactInfo.showroomAddress}
                  </span>
                  <h3 className={styles.framePhotoTitle}>{currentPhoto.title}</h3>
                  <p className={styles.framePhotoDesc}>{currentPhoto.desc}</p>
                </div>
              </a>

              <div className={styles.frameFooterInfo}>
                <div className={styles.frameLocationCopy}>
                  <strong>{contactInfo.showroomName}</strong>
                  <span>
                    <EnvironmentOutlined /> {contactInfo.showroomAddress}
                  </span>
                  <small>
                    <ClockCircleOutlined /> Giờ mở cửa: {contactInfo.showroomHours}
                  </small>
                </div>
                <a
                  href={contactInfo.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.frameVisitBtn}
                >
                  Chỉ đường <ArrowRightOutlined />
                </a>
              </div>
            </div>

            {/* 3 Mini Framed Showroom Photo Thumbnails */}
            <div className={styles.miniFramesRow3Col}>
              {showroomPhotos.map((photo, idx) => {
                const isActive = idx === activeSlideIndex
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`${styles.miniFrameCard} ${isActive ? styles.miniFrameActive : ''}`}
                    aria-label={`Chọn xem ${photo.title}`}
                  >
                    <div className={styles.miniThumbWrap}>
                      <img src={photo.src} alt={photo.title} className={styles.miniThumbImg} loading="lazy" />
                      <span className={styles.miniFrameBadge}>0{idx + 1}</span>
                    </div>
                    <strong className={styles.miniFrameTitle}>{photo.title}</strong>
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'none' }}>
              <Image.PreviewGroup
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (vis) => setPreviewOpen(vis),
                  current: activeSlideIndex,
                  onChange: (current) => setActiveSlideIndex(current),
                }}
              >
                {showroomPhotos.map((photo) => (
                  <Image key={photo.id} src={photo.src} alt={photo.title} />
                ))}
              </Image.PreviewGroup>
            </div>
          </div>

          {/* RIGHT: INTERACTIVE GOOGLE MAP + 3D SOCIAL MEDIA LINKS */}
          <div className={styles.infoColumn}>
            <div className={styles.mapCard3D}>
              <div className={styles.mapCardHead}>
                <div>
                  <span className={styles.mapEyebrow}>BẢN ĐỒ VỊ TRÍ SHOWROOM</span>
                  <h3 className={styles.mapCardTitle}>{contactInfo.showroomAddress}</h3>
                </div>
                <a
                  href={contactInfo.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mapOpenBtn}
                >
                  <CompassOutlined /> Google Maps
                </a>
              </div>

              <div className={styles.mapViewport}>
                <iframe
                  src={contactInfo.mapEmbedUrl}
                  title={`Bản đồ ${contactInfo.showroomDisplay}`}
                  className={styles.mapIframe}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>

            <div className={styles.socialCard3D}>
              <div className={styles.socialCardHeader}>
                <div>
                  <span className={styles.mapEyebrow}>KÊNH LIÊN HỆ &amp; MẠNG XÃ HỘI</span>
                  <h3 className={styles.socialCardTitle}>Kết nối trực tiếp với TrustCar</h3>
                </div>
                <span className={styles.syncBadge}>Đồng bộ cấu hình Showroom</span>
              </div>

              <div className={styles.socialLinksGrid}>
                {socialLinks.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className={`${styles.socialLink3D} ${item.colorClass}`}
                  >
                    <span className={styles.socialIconBadge}>{item.icon}</span>
                    <span className={styles.socialTextWrap}>
                      <strong>{item.label}</strong>
                      <small>{item.sub}</small>
                    </span>
                    <ArrowRightOutlined className={styles.socialArrow} />
                  </a>
                ))}
              </div>

              <div className={styles.ctaActionsBar}>
                <a href={contactInfo.phoneHref} className={styles.primaryAction3D}>
                  <PhoneOutlined /> Gọi ngay: {contactInfo.phoneDisplay}
                </a>
                <button
                  type="button"
                  onClick={() => navigate('/lien-he')}
                  className={styles.secondaryAction3D}
                >
                  <MessageOutlined /> Trang Liên hệ &amp; Đặt lịch xem xe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
