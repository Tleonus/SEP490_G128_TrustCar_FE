/**
 * KAN-69 – Trạng thái của modal gợi ý caption.
 *
 * Không gọi API trong useEffect: caption chỉ được tạo khi người dùng bấm nút, vì mỗi
 * lần gọi tốn một lượt trong hạn mức 20 lượt/ngày của Backend (CAPTION_DAILY_LIMIT).
 *
 * Mỗi lần bấm tạo lại, requestId tăng lên; phản hồi của request cũ bị bỏ qua để kết quả
 * hiển thị luôn khớp với lựa chọn mới nhất.
 */

import { useCallback, useRef, useState } from 'react'
import { suggestCaptions } from '../api/captionApi'
import { captionErrorMessage } from '../utils/captionErrors'
import { DEFAULT_LENGTH, DEFAULT_PRESET, TONE_PRESETS } from '../constants/captionConstants'

export function useCaptionSuggestions(carId) {
  const [presetId, setPresetId] = useState(DEFAULT_PRESET)
  const [length, setLength] = useState(DEFAULT_LENGTH)
  const [options, setOptions] = useState([])
  const [hashtags, setHashtags] = useState([])
  const [imageSuggestion, setImageSuggestion] = useState(null)
  const [source, setSource] = useState(null)
  const [cached, setCached] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRequested, setLastRequested] = useState(null)
  const requestIdRef = useRef(0)

  const preset = TONE_PRESETS.find((item) => item.presetId === presetId) ?? TONE_PRESETS[0]
  const lengthLocked = Boolean(preset.forcedLength)

  const generate = useCallback(async () => {
    if (!carId || loading) return { ok: false }
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setLoading(true)
    setError(null)
    const requested = { presetId, length: lengthLocked ? preset.forcedLength : length }
    setLastRequested(requested)

    try {
      const result = await suggestCaptions(carId, requested)
      if (requestIdRef.current !== requestId) return { ok: false }
      if (!result.captions.length) {
        setOptions([])
        setHashtags([])
        setImageSuggestion(result.imageSuggestion)
        setSource(result.source)
        setCached(false)
        setError('Backend không trả về phương án nào. Thử lại hoặc chọn giọng điệu khác.')
        return { ok: false }
      }
      setOptions(result.captions)
      setHashtags(result.hashtags)
      setImageSuggestion(result.imageSuggestion)
      setSource(result.source)
      setCached(result.cached)
      return { ok: true, count: result.captions.length }
    } catch (err) {
      if (requestIdRef.current !== requestId) return { ok: false }
      setOptions([])
      setHashtags([])
      setImageSuggestion(null)
      setSource(null)
      setCached(false)
      setError(captionErrorMessage(err))
      return { ok: false, message: captionErrorMessage(err) }
    } finally {
      if (requestIdRef.current === requestId) setLoading(false)
    }
  }, [carId, length, lengthLocked, loading, preset.forcedLength, presetId])

  const reset = useCallback(() => {
    requestIdRef.current += 1
    setOptions([])
    setHashtags([])
    setImageSuggestion(null)
    setSource(null)
    setCached(false)
    setError(null)
    setLoading(false)
  }, [])

  return {
    presetId,
    setPresetId,
    length,
    setLength,
    lengthLocked,
    options,
    hashtags,
    imageSuggestion,
    source,
    cached,
    loading,
    error,
    lastRequested,
    generate,
    reset,
  }
}

export default useCaptionSuggestions
