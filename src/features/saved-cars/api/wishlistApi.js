import api from '../../../services/api'

function unwrap(data) {
  return data?.data ?? data
}

export async function getWishlist(params = { page: 1, limit: 100 }) {
  const { data } = await api.get('/customer/wishlist', { params })
  return {
    items: data?.data ?? [],
    meta: data?.meta ?? {},
  }
}

export async function syncGuestWishlist(carIds) {
  const { data } = await api.post('/customer/wishlist/sync', { carIds, priceAlertEnabled: true })
  return unwrap(data)
}

export async function saveCarToWishlist(carId) {
  const { data } = await api.post('/customer/wishlist', { carId, priceAlertEnabled: true })
  return unwrap(data)
}

export async function removeCarFromWishlist(carId) {
  const { data } = await api.delete(`/customer/wishlist/${encodeURIComponent(carId)}`)
  return unwrap(data)
}

export async function setWishlistAlert(carId, priceAlertEnabled) {
  const { data } = await api.patch(`/customer/wishlist/${encodeURIComponent(carId)}/alert`, { priceAlertEnabled })
  return unwrap(data)
}
