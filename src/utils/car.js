export function getCarTitle(car) {
  return [car.brand?.brand_name, car.model?.model_name, car.variant].filter(Boolean).join(' ')
}

export function sortCarImages(images = []) {
  return [...images].sort((a, b) => {
    if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
    return a.display_order - b.display_order
  })
}

export function getCoverImage(car) {
  return sortCarImages(car.images)[0]
}
