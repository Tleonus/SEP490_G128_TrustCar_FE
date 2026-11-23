// Chuẩn bị tài nguyên cho Showroom 3D: nén GLB gốc (rất nặng) và ảnh xe thành bản nhẹ cho web.
//
//   node scripts/showroom-3d/prepare-assets.mjs                 # kệ xoay + nội thất + mọi xe
//   node scripts/showroom-3d/prepare-assets.mjs --cars          # chỉ xe (mô hình + ảnh)
//   node scripts/showroom-3d/prepare-assets.mjs --src="D:/..."  # đổi thư mục nguồn
//
// Xe: mỗi xe một thư mục trong `gg/xe/`, TÊN THƯ MỤC = mã xe trong database (TC-2026-0001, không phân biệt hoa
// thường). Trong đó: 1 file .glb (tên gì cũng được) + ảnh .jpg/.jpeg/.png/.webp (thứ tự theo số trong tên file).
// Có cấu hình scripts/showroom-3d/blender/cars/<MÃ>.json thì tách bộ phận xe bằng Blender trước (xem split_car.py).
// Kết quả:
//   public/showroom-3d/cars/<MÃ>.glb            mô hình đã nén (meshopt + webp)
//   public/showroom-3d/cars/<MÃ>/<n>.webp       ảnh đã thu về 1200 px
//   public/showroom-3d/cars/manifest.json       { "<MÃ>": { model: true|false, photos: [...] } }
// Cần mạng lần đầu: `npx` tải @gltf-transform/cli và sharp-cli (công cụ dòng lệnh, không thêm vào package.json).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const SRC = args.src || 'D:/Ky 9/Đồ án/3D/glb'
const OUT = path.resolve('public/showroom-3d')
const CODE = /^TC-\d{4}-\d{4}$/i
const PHOTO = /\.(jpe?g|png|webp)$/i

const ENV_ITEMS = [
  { from: 'tron_colored.glb', to: 'turntable.glb', ratio: 0.3, tex: 1024 },
  { from: 'gg/noithat/armchair.glb', to: 'armchair.glb', ratio: 0.6, tex: 1024 },
  { from: 'gg/noithat/coofeetable.glb', to: 'coffee-table.glb', ratio: 0.6, tex: 1024 },
  // đồ trang trí sảnh + xưởng (studio màu sơn)
  // chậu cây / đèn cây bản noithat/ (không màu, texture xám) đã bỏ: dùng bản noithat1/ có màu
  { from: 'gg/noithat1/indoorplant.glb', to: 'plant2.glb', ratio: 0.2, tex: 512 },
  { from: 'gg/noithat1/floorlamp.glb', to: 'floor-lamp2.glb', ratio: 0.2, tex: 512 },
  { from: 'gg/noithattang2/phonghop/credenza.glb', to: 'credenza.glb', ratio: 0.1, tex: 512 },
  { from: 'gg/them/ngoaitroi/workbench.glb', to: 'workbench.glb', ratio: 0.02, tex: 512 },
  { from: 'gg/them/ngoaitroi/tool_trolley.glb', to: 'tool-trolley.glb', ratio: 0.02, tex: 512 },
  { from: 'gg/them/ngoaitroi/tool_cabinet_new_standalone.glb', to: 'tool-cabinet.glb', ratio: 0.02, tex: 512 },
  { from: 'gg/them/xuong/air_compressor.glb', to: 'air-compressor.glb', ratio: 0.02, tex: 512 },
  { from: 'gg/them/chamsoc/pressure_washer.glb', to: 'pressure-washer.glb', ratio: 0.02, tex: 512 },
  { from: 'gg/them/chamsoc/detailing.glb', to: 'detailing-cart.glb', ratio: 0.02, tex: 512 },
  { from: 'gg/them/kiemtra/diagnostic.glb', to: 'diagnostic.glb', ratio: 0.02, tex: 512 },
  { from: 'gg/them/kiemtra/headlight.glb', to: 'headlight-tester.glb', ratio: 0.02, tex: 512 },
]
const ONLY = args.env ? new Set(String(args.env).split(',')) : null // --env=a.glb,b.glb: chỉ làm các file này

/** Chạy công cụ qua npx. Windows cần shell để chạy npx.cmd; đường dẫn có dấu cách phải đặt trong ngoặc kép. */
function npx(cli) {
  const win = process.platform === 'win32'
  const argv = win ? cli.map((a) => (/[\s*]/.test(a) ? `"${a}"` : a)) : cli
  execFileSync('npx', ['-y', ...argv], { stdio: ['ignore', 'ignore', 'inherit'], shell: win })
}

