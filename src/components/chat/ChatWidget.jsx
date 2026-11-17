import { useCallback, useEffect, useRef, useState } from 'react'
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
  UpOutlined,
  DownOutlined,
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

function createWelcomeMessage(showroomAddress, streamed = false) {
  return {
    id: 'welcome',
    from: 'bot',
    time: formatTimeNow(),
    streamed,
    text: `Xin chào! Mình là **Trợ lý AI TrustCar** — kết nối trực tiếp với dữ liệu kho xe thực tế tại **${showroomAddress}**.\n\nBạn có thể chọn nhanh **câu hỏi gợi ý** bên dưới hoặc nhập mẫu xe, tầm giá để mình lọc xe ngay lập tức!`,
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
 * Hiển thị nội dung tin nhắn có hỗ trợ in đậm **text** (kể cả khi đang gõ dở) và xuống dòng.
 */
function FormattedBubbleText({ text, isStreaming = false }) {
  const lines = String(text || '').split('\n')
  return (
    <div className={styles.formattedText}>
      {lines.map((line, lineIdx) => {
        const isLastLine = lineIdx === lines.length - 1
        if (!line.trim()) {
          return <div key={lineIdx} className={styles.lineSpacer} />
        }
        const parts = line.split(/(\*\*[^*]+\*\*|\*\*[^*]+$)/g)
        return (
          <p key={lineIdx} className={styles.lineParagraph}>
            {parts.map((part, partIdx) => {
              if (part.startsWith('**')) {
                const clean = part.endsWith('**') ? part.slice(2, -2) : part.slice(2)
                return <strong key={partIdx}>{clean}</strong>
              }
              return <span key={partIdx}>{part}</span>
            })}
            {isStreaming && isLastLine && (
              <span className={styles.streamingCursor} aria-hidden="true" />
            )}
          </p>
        )
      })}
    </div>
  )
}

function getNextStreamIndex(text, currentIndex) {
  if (currentIndex >= text.length) return text.length
  const remaining = text.slice(currentIndex)
  const wordMatch = remaining.match(/^(\s*\S{1,6})/)
  let nextIdx = wordMatch
    ? currentIndex + wordMatch[1].length
    : Math.min(text.length, currentIndex + 3)

  if (text.slice(nextIdx - 1, nextIdx + 1) === '**') {
    nextIdx += 1
  }
  return Math.min(text.length, nextIdx)
}

function getStreamDelayMs(text, prevIndex, nextIndex) {
  const chunk = text.slice(prevIndex, nextIndex)
  if (chunk.includes('\n')) return 95
  if (/[.!?…]/.test(chunk)) return 75
  if (/[,;:]/.test(chunk)) return 46
  return 30
}

/**
 * Hiệu ứng gõ chữ từng từ tự nhiên như người thật nhắn tin cho tin nhắn của Bot.
 */
function StreamingBotText({ text, alreadyStreamed, onProgress, onDone }) {
  const fullText = String(text || '')
  const [visibleLength, setVisibleLength] = useState(
    alreadyStreamed ? fullText.length : 0
  )
  const onProgressRef = useRef(onProgress)
  const onDoneRef = useRef(onDone)
  const doneCalledRef = useRef(Boolean(alreadyStreamed))

  useEffect(() => {
    onProgressRef.current = onProgress
    onDoneRef.current = onDone
  }, [onProgress, onDone])

  useEffect(() => {
    if (alreadyStreamed) {
      setVisibleLength(fullText.length)
      doneCalledRef.current = true
      return undefined
    }
    if (visibleLength >= fullText.length) {
      if (!doneCalledRef.current) {
        doneCalledRef.current = true
        onDoneRef.current?.()
      }
      return undefined
    }

    const nextIdx = getNextStreamIndex(fullText, visibleLength)
    const delay = getStreamDelayMs(fullText, visibleLength, nextIdx)
    const timer = window.setTimeout(() => {
      setVisibleLength(nextIdx)
      onProgressRef.current?.()
    }, delay)

    return () => window.clearTimeout(timer)
  }, [alreadyStreamed, visibleLength, fullText])

  const isStreaming = !alreadyStreamed && visibleLength < fullText.length
  const shown = alreadyStreamed ? fullText : fullText.slice(0, visibleLength)

  function handleSkipStreaming() {
    if (isStreaming) {
      setVisibleLength(fullText.length)
    }
  }

  return (
    <div
      onClick={handleSkipStreaming}
      title={isStreaming ? 'Nhấn để hiển thị toàn bộ câu trả lời' : undefined}
    >
      <FormattedBubbleText text={shown} isStreaming={isStreaming} />
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
  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false)
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
    return [createWelcomeMessage(contactInfo.showroomAddress, false)]
  })
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  const seqRef = useRef(messages.length)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  const isAnyBotStreaming = messages.some((m) => m.from === 'bot' && !m.streamed)

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = listRef.current
    if (!el) return
    if (behavior === 'auto') {
      el.scrollTop = el.scrollHeight
    } else {
      el.scrollTo({
        top: el.scrollHeight,
        behavior,
      })
    }
  }, [])

  const handleStreamProgress = useCallback(() => {
    window.requestAnimationFrame(() => {
      scrollToBottom('auto')
    })
  }, [scrollToBottom])

  useEffect(() => {
    if (!open && messages.length <= 1) return
    try {
      const toStore = messages.slice(-20).map((m) => ({ ...m, streamed: true }))
      globalThis.sessionStorage?.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(toStore))
    } catch {
      // Ignore storage quota errors
    }
  }, [messages, open])

  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(true), 1400)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => {
    if (!open || !listRef.current) return undefined
    scrollToBottom('smooth')
    const followUpTimer = window.setTimeout(() => {
      scrollToBottom('smooth')
    }, 140)
    return () => window.clearTimeout(followUpTimer)
  }, [open, messages.length, loading, isAnyBotStreaming, suggestionsCollapsed, scrollToBottom])

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
    setMessages([createWelcomeMessage(contactInfo.showroomAddress, false)])
    setActiveCategory('popular')
    setSuggestionsCollapsed(false)
  }

  const markMessageStreamed = useCallback((id) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id && !m.streamed ? { ...m, streamed: true } : m))
    )
  }, [])

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

    const updatedHistory = [...messages.map((m) => ({ ...m, streamed: true })), userMsg]
    setMessages(updatedHistory)
    setDraft('')
    setLoading(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const minTypingDelay = new Promise((resolve) => window.setTimeout(resolve, 550))

    try {
      const [reply] = await Promise.all([
        sendChatMessage({
          message: content,
          history: updatedHistory,
          sessionId,
          customerName: user?.fullName,
          customerPhone: user?.phone,
          signal: controller.signal,
        }),
        minTypingDelay,
      ])

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
      await minTypingDelay
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
              <RobotMascot size={40} active={loading || isAnyBotStreaming} />
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

          {/* KHU VỰC BONG BÓNG HỘI THOẠI (KHÔNG BỊ CHE BỞI THANH GỢI Ý TRÊN ĐẦU) */}
          <div className={styles.messages} ref={listRef} aria-live="polite">
            {messages.map((msg, msgIndex) => {
              const isUser = msg.from === 'user'
              const isLastBot = !isUser && msgIndex === messages.length - 1
              const isMsgStreaming = !isUser && !msg.streamed
              const showAttachments = isUser || Boolean(msg.streamed)

              return (
                <div key={msg.id} className={styles.messageGroup}>
                  <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowBot}`}>
                    {!isUser && (
                      <div className={styles.botAvatarBadge}>
                        <RobotMascot size={30} active={(loading && isLastBot) || isMsgStreaming} />
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
                            onProgress={handleStreamProgress}
                            onDone={() => markMessageStreamed(msg.id)}
                          />
                        )}

                        {/* THẺ XE TRỰC TIẾP TỪ API /public/cars HIỂN THỊ SAU KHI GÕ XONG CÂU TRẢ LỜI */}
                        {showAttachments && Array.isArray(msg.cars) && msg.cars.length > 0 && (
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

                      {/* BONG BÓNG ĐIỀU HƯỚNG TRANG / HÀNH ĐỘNG NHANH (HIỂN THỊ SAU KHI GÕ XONG) */}
                      {showAttachments && Array.isArray(msg.actions) && msg.actions.length > 0 && (
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

            {/* TRẠNG THÁI ĐANG SOẠN CÂU TRẢ LỜI NHƯ NGƯỜI THẬT */}
            {loading && (
              <div className={`${styles.row} ${styles.rowBot}`}>
                <div className={styles.botAvatarBadge}>
                  <RobotMascot size={30} active />
                </div>
                <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typingBubble}`}>
                  <div className={styles.typingDots} aria-label="Đang soạn câu trả lời">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className={styles.typingLabel}>Đang tra cứu &amp; soạn câu trả lời...</span>
                </div>
              </div>
            )}

            {/* KHUNG GỢI Ý CÂU HỎI GỌN GÀNG, CÓ THỂ THU GỌN & CHỈ HIỆN SAU KHI BOT TRẢ LỜI XONG */}
            {!loading && !isAnyBotStreaming && (
              <div className={styles.questionDeck}>
                <div className={styles.questionDeckTopBar}>
                  <div className={styles.questionDeckHeader}>
                    <QuestionCircleOutlined />
                    <span>Gợi ý câu hỏi nhanh:</span>
                  </div>
                  <button
                    type="button"
                    className={styles.questionDeckToggle}
                    onClick={() => setSuggestionsCollapsed((prev) => !prev)}
                  >
                    <span>{suggestionsCollapsed ? 'Mở gợi ý' : 'Thu gọn'}</span>
                    {suggestionsCollapsed ? <DownOutlined /> : <UpOutlined />}
                  </button>
                </div>

                {!suggestionsCollapsed && (
                  <>
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
                  </>
                )}
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
