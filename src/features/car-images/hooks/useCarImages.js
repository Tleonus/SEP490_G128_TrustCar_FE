/**
 * Trạng thái gallery ảnh của một xe trong modal "Nhập ảnh xe".
 *
 * - Danh sách ảnh ban đầu lấy từ dòng đang chọn ở bảng kho xe (GET /manage/cars trả kèm images[]),
 *   nên mở modal không tốn thêm request.
 * - Upload trả về images[] mới của xe; DELETE cũng vậy — luôn ghi đè bằng dữ liệu Backend trả về
 *   thay vì tự sửa mảng cục bộ, để ảnh chính/display order khớp server.
 */

import { useCallback, useMemo, useState } from 'react'
import { deleteCarImage, uploadCarImages } from '../api/carImageApi'
import { carImageErrorMessage } from '../utils/carImageErrors'
import { validateImageFiles } from '../utils/validateImageFiles'
import { MAX_IMAGES_PER_CAR } from '../constants/carImageConstants'
import { sortCarImages } from '../../../utils/car'

export function useCarImages(carId, initialImages) {
  const [images, setImages] = useState(() => sortCarImages(initialImages))
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [errors, setErrors] = useState([])

  const canUploadMore = images.length < MAX_IMAGES_PER_CAR
  const primaryImage = useMemo(
    () => images.find((image) => image?.isPrimary) ?? images[0] ?? null,
    [images],
  )

  const clearErrors = useCallback(() => setErrors([]), [])

  /**
   * Tải ảnh lên. Trả về kết quả để modal quyết định thông báo / chọn ảnh vừa thêm.
   * @param {File[]} files
   * @returns {Promise<{ ok: boolean, added: Array, errors: string[] }>}
   */
  const upload = useCallback(async (files) => {
    if (uploading) return { ok: false, added: [], errors: [] }

    const { accepted, errors: validationErrors } = validateImageFiles(files, {
      currentCount: images.length,
    })

    if (!accepted.length) {
      setErrors(validationErrors)
      return { ok: false, added: [], errors: validationErrors }
    }

    setUploading(true)
    setErrors(validationErrors)
    try {
      const before = new Set(images.map((image) => image.url))
      const nextImages = await uploadCarImages(carId, accepted, {
        // Xe chưa có ảnh chính nào thì lấy ảnh đầu tiên làm ảnh chính (Backend tự bỏ qua nếu đã có).
        setFirstAsPrimary: !images.some((image) => image?.isPrimary),
      })
      const sorted = sortCarImages(nextImages)
      setImages(sorted)
      const added = sorted.filter((image) => !before.has(image.url))
      return { ok: true, added, errors: validationErrors }
    } catch (err) {
      const message = carImageErrorMessage(err, 'Không tải được ảnh lên.')
      setErrors([message])
      return { ok: false, added: [], errors: [message] }
    } finally {
      setUploading(false)
    }
  }, [carId, images, uploading])

  /**
   * Xoá một ảnh khỏi gallery.
   * @param {object} image
   */
  const remove = useCallback(async (image) => {
    const imageId = image?._id
    if (!imageId || deletingId) return { ok: false }
    setDeletingId(imageId)
    setErrors([])
    try {
      const nextImages = await deleteCarImage(carId, imageId)
      setImages(sortCarImages(nextImages))
      return { ok: true }
    } catch (err) {
      const message = carImageErrorMessage(err, 'Không xoá được ảnh.')
      setErrors([message])
      return { ok: false, message }
    } finally {
      setDeletingId(null)
    }
  }, [carId, deletingId])

  return {
    images,
    primaryImage,
    total: images.length,
    canUploadMore,
    uploading,
    deletingId,
    errors,
    clearErrors,
    upload,
    remove,
  }
}

export default useCarImages
