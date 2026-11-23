import { Raycaster, Vector2 } from 'three'

const ZOOM_GAIN = 0.0015
const SWIPE_GAIN = 0.0045
const CLICK_SLOP = 5
const KEY_TURN_PX = 60 // phím ← → xoay nhìn quanh tương đương kéo 60 px

function wheelDelta(e) {
  const k = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1
  return Math.max(-240, Math.min(240, e.deltaY * k))
}

/**
 * Chuột / cảm ứng / bàn phím của showroom.
 * - Cuộn chuột / chụm hai ngón: phóng to / thu nhỏ tại chỗ, về phía con trỏ (không đổi điểm dừng). Phím + - cũng vậy.
 * - Đi giữa các điểm dừng: phím ↑ ↓, PageUp / PageDown, Space, vuốt dọc một ngón, cột 01–04, nút "Tiếp theo".
 * - Kéo trên xe: xoay kệ xe. Kéo chỗ trống (hoặc phím ← →): xoay nhìn quanh tại chỗ.
 * - Bấm (không kéo) vào xe: chọn xe.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F04
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F06
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F14
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F20
 */
export function attachInput(canvas, engine) {
  const ray = new Raycaster()
  const ndc = new Vector2()
  let down = null
  const touches = new Map() // ngón tay đang chạm (để chụm phóng to)
  let pinch = null

  const ndcOf = (x, y) => {
    const r = canvas.getBoundingClientRect()
    return [((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1]
  }
  const zoom = (factor, x, y) => {
    const [nx, ny] = ndcOf(x, y)
    const cam = engine.camera
    engine.rig.zoomAt(factor, nx, ny, engine.baseFov(), cam.aspect)
    engine.wake()
  }

  const tableAt = (e) => {
    const r = canvas.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, engine.camera)
    return engine.stage.pick(ray)
  }

  const onWheel = (e) => {
    e.preventDefault()
    zoom(Math.exp(-wheelDelta(e) * ZOOM_GAIN), e.clientX, e.clientY)
  }

  const onKey = (e) => {
    if (e.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName)) return
    const z = { '+': 1.25, '=': 1.25, '-': 0.8 }[e.key]
    if (z) {
      const r = canvas.getBoundingClientRect()
      zoom(z, r.left + r.width / 2, r.top + r.height / 2)
      return
    }
    const turn = { ArrowLeft: -1, ArrowRight: 1 }[e.key]
    if (turn) {
      e.preventDefault()
      engine.rig.turn(turn * KEY_TURN_PX, 0)
      engine.wake()
      return
    }
    const next = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key]
    if (!next) return
    e.preventDefault()
    engine.goTo(engine.rig.stop + next)
  }

  const onDown = (e) => {
    if (e.pointerType === 'touch') touches.set(e.pointerId, [e.clientX, e.clientY])
    if (touches.size === 2) {
      // ngón thứ hai chạm xuống: bỏ thao tác một ngón, chuyển sang chụm phóng to
      if (down?.mode === 'rotate') down.hit.release()
      down = null
      const [a, b] = [...touches.values()]
      pinch = { dist: Math.hypot(a[0] - b[0], a[1] - b[1]) }
      return
    }
    down = { x: e.clientX, y: e.clientY, t: performance.now(), hit: tableAt(e), mode: null }
    canvas.setPointerCapture(e.pointerId)
  }

  const startMode = (e, dx, dy) => {
    if (down.hit) {
      down.mode = 'rotate'
      down.hit.grab()
    } else {
      // chạm màn hình vuốt dọc = đi điểm dừng; còn lại = xoay nhìn quanh
      down.mode = e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) ? 'swipe' : 'look'
    }
  }

  const onPinch = (e) => {
    touches.set(e.pointerId, [e.clientX, e.clientY])
    const [a, b] = [...touches.values()]
    const dist = Math.hypot(a[0] - b[0], a[1] - b[1])
    if (pinch.dist > 0) zoom(dist / pinch.dist, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
    pinch.dist = dist
  }

  const onMove = (e) => {
    if (pinch && touches.has(e.pointerId)) return onPinch(e)
    if (!down) {
      canvas.style.cursor = tableAt(e) ? 'pointer' : 'grab'
      return
    }
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    if (!down.mode && Math.hypot(dx, dy) > CLICK_SLOP) startMode(e, dx, dy)
    const now = performance.now()
    const ddx = dx - (down.lastDx ?? 0)
    const ddy = dy - (down.lastDy ?? 0)
    if (down.mode === 'rotate') down.hit.drag(ddx, (now - down.t) / 1000)
    if (down.mode === 'swipe') engine.rig.nudge(-ddy * SWIPE_GAIN)
    if (down.mode === 'look') engine.rig.turn(ddx, ddy)
    if (down.mode) canvas.style.cursor = 'grabbing'
    Object.assign(down, { lastDx: dx, lastDy: dy, t: now })
    engine.wake()
  }

  const onUp = (e) => {
    touches.delete(e.pointerId)
    if (touches.size < 2) pinch = null
    if (!down) return
    if (down.mode === 'rotate') down.hit.release()
    if (!down.mode && down.hit?.carData) engine.selectCar(down.hit.carData, true)
    canvas.style.cursor = 'grab'
    down = null
  }

  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  window.addEventListener('keydown', onKey)
  return () => {
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    canvas.removeEventListener('pointerup', onUp)
    canvas.removeEventListener('pointercancel', onUp)
    window.removeEventListener('keydown', onKey)
  }
}
