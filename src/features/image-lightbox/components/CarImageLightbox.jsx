/**
 * KAN-89 – Lightbox xem ảnh xe: mở lớn toàn màn hình, phóng to/thu nhỏ, kéo để xem chi tiết,
 * chuyển ảnh qua lại. Chỉ dùng Frontend, không gọi API nào — nhận mảng ảnh từ trang gọi.
 *
 * Cách dùng: chỉ mount khi cần mở (`{open && <CarImageLightbox ... />}`) để state zoom/ảnh
 * luôn khởi tạo lại từ `index` mỗi lần mở.
 *
 * Điều khiển:
 *  - Cuộn chuột hoặc nút +/− để zoom quanh con trỏ; nháy đúp để phóng to/thu về.
 *  - Kéo chuột (hoặc một ngón) để di chuyển khi đã zoom; chụm hai ngón trên thiết bị cảm ứng.
 *  - ← → chuyển ảnh, Esc đóng, 0 đưa về 100%.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CloseOutlined,
  LeftOutlined,
  MinusOutlined,
  OneToOneOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import {
  clampOffset,
  clampZoom,
  distanceBetween,
  fitSizeOf,
  midpointOf,
  wrapIndex,
  zoomAtPoint,
} from '../utils/lightboxMath'
import { DOUBLE_CLICK_ZOOM, MAX_ZOOM, MIN_ZOOM, WHEEL_STEP, ZOOM_STEP } from '../constants/lightboxConstants'
import styles from '../styles/CarImageLightbox.module.css'

const RESET_VIEW = { scale: MIN_ZOOM, offset: { x: 0, y: 0 } }

export default function CarImageLightbox({ images, index = 0, onClose, onIndexChange }) {
  const list = Array.isArray(images) ? images.filter((item) => item?.url) : []
  const total = list.length

  const [active, setActive] = useState(() => wrapIndex(index, total))
  const [view, setView] = useState(RESET_VIEW)
  const [loaded, setLoaded] = useState(false)

  const stageRef = useRef(null)
  const overlayRef = useRef(null)
  const naturalRef = useRef({ w: 0, h: 0 })
  // Listener wheel gắn native đọc state qua ref; ref chỉ được ghi trong callback/effect.
  const viewRef = useRef(RESET_VIEW)
  const activeRef = useRef(wrapIndex(index, total))
  const handlersRef = useRef({})
  const gesturesRef = useRef({
    pointers: new Map(),
    mode: null,
    startOffset: { x: 0, y: 0 },
    startPoint: { x: 0, y: 0 },
    startDistance: 0,
    startScale: 1,
    startMid: { x: 0, y: 0 },
  })

  const applyView = useCallback((next) => {
    viewRef.current = next
    setView(next)
  }, [])

  const resetView = useCallback(() => applyView(RESET_VIEW), [applyView])

  /** Kích thước khung xem + kích thước ảnh lúc vừa khung. */
  const measure = useCallback(() => {
    const stage = stageRef.current
    if (!stage) return null
    const rect = stage.getBoundingClientRect()
    const container = { w: rect.width, h: rect.height }
    return { rect, container, fit: fitSizeOf(naturalRef.current, container) }
  }, [])

  /** Đưa toạ độ màn hình về toạ độ so với tâm khung xem. */
  const pointOf = useCallback((clientX, clientY, rect) => ({
    x: clientX - rect.left - rect.width / 2,
    y: clientY - rect.top - rect.height / 2,
  }), [])

  const zoomTo = useCallback((nextScale, point = { x: 0, y: 0 }) => {
    const metrics = measure()
    if (!metrics) return
    const current = viewRef.current
    const target = clampZoom(nextScale)
    if (target === current.scale) return
    const next = zoomAtPoint({ scale: current.scale, offset: current.offset, point, nextScale: target })
    applyView({
      scale: next.scale,
      offset: clampOffset(next.offset, next.scale, metrics.fit, metrics.container),
    })
  }, [applyView, measure])

  const zoomBy = useCallback((delta) => zoomTo(viewRef.current.scale + delta), [zoomTo])

  const goTo = useCallback((nextIndex) => {
    if (!total) return
    const next = wrapIndex(nextIndex, total)
    activeRef.current = next
    setActive(next)
    resetView()
    setLoaded(false)
    naturalRef.current = { w: 0, h: 0 }
    onIndexChange?.(next)
  }, [onIndexChange, resetView, total])

  const goPrev = useCallback(() => goTo(activeRef.current - 1), [goTo])
  const goNext = useCallback(() => goTo(activeRef.current + 1), [goTo])

  // Khoá cuộn nền + giữ/khôi phục focus khi lightbox mở.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    overlayRef.current?.focus?.()
    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus?.()
    }
  }, [])

  // Phím tắt. Ghi handler vào ref sau mỗi render để listener chỉ cần gắn một lần.
  useEffect(() => {
    handlersRef.current = { onClose, goPrev, goNext, zoomBy, resetView }
  })

  useEffect(() => {
    function handleKey(event) {
      const handlers = handlersRef.current
      if (event.key === 'Escape') {
        event.preventDefault()
        handlers.onClose?.()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlers.goPrev?.()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        handlers.goNext?.()
      } else if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        handlers.zoomBy?.(ZOOM_STEP)
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        handlers.zoomBy?.(-ZOOM_STEP)
      } else if (event.key === '0') {
        event.preventDefault()
        handlers.resetView?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Wheel phải gắn native với passive: false, nếu không không chặn được cuộn trang.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return undefined
    function handleWheel(event) {
      event.preventDefault()
      const metrics = measure()
      if (!metrics) return
      const current = viewRef.current
      const delta = event.deltaY < 0 ? WHEEL_STEP : -WHEEL_STEP
      const target = clampZoom(current.scale + delta)
      if (target === current.scale) return
      const point = pointOf(event.clientX, event.clientY, metrics.rect)
      const next = zoomAtPoint({ scale: current.scale, offset: current.offset, point, nextScale: target })
      applyView({
        scale: next.scale,
        offset: clampOffset(next.offset, next.scale, metrics.fit, metrics.container),
      })
    }
    stage.addEventListener('wheel', handleWheel, { passive: false })
    return () => stage.removeEventListener('wheel', handleWheel)
  }, [applyView, measure, pointOf])

  function handleImageLoad(event) {
    naturalRef.current = {
      w: event.currentTarget.naturalWidth || 0,
      h: event.currentTarget.naturalHeight || 0,
    }
    setLoaded(true)
  }

  function handleDoubleClick(event) {
    const metrics = measure()
    if (!metrics) return
    if (viewRef.current.scale > MIN_ZOOM) {
      resetView()
      return
    }
    const point = pointOf(event.clientX, event.clientY, metrics.rect)
    zoomTo(DOUBLE_CLICK_ZOOM, point)
  }

  // ── Kéo để di chuyển + chụm hai ngón ──────────────────────────────────────
  function handlePointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const gesture = gesturesRef.current
    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture?.(event.pointerId)

    const metrics = measure()
    if (!metrics) return

    if (gesture.pointers.size === 1) {
      gesture.mode = 'pan'
      gesture.startOffset = viewRef.current.offset
      gesture.startPoint = { x: event.clientX, y: event.clientY }
    } else if (gesture.pointers.size === 2) {
      const [a, b] = [...gesture.pointers.values()]
      gesture.mode = 'pinch'
      gesture.startDistance = distanceBetween(a, b) || 1
      gesture.startScale = viewRef.current.scale
      gesture.startOffset = viewRef.current.offset
      const mid = midpointOf(a, b)
      gesture.startMid = pointOf(mid.x, mid.y, metrics.rect)
    }
  }

  function handlePointerMove(event) {
    const gesture = gesturesRef.current
    if (!gesture.pointers.has(event.pointerId)) return
    gesture.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const metrics = measure()
    if (!metrics) return

    if (gesture.mode === 'pinch' && gesture.pointers.size === 2) {
      const [a, b] = [...gesture.pointers.values()]
      const ratio = distanceBetween(a, b) / (gesture.startDistance || 1)
      const target = clampZoom(gesture.startScale * ratio)
      const next = zoomAtPoint({
        scale: gesture.startScale,
        offset: gesture.startOffset,
        point: gesture.startMid,
        nextScale: target,
      })
      applyView({
        scale: next.scale,
        offset: clampOffset(next.offset, next.scale, metrics.fit, metrics.container),
      })
      return
    }

    if (gesture.mode === 'pan' && gesture.pointers.size === 1) {
      if (viewRef.current.scale <= MIN_ZOOM) return
      const next = {
        x: gesture.startOffset.x + (event.clientX - gesture.startPoint.x),
        y: gesture.startOffset.y + (event.clientY - gesture.startPoint.y),
      }
      applyView({
        scale: viewRef.current.scale,
        offset: clampOffset(next, viewRef.current.scale, metrics.fit, metrics.container),
      })
    }
  }

  function handlePointerEnd(event) {
    const gesture = gesturesRef.current
    gesture.pointers.delete(event.pointerId)
    event.currentTarget.releasePointerCapture?.(event.pointerId)

    if (gesture.pointers.size === 1) {
      const [only] = [...gesture.pointers.values()]
      gesture.mode = 'pan'
      gesture.startOffset = viewRef.current.offset
      gesture.startPoint = only
    } else if (gesture.pointers.size === 0) {
      gesture.mode = null
    }
  }

  if (total === 0) return null

  const current = list[active]
  const zoomPercent = Math.round(view.scale * 100)
  const zoomed = view.scale > MIN_ZOOM

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh xe"
      ref={overlayRef}
      tabIndex={-1}
    >
      <header className={styles.toolbar}>
        <div className={styles.heading}>
          <strong className={styles.title}>{current?.caption || 'Hình ảnh xe'}</strong>
          <span className={styles.counter} aria-live="polite">
            {active + 1} / {total}
          </span>
        </div>

        <div className={styles.tools}>
          <span className={styles.zoomValue} aria-live="polite">{zoomPercent}%</span>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => zoomBy(-ZOOM_STEP)}
            disabled={!zoomed}
            aria-label="Thu nhỏ ảnh"
            title="Thu nhỏ (−)"
          >
            <MinusOutlined />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={view.scale >= MAX_ZOOM}
            aria-label="Phóng to ảnh"
            title="Phóng to (+)"
          >
            <PlusOutlined />
          </button>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={resetView}
            disabled={!zoomed}
            aria-label="Đưa ảnh về kích thước vừa khung"
            title="Vừa khung (0)"
          >
            <OneToOneOutlined />
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${styles.closeBtn}`}
            onClick={onClose}
            aria-label="Đóng cửa sổ xem ảnh"
            title="Đóng (Esc)"
          >
            <CloseOutlined />
          </button>
        </div>
      </header>

      <div
        className={styles.stage}
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onDoubleClick={handleDoubleClick}
        data-zoomed={zoomed || undefined}
      >
        <img
          key={current?.url}
          src={current?.url}
          alt={current?.caption || 'Ảnh xe phóng to'}
          className={styles.image}
          style={{
            transform: `translate(${view.offset.x}px, ${view.offset.y}px) scale(${view.scale})`,
            opacity: loaded ? 1 : 0,
          }}
          draggable={false}
          onLoad={handleImageLoad}
          // Ảnh lỗi vẫn hiện khung alt thay vì để trống
          onError={() => setLoaded(true)}
        />

        {!loaded && <span className={styles.loading}>Đang tải ảnh...</span>}

        {total > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={goPrev}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Ảnh trước"
            >
              <LeftOutlined />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={goNext}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Ảnh tiếp theo"
            >
              <RightOutlined />
            </button>
          </>
        )}
      </div>

      <footer className={styles.footer}>
        {total > 1 && (
          <div className={styles.thumbs} role="tablist" aria-label="Chọn ảnh để xem">
            {list.map((image, idx) => (
              <button
                key={image._id || image.publicId || image.url}
                type="button"
                role="tab"
                aria-selected={idx === active}
                aria-label={`Xem ảnh ${idx + 1} trên ${total}`}
                className={`${styles.thumb} ${idx === active ? styles.thumbActive : ''}`}
                onClick={() => goTo(idx)}
              >
                <img src={image.url} alt="" />
              </button>
            ))}
          </div>
        )}
        <p className={styles.hint}>
          Cuộn chuột để phóng to · Kéo để di chuyển · ← → chuyển ảnh · Esc để đóng
        </p>
      </footer>
    </div>,
    document.body,
  )
}
