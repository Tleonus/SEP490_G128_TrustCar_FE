/**
 * Toán học thuần cho lightbox: giới hạn zoom, zoom quanh con trỏ, chặn ảnh trôi khỏi khung.
 *
 * Hệ toạ độ: gốc (0,0) là tâm khung xem. Ảnh hiển thị tại `offset + scale * p` với p là toạ độ
 * trong ảnh đã vừa khung (fit size). Nhờ vậy zoom quanh một điểm chỉ là giải phương trình giữ
 * điểm đó đứng yên.
 */

import { MAX_ZOOM, MIN_ZOOM } from '../constants/lightboxConstants'

/** Kẹp tỷ lệ zoom trong [MIN_ZOOM, MAX_ZOOM]. */
export function clampZoom(scale) {
  if (!Number.isFinite(scale)) return MIN_ZOOM
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale))
}

/**
 * Kích thước ảnh khi vừa khung (object-fit: contain), không phóng to ảnh nhỏ hơn khung.
 * @param {{ w: number, h: number }} natural kích thước gốc của ảnh
 * @param {{ w: number, h: number }} container kích thước khung xem
 */
export function fitSizeOf(natural, container) {
  const cw = Math.max(0, container?.w || 0)
  const ch = Math.max(0, container?.h || 0)
  const nw = Math.max(0, natural?.w || 0)
  const nh = Math.max(0, natural?.h || 0)
  if (!nw || !nh || !cw || !ch) return { w: cw, h: ch }
  const k = Math.min(1, cw / nw, ch / nh)
  return { w: nw * k, h: nh * k }
}

/**
 * Zoom quanh một điểm trên khung xem: điểm nằm dưới con trỏ giữ nguyên vị trí.
 * @param {object} params
 * @param {number} params.scale tỷ lệ hiện tại
 * @param {{x:number,y:number}} params.offset độ dời hiện tại
 * @param {{x:number,y:number}} params.point toạ độ con trỏ so với tâm khung
 * @param {number} params.nextScale tỷ lệ muốn đổi sang
 * @returns {{ scale: number, offset: {x:number,y:number} }}
 */
export function zoomAtPoint({ scale, offset, point, nextScale }) {
  const safeScale = scale > 0 ? scale : 1
  const target = clampZoom(nextScale)
  const px = (point.x - offset.x) / safeScale
  const py = (point.y - offset.y) / safeScale
  return {
    scale: target,
    offset: {
      x: offset.x + (safeScale - target) * px,
      y: offset.y + (safeScale - target) * py,
    },
  }
}

/**
 * Chặn độ dời để không kéo ảnh ra khỏi khung: mép ảnh không vượt quá mép khung.
 * Khi ảnh nhỏ hơn khung theo một trục, trục đó bị khoá về 0.
 * @param {{x:number,y:number}} offset
 * @param {number} scale
 * @param {{w:number,h:number}} fitSize kích thước ảnh lúc vừa khung
 * @param {{w:number,h:number}} container kích thước khung xem
 */
export function clampOffset(offset, scale, fitSize, container) {
  const maxX = Math.max(0, (fitSize.w * scale - container.w) / 2)
  const maxY = Math.max(0, (fitSize.h * scale - container.h) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  }
}

/** Chỉ số ảnh hợp lệ, quấn vòng (ảnh cuối → ảnh đầu). */
export function wrapIndex(index, length) {
  if (!Number.isFinite(length) || length <= 0) return 0
  const safe = Number.isFinite(index) ? Math.trunc(index) : 0
  return ((safe % length) + length) % length
}

/** Khoảng cách giữa hai điểm (dùng cho thao tác chụm hai ngón). */
export function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Trung điểm của hai điểm. */
export function midpointOf(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}
