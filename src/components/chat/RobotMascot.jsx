import { useId } from 'react'

/**
 * Logo / Avatar Trợ lý AI TrustCar: Hình tượng Xe Ô tô 3D thông minh có đôi mắt biểu cảm
 * trên kính chắn gió, đèn pha LED Angel-Eyes, gương chiếu hậu, bánh xe thể thao & nụ cười thân thiện.
 * Hỗ trợ trạng thái `active` (đang suy nghĩ / đang gõ trả lời) với hiệu ứng đèn pha & mắt AI phát sáng.
 */
export default function RobotMascot({ size = 84, className, active = false }) {
  const uid = useId().replace(/:/g, '')
  const bodyGrad = `tc-car-body-${uid}`
  const roofGrad = `tc-car-roof-${uid}`
  const goldTrim = `tc-car-gold-${uid}`
  const glassGrad = `tc-car-glass-${uid}`
  const eyeIris = `tc-car-iris-${uid}`
  const headlightGlow = `tc-car-light-${uid}`
  const tireGrad = `tc-car-tire-${uid}`

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Trợ lý Ô tô AI TrustCar"
    >
      <defs>
        {/* Sơn xe 3D Executive Navy ánh kim */}
        <linearGradient id={bodyGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#274b82" />
          <stop offset="45%" stopColor="#132c52" />
          <stop offset="100%" stopColor="#071428" />
        </linearGradient>

        {/* Nóc xe & viền Pearl Metallic sáng bóng */}
        <linearGradient id={roofGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#dbe7f6" />
          <stop offset="100%" stopColor="#94afd3" />
        </linearGradient>

        {/* Viền Champagne Gold đặc trưng của TrustCar */}
        <linearGradient id={goldTrim} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff0a8" />
          <stop offset="50%" stopColor="#dfb638" />
          <stop offset="100%" stopColor="#946f0e" />
        </linearGradient>

        {/* Kính chắn gió Panoramic tối màu sâu */}
        <linearGradient id={glassGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#112a4e" />
          <stop offset="100%" stopColor="#050e1d" />
        </linearGradient>

        {/* Tròng mắt 3D Cyber Cyan */}
        <radialGradient id={eyeIris} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>

        {/* Hào quang đèn pha LED */}
        <radialGradient id={headlightGlow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>

        {/* Lốp xe thể thao 3D */}
        <linearGradient id={tireGrad} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#090d16" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>
      </defs>

      {/* Đổ bóng mặt đường 3D + Đèn gầm Neon khi active */}
      <ellipse
        cx="60"
        cy="107"
        rx="46"
        ry="6.5"
        fill={active ? '#0ea5e9' : '#050d1a'}
        opacity={active ? '0.38' : '0.32'}
      />
      <ellipse cx="60" cy="107" rx="38" ry="4" fill="#040914" opacity="0.45" />

      {/* Bánh xe thể thao bên trái & phải */}
      <g>
        <rect
          x="10"
          y="78"
          width="17"
          height="26"
          rx="6.5"
          fill={`url(#${tireGrad})`}
          stroke={`url(#${goldTrim})`}
          strokeWidth="1.6"
        />
        <line x1="14" y1="84" x2="23" y2="84" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="90" x2="23" y2="90" stroke="#475569" strokeLinecap="round" strokeWidth="1.5" />
        <line x1="14" y1="96" x2="23" y2="96" stroke="#475569" strokeLinecap="round" strokeWidth="1.5" />

        <rect
          x="93"
          y="78"
          width="17"
          height="26"
          rx="6.5"
          fill={`url(#${tireGrad})`}
          stroke={`url(#${goldTrim})`}
          strokeWidth="1.6"
        />
        <line x1="97" y1="84" x2="106" y2="84" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="97" y1="90" x2="106" y2="90" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="97" y1="96" x2="106" y2="96" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Gương chiếu hậu 2 bên (Tai xe ô tô) có đèn xi-nhan LED */}
      <g>
        <path
          d="M 19 52 L 8 47 C 3 46, 2 55, 8 57 L 18 58 Z"
          fill={`url(#${bodyGrad})`}
          stroke={`url(#${goldTrim})`}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line
          x1="6"
          y1="52"
          x2="13"
          y2="53"
          stroke={active ? '#38bdf8' : '#facc15'}
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        <path
          d="M 101 52 L 112 47 C 117 46, 118 55, 112 57 L 102 58 Z"
          fill={`url(#${bodyGrad})`}
          stroke={`url(#${goldTrim})`}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line
          x1="114"
          y1="52"
          x2="107"
          y2="53"
          stroke={active ? '#38bdf8' : '#facc15'}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* Cảm biến AI / Vây cá mập thông minh trên nóc xe */}
      <path
        d="M 54 20 L 60 10 L 66 20 Z"
        fill={`url(#${goldTrim})`}
        stroke="#081527"
        strokeWidth="1.2"
      />
      <circle
        cx="60"
        cy="10"
        r={active ? '4' : '3'}
        fill={active ? '#38bdf8' : '#fde047'}
      />

      {/* Khoang cabin & Nóc xe Coupe 3D */}
      <path
        d="M 20 57 C 24 27, 35 18, 60 18 C 85 18, 96 27, 100 57 Z"
        fill={`url(#${roofGrad})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Kính chắn gió Panoramic chứa ĐÔI MẮT XE Ô TÔ */}
      <path
        d="M 25 55 C 28 31, 37 23, 60 23 C 83 23, 92 31, 95 55 Q 60 59 25 55 Z"
        fill={`url(#${glassGrad})`}
        stroke="#274b82"
        strokeWidth="1.8"
      />

      {/* Viền mí kính chắn gió tạo dáng chân mày biểu cảm cho xe */}
      <path
        d="M 28 30 Q 45 35 60 32 Q 75 35 92 30"
        stroke={`url(#${goldTrim})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />

      {/* ĐÔI MẮT XE Ô TÔ SỐNG ĐỘNG TRÊN KÍNH CHẮN GIÓ */}
      <g>
        {/* Mắt trái */}
        <ellipse
          cx="45"
          cy="42"
          rx="11.5"
          ry="10.5"
          fill="#f8fafc"
          stroke="#38bdf8"
          strokeWidth="1.5"
        />
        <circle cx="46" cy="42.5" r="7.2" fill={`url(#${eyeIris})`} />
        <circle cx="46.5" cy="42.5" r="3.8" fill="#040d1a" />
        {/* Đốm sáng long lanh trong mắt */}
        <circle cx="43.5" cy="39.5" r="2.4" fill="#ffffff" />
        <circle cx="49" cy="45" r="1.2" fill="#ffffff" opacity="0.85" />

        {/* Mắt phải */}
        <ellipse
          cx="75"
          cy="42"
          rx="11.5"
          ry="10.5"
          fill="#f8fafc"
          stroke="#38bdf8"
          strokeWidth="1.5"
        />
        <circle cx="74" cy="42.5" r="7.2" fill={`url(#${eyeIris})`} />
        <circle cx="73.5" cy="42.5" r="3.8" fill="#040d1a" />
        {/* Đốm sáng long lanh trong mắt */}
        <circle cx="71" cy="39.5" r="2.4" fill="#ffffff" />
        <circle cx="76.5" cy="45" r="1.2" fill="#ffffff" opacity="0.85" />

        {/* Vòng HUD quét quanh mắt khi Bot đang suy nghĩ / trả lời */}
        {active && (
          <>
            <circle
              cx="46"
              cy="42.5"
              r="9"
              fill="none"
              stroke="#fde047"
              strokeWidth="1.3"
              strokeDasharray="4 3"
            />
            <circle
              cx="74"
              cy="42.5"
              r="9"
              fill="none"
              stroke="#fde047"
              strokeWidth="1.3"
              strokeDasharray="4 3"
            />
          </>
        )}
      </g>

      {/* Thân trước xe (Nắp Capo 3D, Vòm bánh & Cản trước thể thao) */}
      <path
        d="M 11 62 C 11 54, 20 52, 32 53 Q 60 56 88 53 C 100 52, 109 54, 109 62 L 111 82 C 111 92, 99 96, 60 96 C 21 96, 9 92, 9 82 Z"
        fill={`url(#${bodyGrad})`}
        stroke={`url(#${goldTrim})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Đường gân dập nổi 3D trên nắp Capo */}
      <path
        d="M 32 54 L 42 66 M 88 54 L 78 66"
        stroke="#60a5fa"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M 22 57 Q 60 62 98 57"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />

      {/* Cụm đèn pha LED Angel-Eye bên trái */}
      <g>
        <circle cx="24" cy="70" r="12" fill={`url(#${headlightGlow})`} />
        <path
          d="M 14 66 C 15 61, 28 62, 34 68 C 33 74, 20 75, 14 71 Z"
          fill="#061224"
          stroke={`url(#${goldTrim})`}
          strokeWidth="1.6"
        />
        <ellipse cx="23.5" cy="68.5" rx="5.5" ry="3.6" fill={active ? '#38bdf8' : '#fef08a'} />
        <ellipse cx="23.5" cy="68.5" rx="2.8" ry="1.8" fill="#ffffff" />
        <path
          d="M 15.5 70.5 Q 24 73 32.5 68.5"
          stroke="#38bdf8"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Cụm đèn pha LED Angel-Eye bên phải */}
      <g>
        <circle cx="96" cy="70" r="12" fill={`url(#${headlightGlow})`} />
        <path
          d="M 106 66 C 105 61, 92 62, 86 68 C 87 74, 100 75, 106 71 Z"
          fill="#061224"
          stroke={`url(#${goldTrim})`}
          strokeWidth="1.6"
        />
        <ellipse cx="96.5" cy="68.5" rx="5.5" ry="3.6" fill={active ? '#38bdf8' : '#fef08a'} />
        <ellipse cx="96.5" cy="68.5" rx="2.8" ry="1.8" fill="#ffffff" />
        <path
          d="M 104.5 70.5 Q 96 73 87.5 68.5"
          stroke="#38bdf8"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Logo Khiên Vàng TrustCar chính giữa mũi xe */}
      <polygon
        points="60,59 66,62 64.5,69 60,72 55.5,69 54,62"
        fill={`url(#${goldTrim})`}
        stroke="#081527"
        strokeWidth="1.2"
      />
      <path
        d="M 57.8 65.5 L 59.5 67.2 L 62.8 63.5"
        stroke="#081527"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Lưới tản nhiệt tạo hình NỤ CƯỜI Ô TÔ thân thiện */}
      <path
        d="M 35 76 Q 60 84 85 76 C 84 87, 74 91, 60 91 C 46 91, 36 87, 35 76 Z"
        fill="#050e1d"
        stroke={`url(#${goldTrim})`}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Đường miệng cười sáng trên lưới tản nhiệt */}
      <path
        d="M 42 79 Q 60 88 78 79"
        stroke={active ? '#38bdf8' : '#f5d97e'}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cản gió gầm trước mạ vàng Champagne */}
      <path
        d="M 26 95 Q 60 98 94 95"
        stroke={`url(#${goldTrim})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/**
 * Avatar riêng dành cho Khách hàng (User) trong khung hội thoại.
 * Hiển thị chữ cái đầu tên user nếu đã đăng nhập, hoặc biểu tượng Khách hàng VIP.
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
