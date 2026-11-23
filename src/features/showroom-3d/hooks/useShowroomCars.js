import { useEffect, useState } from 'react'
import { getCars } from '../../../services/carService'
import { findCarsWithModels, loadManifest, manifestPaint, manifestPhotos } from '../utils/modelAvailability'

const MAX_CARS = 100

/** Gắn ảnh thư mục xe (`showroomPhotos`) và màu sơn thật (`showroomPaint`) từ manifest vào xe. */
function withPhotos(cars, manifest) {
  return cars.map((c) => {
    const folder = manifestPhotos(manifest, c.vehicleCode)
    const paint = manifestPaint(manifest, c.vehicleCode)
    return { ...c, ...(folder.length && { showroomPhotos: folder }), ...(paint && { showroomPaint: paint }) }
  })
}

/**
 * Xe đang bán (API công khai), ảnh trong thư mục xe, và các xe đã có mô hình 3D.
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F05
 * @ears .sdd/features/showroom-3d/SPEC.md#REQ-F13
 */
export function useShowroomCars() {
  const [state, setState] = useState({ status: 'loading', cars: [], modelCars: [], error: null })

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [{ items }, manifest] = await Promise.all([getCars({ page: 1, limit: MAX_CARS }), loadManifest()])
        const cars = withPhotos(items, manifest)
        const modelCars = await findCarsWithModels(cars, fetch, manifest)
        if (alive) setState({ status: 'ready', cars, modelCars, error: null })
      } catch {
        if (alive) setState({ status: 'error', cars: [], modelCars: [], error: 'Không tải được danh sách xe. Vui lòng thử lại sau.' })
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  return state
}
