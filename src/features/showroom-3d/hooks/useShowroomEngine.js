import { useEffect, useRef, useState } from 'react'

const NO_WEBGL = 'Trình duyệt hoặc máy này không hỗ trợ WebGL 2 nên không mở được showroom 3D.'
const IMAGES = { logo: '/showroom-3d/env/logo-emblem.webp' }

function webglAvailable() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    gl?.getExtension('WEBGL_lose_context')?.loseContext() // chỉ thử, trả lại ngữ cảnh ngay
    return Boolean(gl)
  } catch {
    return false
  }
}

/**
 * Tạo engine 3D trên canvas (tải lười three.js), giải phóng khi rời trang.
 * `handlers` luôn đọc bản mới nhất qua ref nên không phải tạo lại engine.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F13
 */
export function useShowroomEngine(canvasRef, handlers) {
  const handlersRef = useRef(handlers)
  const [engine, setEngine] = useState(null)
  const [supported] = useState(webglAvailable)
  const [error, setError] = useState(supported ? null : NO_WEBGL)

  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (!supported) return undefined
    let alive = true
    let instance = null
    const on = new Proxy({}, { get: (_, k) => (...a) => handlersRef.current?.[k]?.(...a) })
    import('../three/engine')
      .then(async ({ ShowroomEngine }) => {
        if (!alive) return
        instance = new ShowroomEngine(canvasRef.current, on)
        await instance.init(IMAGES)
        if (import.meta.env.DEV) window.__showroom = instance // chỉ để kiểm thử khi chạy dev
        if (alive) setEngine(instance)
      })
      .catch(() => alive && setError('Không dựng được showroom 3D. Vui lòng tải lại trang.'))
    return () => {
      alive = false
      instance?.dispose()
    }
  }, [canvasRef, supported])

  return { engine, error }
}
