import api from './api'
import { BRANDS } from '../mock/brands'
import { CAR_MODELS } from '../mock/carModels'
import { ACTIVE_STATUS } from '../utils/constants'

function warnFallback(context, error) {
  console.warn(`[brandService] Không gọi được Backend (${context}), đang dùng dữ liệu mẫu.`, error?.message || error)
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /brands?status=active -> Brand[] { brand_id, brand_name, logo, status }
export async function getBrands() {
  try {
    const { data } = await api.get('/brands', { params: { status: ACTIVE_STATUS } })
    return data
  } catch (error) {
    warnFallback('getBrands', error)
    return BRANDS.filter((b) => b.status === ACTIVE_STATUS)
  }
}

// --- CẦN BACKEND XÁC NHẬN ---
// GET /car-models?brand_id=&status=active -> CarModel[] { model_id, brand_id, model_name, body_type, status }
export async function getCarModels(brandId) {
  try {
    const { data } = await api.get('/car-models', { params: { brand_id: brandId, status: ACTIVE_STATUS } })
    return data
  } catch (error) {
    warnFallback('getCarModels', error)
    return CAR_MODELS.filter((m) => m.status === ACTIVE_STATUS && (!brandId || m.brand_id === brandId))
  }
}
