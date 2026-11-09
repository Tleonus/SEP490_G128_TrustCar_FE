import { useState } from 'react'
import { Form, Input, Button, Image, message } from 'antd'
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CompassOutlined,
  ClockCircleOutlined,
  FacebookFilled,
  MessageFilled,
  TikTokOutlined,
  SendOutlined,
  SafetyCertificateOutlined,
  CheckCircleFilled,
  ArrowRightOutlined,
  ExportOutlined,
  CameraOutlined,
  ExpandOutlined,
} from '@ant-design/icons'
import { sendContactRequest } from '../../services/carService'
import { useContactInfo } from '../../config/contactInfo'
import showroomImg1 from '../../assets/Contacts/contact_1.jpg'
import showroomImg2 from '../../assets/Contacts/contact_2.jpg'
import showroomImg3 from '../../assets/Contacts/contact_3.jpg'
import styles from './ContactPage.module.css'

const QUICK_TOPICS = [
  'Tư vấn chọn mẫu xe phù hợp nhu cầu',
  'Đặt lịch ghé Showroom xem xe & lái thử',
  'Định giá & ký gửi / thu mua xe đã qua sử dụng',
  'Tư vấn thủ tục trả góp ngân hàng',
]

export default function ContactPage() {
  const contactInfo = useContactInfo()
  const [sending, setSending] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [form] = Form.useForm()

  const gallerySlides = [
    {
      id: 'facade',
      badge: 'GÓC NHÌN 01 · MẶT TIỀN',
      title: 'Mặt tiền Showroom Trust Car Auto',
      subtitle: 'Không gian mặt tiền đón khách & khu vực đỗ xe trải nghiệm thực tế tại Cầu Giấy, Hà Nội.',
      src: contactInfo.showroomImageUrl || showroomImg1,
      fallbackSrc: showroomImg1,
      linkHref: contactInfo.mapUrl,
      linkLabel: 'Mở vị trí Google Maps',
    },
    {
      id: 'forecourt',
      badge: 'GÓC NHÌN 02 · KHUÔN VIÊN',
      title: 'Khuôn viên & Bãi xe ngoài trời rộng rãi',
      subtitle: 'Sân bãi thoáng rộng, thuận tiện để khách hàng trực tiếp xem xe, so sánh và lái thử.',
      src: showroomImg2,
      fallbackSrc: showroomImg2,
      linkHref: contactInfo.mapUrl,
      linkLabel: 'Chỉ đường đến bãi xe',
    },
    {
      id: 'indoor',
      badge: 'GÓC NHÌN 03 · KHU TRƯNG BÀY',
      title: 'Không gian trưng bày — "Xe là phải chất"',
      subtitle: 'Khu vực bảo quản và trưng bày các dòng xe đã qua kiểm định 150+ hạng mục.',
      src: showroomImg3,
      fallbackSrc: showroomImg3,
      linkHref: contactInfo.zaloUrl,
      linkLabel: 'Nhận danh sách xe qua Zalo',
    },
  ]

  const currentSlide = gallerySlides[activeSlideIndex] || gallerySlides[0]

  function handleSelectTopic(topic) {
    setSelectedTopic(topic)
    const currentContent = form.getFieldValue('request_content') || ''
    if (!currentContent.trim()) {
      form.setFieldsValue({ request_content: `${topic}: ` })
    } else if (!currentContent.includes(topic)) {
      form.setFieldsValue({ request_content: `[${topic}] ${currentContent}` })
    }
  }

  async function handleSubmit(values) {
    setSending(true)
    try {
      await sendContactRequest(values)
      message.success('Đã gửi yêu cầu liên hệ. TrustCar sẽ phản hồi sớm nhất.')
      form.resetFields()
      setSelectedTopic('')
    } catch {
      message.error('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau hoặc gọi hotline.')
    } finally {
      setSending(false)
    }
  }

  const socialChannels = [
    {
      key: 'zalo',
      name: 'Zalo Official',
      badge: 'Phản hồi nhanh',
      handle: contactInfo.phoneDisplay,
      desc: 'Nhận báo giá lăn bánh, video quay thực tế xe và hồ sơ kiểm định qua Zalo.',
      href: contactInfo.zaloUrl,
      cta: 'Chat qua Zalo',
      themeClass: styles.channelZalo,
      icon: <span className={styles.zaloGlyph}>Zalo</span>,
      external: true,
    },
    {
      key: 'facebook',
      name: 'Facebook Fanpage',
      badge: 'Cộng đồng',
      handle: 'TrustCar Vietnam',
      desc: 'Theo dõi xe mới về đội mỗi ngày, chương trình ưu đãi và lịch bàn giao xe.',
      href: contactInfo.facebookUrl,
      cta: 'Mở Fanpage',
      themeClass: styles.channelFacebook,
      icon: <FacebookFilled />,
      external: true,
    },
    {
      key: 'messenger',
      name: 'Messenger 24/7',
      badge: 'Trực tuyến',
      handle: 'Trò chuyện trực tiếp',
      desc: 'Nhắn tin trực tiếp với chuyên viên tư vấn để giữ xe hoặc đặt lịch lái thử.',
      href: contactInfo.messengerUrl,
      cta: 'Gửi tin nhắn',
      themeClass: styles.channelMessenger,
      icon: <MessageFilled />,
      external: true,
    },
    {
      key: 'tiktok',
      name: 'TikTok Showroom',
      badge: 'Video thực tế',
      handle: contactInfo.tiktokHandle || '@hieu_xeluot',
      desc: 'Xem video review chi tiết từng mẫu xe lướt, kiểm định khung gầm và nội thất.',
      href: contactInfo.tiktokUrl,
      cta: 'Xem kênh TikTok',
      themeClass: styles.channelTiktok,
      icon: <TikTokOutlined />,
      external: true,
    },
    {
      key: 'hotline',
      name: 'Hotline Tư Vấn',
      badge: 'Ưu tiên',
      handle: contactInfo.phoneDisplay,
      desc: `Kết nối trực tiếp bộ phận kinh doanh & hỗ trợ kỹ thuật (${contactInfo.showroomHours}).`,
      href: contactInfo.phoneHref,
      cta: 'Gọi tư vấn ngay',
      themeClass: styles.channelPhone,
      icon: <PhoneOutlined />,
      external: false,
    },
    {
      key: 'email',
      name: 'Email Tiếp Nhận',
      badge: 'Hồ sơ & Hợp tác',
      handle: contactInfo.email,
      desc: 'Tiếp nhận hồ sơ thẩm định vay ngân hàng, hợp tác đối tác và phản hồi dịch vụ.',
      href: `mailto:${contactInfo.email}`,
      cta: 'Soạn Email',
      themeClass: styles.channelEmail,
      icon: <MailOutlined />,
      external: false,
    },
  ]

  return (
    <div className={styles.pageWrapper}>
      {/* SECTION 1: 3D SHOWROOM HERO & FRAMED GALLERY STAGE */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrowBadge}>
                <SafetyCertificateOutlined />
                <span>LIÊN HỆ &amp; VỊ TRÍ SHOWROOM CHÍNH THỨC</span>
              </div>
              <h1 className={styles.heroTitle}>
                Kết nối với <span>TrustCar</span> &amp; Trải nghiệm Showroom thực tế
              </h1>
              <p className={styles.heroDesc}>
                Mời bạn ghé thăm trực tiếp Showroom để xem xe thực tế, kiểm tra báo cáo kiểm định 150+ hạng mục
                và đăng ký lái thử cùng chuyên gia của TrustCar.
              </p>

              {/* 3D Raised Showroom Location Card with Direct Link */}
              <a
                href={contactInfo.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.address3DCard}
                aria-label={`Mở vị trí ${contactInfo.showroomDisplay} trên Google Maps`}
              >
                <div className={styles.address3DIcon}>
                  <EnvironmentOutlined />
                </div>
                <div className={styles.address3DBody}>
                  <div className={styles.address3DHeader}>
                    <span className={styles.address3DTag}>{contactInfo.showroomName}</span>
                    <span className={styles.address3DLinkHint}>
                      Mở bản đồ <ExportOutlined />
                    </span>
                  </div>
                  <strong className={styles.address3DText}>{contactInfo.showroomAddress}</strong>
                  <div className={styles.address3DMetaRow}>
                    <span>
                      <ClockCircleOutlined /> Giờ mở cửa: {contactInfo.showroomHours}
                    </span>
                    <span>
                      <PhoneOutlined /> Hotline: {contactInfo.phoneDisplay}
                    </span>
                  </div>
                </div>
              </a>

              <div className={styles.heroActions}>
                <a
                  href={contactInfo.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.primary3DBtn}
                >
                  <CompassOutlined /> Chỉ đường Google Maps
                </a>
                <a href={contactInfo.phoneHref} className={styles.secondary3DBtn}>
                  <PhoneOutlined /> Gọi {contactInfo.phoneDisplay}
                </a>
                <a href="#contact-form-section" className={styles.ghost3DBtn}>
                  <SendOutlined /> Đặt lịch hẹn xem xe
                </a>
              </div>
            </div>

            {/* Right: 3D Framed Showroom Real Photo Gallery Stage */}
            <div className={styles.stage3D}>
              <div className={styles.mainFrame3D}>
                <span className={`${styles.frameCorner} ${styles.cornerTL}`} aria-hidden="true" />
                <span className={`${styles.frameCorner} ${styles.cornerTR}`} aria-hidden="true" />
                <span className={`${styles.frameCorner} ${styles.cornerBL}`} aria-hidden="true" />
                <span className={`${styles.frameCorner} ${styles.cornerBR}`} aria-hidden="true" />

                <div className={styles.frameTopBar}>
                  <span className={styles.frameStatusBadge}>
                    <CameraOutlined /> {currentSlide.badge} ({activeSlideIndex + 1}/{gallerySlides.length})
                  </span>
                  <div className={styles.frameTopActions}>
                    <button
                      type="button"
                      className={styles.frameZoomBtn}
                      onClick={() => setPreviewOpen(true)}
                    >
                      <ExpandOutlined /> Phóng to
                    </button>
                    <a
                      href={currentSlide.linkHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.frameLinkPill}
                    >
                      {currentSlide.linkLabel} <ExportOutlined />
                    </a>
                  </div>
                </div>

                <a
                  href={currentSlide.linkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.frameViewport}
                  title={`Nhấn để mở: ${currentSlide.linkLabel}`}
                >
                  <img
                    src={currentSlide.src}
                    alt={`${currentSlide.title} — ${contactInfo.showroomDisplay}`}
                    className={styles.showroomPhoto}
                    onError={(e) => {
                      if (e.currentTarget.src !== currentSlide.fallbackSrc) {
                        e.currentTarget.src = currentSlide.fallbackSrc
                      }
                    }}
                  />
                  <div className={styles.photoVignette} />
                  <div className={styles.photoOverlayContent}>
                    <span className={styles.photoLocationPill}>
                      <EnvironmentOutlined /> {contactInfo.showroomAddress}
                    </span>
                    <h3 className={styles.photoOverlayTitle}>{currentSlide.title}</h3>
                    <p className={styles.photoOverlayDesc}>{currentSlide.subtitle}</p>
                  </div>
                </a>

                <div className={styles.frameCaptionBar}>
                  <div>
                    <div className={styles.frameCaptionTitle}>{contactInfo.showroomName}</div>
                    <div className={styles.frameCaptionAddress}>{contactInfo.showroomAddress}</div>
                  </div>
                  <a
                    href={contactInfo.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.frameDirectionChip}
                  >
                    Xem trên Google Maps <ArrowRightOutlined />
                  </a>
                </div>
              </div>

              {/* 3 Framed 3D Thumbnail Switcher Cards */}
              <div className={styles.subFramesGrid3Col}>
                {gallerySlides.map((slide, idx) => {
                  const isActive = idx === activeSlideIndex
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`${styles.subFrame3D} ${isActive ? styles.subFrameActive : ''}`}
                      aria-label={`Xem ${slide.title}`}
                    >
                      <div className={styles.subFrameThumbWrap}>
                        <img
                          src={slide.src}
                          alt={slide.title}
                          className={styles.subFrameThumbImg}
                          loading="lazy"
                        />
                        <span className={styles.subFrameIndexBadge}>0{idx + 1}</span>
                      </div>
                      <div className={styles.subFrameMeta}>
                        <strong>{slide.title}</strong>
                        <span>{isActive ? 'Đang hiển thị' : 'Nhấn để xem khung lớn'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Hidden PreviewGroup for Lightbox Fullscreen Inspection */}
              <div style={{ display: 'none' }}>
                <Image.PreviewGroup
                  preview={{
                    visible: previewOpen,
                    onVisibleChange: (vis) => setPreviewOpen(vis),
                    current: activeSlideIndex,
                    onChange: (current) => setActiveSlideIndex(current),
                  }}
                >
                  {gallerySlides.map((slide) => (
                    <Image key={slide.id} src={slide.src} alt={slide.title} />
                  ))}
                </Image.PreviewGroup>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 3D SOCIAL MEDIA & CONTACT CHANNELS */}
      <section className={styles.socialSection}>
        <div className="container">
          <div className="section-head">
            <div className="section-eyebrow">Kênh kết nối đa nền tảng</div>
            <h2 className="section-title">Thông tin liên hệ &amp; Mạng xã hội chính thức</h2>
            <p className="section-desc">
              Hệ thống đường dẫn liên hệ được đồng bộ từ trang cấu hình quản trị.
              Nhấn vào từng thẻ 3D bên dưới để kết nối trực tiếp với TrustCar.
            </p>
          </div>

          <div className={styles.social3DGrid}>
            {socialChannels.map((item) => (
              <a
                key={item.key}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                className={`${styles.social3DCard} ${item.themeClass}`}
              >
                <div className={styles.socialCardTop}>
                  <div className={styles.social3DIconBox}>{item.icon}</div>
                  <span className={styles.socialBadge}>{item.badge}</span>
                </div>
                <div className={styles.socialCardBody}>
                  <h3 className={styles.socialName}>{item.name}</h3>
                  <div className={styles.socialHandle}>{item.handle}</div>
                  <p className={styles.socialDesc}>{item.desc}</p>
                </div>
                <div className={styles.socialCardFooter}>
                  <span>{item.cta}</span>
                  <ArrowRightOutlined />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: INTERACTIVE MAP & CONSULTATION FORM */}
      <section className={styles.mainContentSection} id="showroom-map">
        <div className="container">
          <div className={styles.splitLayout}>
            {/* Left: 3D Map & Showroom Location Card */}
            <div className={styles.map3DCard}>
              <div className={styles.cardHeader3D}>
                <div className={styles.cardHeaderIcon}>
                  <EnvironmentOutlined />
                </div>
                <div>
                  <span className={styles.cardEyebrow}>BẢN ĐỒ &amp; ĐỊA CHỈ SHOWROOM</span>
                  <h2 className={styles.cardTitle}>{contactInfo.showroomName}</h2>
                  <p className={styles.cardSubtitle}>{contactInfo.showroomAddress}</p>
                </div>
              </div>

              <div className={styles.mapFrameWrapper}>
                <iframe
                  src={contactInfo.mapEmbedUrl}
                  title={`Bản đồ vị trí ${contactInfo.showroomDisplay}`}
                  className={styles.mapIframe}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              <div className={styles.locationDetailsBox}>
                <div className={styles.locationDetailRow}>
                  <EnvironmentOutlined className={styles.detailRowIcon} />
                  <div>
                    <strong>Địa chỉ đón khách &amp; xem xe:</strong>
                    <p>{contactInfo.showroomAddress}</p>
                  </div>
                </div>
                <div className={styles.locationDetailRow}>
                  <ClockCircleOutlined className={styles.detailRowIcon} />
                  <div>
                    <strong>Khung giờ hoạt động:</strong>
                    <p>{contactInfo.showroomHours}</p>
                  </div>
                </div>

                <div className={styles.amenitiesList}>
                  <span><CheckCircleFilled /> Bãi đỗ ô tô rộng rãi</span>
                  <span><CheckCircleFilled /> Lái thử thực tế</span>
                  <span><CheckCircleFilled /> Kiểm định 150+ hạng mục</span>
                </div>

                <div className={styles.mapActionRow}>
                  <a
                    href={contactInfo.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primary3DBtn}
                  >
                    <CompassOutlined /> Xem vị trí trên Google Maps
                  </a>
                  <a
                    href={contactInfo.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondary3DBtn}
                  >
                    <EnvironmentOutlined /> Chỉ đường đến Showroom
                  </a>
                </div>
              </div>
            </div>

            {/* Right: 3D Contact & Consultation Form Card */}
            <div className={styles.form3DCard} id="contact-form-section">
              <div className={styles.cardHeader3D}>
                <div className={styles.cardHeaderIcon}>
                  <SendOutlined />
                </div>
                <div>
                  <span className={styles.cardEyebrow}>ĐẶT LỊCH HẸN &amp; TƯ VẤN</span>
                  <h2 className={styles.cardTitle}>Gửi yêu cầu liên hệ</h2>
                  <p className={styles.cardSubtitle}>
                    Điền thông tin bên dưới, chuyên viên TrustCar sẽ liên hệ tư vấn trong 15 phút.
                  </p>
                </div>
              </div>

              <div className={styles.topicPicker}>
                <span className={styles.topicPickerLabel}>Chọn nhanh nhu cầu của bạn:</span>
                <div className={styles.topicChips}>
                  {QUICK_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      className={`${styles.topicChip} ${selectedTopic === topic ? styles.topicChipActive : ''}`}
                      onClick={() => handleSelectTopic(topic)}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className={styles.contactForm}
              >
                <div className={styles.formRow2Col}>
                  <Form.Item
                    name="full_name"
                    label="Họ và tên"
                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                  >
                    <Input placeholder="Nguyễn Văn A" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="phone_number"
                    label="Số điện thoại"
                    rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                  >
                    <Input placeholder="09xxxxxxxx" size="large" />
                  </Form.Item>
                </div>

                <Form.Item
                  name="email"
                  label="Email nhận báo giá & hồ sơ kiểm định"
                  rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                >
                  <Input placeholder="email@example.com" size="large" />
                </Form.Item>

                <Form.Item
                  name="request_content"
                  label="Nội dung cần tư vấn / Mẫu xe quan tâm"
                >
                  <Input.TextArea
                    rows={4}
                    placeholder="Ví dụ: Tôi muốn đặt lịch xem xe và lái thử tại Showroom Số 18 Hoàng Quán Chi..."
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={sending}
                  icon={<SendOutlined />}
                  block
                  className={styles.submit3DBtn}
                >
                  Gửi yêu cầu liên hệ
                </Button>
              </Form>

              <div className={styles.formQuickFooter}>
                <span>Cần phản hồi ngay lập tức?</span>
                <div className={styles.formQuickLinks}>
                  <a href={contactInfo.phoneHref}>
                    <PhoneOutlined /> {contactInfo.phoneDisplay}
                  </a>
                  <a href={contactInfo.zaloUrl} target="_blank" rel="noopener noreferrer">
                    Chat Zalo ngay
                  </a>
                  <a href={contactInfo.messengerUrl} target="_blank" rel="noopener noreferrer">
                    Messenger
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
