const panelLabels = { hero: '01 / MAIN SCENE', top: '02 / FLASHBACK', bottom: '03 / AFTER HOURS' };

function panelLayout(width, height) {
  const portrait = height >= width * 1.15;
  const top = portrait ? 0.045 : 0.055;
  const photoBottom = portrait ? 0.68 : 0.72;
  const photoHeight = photoBottom - top;
  return {
    hero: { x: 0.045, y: top, w: 0.595, h: photoHeight },
    top: { x: 0.66, y: top, w: 0.295, h: photoHeight * 0.47 },
    bottom: { x: 0.66, y: top + photoHeight * 0.515, w: 0.295, h: photoHeight * 0.485 },
  };
}

function paintPanel(ctx, panel, image, crop, width, height, index) {
  const x = panel.x * width;
  const y = panel.y * height;
  const w = panel.w * width;
  const h = panel.h * height;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (image) {
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight) * crop.zoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const extraX = drawWidth - w;
    const extraY = drawHeight - h;
    const left = x - extraX / 2 + extraX * crop.x / 200;
    const top = y - extraY / 2 + extraY * crop.y / 200;
    ctx.drawImage(image, left, top, drawWidth, drawHeight);
  } else {
    const fill = ctx.createLinearGradient(x, y, x + w, y + h);
    fill.addColorStop(0, '#fd6c87');
    fill.addColorStop(.55, '#78366b');
    fill.addColorStop(1, '#201b49');
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  const tint = ctx.createLinearGradient(x, y, x + w * .18, y + h);
  tint.addColorStop(0, 'rgba(255, 76, 151, .28)');
  tint.addColorStop(.48, 'rgba(92, 48, 132, .10)');
  tint.addColorStop(1, 'rgba(15, 11, 42, .42)');
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = '#fff0e8';
  ctx.lineWidth = Math.max(2, width * .0024);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 95, 158, .88)';
  ctx.lineWidth = Math.max(1, width * .0012);
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  ctx.fillStyle = '#fff2ed';
  ctx.font = `800 ${Math.max(11, width * .011)}px system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.shadowColor = '#1b102c';
  ctx.shadowBlur = 8;
  ctx.fillText(panelLabels[index], x + w * .045, y + h * .09);
  ctx.restore();
}

function splitTitle(text, ctx, maxWidth) {
  const words = text.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawTitle(ctx, text, width, height) {
  const maxWidth = width * .9;
  let fontSize = Math.min(width * .102, height * .11);
  let lines;
  ctx.font = `1000 italic ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  lines = splitTitle(text, ctx, maxWidth);
  if (lines.length > 1) {
    fontSize = Math.min(width * .078, height * .085);
    ctx.font = `1000 italic ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    lines = splitTitle(text, ctx, maxWidth);
  }
  while (lines.some(line => ctx.measureText(line).width > maxWidth) && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `1000 italic ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    lines = splitTitle(text, ctx, maxWidth);
  }

  const centerY = height * .86;
  const lineHeight = fontSize * 1.02;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255, 49, 137, .8)';
  ctx.shadowBlur = fontSize * .24;
  for (let i = 0; i < lines.length; i++) {
    const y = centerY + (i - (lines.length - 1) / 2) * lineHeight;
    ctx.lineWidth = Math.max(7, fontSize * .13);
    ctx.strokeStyle = '#21142d';
    ctx.strokeText(lines[i], width / 2, y, maxWidth);
    ctx.lineWidth = Math.max(2, fontSize * .038);
    ctx.strokeStyle = '#fff3e8';
    ctx.strokeText(lines[i], width / 2, y, maxWidth);
    ctx.fillStyle = '#fff9f0';
    ctx.fillText(lines[i], width / 2, y, maxWidth);
  }
  ctx.restore();
}

function drawFooterSun(ctx, width, height, top) {
  const radius = Math.min(width, height) * .34;
  const centerY = height * .97;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, top, width, height - top);
  ctx.clip();
  const gradient = ctx.createLinearGradient(0, centerY - radius, 0, centerY);
  gradient.addColorStop(0, 'rgba(255, 211, 117, .9)');
  gradient.addColorStop(.52, 'rgba(255, 111, 130, .84)');
  gradient.addColorStop(1, 'rgba(226, 73, 147, .72)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(width / 2, centerY, radius, Math.PI, 0);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(width / 2, centerY, radius, Math.PI, 0);
  ctx.clip();
  ctx.fillStyle = 'rgba(36, 24, 58, .34)';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(0, centerY - radius * .55 + i * height * .018, width, height * .006);
  }
  ctx.restore();
  ctx.restore();
}

/** Draws the multi-frame, neon-noir poster at the canvas's current export dimensions. */
export function drawCover(canvas, photos, caption, crops) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const background = ctx.createLinearGradient(0, 0, width * .2, height);
  background.addColorStop(0, '#351735');
  background.addColorStop(.44, '#2b214a');
  background.addColorStop(1, '#101e3d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const panels = panelLayout(width, height);
  for (const name of ['hero', 'top', 'bottom']) {
    paintPanel(ctx, panels[name], photos[name], crops[name], width, height, name);
  }
  drawFooterSun(ctx, width, height, (panels.hero.y + panels.hero.h) * height);

  const edge = Math.max(13, width * .018);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 236, 218, .92)';
  ctx.lineWidth = Math.max(2, width * .0022);
  ctx.strokeRect(edge, edge, width - edge * 2, height - edge * 2);
  ctx.strokeStyle = 'rgba(255, 95, 158, .75)';
  ctx.lineWidth = Math.max(1, width * .001);
  ctx.strokeRect(edge * 1.45, edge * 1.45, width - edge * 2.9, height - edge * 2.9);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff3e8';
  ctx.font = `900 ${Math.max(14, width * .018)}px system-ui, sans-serif`;
  ctx.letterSpacing = `${Math.max(1, width * .002)}px`;
  ctx.fillText('NEON HOURS', width * .052, height * .748);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8debf0';
  ctx.font = `800 ${Math.max(10, width * .0105)}px system-ui, sans-serif`;
  ctx.fillText('VICE CITY  /  VOL. 06', width * .948, height * .748);
  ctx.setLineDash([width * .008, width * .007]);
  ctx.strokeStyle = 'rgba(255, 221, 193, .42)';
  ctx.lineWidth = Math.max(1, width * .001);
  ctx.beginPath();
  ctx.moveTo(width * .052, height * .768);
  ctx.lineTo(width * .948, height * .768);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  drawTitle(ctx, caption, width, height);

  ctx.save();
  ctx.font = `700 ${Math.max(9, width * .009)}px system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 237, 224, .74)';
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${Math.max(1, width * .002)}px`;
  ctx.fillText('ONE CITY  ·  THREE STORIES  ·  YOURS TO TELL', width / 2, height * .962);
  ctx.restore();
}
