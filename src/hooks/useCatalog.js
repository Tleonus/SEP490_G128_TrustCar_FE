import { useEffect, useState } from 'react'
import { getBrands } from '../services/brandService'

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
