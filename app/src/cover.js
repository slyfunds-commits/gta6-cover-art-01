const PANEL_KEYS = ["main", "mid", "close"];

function panelLayout(width, height) {
  const ratio = width / height;
  if (ratio >= 1.35) {
    return [
      { key: "main", x: 0.045, y: 0.055, w: 0.575, h: 0.59, label: "MAIN" },
      { key: "mid", x: 0.65, y: 0.055, w: 0.305, h: 0.28, label: "MIDNIGHT" },
      { key: "close", x: 0.65, y: 0.365, w: 0.305, h: 0.28, label: "LAST LIGHT" },
    ];
  }
  if (height / width >= 1.2) {
    return [
      { key: "main", x: 0.05, y: 0.045, w: 0.9, h: 0.36, label: "MAIN" },
      { key: "mid", x: 0.05, y: 0.435, w: 0.435, h: 0.205, label: "MIDNIGHT" },
      { key: "close", x: 0.515, y: 0.435, w: 0.435, h: 0.205, label: "LAST LIGHT" },
    ];
  }
  return [
    { key: "main", x: 0.045, y: 0.05, w: 0.56, h: 0.59, label: "MAIN" },
    { key: "mid", x: 0.635, y: 0.05, w: 0.32, h: 0.28, label: "MIDNIGHT" },
    { key: "close", x: 0.635, y: 0.36, w: 0.32, h: 0.28, label: "LAST LIGHT" },
  ];
}

function paintSky(ctx, width, height) {
  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, "#431735");
  sky.addColorStop(0.52, "#25204b");
  sky.addColorStop(1, "#101936");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
}

