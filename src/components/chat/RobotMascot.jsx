import { useId } from 'react'

export default function RobotMascot({ size = 84, className }) {
  const uid = useId().replace(/:/g, '')
  const shell = `shell-${uid}`
  const visor = `visor-${uid}`
  const glow = `glow-${uid}`

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
        <linearGradient id={shell} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4dbf8" />
        </linearGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2656" />
          <stop offset="1" stopColor="#140b24" />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c58bff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#c58bff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="60" cy="112" rx="26" ry="4" fill="#000" opacity="0.14" />

      <ellipse cx="22" cy="86" rx="8" ry="11" fill={`url(#${shell})`} stroke="#d3c7f0" strokeWidth="1.5" transform="rotate(22 22 86)" />
      <ellipse cx="98" cy="86" rx="8" ry="11" fill={`url(#${shell})`} stroke="#d3c7f0" strokeWidth="1.5" transform="rotate(-22 98 86)" />
      <circle cx="17" cy="95" r="4" fill="#9b5de5" />
      <circle cx="103" cy="95" r="4" fill="#9b5de5" />

      <ellipse cx="60" cy="98" rx="24" ry="15" fill={`url(#${shell})`} stroke="#d3c7f0" strokeWidth="1.5" />
      <rect x="48" y="96" width="24" height="5" rx="2.5" fill="#9b5de5" />

      <line x1="60" y1="8" x2="60" y2="18" stroke="#b9a6e6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="7" r="4.5" fill="#9b5de5" />

      <circle cx="12" cy="54" r="8" fill="#9b5de5" />
      <circle cx="108" cy="54" r="8" fill="#9b5de5" />
      <circle cx="12" cy="54" r="3" fill="#d9c2ff" />
      <circle cx="108" cy="54" r="3" fill="#d9c2ff" />

      <rect x="14" y="17" width="92" height="76" rx="36" fill={`url(#${shell})`} stroke="#d3c7f0" strokeWidth="1.5" />
      <path d="M30 28 q14 -8 32 -6" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9" />

      <rect x="25" y="31" width="70" height="46" rx="23" fill={`url(#${visor})`} />
      <ellipse cx="42" cy="54" rx="14" ry="12" fill={`url(#${glow})`} />
      <ellipse cx="78" cy="54" rx="14" ry="12" fill={`url(#${glow})`} />

      <path d="M35 56 q7 -11 14 0" stroke="#e1b8ff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M71 56 q7 -11 14 0" stroke="#e1b8ff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M53 63 q7 7 14 0" stroke="#ff9ccf" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="33" cy="64" r="3.2" fill="#ff7eb6" opacity="0.55" />
      <circle cx="87" cy="64" r="3.2" fill="#ff7eb6" opacity="0.55" />
    </svg>
  )
}
