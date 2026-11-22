import { describe, expect, it } from 'vitest'
import {
  clampOffset,
  clampZoom,
  distanceBetween,
  fitSizeOf,
  midpointOf,
  wrapIndex,
  zoomAtPoint,
} from './lightboxMath'
import { MAX_ZOOM, MIN_ZOOM } from '../constants/lightboxConstants'

describe('clampZoom', () => {
  it('kẹp trong khoảng cho phép', () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM)
    expect(clampZoom(99)).toBe(MAX_ZOOM)
    expect(clampZoom(2)).toBe(2)
  })

  it('giá trị không hợp lệ trả về mức nhỏ nhất', () => {
    expect(clampZoom(Number.NaN)).toBe(MIN_ZOOM)
    expect(clampZoom(undefined)).toBe(MIN_ZOOM)
  })
})

describe('fitSizeOf', () => {
  it('ảnh ngang vừa theo chiều rộng khung', () => {
    expect(fitSizeOf({ w: 1200, h: 600 }, { w: 600, h: 600 })).toEqual({ w: 600, h: 300 })
  })

  it('ảnh dọc vừa theo chiều cao khung', () => {
    expect(fitSizeOf({ w: 600, h: 1200 }, { w: 600, h: 600 })).toEqual({ w: 300, h: 600 })
  })

  it('không phóng to ảnh nhỏ hơn khung', () => {
    expect(fitSizeOf({ w: 200, h: 100 }, { w: 600, h: 600 })).toEqual({ w: 200, h: 100 })
  })

  it('thiếu kích thước thì trả về khung', () => {
    expect(fitSizeOf({ w: 0, h: 0 }, { w: 600, h: 400 })).toEqual({ w: 600, h: 400 })
  })
})

describe('zoomAtPoint', () => {
  it('zoom quanh tâm không đổi độ dời', () => {
    const result = zoomAtPoint({ scale: 1, offset: { x: 0, y: 0 }, point: { x: 0, y: 0 }, nextScale: 2 })
    expect(result.scale).toBe(2)
    expect(result.offset).toEqual({ x: 0, y: 0 })
  })

  it('giữ điểm dưới con trỏ đứng yên khi phóng to', () => {
    const point = { x: 100, y: 50 }
    const before = { scale: 1, offset: { x: 0, y: 0 } }
    // Toạ độ nội dung đang nằm dưới con trỏ
    const contentX = (point.x - before.offset.x) / before.scale
    const result = zoomAtPoint({ ...before, point, nextScale: 2 })
    const screenX = result.offset.x + result.scale * contentX
    expect(screenX).toBeCloseTo(point.x, 6)
  })

  it('không cho vượt quá giới hạn zoom', () => {
    const result = zoomAtPoint({ scale: 3.5, offset: { x: 0, y: 0 }, point: { x: 10, y: 10 }, nextScale: 50 })
    expect(result.scale).toBe(MAX_ZOOM)
  })
})

describe('clampOffset', () => {
  it('khoá về tâm khi ảnh vừa khung', () => {
    const offset = clampOffset({ x: 120, y: -80 }, 1, { w: 600, h: 300 }, { w: 600, h: 400 })
    expect(offset).toEqual({ x: 0, y: 0 })
  })

  it('cho phép kéo tới mép ảnh nhưng không xa hơn', () => {
    // fit 600x300, zoom 2 → ảnh 1200x600 trong khung 600x400
    const offset = clampOffset({ x: 9999, y: 9999 }, 2, { w: 600, h: 300 }, { w: 600, h: 400 })
    expect(offset).toEqual({ x: 300, y: 100 })
  })

  it('không đảo dấu offset hợp lệ', () => {
    const offset = clampOffset({ x: -120, y: -50 }, 2, { w: 600, h: 300 }, { w: 600, h: 400 })
    expect(offset).toEqual({ x: -120, y: -50 })
  })
})

describe('wrapIndex', () => {
  it('quấn vòng hai đầu', () => {
    expect(wrapIndex(2, 3)).toBe(2)
    expect(wrapIndex(3, 3)).toBe(0)
    expect(wrapIndex(-1, 3)).toBe(2)
  })

  it('danh sách rỗng trả về 0', () => {
    expect(wrapIndex(5, 0)).toBe(0)
  })
})

describe('hình học con trỏ', () => {
  it('tính khoảng cách và trung điểm', () => {
    expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(midpointOf({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 })
  })
})
