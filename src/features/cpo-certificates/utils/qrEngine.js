import QRCode from 'qrcode'
import { QR_OPTIONS } from '../constants/cpoCertificateConstants'

/**
 * QR Engine: sinh mã QR ngay trên trình duyệt, không gửi URL đi đâu.
 * Mức sửa lỗi Q (~25%), không chèn logo để máy quét đọc chắc chắn sau khi in.
 */

const baseOptions = {
  errorCorrectionLevel: QR_OPTIONS.errorCorrectionLevel,
  margin: QR_OPTIONS.margin,
  color: QR_OPTIONS.color,
}

/** @param {string} text @returns {Promise<string>} data URL PNG */
export function generateQrPngDataUrl(text, width = QR_OPTIONS.pngWidth) {
  return QRCode.toDataURL(text, { ...baseOptions, type: 'image/png', width })
}

/** @param {string} text @returns {Promise<string>} chuỗi SVG (vector, in sắc nét ở mọi cỡ) */
export function generateQrSvg(text) {
  return QRCode.toString(text, { ...baseOptions, type: 'svg' })
}

/** SVG → data URL để hiển thị bằng <img>, không cần chèn HTML thô vào DOM. */
export function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Tải một data URL hoặc Blob về máy với tên file cho trước. */
export function downloadFile(source, fileName) {
  const url = source instanceof Blob ? URL.createObjectURL(source) : source
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  if (source instanceof Blob) setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Sao chép văn bản; dùng textarea tạm khi trình duyệt chặn Clipboard API (http, iOS cũ). */
export async function copyText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  area.remove()
  if (!ok) throw new Error('Copy failed')
}
