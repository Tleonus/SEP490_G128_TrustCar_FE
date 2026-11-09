import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  LinkOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  PictureOutlined,
  SaveOutlined,
  ShopOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import Icon from '../../features/vehicle-intake/components/VehicleIntakeIcon'
import styles from './AdminBaseSettingsPage.module.css'
import { getBaseSettings, saveBaseSettings } from '../../config/contactInfo'

const DAYS = [
  { key: 'monday', label: 'Th\u{1ee9} 2' },
  { key: 'tuesday', label: 'Th\u{1ee9} 3' },
  { key: 'wednesday', label: 'Th\u{1ee9} 4' },
  { key: 'thursday', label: 'Th\u{1ee9} 5' },
  { key: 'friday', label: 'Th\u{1ee9} 6' },
  { key: 'saturday', label: 'Th\u{1ee9} 7' },
  { key: 'sunday', label: 'Ch\u{1ee7} nh\u{1ead}t' },
]

function timeToMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number)
  return (hours * 60) + minutes
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function Field({ label, htmlFor, hint, children }) {
  return (
    <label className={styles.field} htmlFor={htmlFor}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
      {hint && <span className={styles.fieldHint}>{hint}</span>}
    </label>
  )
}

function SectionHeading({ icon, eyebrow, title, description, headingId }) {
  return (
    <div className={styles.sectionHeading}>
      <div className={styles.sectionIcon} aria-hidden="true">{icon}</div>
      <div>
        <span className={styles.sectionEyebrow}>{eyebrow}</span>
        <h2 id={headingId}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function AdminBaseSettingsPage() {
  const [settings, setSettings] = useState(getBaseSettings)
  const [savedSettings, setSavedSettings] = useState(getBaseSettings)
  const [saveState, setSaveState] = useState('idle')

  const isDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  const schedule = useMemo(() => {
    const opening = timeToMinutes(settings.openingTime)
    const closing = timeToMinutes(settings.closingTime)
    const duration = Number(settings.slotDuration)
    const totalMinutes = closing - opening
    const slotCount = totalMinutes > 0 && duration > 0 ? Math.floor(totalMinutes / duration) : 0
    const workingDays = DAYS.length - settings.daysOff.length
    return {
      totalMinutes,
      duration,
      slotCount,
      workingDays,
      weeklyCapacity: slotCount * Number(settings.maxCustomersPerSlot) * workingDays,
    }
  }, [settings])

  useEffect(() => {
    if (saveState !== 'success') return undefined
    const timer = window.setTimeout(() => setSaveState('idle'), 3500)
    return () => window.clearTimeout(timer)
  }, [saveState])

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
    setSaveState('idle')
  }

  function toggleDay(day) {
    setSettings((current) => ({
      ...current,
      daysOff: current.daysOff.includes(day)
        ? current.daysOff.filter((item) => item !== day)
        : [...current.daysOff, day],
    }))
    setSaveState('idle')
  }

  function handleReset() {
    setSettings(savedSettings)
    setSaveState('idle')
  }

  function handleSave(event) {
    event.preventDefault()
    if (!isValidTime(settings.openingTime) || !isValidTime(settings.closingTime) || schedule.totalMinutes <= 0 || schedule.duration <= 0 || Number(settings.maxCustomersPerSlot) <= 0) {
      setSaveState('error')
      return
    }
    saveBaseSettings(settings)
    setSavedSettings(settings)
    setSaveState('success')
  }

  const previewSlots = schedule.slotCount > 0
    ? Array.from({ length: Math.min(schedule.slotCount, 5) }, (_, index) => {
      const start = timeToMinutes(settings.openingTime) + (index * schedule.duration)
      const end = start + schedule.duration
      const toTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
      return `${toTime(start)} \u2013 ${toTime(end)}`
    })
    : []

  return (
    <div className={styles.page}>
      <form onSubmit={handleSave}>
        <header className={styles.pageHeader}>
          <div className={styles.headingCopy}>
            <span className={styles.eyebrow}>C&#7844;U H&Igrave;NH SHOWROOM</span>
            <h1>C&#7845;u h&igrave;nh v&#7853;n h&agrave;nh</h1>
            <p>Thi&#7871;t l&#7853;p th&ocirc;ng tin d&ugrave;ng chung v&agrave; quy t&#7855;c nh&#7853;n l&#7883;ch l&aacute;i th&#7917; cho showroom.</p>
          </div>
          <div className={styles.headerActions}>
            {isDirty && <span className={styles.unsavedNote}>C&oacute; thay &#273;&#7893;i ch&#432;a l&#432;u</span>}
            <button type="button" className={styles.secondaryButton} onClick={handleReset} disabled={!isDirty}>H&#7911;y thay &#273;&#7893;i</button>
            <button type="submit" className={styles.primaryButton} disabled={!isDirty}>
              <SaveOutlined aria-hidden="true" />
              L&#432;u c&#7845;u h&igrave;nh
            </button>
          </div>
        </header>

        {saveState === 'success' && (
          <div className={`${styles.alert} ${styles.successAlert}`} role="status">
            <CheckCircleOutlined aria-hidden="true" />
            <span>&#272;&atilde; l&#432;u c&#7845;u h&igrave;nh v&agrave; c&#7853;p nh&#7853;t th&ocirc;ng tin li&ecirc;n h&#7879; cho website.</span>
          </div>
        )}
        {saveState === 'error' && (
          <div className={`${styles.alert} ${styles.errorAlert}`} role="alert">
            <span>Nh&#7853;p gi&#7901; theo &#273;&#7883;nh d&#7841;ng 24 gi&#7901; (HH:mm), gi&#7901; &#273;&oacute;ng c&#7917;a ph&#7843;i sau gi&#7901; m&#7903; c&#7917;a v&agrave; c&aacute;c gi&#7899;i h&#7841;n ph&#7843;i l&#7899;n h&#417;n 0.</span>
          </div>
        )}

        <div className={styles.layout}>
          <section className={styles.card} aria-labelledby="contact-heading">
            <SectionHeading
              headingId="contact-heading"
              icon={<ShopOutlined />}
              eyebrow="01 &middot; TH&Ocirc;NG TIN CHUNG"
              title="Th&ocirc;ng tin showroom"
              description="Th&ocirc;ng tin n&agrave;y s&#7869; &#273;&#432;&#7907;c d&ugrave;ng &#7903; trang Li&ecirc;n h&#7879;, footer v&agrave; n&#7897;i dung email g&#7917;i kh&aacute;ch."
            />
            <div className={styles.formGrid}>
              <Field label="T&ecirc;n showroom" htmlFor="showroom-name" hint="T&ecirc;n hi&#7875;n th&#7883; c&ocirc;ng khai tr&ecirc;n website.">
                <div className={styles.inputWithIcon}>
                  <ShopOutlined aria-hidden="true" />
                  <input id="showroom-name" className={styles.input} value={settings.showroomName} onChange={(event) => updateField('showroomName', event.target.value)} required />
                </div>
              </Field>
              <Field label="&#272;&#7883;a ch&#7881; showroom" htmlFor="showroom-address">
                <div className={styles.inputWithIcon}>
                  <EnvironmentOutlined aria-hidden="true" />
                  <input id="showroom-address" className={styles.input} value={settings.address} onChange={(event) => updateField('address', event.target.value)} required />
                </div>
              </Field>
              <Field label="Hotline" htmlFor="showroom-hotline">
                <div className={styles.inputWithIcon}>
                  <PhoneOutlined aria-hidden="true" />
                  <input id="showroom-hotline" className={styles.input} type="tel" value={settings.hotline} onChange={(event) => updateField('hotline', event.target.value)} required />
                </div>
              </Field>
              <Field label="Email ti&#7871;p nh&#7853;n" htmlFor="showroom-email" hint="&#272;&#7883;a ch&#7881; nh&#7853;n y&ecirc;u c&#7847;u v&agrave; g&#7917;i ph&#7843;n h&#7891;i cho kh&aacute;ch.">
                <div className={styles.inputWithIcon}>
                  <MailOutlined aria-hidden="true" />
                  <input id="showroom-email" className={styles.input} type="email" value={settings.email} onChange={(event) => updateField('email', event.target.value)} required />
                </div>
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="H&igrave;nh &#7843;nh Showroom (URL)" htmlFor="showroom-image-url" hint="D&aacute;n &#273;&#432;&#7901;ng d&#7851;n &#7843;nh th&#7921;c t&#7871; Showroom &#273;&#7875; hi&#7875;n th&#7883; trong khung 3D &#7903; Trang ch&#7911; v&agrave; Trang Li&ecirc;n h&#7879; (&#273;&#7875; tr&#7889;ng s&#7869; hi&#7875;n th&#7883; khung &#273;&oacute;ng s&#7861;n ch&#7901; g&#7855;n &#7843;nh).">
                  <div className={styles.inputWithIcon}>
                    <PictureOutlined aria-hidden="true" />
                    <input id="showroom-image-url" className={styles.input} type="url" value={settings.showroomImageUrl || ''} onChange={(event) => updateField('showroomImageUrl', event.target.value)} placeholder="https://example.com/showroom-trustcar.jpg" />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          <section className={styles.card} aria-labelledby="hours-heading">
            <SectionHeading
              headingId="hours-heading"
              icon={<ClockCircleOutlined />}
              eyebrow="02 &middot; L&#7882;CH HO&#7840;T &#272;&#7896;NG"
              title="Gi&#7901; m&#7903; c&#7917;a"
              description="D&ugrave;ng l&agrave;m kho&#7843;ng th&#7901;i gian h&#7907;p l&#7879; &#273;&#7875; h&#7879; th&#7889;ng t&#7841;o c&aacute;c ca l&aacute;i th&#7917;."
            />
            <div className={styles.timeGrid}>
              <Field label="M&#7903; c&#7917;a" htmlFor="opening-time">
                <div className={styles.inputWithIcon}>
                  <ClockCircleOutlined aria-hidden="true" />
                  <input id="opening-time" className={styles.input} type="text" inputMode="numeric" maxLength="5" pattern="([01]\d|2[0-3]):[0-5]\d" placeholder="08:00" value={settings.openingTime} onChange={(event) => updateField('openingTime', event.target.value)} required />
                </div>
              </Field>
              <span className={styles.timeSeparator} aria-hidden="true">&#273;&#7871;n</span>
              <Field label="&#272;&#243;ng c&#7917;a" htmlFor="closing-time">
                <div className={styles.inputWithIcon}>
                  <ClockCircleOutlined aria-hidden="true" />
                  <input id="closing-time" className={styles.input} type="text" inputMode="numeric" maxLength="5" pattern="([01]\d|2[0-3]):[0-5]\d" placeholder="20:00" value={settings.closingTime} onChange={(event) => updateField('closingTime', event.target.value)} required />
                </div>
              </Field>
            </div>
            <div className={styles.daysBlock}>
              <div className={styles.daysTitle}>
                <span className={styles.fieldLabel}>Ng&agrave;y ngh&#7881; c&#7889; &#273;&#7883;nh</span>
                <span className={styles.fieldHint}>Ch&#7885;n ng&agrave;y showroom kh&ocirc;ng nh&#7853;n l&#7883;ch.</span>
              </div>
              <div className={styles.daysGrid}>
                {DAYS.map((day) => (
                  <label className={`${styles.dayOption} ${settings.daysOff.includes(day.key) ? styles.dayOff : ''}`} key={day.key}>
                    <input type="checkbox" checked={settings.daysOff.includes(day.key)} onChange={() => toggleDay(day.key)} />
                    <span>{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          <section className={`${styles.card} ${styles.linksCard}`} aria-labelledby="links-heading">
            <SectionHeading
              headingId="links-heading"
              icon={<LinkOutlined />}
              eyebrow="03 &middot; K&Ecirc;NH LI&Ecirc;N H&#7878;"
              title="&#272;&#432;&#7901;ng d&#7851;n li&ecirc;n h&#7879;"
              description="Qu&#7843;n l&yacute; c&aacute;c &#273;&#432;&#7901;ng d&#7851;n &#273;&#432;&#7907;c d&ugrave;ng tr&ecirc;n trang ch&#7911;, footer v&agrave; c&#7909;m n&uacute;t li&ecirc;n h&#7879;."
            />
            <div className={styles.linksGrid}>
              <Field label="Google Maps" htmlFor="map-url">
                <div className={styles.inputWithIcon}>
                  <CompassOutlined aria-hidden="true" />
                  <input id="map-url" className={styles.input} type="url" value={settings.mapUrl} onChange={(event) => updateField('mapUrl', event.target.value)} placeholder="https://maps.google.com/..." />
                </div>
              </Field>
              <Field label="Zalo" htmlFor="zalo-url">
                <div className={styles.inputWithIcon}>
                  <MessageOutlined aria-hidden="true" />
                  <input id="zalo-url" className={styles.input} type="url" value={settings.zaloUrl} onChange={(event) => updateField('zaloUrl', event.target.value)} placeholder="https://zalo.me/..." />
                </div>
              </Field>
              <Field label="Facebook" htmlFor="facebook-url">
                <div className={styles.inputWithIcon}>
                  <GlobalOutlined aria-hidden="true" />
                  <input id="facebook-url" className={styles.input} type="url" value={settings.facebookUrl} onChange={(event) => updateField('facebookUrl', event.target.value)} placeholder="https://facebook.com/..." />
                </div>
              </Field>
              <Field label="Messenger" htmlFor="messenger-url">
                <div className={styles.inputWithIcon}>
                  <MessageOutlined aria-hidden="true" />
                  <input id="messenger-url" className={styles.input} type="url" value={settings.messengerUrl} onChange={(event) => updateField('messengerUrl', event.target.value)} placeholder="https://m.me/..." />
                </div>
              </Field>
              <Field label="TikTok" htmlFor="tiktok-url">
                <div className={styles.inputWithIcon}>
                  <VideoCameraOutlined aria-hidden="true" />
                  <input id="tiktok-url" className={styles.input} type="url" value={settings.tiktokUrl} onChange={(event) => updateField('tiktokUrl', event.target.value)} placeholder="https://tiktok.com/@..." />
                </div>
              </Field>
              <Field label="T&ecirc;n hi&#7875;n th&#7883; TikTok" htmlFor="tiktok-handle" hint="V&iacute; d&#7909;: @trustcar.vn">
                <div className={styles.inputWithIcon}>
                  <UserOutlined aria-hidden="true" />
                  <input id="tiktok-handle" className={styles.input} value={settings.tiktokHandle} onChange={(event) => updateField('tiktokHandle', event.target.value)} placeholder="@trustcar.vn" />
                </div>
              </Field>
            </div>
          </section>

          <section className={`${styles.card} ${styles.testDriveCard}`} aria-labelledby="test-drive-heading">
            <div className={styles.testDriveHeader}>
              <SectionHeading
                headingId="test-drive-heading"
                icon={<ThunderboltOutlined />}
                eyebrow="04 &middot; QUY T&#7854;C L&Aacute;I TH&#7916;"
                title="C&#7845;u h&igrave;nh l&aacute;i th&#7917;"
                description="&#272;&acirc;y l&agrave; c&#417; s&#7903; &#273;&#7875; KAN-16 t&iacute;nh c&aacute;c khung gi&#7901; c&ograve;n tr&#7889;ng khi kh&aacute;ch &#273;&#7863;t l&#7883;ch."
              />
              <span className={styles.priorityBadge}>Thi&#7871;t l&#7853;p quan tr&#7885;ng</span>
            </div>
            <div className={styles.testDriveGrid}>
              <div className={styles.testDriveFields}>
                <Field label="&#272;&#7897; d&agrave;i m&#7895;i ca" htmlFor="slot-duration" hint="Th&#7901;i l&#432;&#7907;ng m&#7897;t l&#7883;ch l&aacute;i th&#7917;.">
                  <div className={`${styles.inputWithIcon} ${styles.inputWithSuffix}`}>
                    <ClockCircleOutlined aria-hidden="true" />
                    <input id="slot-duration" className={styles.input} type="number" min="15" max="480" step="15" value={settings.slotDuration} onChange={(event) => updateField('slotDuration', event.target.value)} required />
                    <span className={styles.inputSuffix}>ph&uacute;t</span>
                  </div>
                </Field>
                <Field label="T&#7889;i &#273;a m&#7895;i khung gi&#7901;" htmlFor="max-customers" hint="S&#7889; kh&aacute;ch t&#7889;i &#273;a c&oacute; th&#7875; nh&#7853;n trong c&ugrave;ng m&#7897;t ca.">
                  <div className={`${styles.inputWithIcon} ${styles.inputWithSuffix}`}>
                    <TeamOutlined aria-hidden="true" />
                    <input id="max-customers" className={styles.input} type="number" min="1" max="100" value={settings.maxCustomersPerSlot} onChange={(event) => updateField('maxCustomersPerSlot', event.target.value)} required />
                    <span className={styles.inputSuffix}>kh&aacute;ch</span>
                  </div>
                </Field>
              </div>
              <aside className={styles.preview} aria-label="Xem tr&#432;&#7899;c l&#7883;ch l&aacute;i th&#7917;">
                <div className={styles.previewTopline}><span>Xem tr&#432;&#7899;c m&#7897;t ng&agrave;y l&agrave;m vi&#7879;c</span><Icon name="gauge" size={18} /></div>
                <strong>{settings.openingTime} &ndash; {settings.closingTime}</strong>
                <div className={styles.previewStats}>
                  <div><span>Th&#7901;i l&#432;&#7907;ng ca</span><b>{settings.slotDuration} ph&uacute;t</b></div>
                  <div><span>S&#7889; khung gi&#7901;</span><b>{schedule.slotCount} ca</b></div>
                  <div><span>C&ocirc;ng su&#7845;t/ng&agrave;y</span><b>{schedule.slotCount * Number(settings.maxCustomersPerSlot)} kh&aacute;ch</b></div>
                </div>
                {previewSlots.length > 0 ? (
                  <div className={styles.slotList}>
                    {previewSlots.map((slot) => <span key={slot}>{slot}</span>)}
                    {schedule.slotCount > previewSlots.length && <span className={styles.moreSlots}>+ {schedule.slotCount - previewSlots.length} ca ti&#7871;p theo</span>}
                  </div>
                ) : (
                  <p className={styles.previewError}>Ch&#432;a th&#7875; t&#7841;o khung gi&#7901; t&#7915; thi&#7871;t l&#7853;p hi&#7879;n t&#7841;i.</p>
                )}
              </aside>
            </div>
            <div className={styles.infoBanner}>
              <Icon name="info" size={17} />
              <span>V&#7899;i thi&#7871;t l&#7853;p hi&#7879;n t&#7841;i, showroom c&oacute; th&#7875; ph&#7909;c v&#7909; kho&#7843;ng <strong>{schedule.weeklyCapacity} l&#432;&#7907;t/tu&#7847;n</strong> n&#7871;u ho&#7841;t &#273;&#7897;ng &#273;&#7911; {schedule.workingDays} ng&agrave;y.</span>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}
