import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

function canvas(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  t.anisotropy = 8
  return t
}

/** Cửa cuốn: các nan ngang. */
export function rollerDoorTexture() {
  const t = canvas(64, 512, (g, w, h) => {
    g.fillStyle = '#1b1c1f'
    g.fillRect(0, 0, w, h)
    for (let y = 0; y < h; y += 16) {
      g.fillStyle = '#2a2c30'
      g.fillRect(0, y, w, 9)
      g.fillStyle = '#0c0d0e'
      g.fillRect(0, y + 13, w, 2)
    }
  })
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

/** Sàn bê tông mài: nhiễu nhẹ để mặt sàn không phẳng lì. */
export function floorTexture(base = '#1e1f22') {
  const t = canvas(512, 512, (g, w, h) => {
    g.fillStyle = base
    g.fillRect(0, 0, w, h)
    for (let i = 0; i < 9000; i++) {
      const a = Math.random() * 0.06
      g.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2)
    }
  })
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

/** Chữ thương hiệu dưới logo ở studio. */
export function wordmarkTexture() {
  return canvas(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.textAlign = 'center'
    g.fillStyle = '#f2f2f2'
    g.font = '700 118px "Inter", "Segoe UI", Arial, sans-serif'
    g.fillText('TRUST CAR', w / 2, 128)
    g.fillStyle = '#1d4ed8'
    g.font = 'italic 700 46px "Inter", "Segoe UI", Arial, sans-serif'
    g.fillText('XE LÀ PHẢI CHẤT', w / 2, 210)
  })
}

/**
 * Cảnh phố mờ ngoài vách kính (không có xe): trời chiều, hàng cây / nhà mờ, mặt đường.
 * Vẽ bằng code để không dùng ảnh xe của hãng khác.
 */
export function streetTexture() {
  return canvas(1024, 384, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.62)
    sky.addColorStop(0, '#9fb6cc')
    sky.addColorStop(0.7, '#e9d3b4')
    sky.addColorStop(1, '#f3e2c6')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    g.filter = 'blur(6px)'
    for (let i = 0; i < 9; i++) {
      g.fillStyle = `rgba(${150 + i * 6}, ${150 + i * 5}, ${155 + i * 4}, 0.9)`
      const bw = 70 + ((i * 53) % 90)
      const bh = 80 + ((i * 37) % 120)
      g.fillRect(i * 120 - 20, h * 0.62 - bh, bw, bh)
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = i % 2 ? 'rgba(52, 78, 52, 0.95)' : 'rgba(70, 98, 62, 0.92)'
      g.beginPath()
      g.ellipse(i * 78 + 20, h * 0.5, 46 + (i % 3) * 14, 62 + (i % 4) * 10, 0, 0, Math.PI * 2)
      g.fill()
      g.fillRect(i * 78 + 16, h * 0.52, 8, h * 0.1)
    }
    g.filter = 'none'
    const road = g.createLinearGradient(0, h * 0.62, 0, h)
    road.addColorStop(0, '#6f7378')
    road.addColorStop(1, '#3d4044')
    g.fillStyle = road
    g.fillRect(0, h * 0.62, w, h * 0.38)
    g.fillStyle = 'rgba(240, 240, 240, 0.65)'
    for (let x = 0; x < w; x += 110) g.fillRect(x, h * 0.8, 60, 5)
  })
}

/** Màn LED trong sảnh: logo TRUST CAR + khẩu hiệu. `logo` là ảnh logo đã tải. */
export function ledTexture(logo) {
  return canvas(1024, 576, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h)
    bg.addColorStop(0, '#0b1220')
    bg.addColorStop(1, '#1b2b44')
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    g.strokeStyle = 'rgba(29, 78, 216, 0.35)'
    g.lineWidth = 2
    for (let i = 0; i < 6; i++) {
      g.beginPath()
      g.arc(w * 0.28, h * 0.5, 150 + i * 34, 0, Math.PI * 2)
      g.stroke()
    }
    if (logo?.width) {
      const lh = 300
      const lw = (lh * logo.width) / logo.height
      g.drawImage(logo, w * 0.28 - lw / 2, h * 0.5 - lh / 2, lw, lh)
    }
    // chữ bên phải logo: căn từ 50 % bề ngang, chừa lề 6 % -> mọi dòng đều nằm gọn trong màn (maxWidth tự co chữ)
    const x = w * 0.5
    const maxW = w * 0.44
    g.textAlign = 'left'
    g.fillStyle = '#ffffff'
    g.font = '800 88px "Inter", "Segoe UI", Arial, sans-serif'
    g.fillText('TRUST CAR', x, h * 0.42, maxW)
    g.fillStyle = '#60a5fa'
    g.font = 'italic 700 38px "Inter", "Segoe UI", Arial, sans-serif'
    g.fillText('XE LÀ PHẢI CHẤT', x, h * 0.53, maxW)
    g.fillStyle = 'rgba(255, 255, 255, 0.8)'
    g.font = '500 26px "Inter", "Segoe UI", Arial, sans-serif'
    g.fillText('Kiểm định 150+ hạng mục', x, h * 0.65, maxW)
    g.fillText('Minh bạch lịch sử xe', x, h * 0.72, maxW)
  })
}

/** Chữ trên mảng tường studio: TRUST CAR · PAINT STUDIO (nền trong suốt). */
export function studioWordTexture() {
  return canvas(1024, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h)
    g.textAlign = 'center'
    g.fillStyle = '#f2f2f2'
    g.font = '800 96px "Inter", "Segoe UI", Arial, sans-serif'
    g.fillText('TRUST CAR', w / 2, 110, w * 0.9)
    g.fillStyle = '#60a5fa'
    g.font = '600 44px "Inter", "Segoe UI", Arial, sans-serif'
    g.fillText('P A I N T   S T U D I O', w / 2, 196, w * 0.9)
  })
}
