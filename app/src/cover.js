// Neon Hours — poster renderer.
//
// Draws the three-panel neon-noir cover onto any 2D canvas context.
// The poster is pure canvas: a magenta-to-navy sky, three photo panels
// whose arrangement follows the poster's aspect ratio, a striped retro
// sun low on the horizon, and a big italic headline over the sun.

export const PANEL_LABELS = {
  main: 'MAIN',
  mid: 'MIDNIGHT',
  close: 'LAST LIGHT',
};

// Where the three panels sit for a poster of the given size.
// Wide posters put the main panel large on the left with the other two
// stacked on the right. Portrait posters put the main panel full width
// on top with the other two side by side below. Square posters use the
// wide arrangement with a slightly narrower main panel.
export function layoutFor(width, height) {
  const ratio = width / height;
  const pad = Math.round(width * 0.04);
  const top = Math.round(height * 0.045);
  const zoneH = Math.round(height * 0.555);
  const gap = Math.max(8, Math.round(width * 0.018));
  const contentW = width - pad * 2;

  if (ratio >= 1.35) {
    const mainW = Math.round(contentW * 0.57);
    const rightW = contentW - mainW - gap;
    const halfH = Math.round((zoneH - gap) / 2);
    return {
      main: { x: pad, y: top, w: mainW, h: zoneH },
      mid: { x: pad + mainW + gap, y: top, w: rightW, h: halfH },
      close: { x: pad + mainW + gap, y: top + halfH + gap, w: rightW, h: halfH },
    };
  }

  if (height / width >= 1.2) {
    const mainH = Math.round(zoneH * 0.56);
    const bottomH = zoneH - mainH - gap;
    const halfW = Math.round((contentW - gap) / 2);
    return {
      main: { x: pad, y: top, w: contentW, h: mainH },
      mid: { x: pad, y: top + mainH + gap, w: halfW, h: bottomH },
      close: { x: pad + halfW + gap, y: top + mainH + gap, w: halfW, h: bottomH },
    };
  }

  const mainW = Math.round(contentW * 0.56);
  const rightW = contentW - mainW - gap;
  const halfH = Math.round((zoneH - gap) / 2);
  return {
    main: { x: pad, y: top, w: mainW, h: zoneH },
    mid: { x: pad + mainW + gap, y: top, w: rightW, h: halfH },
    close: { x: pad + mainW + gap, y: top + halfH + gap, w: rightW, h: halfH },
  };
}

// Fit one photo into a panel: cover the panel, zoomed and panned by the
// panel's crop. With no photo, paint a pink-to-purple-to-navy gradient.
function paintPanel(ctx, rect, photo, crop, label) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (photo && photo.naturalWidth > 0 && photo.naturalHeight > 0) {
    const zoom = crop && crop.zoom ? crop.zoom : 1;
    const base = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
    const drawnW = photo.naturalWidth * base;
    const drawnH = photo.naturalHeight * base;
    const panX = crop && crop.x ? crop.x : 0;
    const panY = crop && crop.y ? crop.y : 0;
    const offsetX = (rect.w - drawnW) / 2 + (panX / 100) * ((drawnW - rect.w) / 2);
    const offsetY = (rect.h - drawnH) / 2 + (panY / 100) * ((drawnH - rect.h) / 2);
    ctx.drawImage(photo, rect.x + offsetX, rect.y + offsetY, drawnW, drawnH);
  } else {
    const fallback = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    fallback.addColorStop(0, '#ff4f96');
    fallback.addColorStop(0.5, '#7b2fbe');
    fallback.addColorStop(1, '#101936');
    ctx.fillStyle = fallback;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  // Pink-to-navy diagonal tint so every panel shares the same night grade.
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  tint.addColorStop(0, 'rgba(255, 79, 150, 0.22)');
  tint.addColorStop(1, 'rgba(16, 25, 54, 0.38)');
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  // Cream frame around the panel.
  ctx.save();
  ctx.strokeStyle = '#fff0e2';
  ctx.lineWidth = Math.max(2, rect.w * 0.008);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  // Small label tucked into the top-left corner, clear of the edges.
  const size = Math.max(13, Math.round(rect.w * 0.045));
  const inset = Math.max(10, Math.round(rect.w * 0.03));
  ctx.save();
  ctx.font = `700 ${size}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(9, 8, 23, 0.85)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#fff0e2';
  ctx.fillText(label, rect.x + inset, rect.y + inset + size);
  ctx.restore();
}

// The retro sun: a half-disc rising over a horizon at 92% height,
// cream fading through pink to magenta, with dark stripes that grow
// thicker as they near the horizon.
function paintSun(ctx, width, height) {
  const cx = width / 2;
  const horizon = height * 0.92;
  // The radius follows the width on square and portrait posters, but is
  // capped by the height on wide ones so the dome never swallows the
  // headline that sits across it.
  const radius = Math.min(width * 0.24, height * 0.32);
  const top = horizon - radius;

  const glow = ctx.createLinearGradient(0, top, 0, horizon);
  glow.addColorStop(0, '#ffe9c9');
  glow.addColorStop(0.45, '#ff4f96');
  glow.addColorStop(1, '#c62b7a');

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, horizon, radius, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = glow;
  ctx.fill();
  ctx.clip();
  // Dark stripes only across the lower quarter of the dome, growing
  // thicker toward the horizon, so they never cut through the headline.
  ctx.fillStyle = '#101936';
  for (let i = 0; i < 6; i++) {
    const y = horizon - radius * (0.25 - i * 0.04);
    const thick = radius * (0.01 + i * 0.007);
    ctx.fillRect(cx - radius, y, radius * 2, thick);
  }
  ctx.restore();
}

// Greedy word wrap that fits inside maxWidth, or null when the words
// need more than maxLines lines.
function wrapLines(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      if (!current) return null;
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) return null;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 && lines.length <= maxLines ? lines : null;
}

// The headline: big italic heavy uppercase cream lettering, shrunk until
// it fits in at most two lines inside 88% of the width, with a dark
// outline and a pink glow, centred around 77.5% height.
function paintHeadline(ctx, width, height, text) {
  const headline = (text || '').toUpperCase().trim() || 'NEON HOURS';
  const maxW = width * 0.88;
  const centreY = height * 0.775;

  // The base size follows the width, but is capped by the height on wide
  // posters so the lettering never grows tall enough to meet the sun's
  // stripes; it still shrinks further until it fits in two lines.
  let size = Math.round(Math.min(width, height * 1.25) * 0.085);
  let lines = null;
  while (size > 12) {
    ctx.font = `italic 900 ${size}px Arial, sans-serif`;
    lines = wrapLines(ctx, headline, maxW, 2);
    if (lines) break;
    size = Math.round(size * 0.92);
  }
  if (!lines) {
    ctx.font = `italic 900 ${size}px Arial, sans-serif`;
    lines = [headline];
  }

  const lineHeight = size * 1.04;
  const firstY = centreY - ((lines.length - 1) * lineHeight) / 2;
  ctx.save();
  ctx.font = `italic 900 ${size}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff4f96';
  ctx.shadowBlur = Math.round(size * 0.3);
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeStyle = 'rgba(16, 9, 32, 0.9)';
  ctx.fillStyle = '#fff0e2';
  lines.forEach((line, i) => {
    const y = firstY + i * lineHeight;
    ctx.strokeText(line, width / 2, y);
    ctx.fillText(line, width / 2, y);
  });
  ctx.restore();
}

