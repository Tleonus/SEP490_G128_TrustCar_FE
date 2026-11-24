// Builds full light/dark token sets from a few OKLCH parameters. Exposes window.buildTheme.
(function () {
  const { oklch, contrast, ensure } = window.Color;
  const WHITE = '#FFFFFF';

  // Picks white or the dark ink for text on a filled colour; shifts the fill if neither reaches 4.5.
  function fill(L, C, h, ink, preferDarkInk) {
    let bg = oklch(L, C, h);
    const order = preferDarkInk ? [ink, WHITE] : [WHITE, ink];
    for (const fg of order) if (contrast(fg, bg) >= 4.5) return { bg, fg };
    const fg = order[0];
    const dir = fg === WHITE ? -1 : 1;
    for (let i = 0; i < 200 && contrast(fg, bg) < 4.5; i++) { L += dir * 0.005; bg = oklch(L, C, h); }
    return { bg, fg };
  }

  function mode(p, dark) {
    const nC = p.neutralC, nH = p.neutralH;
    const n = dark
      ? { bg: oklch(0.165, nC, nH), surface: oklch(0.205, nC, nH), surfaceAlt: oklch(0.25, nC, nH), border: oklch(0.31, nC, nH) }
      : { bg: oklch(0.975, nC * 0.7, nH), surface: oklch(0.997, nC * 0.2, nH), surfaceAlt: oklch(0.948, nC, nH), border: oklch(0.9, nC, nH) };

    const text = dark ? oklch(0.96, nC * 0.6, nH) : oklch(0.2, nC * 1.6, nH);
    const ink = dark ? n.bg : text;
    const muted = dark
      ? ensure(0.74, nC * 1.5, nH, n.surfaceAlt, 4.5, 1)
      : ensure(0.5, nC * 2, nH, n.surfaceAlt, 4.5, -1);

    let bL = dark ? Math.max(p.brandL, 0.74) : p.brandL;
    const bC = dark ? p.brandC * 0.85 : p.brandC;
    // The primary button must stay visible against cards (3:1 for UI components).
    while (!dark && bL > 0.1 && contrast(oklch(bL, bC, p.brandH), n.surface) < 3) bL -= 0.005;
    const primary = fill(bL, bC, p.brandH, dark ? n.bg : text, dark);
    const aL = dark ? Math.max(p.accentL, 0.78) : p.accentL;
    const accent = fill(aL, p.accentC, p.accentH, dark ? n.bg : text, aL > 0.66);

    const readable = (L, C, h) => ensure(L, C, h, n.surface, 4.5, dark ? 1 : -1);
    return {
      ...n, text, muted,
      primary: primary.bg, onPrimary: primary.fg,
      primaryHover: oklch(bL + (dark ? 0.05 : -0.06), bC, p.brandH),
      link: readable(dark ? 0.78 : 0.48, bC, p.brandH),
      accent: accent.bg, onAccent: accent.fg,
      accentHover: oklch(aL + (dark ? 0.05 : -0.06), p.accentC, p.accentH),
      accentText: readable(dark ? 0.8 : 0.5, p.accentC, p.accentH),
      success: readable(dark ? 0.78 : 0.5, 0.14, 150),
      warning: readable(dark ? 0.82 : 0.55, 0.14, 70),
      danger: readable(dark ? 0.72 : 0.5, 0.18, 27),
    };
  }

  window.buildTheme = (p) => ({ light: mode(p, false), dark: mode(p, true) });
})();
