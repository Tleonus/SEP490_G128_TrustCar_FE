import { Box3, Group, SRGBColorSpace, TextureLoader, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export const ENV_URL = '/showroom-3d/env'

const gltf = new GLTFLoader()
gltf.setMeshoptDecoder(MeshoptDecoder)
const textures = new TextureLoader()

/** Tải GLB, trả về scene gốc. `onProgress(0..1)` khi máy chủ báo kích thước. */
export function loadGLB(url, onProgress) {
  return new Promise((resolve, reject) => {
    gltf.load(
      url,
      (g) => resolve(g.scene),
      (e) => onProgress && e.total && onProgress(e.loaded / e.total),
      reject,
    )
  })
}

export function loadTexture(url) {
  return new Promise((resolve, reject) => {
    textures.load(url, (t) => {
      t.colorSpace = SRGBColorSpace
      t.anisotropy = 8
      resolve(t)
    }, undefined, reject)
  })
}

/** Bật bóng đổ cho mọi mesh. */
export function castShadows(root, cast = true, receive = true) {
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = cast
      o.receiveShadow = receive
    }
  })
  return root
}

/**
 * Bọc mô hình vào một Group đã chuẩn hóa: đáy chạm y = 0, tâm ở gốc, kích thước ngang lớn nhất = `size`.
 * Mô hình AI có tỉ lệ và gốc tùy ý, nên phải đo hộp bao sau khi đã áp phép biến đổi của file.
 * `heightScale` cho phép dẹt lại theo trục đứng (kệ xoay).
 */
export function normalize(root, size, heightScale = 1) {
  root.updateMatrixWorld(true)
  const box = new Box3().setFromObject(root)
  const dim = box.getSize(new Vector3())
  const center = box.getCenter(new Vector3())
  const k = size / Math.max(dim.x, dim.z)
  const holder = new Group()
  root.position.sub(new Vector3(center.x, box.min.y, center.z))
  holder.add(root)
  holder.scale.set(k, k * heightScale, k)
  holder.userData.size = { x: dim.x * k, y: dim.y * k * heightScale, z: dim.z * k }
  holder.userData.longAxis = dim.x >= dim.z ? 'x' : 'z'
  return holder
}

export function disposeTree(root) {
  root.traverse((o) => {
    if (!o.isMesh) return
    o.geometry?.dispose()
    const mats = Array.isArray(o.material) ? o.material : [o.material]
    for (const m of mats) {
      if (!m) continue
      for (const v of Object.values(m)) if (v && v.isTexture) v.dispose()
      m.dispose()
    }
  })
}
