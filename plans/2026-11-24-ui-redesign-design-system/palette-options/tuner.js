// Tuner UI: presets + sliders -> buildTheme -> live light/dark preview, contrast table, CSS export.
(function () {
  const { contrast } = window.Color;
  const IMG = '../../../src/assets';
  const state = { ...window.PRESETS[0] };
  const $ = (id) => document.getElementById(id);

  const SLIDERS = {
    brand: [['brandH', 'Sắc (hue)', 0, 360, 1], ['brandC', 'Độ rực', 0, 0.25, 0.005], ['brandL', 'Độ sáng', 0.15, 0.75, 0.005]],
    accent: [['accentH', 'Sắc (hue)', 0, 360, 1], ['accentC', 'Độ rực', 0, 0.25, 0.005], ['accentL', 'Độ sáng', 0.2, 0.95, 0.005]],
    neutral: [['neutralH', 'Ngả màu', 0, 360, 1], ['neutralC', 'Độ ngả', 0, 0.03, 0.001]],
  };

  function buildControls() {
    for (const [group, list] of Object.entries(SLIDERS)) {
      $(group).innerHTML = list.map(([k, label, min, max, step]) =>
        `<label class="ctl">${label}<input type="range" id="s-${k}" min="${min}" max="${max}" step="${step}"><output id="o-${k}"></output></label>` +
        (k.endsWith('H') ? '<div class="hue"></div>' : '')).join('');
      for (const [k] of list) $('s-' + k).addEventListener('input', (e) => { state[k] = +e.target.value; render(); });
    }
  }

  function buildPresets() {
    $('presets').innerHTML = window.PRESETS.map((p) => {
      const t = window.buildTheme(p).light;
      return `<button class="preset" data-id="${p.id}"><span class="dot" style="background:${t.primary}"></span><span class="dot" style="background:${t.accent}"></span>${p.name}</button>`;
    }).join('');
    $('presets').addEventListener('click', (e) => {
      const b = e.target.closest('.preset');
      if (!b) return;
      Object.assign(state, window.PRESETS.find((p) => p.id === b.dataset.id));
      render();
    });
  }

  const vars = (t) => Object.entries(t).map(([k, v]) => `--${k}:${v}`).join(';');

  function frame(t, label) {
    const car = (img, name, meta, price, cpo) => `
      <div class="card"><img src="${IMG}/cars/${img}" alt="">
        <div class="card-body"><div class="card-title">${name}</div><div class="card-meta">${meta}</div>
        <div class="price">${price}</div>
        <div class="badges">${cpo ? '<span class="badge badge-cpo">Đã kiểm định</span>' : ''}<span class="badge">Chính chủ</span></div>
        <button class="btn btn-primary btn-sm">Xem chi tiết</button></div></div>`;
    return `<div class="frame" style="${vars(t)}">
      <div class="mode-label">${label}</div>
      <nav class="nav"><span class="logo">Trust<span>Car</span></span><a class="active">Mua xe</a><a>Bán xe</a><a>Kiểm định</a><span class="spacer"></span>
        <a style="color:${t.link};font-weight:600">Đăng nhập</a><button class="btn btn-primary btn-sm">Đăng tin</button></nav>
      <div class="hero" style="background-image:url(${IMG}/hero_slides/hero1.jpg)"><div class="hero-body">
        <h3>Xe đã qua sử dụng, kiểm định rõ ràng</h3><p>Hơn 2.000 xe được kiểm tra 160 hạng mục trước khi đăng bán.</p>
        <div class="row"><button class="btn btn-primary">Tìm xe ngay</button><button class="btn btn-accent">Đặt lịch kiểm định</button></div></div></div>
      <div class="content">
        <div class="cards">${car('sedan1.jpg', 'Toyota Camry 2.5Q 2021', '45.000 km · Tự động · Hà Nội', '895.000.000 ₫', true)}
          ${car('suv1.jpg', 'Mazda CX-5 Premium 2022', '28.000 km · Tự động · TP.HCM', '789.000.000 ₫', false)}</div>
        <div class="row"><button class="btn btn-primary">Nút chính</button><button class="btn btn-secondary">Nút phụ</button><button class="btn btn-accent">Nút nhấn</button>
          <a style="color:${t.link};font-weight:600;font-size:14px">Liên kết</a></div>
        <div class="panel row"><span class="status" style="color:${t.success}">● Đã duyệt</span><span class="status" style="color:${t.warning}">● Chờ kiểm định</span>
          <span class="status" style="color:${t.danger}">● Bị từ chối</span><span class="card-meta">Chữ phụ trên nền xám</span></div>
      </div></div>`;
  }

  const PAIRS = [
    ['Chữ chính / nền', 'text', 'bg', 4.5], ['Chữ phụ / nền xám', 'muted', 'surfaceAlt', 4.5],
    ['Chữ trên nút chính', 'onPrimary', 'primary', 4.5], ['Chữ trên nút nhấn', 'onAccent', 'accent', 4.5],
    ['Liên kết / thẻ', 'link', 'surface', 4.5], ['Nút chính / thẻ (viền)', 'primary', 'surface', 3],
    ['Thành công / thẻ', 'success', 'surface', 4.5], ['Cảnh báo / thẻ', 'warning', 'surface', 4.5], ['Lỗi / thẻ', 'danger', 'surface', 4.5],
  ];

  function checks(theme) {
    const cell = (t, a, b, min) => { const r = contrast(t[a], t[b]); return `<td class="${r >= min ? 'ok' : 'bad'}">${r.toFixed(2)}</td>`; };
    return `<b>Độ tương phản</b> (cần ≥ 4.5 cho chữ, ≥ 3 cho viền nút)<table><tr><td></td><td>Sáng</td><td>Tối</td><td>Tối thiểu</td></tr>` +
      PAIRS.map(([n, a, b, m]) => `<tr><td>${n}</td>${cell(theme.light, a, b, m)}${cell(theme.dark, a, b, m)}<td>${m}</td></tr>`).join('') + '</table>';
  }

  const CSS_NAMES = { bg: 'color-bg', surface: 'color-surface', surfaceAlt: 'color-surface-alt', text: 'color-text', muted: 'color-text-secondary',
    border: 'color-border', primary: 'color-primary', primaryHover: 'color-primary-dark', onPrimary: 'color-on-primary', link: 'color-link',
    accent: 'color-accent', accentHover: 'color-accent-hover', onAccent: 'color-on-accent', accentText: 'color-accent-text',
    success: 'color-success', warning: 'color-warning', danger: 'color-danger' };

  function exportText(theme) {
    const block = (sel, t) => `${sel} {\n` + Object.entries(CSS_NAMES).map(([k, n]) => `  --${n}: ${t[k]};`).join('\n') + '\n}';
    const params = Object.fromEntries(Object.entries(state).filter(([k]) => /^(brand|accent|neutral)/.test(k)));
    return `/* ${JSON.stringify(params)} */\n${block(':root', theme.light)}\n\n${block("[data-theme='dark']", theme.dark)}`;
  }

  function render() {
    for (const list of Object.values(SLIDERS)) for (const [k, , , , step] of list) {
      $('s-' + k).value = state[k];
      $('o-' + k).textContent = step >= 1 ? Math.round(state[k]) : (+state[k]).toFixed(3);
    }
    document.querySelectorAll('.preset').forEach((b) => b.classList.toggle('on', b.dataset.id === state.id));
    const p = window.PRESETS.find((x) => x.id === state.id);
    $('note').textContent = p ? p.note : '';
    const theme = window.buildTheme(state);
    $('frames').innerHTML = frame(theme.light, 'Chế độ sáng') + frame(theme.dark, 'Chế độ tối');
    $('checks').innerHTML = checks(theme);
    $('out').value = exportText(theme);
  }

  $('copy').addEventListener('click', () => { $('out').select(); navigator.clipboard?.writeText($('out').value); });
  buildControls();
  buildPresets();
  render();
})();