// Draw the whole poster. `state` holds photos {main, mid, close} as
// image elements (or null), crops {main, mid, close} as {zoom, x, y},
// and the headline string.
export function drawPoster(ctx, width, height, state) {
  const photos = state.photos || {};
  const crops = state.crops || {};
  const headline = state.headline || '';

  // Night sky: deep magenta at the top, indigo in the middle, dark navy low.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#431735');
  sky.addColorStop(0.55, '#25204b');
  sky.addColorStop(1, '#101936');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  paintSun(ctx, width, height);

  const rects = layoutFor(width, height);
  for (const key of ['main', 'mid', 'close']) {
    paintPanel(ctx, rects[key], photos[key] || null, crops[key] || null, PANEL_LABELS[key]);
  }

  paintHeadline(ctx, width, height, headline);

  // Wordmark low on the left, series line low on the right. A dark shadow
  // keeps both readable where they cross the edge of the sun.
  const wordSize = Math.round(width * 0.034);
  const smallSize = Math.round(width * 0.02);
  ctx.save();
  ctx.shadowColor = 'rgba(9, 8, 23, 0.9)';
  ctx.shadowBlur = Math.round(wordSize * 0.25);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `800 ${wordSize}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff0e2';
  try { ctx.letterSpacing = `${Math.max(2, Math.round(wordSize * 0.12))}px`; } catch (e) { /* older canvas */ }
  ctx.fillText('NEON HOURS', width * 0.04, height * 0.905);
  try { ctx.letterSpacing = `${Math.max(1, Math.round(smallSize * 0.14))}px`; } catch (e) { /* older canvas */ }
  ctx.font = `700 ${smallSize}px Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#66e1e9';
  ctx.fillText('NIGHT SERIES · VOL. 07', width * 0.96, height * 0.905);
  ctx.restore();

  // Tagline centred near the bottom edge.
  ctx.save();
  ctx.font = `700 ${Math.round(width * 0.018)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = '3px'; } catch (e) { /* older canvas */ }
  ctx.fillStyle = 'rgba(255, 240, 226, 0.9)';
  ctx.fillText('THREE FRAMES · ONE NIGHT · YOUR STORY', width / 2, height * 0.955);
  ctx.restore();

  // Thin cream border inset 1.8% around the whole poster.
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 240, 226, 0.9)';
  ctx.lineWidth = Math.max(2, width * 0.003);
  ctx.strokeRect(width * 0.018, height * 0.018, width * 0.964, height * 0.964);
  ctx.restore();
}
