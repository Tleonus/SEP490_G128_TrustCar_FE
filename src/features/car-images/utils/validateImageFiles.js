/**
 * Kiểm tra file ảnh trước khi gửi lên Backend, để báo lỗi rõ ràng thay vì để request
 * bị 413/415 từ multer.
 */

import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_BYTES,
  MAX_FILES_PER_REQUEST,
  MAX_IMAGES_PER_CAR,
} from '../constants/carImageConstants'

const MB = 1024 * 1024

function formatMb(bytes) {
  return `${Math.round((bytes / MB) * 10) / 10} MB`
}

/**
 * Lọc file hợp lệ và gom các thông báo lỗi lại.
 * @param {File[]} files
 * @param {{ currentCount?: number, maxSelectable?: number }} [options]
 * @returns {{ accepted: File[], errors: string[] }}
 */
export function validateImageFiles(files, { currentCount = 0, maxSelectable = MAX_FILES_PER_REQUEST } = {}) {
  const list = Array.from(files ?? [])
  const errors = []
  const accepted = []
  let room = Math.max(0, MAX_IMAGES_PER_CAR - currentCount)
  let perRequest = Math.max(0, Math.min(maxSelectable, MAX_FILES_PER_REQUEST))

  if (room === 0) {
    return { accepted: [], errors: [`Xe đã đủ ${MAX_IMAGES_PER_CAR} ảnh, không thể tải thêm.`] }
  }

  for (const file of list) {
    if (perRequest === 0) {
      errors.push(`Mỗi lần chỉ tải được tối đa ${MAX_FILES_PER_REQUEST} ảnh.`)
      break
    }
    if (room === 0) {
      errors.push(`Xe chỉ còn nhận thêm ${MAX_IMAGES_PER_CAR - currentCount} ảnh (tối đa ${MAX_IMAGES_PER_CAR} ảnh/xe).`)
      break
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      errors.push(`"${file.name}" không phải ảnh JPG, PNG hoặc WEBP.`)
      continue
    }
    if (file.size > MAX_FILE_BYTES) {
      errors.push(`"${file.name}" nặng ${formatMb(file.size)}, vượt quá ${formatMb(MAX_FILE_BYTES)}/ảnh.`)
      continue
    }
    accepted.push(file)
    room -= 1
    perRequest -= 1
  }

  return { accepted, errors }
}
