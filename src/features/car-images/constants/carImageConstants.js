/**
 * Giới hạn upload ảnh xe — lấy đúng theo Backend (TrustCar_BE):
 *  - middlewares/uploadMiddleware.js: 5 MB/file, tối đa 10 file mỗi request (field "images")
 *  - services/carService.js uploadCarImages: tối đa 20 ảnh/xe (GBR-15)
 *  - ALLOWED_MIME_TYPES: image/jpeg, image/png, image/webp
 */

export const MAX_FILE_BYTES = 5 * 1024 * 1024
export const MAX_FILES_PER_REQUEST = 10
export const MAX_IMAGES_PER_CAR = 20

export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ACCEPTED_IMAGE_TYPES = ACCEPTED_MIME_TYPES.join(',')
