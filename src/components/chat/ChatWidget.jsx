import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CloseOutlined,
  SendOutlined,
  ReloadOutlined,
  ExpandAltOutlined,
  ShrinkOutlined,
  ThunderboltFilled,
  CarOutlined,
  SafetyCertificateFilled,
  EnvironmentOutlined,
  CompassOutlined,
  ArrowRightOutlined,
  ExportOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import RobotMascot, { UserChatAvatar } from './RobotMascot'
import {
  sendChatMessage,
  getOrCreateChatSessionId,
  resetChatSessionId,
  CHAT_MESSAGES_STORAGE_KEY,
} from '../../services/chatService'
import { useContactInfo } from '../../config/contactInfo'
import { useAuthStore } from '../../store/useAuthStore'
import styles from './ChatWidget.module.css'

const QUESTION_CATEGORIES = [
  {
    key: 'popular',
    label: 'Phổ biến',
    questions: [
      'Tư vấn xe theo ngân sách',
      'Xe SUV gầm cao cho gia đình',
      'Quy trình kiểm định CPO 150+ hạng mục',
      'Đặt lịch xem xe & lái thử',
    ],
  },
  {
    key: 'budget',
    label: 'Theo ngân sách',
    questions: [
      'Tìm xe dưới 500 triệu',
      'Tìm xe từ 500 đến 800 triệu',
      'Tìm xe từ 800 triệu đến 1.2 tỷ',
      'Tìm xe trên 1.2 tỷ',
    ],
  },
  {
    key: 'body',
    label: 'Dòng xe & Hãng',
    questions: [
      'Xe SUV gầm cao 7 chỗ',
      'Xe Sedan đi phố tiết kiệm',
      'Tìm xe Toyota đang có sẵn',
      'Tìm xe Mazda đang có sẵn',
    ],
  },
  {
    key: 'service',
    label: 'Trả góp & Showroom',
    questions: [
      'Thủ tục mua xe trả góp ngân hàng',
      'Địa chỉ Showroom ở đâu?',
      'Chính sách bảo hành & kiểm định CPO',
      'Đặt lịch xem xe thực tế',
    ],
  },
]

function formatTimeNow() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function createWelcomeMessage(showroomAddress) {
  return {
    id: 'welcome',
    from: 'bot',
    time: formatTimeNow(),
    streamed: true,
    text: `Xin chào! Mình là **Trợ lý AI TrustCar** — kết nối trực tiếp với dữ liệu kho xe thực tế tại **${showroomAddress}**.\n\nBạn có thể chọn nhanh **bong bóng câu hỏi** bên dưới hoặc nhập mẫu xe, tầm giá để mình lọc xe ngay lập tức!`,
    actions: [
      { label: 'Khám phá kho xe', to: '/xe', type: 'navigate' },
      { label: 'Vị trí Showroom 3D', to: '/lien-he', type: 'navigate' },
    ],
    followUps: [
      'Tư vấn xe theo ngân sách',
      'Xe SUV gầm cao cho gia đình',
      'Tìm xe từ 500 đến 800 triệu',
      'Địa chỉ Showroom ở đâu?',
    ],
  }
}

/**
 * Hiển thị nội dung tin nhắn có hỗ trợ in đậm **text** và xuống dòng.
 */
function FormattedBubbleText({ text }) {
  const lines = String(text || '').split('\n')
  return (
    <div className={styles.formattedText}>
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className={styles.lineSpacer} />
        }
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <p key={lineIdx} className={styles.lineParagraph}>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={partIdx}>{part.slice(2, -2)}</strong>
              }
              return <span key={partIdx}>{part}</span>
            })}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Hiệu ứng gõ chữ siêu tốc (Fast Streaming Bubble) cho tin nhắn mới của Bot.
 */
function StreamingBotText({ text, alreadyStreamed, onDone }) {
  const [visibleLength, setVisibleLength] = useState(alreadyStreamed ? text.length : 0)

  useEffect(() => {
    if (alreadyStreamed || visibleLength >= text.length) {
      if (!alreadyStreamed) onDone?.()
      return undefined
    }
    const step = Math.max(5, Math.ceil(text.length / 26))
    const timer = window.setTimeout(() => {
      setVisibleLength((prev) => Math.min(text.length, prev + step))
    }, 14)
    return () => window.clearTimeout(timer)
  }, [alreadyStreamed, visibleLength, text, onDone])

  const shown = alreadyStreamed ? text : text.slice(0, visibleLength)
  return (
    <div onClick={() => setVisibleLength(text.length)}>
      <FormattedBubbleText text={shown} />
    </div>
  )
}

