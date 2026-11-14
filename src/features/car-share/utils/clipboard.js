/**
 * KAN-67 – Copy văn bản vào clipboard.
 *
 * Dùng navigator.clipboard.writeText theo yêu cầu ticket. Trình duyệt chỉ mở API này trên
 * HTTPS hoặc localhost; khi không có (mở qua IP mạng LAN bằng http, trình duyệt cũ) thì
 * dùng textarea tạm + execCommand('copy').
 *
 * Không dùng lại copyText của cpo-certificates/utils/qrEngine.js vì file đó import thư viện
 * qrcode, sẽ kéo thư viện này vào trang chi tiết xe công khai.
 */
export async function copyToClipboard(text) {
  if (!text) throw new Error('Nothing to copy')

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  try {
    if (!document.execCommand('copy')) throw new Error('Copy failed')
  } finally {
    area.remove()
  }
}
