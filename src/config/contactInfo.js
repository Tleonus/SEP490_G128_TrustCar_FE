const SETTINGS_STORAGE_KEY = 'trustcar:admin:base-settings'

export const DEFAULT_BASE_SETTINGS = {
  showroomName: 'Showroom TrustCar',
  address: 'Quận 1, TP. Hồ Chí Minh',
  hotline: '0856 098 686',
  email: 'support@trustcar.vn',
  openingTime: '08:00',
  closingTime: '20:00',
  daysOff: ['sunday'],
  slotDuration: '90',
  maxCustomersPerSlot: '4',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Showroom+TrustCar%2C+Qu%E1%BA%ADn+1%2C+TP.+H%E1%BB%93+Ch%C3%AD+Minh',
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
  return Object.fromEntries(Object.entries(stored).map(([key, value]) => [
    key,
    hasMojibake(value) ? DEFAULT_BASE_SETTINGS[key] : value,
  ]))
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

  return {
    phone,
    phoneDisplay,
    phoneHref: `tel:${phone}`,
    email: String(settings.email || '').trim(),
    showroomName: String(settings.showroomName || '').trim(),
    showroomAddress: String(settings.address || '').trim(),
    showroomDisplay: `${String(settings.showroomName || '').trim()}, ${String(settings.address || '').trim()}`,
    showroomHours: `${settings.openingTime} - ${settings.closingTime} ${daysOffLabel}`,
    mapUrl: String(settings.mapUrl || '').trim(),
    zaloUrl: String(settings.zaloUrl || '').trim(),
    facebookUrl: String(settings.facebookUrl || '').trim(),
    messengerUrl: String(settings.messengerUrl || '').trim(),
    tiktokUrl: String(settings.tiktokUrl || '').trim(),
    tiktokHandle: String(settings.tiktokHandle || '').trim(),
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