export default function ChatWidget() {
  const navigate = useNavigate()
  const contactInfo = useContactInfo()
  const user = useAuthStore((state) => state.user)

  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [activeCategory, setActiveCategory] = useState('popular')
  const [sessionId, setSessionId] = useState(() => getOrCreateChatSessionId())
  const [messages, setMessages] = useState(() => {
    try {
      const raw = globalThis.sessionStorage?.getItem(CHAT_MESSAGES_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m) => ({ ...m, streamed: true }))
        }
      }
    } catch {
      // Ignore invalid sessionStorage data
    }
    return [createWelcomeMessage(contactInfo.showroomAddress)]
  })
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const seqRef = useRef(messages.length)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    try {
      const toStore = messages.slice(-20).map((m) => ({ ...m, streamed: true }))
      globalThis.sessionStorage?.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(toStore))
    } catch {
      // Ignore storage quota errors
    }
  }, [messages])

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(true), 1400)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [open, messages, loading])

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  function openChat() {
    setOpen(true)
    setShowHint(false)
  }

  function handleResetChat() {
    abortRef.current?.abort()
    setLoading(false)
    setSessionId(resetChatSessionId())
    setMessages([createWelcomeMessage(contactInfo.showroomAddress)])
    setActiveCategory('popular')
  }

  function markMessageStreamed(id) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id && !m.streamed ? { ...m, streamed: true } : m))
    )
  }

  async function handleSendQuestion(rawText) {
    const content = String(rawText || '').trim()
    if (!content || loading) return

    seqRef.current += 1
    const userMsg = {
      id: `u-${seqRef.current}`,
      from: 'user',
      time: formatTimeNow(),
      text: content,
    }

    const updatedHistory = [...messages, userMsg]
    setMessages(updatedHistory)
    setDraft('')
    setLoading(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const reply = await sendChatMessage({
        message: content,
        history: updatedHistory,
        sessionId,
        customerName: user?.fullName,
        customerPhone: user?.phone,
        signal: controller.signal,
      })

      seqRef.current += 1
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${seqRef.current}`,
          from: 'bot',
          time: formatTimeNow(),
          streamed: false,
          text: reply.text,
          cars: reply.cars || [],
          actions: reply.actions || [],
          followUps: reply.followUps || [],
        },
      ])
    } catch {
      seqRef.current += 1
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${seqRef.current}`,
          from: 'bot',
          time: formatTimeNow(),
          streamed: false,
          text: `Hiện hệ thống đang bận trong giây lát. Bạn có thể gọi trực tiếp Hotline **${contactInfo.phoneDisplay}** hoặc xem danh sách xe bên dưới nhé!`,
          actions: [
            { label: 'Xem danh sách xe', to: '/xe', type: 'navigate' },
            { label: 'Liên hệ Showroom', to: '/lien-he', type: 'navigate' },
          ],
          followUps: ['Tư vấn xe theo ngân sách', 'Địa chỉ Showroom ở đâu?'],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    handleSendQuestion(draft)
  }

  function handleNavigateAction(action) {
    if (action.href) {
      window.open(action.href, action.href.startsWith('tel:') ? '_self' : '_blank', 'noopener,noreferrer')
      return
    }
    if (action.to) {
      navigate(action.to)
    }
  }

  const currentCategoryObj =
    QUESTION_CATEGORIES.find((c) => c.key === activeCategory) || QUESTION_CATEGORIES[0]

  const latestBotMsg = [...messages].reverse().find((m) => m.from === 'bot')
  const dynamicFollowUps = latestBotMsg?.followUps?.length
    ? latestBotMsg.followUps
    : currentCategoryObj.questions

  return (
    <div className={styles.root}>
      {open && (
        <section
          className={`${styles.panel} ${expanded ? styles.panelExpanded : ''}`}
          role="dialog"
          aria-label="Trợ lý AI TrustCar"
        >
          {/* HEADER CHUYÊN NGHIỆP VỚI AVATAR RIÊNG & TRẠNG THÁI LIVE API */}
          <header className={styles.panelHead}>
            <div className={styles.headAvatarWrap}>
              <RobotMascot size={42} active={loading} />
              <span className={styles.onlineDot} title="Đã kết nối API kho xe trực tuyến" />
            </div>

            <div className={styles.headText}>
              <div className={styles.headTitleRow}>
                <span className={styles.headTitle}>Trợ lý AI TrustCar</span>
                <span className={styles.liveApiBadge}>
                  <ThunderboltFilled /> Live API
                </span>
              </div>
              <div className={styles.headSub}>
                Tư vấn kho xe thực tế &middot; Định vị Showroom 24/7
              </div>
            </div>

            <div className={styles.headControls}>
              <button
                type="button"
                className={styles.headBtn}
                onClick={handleResetChat}
                title="Làm mới cuộc trò chuyện"
                aria-label="Làm mới cuộc trò chuyện"
              >
                <ReloadOutlined />
              </button>
              <button
                type="button"
                className={`${styles.headBtn} ${styles.expandBtn}`}
                onClick={() => setExpanded((prev) => !prev)}
                title={expanded ? 'Thu gọn khung chat' : 'Mở rộng khung chat'}
                aria-label={expanded ? 'Thu gọn khung chat' : 'Mở rộng khung chat'}
              >
                {expanded ? <ShrinkOutlined /> : <ExpandAltOutlined />}
              </button>
              <button
                type="button"
                className={styles.headBtn}
                onClick={() => setOpen(false)}
                title="Đóng cửa sổ chat"
                aria-label="Đóng cửa sổ chat"
              >
                <CloseOutlined />
              </button>
            </div>
          </header>

          {/* THANH ĐIỀU HƯỚNG CHỦ ĐỀ CÂU HỎI NHANH */}
          <div className={styles.categoryNav} role="tablist" aria-label="Chủ đề câu hỏi gợi ý">
            {QUESTION_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.key}
                className={`${styles.categoryTab} ${
                  activeCategory === cat.key ? styles.categoryTabActive : ''
                }`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* KHU VỰC BONG BÓNG HỘI THOẠI */}
          <div className={styles.messages} ref={listRef} aria-live="polite">
            {messages.map((msg, msgIndex) => {
              const isUser = msg.from === 'user'
              const isLastBot = !isUser && msgIndex === messages.length - 1

              return (
                <div key={msg.id} className={styles.messageGroup}>
                  <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowBot}`}>
                    {!isUser && (
                      <div className={styles.botAvatarBadge}>
                        <RobotMascot size={30} active={loading && isLastBot} />
                      </div>
                    )}

                    <div className={styles.bubbleColumn}>
                      <div className={`${styles.senderMeta} ${isUser ? styles.senderMetaUser : ''}`}>
                        <span>{isUser ? user?.fullName || 'Khách hàng' : 'TrustCar AI Concierge'}</span>
                        <time>{msg.time}</time>
                      </div>

                      <div
                        className={`${styles.bubble} ${
                          isUser ? styles.bubbleUser : styles.bubbleBot
                        }`}
                      >
                        {isUser ? (
                          <FormattedBubbleText text={msg.text} />
                        ) : (
                          <StreamingBotText
                            text={msg.text}
                            alreadyStreamed={Boolean(msg.streamed)}
                            onDone={() => markMessageStreamed(msg.id)}
                          />
                        )}

                        {/* THẺ XE TRỰC TIẾP TỪ API /public/cars TRONG BONG BÓNG TRẢ LỜI */}
                        {Array.isArray(msg.cars) && msg.cars.length > 0 && (
                          <div className={styles.carCardsList}>
                            {msg.cars.map((car) => (
                              <button
                                key={car.id}
                                type="button"
                                className={styles.chatCarCard}
                                onClick={() => navigate(car.to)}
                              >
                                <div className={styles.chatCarThumb}>
                                  {car.imageUrl ? (
                                    <img src={car.imageUrl} alt={car.title} loading="lazy" />
                                  ) : (
                                    <CarOutlined className={styles.chatCarFallbackIcon} />
                                  )}
                                  {car.cpo && (
                                    <span className={styles.chatCarCpo}>
                                      <SafetyCertificateFilled /> CPO
                                    </span>
                                  )}
                                </div>
                                <div className={styles.chatCarInfo}>
                                  <div className={styles.chatCarTitle}>{car.title}</div>
                                  <div className={styles.chatCarPrice}>{car.priceText}</div>
                                  <div className={styles.chatCarSpecs}>
                                    <span>{car.year}</span>
                                    <span>&bull;</span>
                                    <span>{car.mileageText}</span>
                                    {car.bodyTypeLabel && (
                                      <>
                                        <span>&bull;</span>
                                        <span>{car.bodyTypeLabel}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <ArrowRightOutlined className={styles.chatCarArrow} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* BONG BÓNG ĐIỀU HƯỚNG TRANG / HÀNH ĐỘNG NHANH */}
                      {Array.isArray(msg.actions) && msg.actions.length > 0 && (
                        <div className={styles.actionBubbles}>
                          {msg.actions.map((action, idx) => (
                            <button
                              key={`${msg.id}-act-${idx}`}
                              type="button"
                              className={styles.actionBubbleBtn}
                              onClick={() => handleNavigateAction(action)}
                            >
                              {action.href ? <ExportOutlined /> : <CompassOutlined />}
                              <span>{action.label}</span>
                              <ArrowRightOutlined className={styles.actionArrow} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className={styles.userAvatarBadge}>
                        <UserChatAvatar size={30} name={user?.fullName} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* TRẠNG THÁI ĐANG TRUY VẤN API NHANH */}
            {loading && (
              <div className={`${styles.row} ${styles.rowBot}`}>
                <div className={styles.botAvatarBadge}>
                  <RobotMascot size={30} active />
                </div>
                <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typingBubble}`}>
                  <div className={styles.typingDots} aria-label="Đang tra cứu dữ liệu kho xe">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className={styles.typingLabel}>Đang tra cứu kho xe TrustCar...</span>
                </div>
              </div>
            )}

            {/* BONG BÓNG CÂU HỎI GỢI Ý / ĐIỀU HƯỚNG HỘI THOẠI */}
            {!loading && (
              <div className={styles.questionDeck}>
                <div className={styles.questionDeckHeader}>
                  <QuestionCircleOutlined />
                  <span>Chọn nhanh bong bóng câu hỏi ({currentCategoryObj.label}):</span>
                </div>
                <div className={styles.questionBubblesGrid}>
                  {(activeCategory === 'popular' ? dynamicFollowUps : currentCategoryObj.questions).map(
                    (question) => (
                      <button
                        key={question}
                        type="button"
                        className={styles.questionBubble}
                        onClick={() => handleSendQuestion(question)}
                      >
                        <span className={styles.questionBubbleText}>{question}</span>
                        <SendOutlined className={styles.questionBubbleIcon} />
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FORM NHẬP TIN NHẮN & THANH TRẠNG THÁI */}
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập tên xe, tầm giá (VD: SUV dưới 700 triệu) hoặc SĐT..."
              aria-label="Nội dung tin nhắn"
              maxLength={500}
            />
            <button
              type="submit"
              className={styles.send}
              disabled={!draft.trim() || loading}
              aria-label="Gửi tin nhắn"
            >
              <SendOutlined />
            </button>
          </form>

          <footer className={styles.panelFooter}>
            <span>
              <EnvironmentOutlined /> {contactInfo.showroomAddress}
            </span>
            <a href={contactInfo.phoneHref} className={styles.footerHotline}>
              Hotline: {contactInfo.phoneDisplay}
            </a>
          </footer>
        </section>
      )}

      {/* NÚT LAUNCHER AVATAR 3D NỔI */}
      {!open && (
        <div className={styles.launcherWrap}>
          {showHint && (
            <div className={styles.hintBubble}>
              <button
                type="button"
                className={styles.hintContentBtn}
                onClick={openChat}
              >
                <span className={styles.hintDot} />
                <span>Cần tìm xe theo tầm giá? Hỏi AI ngay!</span>
              </button>
              <button
                type="button"
                className={styles.hintClose}
                aria-label="Ẩn lời chào"
                onClick={() => setShowHint(false)}
              >
                <CloseOutlined />
              </button>
            </div>
          )}

          <button
            type="button"
            className={styles.launcher}
            onClick={openChat}
            aria-label="Mở Trợ lý AI TrustCar"
          >
            <span className={styles.launcherPulse} aria-hidden="true" />
            <div className={styles.launcherAvatarFrame}>
              <RobotMascot size={66} className={styles.mascot} />
            </div>
            <span className={styles.launcherBadge}>AI Tư Vấn</span>
          </button>
        </div>
      )}
    </div>
  )
}
