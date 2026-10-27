import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloseOutlined, SendOutlined } from '@ant-design/icons'
import RobotMascot from './RobotMascot'
import styles from './ChatWidget.module.css'

const SUGGESTIONS = [
  'Tư vấn xe theo ngân sách',
  'Xe gầm cao cho gia đình',
  'Thủ tục mua xe cũ',
  'Đặt lịch xem xe',
]

const WELCOME = {
  id: 'welcome',
  from: 'bot',
  text: 'Xin chào, mình là trợ lý AI của TrustCar. Mình có thể giúp bạn chọn xe, tìm hiểu quy trình kiểm định và đặt lịch xem xe. Bạn đang quan tâm điều gì?',
}

const HINT_DELAY_MS = 2500
const REPLY_DELAY_MS = 1200

export default function ChatWidget() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const replyTimer = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), HINT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => () => clearTimeout(replyTimer.current), [])

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [open, messages, typing])

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

  function sendMessage(text) {
    const content = text.trim()
    if (!content || typing) return

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, from: 'user', text: content }])
    setDraft('')
    setTyping(true)

    replyTimer.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          from: 'bot',
          text: 'Cảm ơn bạn đã nhắn tin. Trợ lý AI của TrustCar đang trong giai đoạn hoàn thiện nên chưa thể trả lời tự động. Bạn có thể xem danh sách xe hoặc gọi hotline 1900 1234 để được tư vấn ngay.',
          actions: [
            { label: 'Xem danh sách xe', to: '/xe' },
            { label: 'Gửi yêu cầu tư vấn', to: '/lien-he' },
          ],
        },
      ])
      setTyping(false)
    }, REPLY_DELAY_MS)
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(draft)
  }

  function handleAction(to) {
    setOpen(false)
    navigate(to)
  }

  const onlyWelcome = messages.length === 1

  return (
    <div className={styles.root}>
      {open && (
        <section className={styles.panel} role="dialog" aria-label="Trò chuyện với trợ lý AI TrustCar">
          <header className={styles.panelHead}>
            <div className={styles.headAvatar}>
              <RobotMascot size={36} />
            </div>
            <div className={styles.headText}>
              <div className={styles.headTitle}>Trợ lý AI TrustCar</div>
              <div className={styles.headSub}>Tư vấn chọn xe và đặt lịch xem xe</div>
            </div>
            <button
              type="button"
              className={styles.headBtn}
              onClick={() => setOpen(false)}
              aria-label="Đóng cửa sổ chat"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className={styles.messages} ref={listRef} aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`${styles.row} ${msg.from === 'user' ? styles.rowUser : ''}`}>
                  {msg.from === 'bot' && (
                    <div className={styles.botAvatar}>
                      <RobotMascot size={26} />
                    </div>
                  )}
                  <div
                    className={`${styles.bubble} ${
                      msg.from === 'user' ? styles.bubbleUser : styles.bubbleBot
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                {msg.actions && (
                  <div className={styles.actions} style={{ marginTop: 8 }}>
                    {msg.actions.map((action) => (
                      <button
                        key={action.to}
                        type="button"
                        className={styles.chip}
                        onClick={() => handleAction(action.to)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {onlyWelcome && (
              <div className={styles.chips}>
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={styles.chip}
                    onClick={() => sendMessage(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {typing && (
              <div className={styles.row}>
                <div className={styles.botAvatar}>
                  <RobotMascot size={26} />
                </div>
                <div className={`${styles.bubble} ${styles.bubbleBot} ${styles.typing}`} aria-label="Trợ lý đang soạn tin">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              aria-label="Nội dung tin nhắn"
              maxLength={500}
            />
            <button
              type="submit"
              className={styles.send}
              disabled={!draft.trim() || typing}
              aria-label="Gửi tin nhắn"
            >
              <SendOutlined />
            </button>
          </form>
          <div className={styles.note}>Giao diện demo, chưa kết nối AI thật.</div>
        </section>
      )}

      {!open && (
        <button
          type="button"
          className={styles.launcher}
          onClick={openChat}
          aria-label="Mở trò chuyện với trợ lý AI"
        >
          {showHint && (
            <span className={styles.hint}>
              Bạn cần hỗ trợ gì?
              <span
                role="button"
                tabIndex={0}
                className={styles.hintClose}
                aria-label="Ẩn lời chào"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowHint(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowHint(false)
                  }
                }}
              >
                <CloseOutlined />
              </span>
            </span>
          )}
          <RobotMascot size={84} className={styles.mascot} />
        </button>
      )}
    </div>
  )
}
