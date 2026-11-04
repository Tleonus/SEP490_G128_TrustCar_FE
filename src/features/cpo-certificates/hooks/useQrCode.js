import { useEffect, useState } from 'react'
import { generateQrPngDataUrl, generateQrSvg, svgToDataUrl } from '../utils/qrEngine'

/**
 * Sinh QR (PNG + SVG) cho một URL; tự sinh lại khi URL đổi, bỏ kết quả cũ nếu URL đã đổi giữa chừng.
 * @param {string|null} url  null → không sinh (xe không đủ điều kiện hoặc cấu hình sai).
 */
export function useQrCode(url) {
  const [state, setState] = useState({ pngDataUrl: null, svg: null, svgDataUrl: null, loading: false, error: null })

  useEffect(() => {
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ pngDataUrl: null, svg: null, svgDataUrl: null, loading: false, error: null })
      return undefined
    }
    let active = true
    setState((prev) => ({ ...prev, loading: true, error: null }))
    Promise.all([generateQrPngDataUrl(url), generateQrSvg(url)])
      .then(([pngDataUrl, svg]) => {
        if (active) setState({ pngDataUrl, svg, svgDataUrl: svgToDataUrl(svg), loading: false, error: null })
      })
      .catch(() => {
        if (active) setState({ pngDataUrl: null, svg: null, svgDataUrl: null, loading: false, error: 'Không thể tạo mã QR.' })
      })
    return () => {
      active = false
    }
  }, [url])

  return state
}
