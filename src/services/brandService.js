import api from './api'
import { BRANDS } from '../mock/brands'

// Xác nhận với Backend: GET /brands -> [{ id, name, logoUrl }]
const USE_MOCK = true

export async function getBrands() {
  if (USE_MOCK) {
    return Promise.resolve(BRANDS)
  }
  const { data } = await api.get('/brands')
  return data
}
