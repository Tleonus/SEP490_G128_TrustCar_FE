// Rendered into index.html by build-preview.mjs; PALETTES and CONTRAST are injected above this file.
const IMG = '../../../src/assets';
const cars = [
  { img: `${IMG}/cars/sedan1.jpg`, name: 'Toyota Camry 2.5Q 2021', meta: '42.000 km · Tự động · Xăng', price: '965.000.000 ₫', cpo: true },
  { img: `${IMG}/cars/suv1.jpg`, name: 'Mazda CX-5 2.0 Premium 2022', meta: '28.500 km · Tự động · Xăng', price: '799.000.000 ₫', cpo: false },
];
const tokenKeys = ['bg', 'surface', 'text', 'muted', 'primary', 'accent', 'accentText'];
const pick = (rows, pair) => rows.find((r) => r.pair === pair).ratio;

const frame = (p, mode) => {
  const t = p[mode];
  const vars = Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');
  const c = CONTRAST[p.id][mode];
  return `
  <section class="frame" style="${vars}">
    <div class="mode-label">${mode === 'light' ? 'Light' : 'Dark'}</div>
    <nav class="nav">
      <span class="logo">Trust<span>Car</span></span>
      <a class="active" href="#">Mua xe</a><a href="#">Định giá</a><a href="#">Showroom 3D</a>
      <span class="spacer"></span>
      <button class="btn btn-secondary btn-sm">Đăng nhập</button>
    </nav>
    <div class="hero" style="background-image:url('${IMG}/hero_slides/hero1.jpg')">
      <div class="hero-body">
        <h3>Xe đã kiểm định 160 điểm, giá minh bạch</h3>
        <p>Mỗi xe có hồ sơ kiểm tra và bảo hành 12 tháng.</p>
        <div class="row">
          <button class="btn btn-primary">Xem xe đang bán</button>
          <button class="btn btn-secondary">Đặt lịch xem xe</button>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="cards">
        ${cars.map((car) => `
        <article class="card">
          <img src="${car.img}" alt="">
          <div class="card-body">
            <div class="badges">${car.cpo ? '<span class="badge badge-cpo">Đã kiểm định</span>' : ''}<span class="badge">Hà Nội</span></div>
            <div class="card-title">${car.name}</div>
            <div class="card-meta">${car.meta}</div>
            <div class="price">${car.price}</div>
            <div class="row"><button class="btn btn-primary btn-sm">Đặt cọc</button><button class="btn btn-secondary btn-sm">So sánh</button></div>
          </div>
        </article>`).join('')}
      </div>
      <div class="row">
        <span class="status" style="color:var(--success)">● Còn xe</span>
        <span class="status" style="color:var(--warning)">● Đang giữ chỗ</span>
        <span class="status" style="color:var(--danger)">● Đã bán</span>
        <span class="spacer" style="flex:1"></span>
        <button class="btn btn-accent btn-sm">Nhận báo giá</button>
      </div>
      <div class="panel">
        <div class="swatches">
          ${tokenKeys.map((k) => `<div><div class="sw" style="background:${t[k]}"></div><div class="sw-label">${k}<br>${t[k]}</div></div>`).join('')}
        </div>
      </div>
      <p class="contrast">Tương phản: chữ/nền <b>${pick(c, 'text/bg')}</b> · chữ phụ <b>${pick(c, 'muted/surface')}</b> · chữ trên nút chính <b>${pick(c, 'onPrimary/primary')}</b> · chữ nhấn <b>${pick(c, 'accentText/surface')}</b> · ${c.every((r) => r.pass) ? '<b>đạt AA toàn bộ</b>' : '<b>có cặp chưa đạt AA: ' + c.filter((r) => !r.pass).map((r) => r.pair + ' ' + r.ratio).join(', ') + '</b>'}</p>
    </div>
  </section>`;
};

document.getElementById('root').innerHTML = PALETTES.map((p) => `
  <div class="option">
    <h2>${p.name}</h2>
    <p>${p.mood}</p>
    <div class="modes">${frame(p, 'light')}${frame(p, 'dark')}</div>
  </div>`).join('');
