import { useId } from 'react'

/**
 * Avatar riêng của Trợ lý AI TrustCar (Executive Navy + Champagne Gold + Cyber HUD).
 * Hỗ trợ trạng thái `active` (đang trả lời / phân tích) với hiệu ứng quét HUD nhanh.
 */
export default function RobotMascot({ size = 84, className, active = false }) {
  const uid = useId().replace(/:/g, '')
  const helmetGrad = `tc-helmet-${uid}`
  const navyArmor = `tc-navy-${uid}`
  const goldTrim = `tc-gold-${uid}`
  const visorGrad = `tc-visor-${uid}`
  const hudGlow = `tc-hud-${uid}`

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Trợ lý AI TrustCar"
    >
      <defs>
        <linearGradient id={helmetGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#eef2f8" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id={navyArmor} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e3a66" />
          <stop offset="55%" stopColor="#0f2342" />
          <stop offset="100%" stopColor="#071224" />
        </linearGradient>

        <linearGradient id={goldTrim} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fae08c" />
          <stop offset="50%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#967210" />
        </linearGradient>

        <linearGradient id={visorGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f294a" />
          <stop offset="100%" stopColor="#050d1a" />
        </linearGradient>

        <radialGradient id={hudGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Đổ bóng 3D bên dưới */}
      <ellipse cx="60" cy="113" rx="28" ry="4.5" fill="#06101f" opacity="0.24" />

      {/* Tay trái & phải tạo dáng chuyên viên tư vấn */}
      <ellipse
        cx="19"
        cy="84"
        rx="7.5"
        ry="11"
        fill={`url(#${helmetGrad})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="1.8"
        transform="rotate(20 19 84)"
      />
      <ellipse
        cx="101"
        cy="84"
        rx="7.5"
        ry="11"
        fill={`url(#${helmetGrad})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="1.8"
        transform="rotate(-20 101 84)"
      />

      {/* Thân giáp Navy + Huy hiệu Khiên Vàng TrustCar */}
      <path
        d="M35 88 C35 78, 85 78, 85 88 L81 105 C81 109, 39 109, 39 105 Z"
        fill={`url(#${navyArmor})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="2"
      />
      {/* Huy hiệu khiên CPO trên ngực */}
      <polygon
        points="60,88 68,92 66,101 60,105 54,101 52,92"
        fill={`url(#${goldTrim})`}
      />
      <path
        d="M57 96 L59.5 98.5 L64 93.5"
        stroke="#081527"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Ăng-ten tín hiệu AI đỉnh đầu */}
      <line
        x1="60"
        y1="8"
        x2="60"
        y2="18"
        stroke={`url(#${goldTrim})`}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="60" cy="7" r="5" fill={`url(#${goldTrim})`} />
      <circle cx="60" cy="7" r="2.5" fill={active ? '#38bdf8' : '#fff8dc'} />

      {/* Tai nghe / Cảm biến âm thanh hai bên */}
      <rect
        x="7"
        y="42"
        width="10"
        height="24"
        rx="5"
        fill={`url(#${navyArmor})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="2"
      />
      <rect
        x="103"
        y="42"
        width="10"
        height="24"
        rx="5"
        fill={`url(#${navyArmor})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="2"
      />

      {/* Khung đầu 3D chính */}
      <rect
        x="15"
        y="17"
        width="90"
        height="72"
        rx="34"
        fill={`url(#${helmetGrad})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="2.2"
      />

      {/* Viền vương miện / Crest vàng trên trán */}
      <path
        d="M44 18 L60 25 L76 18"
        fill={`url(#${goldTrim})`}
        opacity="0.92"
      />
      <path
        d="M29 27 Q44 20 62 22"
        stroke="#ffffff"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.95"
      />

      {/* Kính Visor HUD trung tâm */}
      <rect
        x="24"
        y="30"
        width="72"
        height="46"
        rx="22"
        fill={`url(#${visorGrad})`}
        stroke="#254878"
        strokeWidth="1.6"
      />

      {/* Hào quang mắt HUD */}
      <ellipse cx="43" cy="52" rx="14" ry="11" fill={`url(#${hudGlow})`} />
      <ellipse cx="77" cy="52" rx="14" ry="11" fill={`url(#${hudGlow})`} />

      {/* Mắt LED AI sắc nét */}
      {active ? (
        <>
          <circle cx="43" cy="52" r="6.5" fill="#38bdf8" />
          <circle cx="43" cy="52" r="3" fill="#ffffff" />
          <circle cx="77" cy="52" r="6.5" fill="#38bdf8" />
          <circle cx="77" cy="52" r="3" fill="#ffffff" />
        </>
      ) : (
        <>
          <path
            d="M35 54 Q43 43 51 54"
            stroke="#38bdf8"
            strokeWidth="4.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M69 54 Q77 43 85 54"
            stroke="#38bdf8"
            strokeWidth="4.8"
            strokeLinecap="round"
            fill="none"
          />
        </>
      )}

      {/* Nụ cười thân thiện ánh vàng Champagne */}
      <path
        d="M52 63 Q60 69 68 63"
        stroke="#f5d97e"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Điểm sáng má HUD */}
      <circle cx="33" cy="61" r="2.6" fill="#f5d97e" opacity="0.75" />
      <circle cx="87" cy="61" r="2.6" fill="#f5d97e" opacity="0.75" />
    </svg>
  )
}

/**
 * Avatar riêng dành cho Khách hàng (User) trong khung hội thoại.
 * Hiển thị chữ cái đầu tên user nếu đã đăng nhập, hoặc biểu tượng Khách hàng VIP có vô-lăng.
 */
export function UserChatAvatar({ size = 32, name = '' }) {
  const uid = useId().replace(/:/g, '')
  const bgGrad = `tc-user-bg-${uid}`
  const ringGrad = `tc-user-ring-${uid}`
  const initial = String(name || '').trim().charAt(0).toUpperCase()

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={name ? `Khách hàng ${name}` : 'Khách hàng'}
    >
      <defs>
        <linearGradient id={bgGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1b3a68" />
          <stop offset="100%" stopColor="#0b1f3a" />
        </linearGradient>
        <linearGradient id={ringGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fae08c" />
          <stop offset="55%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#967210" />
        </linearGradient>
      </defs>

      <circle cx="24" cy="24" r="22.5" fill={`url(#${bgGrad})`} stroke={`url(#${ringGrad})`} strokeWidth="2.5" />

      {initial ? (
        <text
          x="24"
          y="29.5"
          textAnchor="middle"
          fill="#f8e396"
          fontSize="18"
          fontWeight="800"
          fontFamily="Inter, Segoe UI, sans-serif"
        >
          {initial}
        </text>
      ) : (
        <g fill="none" stroke="#f5d97e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="17.5" r="5.5" fill="rgba(245, 217, 126, 0.2)" />
          <path d="M13.5 34.5 C14.8 28.5, 33.2 28.5, 34.5 34.5" />
        </g>
      )}
    </svg>
  )
}