const mb = (f) => (fs.statSync(f).size / 1e6).toFixed(1)

function optimize(input, output, { ratio, tex }) {
  fs.mkdirSync(path.dirname(output), { recursive: true })
  const simplify = ratio < 1 ? ['--simplify', 'true', '--simplify-ratio', String(ratio), '--simplify-error', '0.0005'] : ['--simplify', 'false']
  npx(['@gltf-transform/cli@4.5.1', 'optimize', input, output, '--compress', 'meshopt', '--texture-compress', 'webp',
    '--texture-size', String(tex), ...simplify])
  console.log(`${path.basename(input)} (${mb(input)} MB) -> ${path.relative(process.cwd(), output)} (${mb(output)} MB)`)
}

// Tách bộ phận xe bằng Blender (chạy nền) nếu có cấu hình scripts/showroom-3d/blender/cars/<MÃ>.json.
// Đường dẫn Blender đổi được bằng --blender="C:/.../blender.exe". Không có Blender/cấu hình thì nén thẳng file gốc.
const BLENDER = args.blender || 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe'
const SPLIT_DIR = path.resolve('scripts/showroom-3d/blender')

function splitParts(input, code) {
  const cfg = path.join(SPLIT_DIR, 'cars', `${code}.json`)
  if (!fs.existsSync(cfg) || !fs.existsSync(BLENDER)) return null
  const out = path.join(os.tmpdir(), `tc-split-${code}.glb`)
  const length = String(JSON.parse(fs.readFileSync(cfg, 'utf8')).length ?? 4.7)
  execFileSync(BLENDER, ['-b', '--factory-startup', '--python', path.join(SPLIT_DIR, 'split_car.py'), '--', input, out, length, cfg],
    { stdio: ['ignore', 'ignore', 'inherit'] })
  console.log(`${code}: đã tách bộ phận bằng Blender`)
  return out
}

/** Ảnh xe -> webp 1200 px, đặt tên lại theo thứ tự 1, 2, 3... Trả về đường dẫn web của các ảnh. */
function photos(dir, code) {
  const files = fs.readdirSync(dir).filter((f) => PHOTO.test(f))
    .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0) || a.localeCompare(b))
  const out = path.join(OUT, 'cars', code)
  fs.rmSync(out, { recursive: true, force: true })
  fs.mkdirSync(out, { recursive: true })
  return files.map((f, i) => {
    const target = path.join(out, `${i + 1}.webp`)
    npx(['sharp-cli@5.2.0', '-i', path.join(dir, f), '-o', target, '-f', 'webp', '-q', '75', 'resize', '1200'])
    return `/showroom-3d/cars/${code}/${i + 1}.webp`
  })
}

function carFolders(root) {
  if (!fs.existsSync(root)) return []
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && CODE.test(e.name))
    .map((e) => ({ dir: path.join(root, e.name), code: e.name.toUpperCase() }))
}

if (!('cars' in args)) {
  for (const it of ENV_ITEMS.filter((i) => !ONLY || ONLY.has(i.to))) optimize(path.join(SRC, it.from), path.join(OUT, 'env', it.to), it)
}
const manifest = {}
for (const { dir, code } of ONLY ? [] : carFolders(path.join(SRC, 'gg/xe'))) {
  const glb = fs.readdirSync(dir).find((f) => f.toLowerCase().endsWith('.glb'))
  if (glb) {
    const split = splitParts(path.join(dir, glb), code) // đã giảm lưới trong Blender -> không giảm thêm
    optimize(split ?? path.join(dir, glb), path.join(OUT, 'cars', `${code}.glb`), { ratio: split ? 1 : 0.25, tex: 2048 })
    if (split) fs.rmSync(split, { force: true })
  }
  manifest[code] = { model: Boolean(glb), photos: photos(dir, code) }
  // màu sơn thật của xe (khi texture AI sai màu, ví dụ bị De-light đổi màu): khai trong cấu hình Blender của xe
  const cfgFile = path.join(SPLIT_DIR, 'cars', code + '.json')
  const paint = fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')).paint_color : null
  if (paint) manifest[code].paint = paint
  console.log(`${code}: ${glb ? 'có mô hình' : 'chưa có mô hình'}, ${manifest[code].photos.length} ảnh`)
}
if (!ONLY) fs.writeFileSync(path.join(OUT, 'cars', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`Xong: ${Object.keys(manifest).length} xe -> public/showroom-3d/cars/manifest.json`)
