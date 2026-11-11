import { useEffect, useState } from 'react'

const SETTINGS_STORAGE_KEY = 'trustcar:admin:base-settings'

const LEGACY_ADDRESSES = [
  'Quận 1, TP. Hồ Chí Minh',
  '123 Đường ABC, Quận 1, TP. Hồ Chí Minh',
]

const LEGACY_MAP_URLS = [
  'https://www.google.com/maps/search/?api=1&query=Showroom+TrustCar%2C+Qu%E1%BA%ADn+1%2C+TP.+H%E1%BB%93+Ch%C3%AD+Minh',
]

export const DEFAULT_SHOWROOM_ADDRESS = 'Số 18 Hoàng Quán Chi, Cầu Giấy, Hà Nội, Hanoi, Vietnam'

export const DEFAULT_BASE_SETTINGS = {
  showroomName: 'Showroom TrustCar',
  address: DEFAULT_SHOWROOM_ADDRESS,
  hotline: '0856 098 686',
  email: 'support@trustcar.vn',
  openingTime: '08:00',
  closingTime: '20:00',
  daysOff: ['sunday'],
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Showroom+TrustCar%2C+S%E1%BB%91+18+Ho%C3%A0ng+Qu%C3%A1n+Chi%2C+C%E1%BA%A7u+Gi%E1%BA%A5y%2C+H%C3%A0+N%E1%BB%99i%2C+Hanoi%2C+Vietnam',
  showroomImageUrl: '',
  zaloUrl: 'https://zalo.me/0856098686',
  facebookUrl: 'https://www.facebook.com/tronghieu.7297',
  messengerUrl: 'https://m.me/tronghieu.7297',
  tiktokUrl: 'https://www.tiktok.com/@hieu_xeluot?is_from_webapp=1&sender_device=pc',
  tiktokHandle: '@hieu_xeluot',
}

const DAY_LABELS = {
  monday: 'Thứ 2',
  tuesday: 'Thứ 3',
  wednesday: 'Thứ 4',
  thursday: 'Thứ 5',
  friday: 'Thứ 6',
  saturday: 'Thứ 7',
  sunday: 'Chủ nhật',
}

function readStoredSettings() {
  if (typeof window === 'undefined') return {}
  try {
    const saved = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function hasMojibake(value) {
  return typeof value === 'string' && /\u00c3|\u00c2|\ufffd|\u00e1\u00ba|\u00c4/.test(value)
}

function repairStoredSettings(stored) {
  return Object.fromEntries(Object.entries(stored).map(([key, value]) => {
    if (hasMojibake(value)) {
      return [key, DEFAULT_BASE_SETTINGS[key]]
    }
    if (key === 'address' && LEGACY_ADDRESSES.includes(String(value || '').trim())) {
      return [key, DEFAULT_BASE_SETTINGS.address]
    }
    if (key === 'mapUrl' && LEGACY_MAP_URLS.includes(String(value || '').trim())) {
      return [key, DEFAULT_BASE_SETTINGS.mapUrl]
    }
    return [key, value]
  }))
}

export function getBaseSettings() {
  return { ...DEFAULT_BASE_SETTINGS, ...repairStoredSettings(readStoredSettings()) }
}

export function buildContactInfo(settings = getBaseSettings()) {
  const phoneDisplay = String(settings.hotline || DEFAULT_BASE_SETTINGS.hotline).trim()
  const phone = phoneDisplay.replace(/\D/g, '')
  const daysOff = Array.isArray(settings.daysOff) ? settings.daysOff : []
  const daysOffLabel = daysOff.length === 0
    ? 'hàng ngày'
    : `nghỉ ${daysOff.map((day) => DAY_LABELS[day] || day).join(', ')}`

  const showroomName = String(settings.showroomName || DEFAULT_BASE_SETTINGS.showroomName).trim()
  const showroomAddress = String(settings.address || DEFAULT_BASE_SETTINGS.address).trim()
  const showroomDisplay = showroomName
    ? `${showroomName}, ${showroomAddress}`
    : showroomAddress

  const addressQuery = encodeURIComponent(showroomAddress)
  const searchQuery = encodeURIComponent(`${showroomName}, ${showroomAddress}`)
  const rawMapUrl = String(settings.mapUrl || '').trim()

  return {
    phone,
    phoneDisplay,
    phoneHref: `tel:${phone}`,
    email: String(settings.email || DEFAULT_BASE_SETTINGS.email).trim(),
    showroomName,
    showroomAddress,
    showroomDisplay,
    showroomHours: `${settings.openingTime} - ${settings.closingTime} (${daysOffLabel})`,
    openingTime: String(settings.openingTime || DEFAULT_BASE_SETTINGS.openingTime).trim(),
    closingTime: String(settings.closingTime || DEFAULT_BASE_SETTINGS.closingTime).trim(),
    mapUrl: rawMapUrl || `https://www.google.com/maps/search/?api=1&query=${searchQuery}`,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`,
    mapEmbedUrl: `https://maps.google.com/maps?q=${addressQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`,
    showroomImageUrl: String(settings.showroomImageUrl || '').trim(),
    zaloUrl: String(settings.zaloUrl || DEFAULT_BASE_SETTINGS.zaloUrl).trim(),
    facebookUrl: String(settings.facebookUrl || DEFAULT_BASE_SETTINGS.facebookUrl).trim(),
    messengerUrl: String(settings.messengerUrl || DEFAULT_BASE_SETTINGS.messengerUrl).trim(),
    tiktokUrl: String(settings.tiktokUrl || DEFAULT_BASE_SETTINGS.tiktokUrl).trim(),
    tiktokHandle: String(settings.tiktokHandle || DEFAULT_BASE_SETTINGS.tiktokHandle).trim(),
  }
}

export const CONTACT_INFO = buildContactInfo()

export function applyBaseSettings(settings) {
  Object.assign(CONTACT_INFO, buildContactInfo(settings))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trustcar:contact-info-updated', { detail: CONTACT_INFO }))
  }
}

export function saveBaseSettings(settings) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }
  applyBaseSettings(settings)
}

export function useContactInfo() {
  const [contactInfo, setContactInfo] = useState(() => buildContactInfo(getBaseSettings()))

  useEffect(() => {
    function syncContactInfo() {
      const latest = buildContactInfo(getBaseSettings())
      Object.assign(CONTACT_INFO, latest)
      setContactInfo(latest)
    }

    window.addEventListener('trustcar:contact-info-updated', syncContactInfo)
    window.addEventListener('storage', syncContactInfo)
    return () => {
      window.removeEventListener('trustcar:contact-info-updated', syncContactInfo)
      window.removeEventListener('storage', syncContactInfo)
    }
  }, [])

  return contactInfo
}
