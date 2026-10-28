export function getCarTitle(car) {
  if (!car) return ''
  return [car.make, car.model, car.variant].filter(Boolean).join(' ')
}

export function sortCarImages(images = []) {
  return [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
}

export function getCoverImage(car) {
  return sortCarImages(car?.images)[0]
}