function paintPanel(ctx, panel, image, crop, width, height) {
  const rect = {
    x: panel.x * width,
    y: panel.y * height,
    w: panel.w * width,
    h: panel.h * height,
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (image && image.complete && image.naturalWidth) {
    const coverScale = Math.max(rect.w / image.naturalWidth, rect.h / image.naturalHeight);
    const scale = coverScale * (crop?.zoom ?? 1);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const extraX = Math.max(0, drawWidth - rect.w);
    const extraY = Math.max(0, drawHeight - rect.h);
    const left = rect.x + (rect.w - drawWidth) / 2 - extraX * ((crop?.x ?? 0) / 200);
    const top = rect.y + (rect.h - drawHeight) / 2 - extraY * ((crop?.y ?? 0) / 200);
    ctx.drawImage(image, left, top, drawWidth, drawHeight);
  } else {
    const fallback = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    fallback.addColorStop(0, "#ff7893");
    fallback.addColorStop(0.5, "#773b77");
    fallback.addColorStop(1, "#172856");
    ctx.fillStyle = fallback;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }

  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.4, rect.y + rect.h);
  tint.addColorStop(0, "rgba(255,79,150,.30)");
  tint.addColorStop(0.48, "rgba(48,33,83,.06)");
  tint.addColorStop(1, "rgba(10,17,45,.62)");
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,239,222,.88)";
  ctx.lineWidth = Math.max(1.5, width * 0.0015);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "#fff2df";
  ctx.font = `700 ${Math.max(10, width * 0.012)}px Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const labelTop = Math.max(ctx.lineWidth + 4, rect.h * 0.095);
  ctx.fillText(panel.label, rect.x + width * 0.014, rect.y + labelTop);
}

function paintSun(ctx, width, height) {
  const radius = Math.min(width, height) * 0.085;
  const centerX = width * 0.5;
  const horizon = height * 0.92;
  const sun = ctx.createLinearGradient(centerX, horizon - radius, centerX, horizon);
  sun.addColorStop(0, "#ffe4a0");
  sun.addColorStop(0.48, "#ff7893");
  sun.addColorStop(1, "#d73591");
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, horizon, radius, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = sun;
  ctx.fill();

  ctx.fillStyle = "#272044";
  const stripeWidths = [0.98, 0.88, 0.76, 0.62, 0.48];
  stripeWidths.forEach((fraction, index) => {
    const stripeY = horizon - radius * (0.25 - index * 0.12);
    const stripeHeight = Math.max(2, radius * (0.045 + index * 0.008));
    ctx.fillRect(centerX - radius * fraction / 2, stripeY, radius * fraction, stripeHeight);
  });
  ctx.restore();
}

function paintHeadline(ctx, width, height, caption) {
  const words = String(caption || "MIDNIGHT HEAT").toUpperCase().trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  let size = Math.min(width * 0.075, height * 0.105);
  const maxWidth = width * 0.88;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fitLines = (fontSize) => {
    const result = [];
    let active = "";
    for (const word of words.length ? words : ["MIDNIGHT HEAT"]) {
      const candidate = active ? `${active} ${word}` : word;
      ctx.font = `italic 900 ${fontSize}px Arial, sans-serif`;
      if (active && ctx.measureText(candidate).width > maxWidth) {
        result.push(active);
        active = word;
      } else active = candidate;
    }
    if (active) result.push(active);
    return result;
  };

  let fitted = fitLines(size);
  while (size > width * 0.032 && (fitted.length > 2 || fitted.some((text) => {
    ctx.font = `italic 900 ${size}px Arial, sans-serif`;
    return ctx.measureText(text).width > maxWidth;
  }))) {
    size *= 0.92;
    fitted = fitLines(size);
  }
  lines.push(...fitted.slice(0, 2));
  ctx.font = `italic 900 ${size}px Arial, sans-serif`;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * 0.085);
  ctx.strokeStyle = "rgba(14,12,30,.9)";
  ctx.shadowColor = "rgba(255,79,150,.8)";
  ctx.shadowBlur = size * 0.3;
  const centerY = height * 0.775;
  const lineGap = size * 0.88;
  lines.forEach((text, index) => {
    const y = centerY + (index - (lines.length - 1) / 2) * lineGap;
    ctx.strokeText(text, width / 2, y, maxWidth);
    ctx.fillStyle = "#fff0db";
    ctx.fillText(text, width / 2, y, maxWidth);
  });
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

export function drawCover(canvas, images, caption, crops = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("A 2D canvas context is required to draw the poster.");
  const { width, height } = canvas;
  paintSky(ctx, width, height);
  const assigned = images ?? {};
  panelLayout(width, height).forEach((panel) => {
    const image = Array.isArray(assigned) ? assigned[PANEL_KEYS.indexOf(panel.key)] : assigned[panel.key];
    paintPanel(ctx, panel, image, crops[panel.key], width, height);
  });

  paintSun(ctx, width, height);
  const borderInset = width * 0.018;
  ctx.strokeStyle = "rgba(255,239,222,.82)";
  ctx.lineWidth = Math.max(1.5, width * 0.0013);
  ctx.strokeRect(borderInset, borderInset, width - borderInset * 2, height - borderInset * 2);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff0db";
  ctx.font = `800 ${Math.max(13, width * 0.019)}px Arial, sans-serif`;
  ctx.fillText("NEON HOURS", borderInset + width * 0.014, height * 0.925);
  ctx.textAlign = "right";
  ctx.fillStyle = "#66e1e9";
  ctx.font = `700 ${Math.max(9, width * 0.009)}px Arial, sans-serif`;
  ctx.fillText("NIGHT SERIES · VOL. 07", width - borderInset - width * 0.014, height * 0.924);

  paintHeadline(ctx, width, height, caption);

  const tagline = "THREE FRAMES · ONE NIGHT · YOUR STORY";
  const tagSize = Math.max(8, width * 0.008);
  ctx.font = `700 ${tagSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const taglineY = height * 0.955;
  ctx.fillStyle = "#fff0db";
  ctx.fillText(tagline, width / 2, taglineY, width * 0.82);
}
