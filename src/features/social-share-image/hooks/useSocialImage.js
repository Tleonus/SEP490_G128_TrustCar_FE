/**
 * KAN-66 – Hook cho màn chọn ảnh chia sẻ: tải xe, chọn ảnh, upload ảnh mới, lưu.
 *
 * Ảnh đang chọn chỉ là trạng thái cục bộ cho đến khi bấm Lưu. Ảnh vừa upload được
 * thêm vào gallery ngay (Backend đã lưu vào images[]), nhưng chưa trở thành ảnh
 * chia sẻ cho đến khi lưu thành công.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getManagedCar, setSocialImage, uploadCarImage } from '../api/socialImageApi'
import { socialImageErrorMessage } from '../utils/socialImageErrors'
import { sortCarImages } from '../../../utils/car'
import { MAX_IMAGES_PER_CAR, MAX_UPLOAD_BYTES } from '../constants/socialImageConstants'

/** URL ảnh chia sẻ Backend đang lưu (nếu trường đã tồn tại). */
function storedSocialUrl(car) {
  const url = car?.socialImage?.url
  return typeof url === 'string' && url.trim() ? url.trim() : null
}

export function useSocialImage(carId) {
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    if (!carId) return undefined
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setLoadError(null)
    getManagedCar(carId)
      .then((detail) => {
        if (!active) return
        setCar(detail)
        setSelectedUrl(storedSocialUrl(detail))
      })
      .catch((err) => {
        if (active) setLoadError(socialImageErrorMessage(err, 'Không tải được thông tin xe.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [carId])

  const images = useMemo(() => sortCarImages(car?.images), [car])
  const savedUrl = storedSocialUrl(car)
  const isDirty = selectedUrl !== savedUrl
  const canUploadMore = images.length < MAX_IMAGES_PER_CAR

  const selectImage = useCallback((url) => {
    setActionError(null)
    setSelectedUrl(url)
  }, [])

  const uploadImage = useCallback(async (file) => {
    if (!file) return { ok: false }
    if (file.size > MAX_UPLOAD_BYTES) {
      const message = `Ảnh "${file.name}" vượt quá ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`
      setActionError(message)
      return { ok: false, message }
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type || '')) {
      const message = 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.'
      setActionError(message)
      return { ok: false, message }
    }
    setUploading(true)
    setActionError(null)
    try {
      const nextImages = await uploadCarImage(carId, file)
      const added = nextImages.find((image) => !images.some((current) => current.url === image.url))
      setCar((current) => (current ? { ...current, images: nextImages } : current))
      if (added?.url) setSelectedUrl(added.url)
      return { ok: true, url: added?.url || null }
    } catch (err) {
      const message = socialImageErrorMessage(err, 'Không tải được ảnh lên.')
      setActionError(message)
      return { ok: false, message }
    } finally {
      setUploading(false)
    }
  }, [carId, images])

  const save = useCallback(async () => {
    if (!selectedUrl || saving) return { ok: false }
    const image = images.find((item) => item.url === selectedUrl)
    setSaving(true)
    setActionError(null)
    try {
      const updated = await setSocialImage(carId, { url: selectedUrl, imageId: image?._id || null })
      setCar((current) => (current ? { ...current, ...(updated || {}), socialImage: { url: selectedUrl } } : current))
      return { ok: true }
    } catch (err) {
      const message = socialImageErrorMessage(err, 'Không lưu được ảnh chia sẻ.')
      setActionError(message)
      return { ok: false, message }
    } finally {
      setSaving(false)
    }
  }, [carId, images, saving, selectedUrl])

  return {
    car,
    images,
    loading,
    loadError,
    selectedUrl,
    savedUrl,
    isDirty,
    canUploadMore,
    uploading,
    saving,
    actionError,
    selectImage,
    uploadImage,
    save,
  }
}

export default useSocialImage
