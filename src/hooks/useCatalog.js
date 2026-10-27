import { useEffect, useState } from 'react'
import { getBrands, getCarModels } from '../services/brandService'

export function useBrands() {
  const [brands, setBrands] = useState([])

  useEffect(() => {
    let active = true
    getBrands().then((data) => {
      if (active) setBrands(data)
    })
    return () => {
      active = false
    }
  }, [])

  return brands
}

export function useCarModels(brandId) {
  const [models, setModels] = useState([])

  useEffect(() => {
    let active = true
    if (!brandId) return undefined
    getCarModels(brandId).then((data) => {
      if (active) setModels(data)
    })
    return () => {
      active = false
    }
  }, [brandId])

  return brandId ? models : []
}
