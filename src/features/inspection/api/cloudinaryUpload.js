/**
 * KAN-55 – Upload ảnh bằng chứng thẳng lên Cloudinary bằng chữ ký do Backend cấp.
 *
 * Backend (inspectionMediaService.buildUploadSignature) ký trên đúng 3 tham số
 * { timestamp, folder, allowed_formats } và trả về { cloudName, apiKey, timestamp,
 * signature, folder, allowedFormats }. Ảnh phải nằm trong thư mục
 * `trustcar/inspections/<inspectionId>` thì Backend mới chấp nhận khi lưu/gửi biên bản
 * (isInspectionImageUrl), nên FE không được đổi `folder`.
 *
 * Dùng axios trần (không phải instance `services/api`) vì đây là host khác:
 * không gắn Bearer token của TrustCar và không đi qua interceptor refresh token.
 */

import axios from 'axios'

const CLOUDINARY_ENDPOINT = (cloudName) => `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`

/** Cloudinary từ chối chữ ký cũ hơn 1 giờ; làm mới sớm hơn để an toàn. */
const SIGNATURE_TTL_MS = 30 * 60 * 1000

/** Giới hạn FE: 10 MB/ảnh, đúng định dạng BE cho phép. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/**
 * Kiểm tra file trước khi upload để báo lỗi sớm, không đợi Cloudinary từ chối.
 * @returns {string|null} thông báo lỗi tiếng Việt, null nếu file hợp lệ
 */
export function validateEvidenceFile(file, allowedFormats = 'jpg,png,webp') {
  if (!file) return 'Không đọc được file ảnh.'
  const formats = String(allowedFormats || '')
    .split(',')
    .map((format) => format.trim().toLowerCase())
    .filter(Boolean)
  const extension = String(file.name || '').split('.').pop()?.toLowerCase() || ''
  const mimeOk = /^image\/(jpeg|png|webp)$/.test(file.type || '')
  const extensionOk = formats.length === 0 || formats.includes(extension === 'jpeg' ? 'jpg' : extension)
  if (!mimeOk && !extensionOk) {
    return `Chỉ chấp nhận ảnh ${formats.join(', ').toUpperCase() || 'JPG, PNG, WEBP'}.`
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Ảnh "${file.name}" vượt quá ${Math.round(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`
  }
  return null
}

/**
 * Upload một file theo chữ ký đã cấp.
 * @param {File} file
 * @param {{cloudName:string, apiKey:string, timestamp:number, signature:string, folder:string, allowedFormats:string}} signature
 * @param {{ onProgress?: (percent:number)=>void, signal?: AbortSignal }} [options]
 * @returns {Promise<{ url: string, publicId: string, folder: string }>}
 */
export async function uploadEvidencePhoto(file, signature, { onProgress, signal } = {}) {
  if (!signature?.cloudName || !signature?.signature) {
    throw new Error('Chữ ký upload không hợp lệ. Vui lòng thử lại.')
  }

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', signature.apiKey)
  form.append('timestamp', String(signature.timestamp))
  form.append('signature', signature.signature)
  // Hai tham số đã được Backend ký — phải gửi lại đúng như vậy.
  form.append('folder', signature.folder)
  if (signature.allowedFormats) form.append('allowed_formats', signature.allowedFormats)

  const { data } = await axios.post(CLOUDINARY_ENDPOINT(signature.cloudName), form, {
    signal,
    onUploadProgress: (event) => {
      if (onProgress && event.total) onProgress(Math.round((event.loaded * 100) / event.total))
    },
  })

  const url = data?.secure_url || data?.url
  if (!url) throw new Error('Cloudinary không trả về URL ảnh.')
  return { url: String(url), publicId: data?.public_id || null, folder: signature.folder }
}

/**
 * Bộ nhớ tạm chữ ký: một lần lấy chữ ký dùng cho nhiều ảnh, tự làm mới khi sắp hết hạn.
 * Backend chỉ cấp chữ ký cho biên bản ĐANG MỞ (loadDraft), nên khi biên bản đã gửi
 * mọi lời gọi xin chữ ký mới sẽ nhận 409 — vì vậy phải invalidate() sau khi submit.
 * @param {() => Promise<object>} fetchSignature
 */
export function createSignatureCache(fetchSignature) {
  let cached = null
  let obtainedAt = 0

  const isFresh = () => {
    if (!cached) return false
    if (Date.now() - obtainedAt > SIGNATURE_TTL_MS) return false
    // Chữ ký Cloudinary sống 1 giờ tính từ timestamp trong chữ ký.
    const signedAt = Number(cached.timestamp) * 1000
    return Number.isFinite(signedAt) && Date.now() - signedAt < SIGNATURE_TTL_MS
  }

  return {
    async get() {
      if (isFresh()) return cached
      cached = await fetchSignature()
      obtainedAt = Date.now()
      return cached
    },
    invalidate() {
      cached = null
      obtainedAt = 0
    },
  }
}

/**
 * URL ảnh có đúng là ảnh upload gốc nằm trong thư mục của biên bản này không.
 * Backend từ chối (422 VALIDATION_ERROR) mọi URL ngoài thư mục đó, nên FE kiểm tra
 * trước để không lưu nhầm ảnh ngoài luồng vào biên bản.
 */
export function isInspectionFolderUrl(url, inspectionId, folderRoot = 'trustcar/inspections') {
  if (typeof url !== 'string' || !inspectionId) return false
  const escaped = String(folderRoot).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = `^https://res\\.cloudinary\\.com/[^/]+/image/upload/(?:v\\d+/)?${escaped}/${inspectionId}/[^/?#\\s]+$`
  return new RegExp(pattern).test(url)
}
