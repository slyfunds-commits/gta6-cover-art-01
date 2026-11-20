const NAMES = { main: 'MAIN', mid: 'MIDNIGHT', close: 'LAST LIGHT' };

function drawPhoto(ctx, image, box, crop) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  if (image) {
    const scale = Math.max(box.w / image.naturalWidth, box.h / image.naturalHeight) * crop.zoom;
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    const spareX = dw - box.w;
    const spareY = dh - box.h;
    const dx = box.x - spareX / 2 + spareX * crop.x / 200;
    const dy = box.y - spareY / 2 + spareY * crop.y / 200;
    ctx.drawImage(image, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
    g.addColorStop(0, '#ff708c');
    g.addColorStop(.55, '#743873');
    g.addColorStop(1, '#17255a');
    ctx.fillStyle = g;
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  const shade = ctx.createLinearGradient(box.x, box.y, box.x + box.w * .3, box.y + box.h);
  shade.addColorStop(0, 'rgba(255,79,150,.28)');
  shade.addColorStop(.5, 'rgba(70,40,120,.05)');
  shade.addColorStop(1, 'rgba(8,10,38,.48)');
  ctx.fillStyle = shade;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,244,232,.92)';
  ctx.lineWidth = Math.max(2, box.w * .008);
  ctx.strokeRect(box.x + ctx.lineWidth / 2, box.y + ctx.lineWidth / 2, box.w - ctx.lineWidth, box.h - ctx.lineWidth);
  ctx.fillStyle = '#fff7ea';
  ctx.font = `900 ${Math.max(11, box.w * .055)}px Arial, sans-serif`;
  ctx.letterSpacing = `${Math.max(1, box.w * .009)}px`;
  ctx.fillText(NAMES[box.name], box.x + box.w * .06, box.y + box.h * .10);
  ctx.restore();
}

function panelLayout(w, h) {
  const landscape = w / h >= 1.35;
  if (landscape) return {
    main: { name: 'main', x: w*.035, y: h*.055, w:w*.60, h:h*.78 },
    mid: { name: 'mid', x: w*.655, y: h*.055, w:w*.31, h:h*.37 },
    close: { name: 'close', x: w*.655, y: h*.445, w:w*.31, h:h*.39 },
  };
  if (h/w >= 1.20) return {
    main: { name: 'main', x:w*.045, y:h*.035, w:w*.91, h:h*.50 },
    mid: { name: 'mid', x:w*.045, y:h*.555, w:w*.43, h:h*.25 },
    close: { name: 'close', x:w*.505, y:h*.555, w:w*.45, h:h*.25 },
  };
  return {
    main: { name:'main', x:w*.04, y:h*.055, w:w*.58, h:h*.62 },
    mid: { name:'mid', x:w*.64, y:h*.055, w:w*.32, h:h*.29 },
    close: { name:'close', x:w*.64, y:h*.365, w:w*.32, h:h*.31 },
  };
}

function titleLines(text, ctx, maxWidth) {
  const words = text.toUpperCase().trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawTitle(ctx, text, w, h) {
  let size = Math.min(w*.105, h*.085);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 italic ${size}px Arial, sans-serif`;
  const maxWidth = w*.92;
  let lines = titleLines(text, ctx, maxWidth);
  if (lines.length > 1) size *= .78;
  ctx.font = `900 italic ${size}px Arial, sans-serif`;
  while (lines.some(line => ctx.measureText(line).width > maxWidth) && size > 24) {
    size -= 2;
    ctx.font = `900 italic ${size}px Arial, sans-serif`;
  }
  const y = h*(h/w >= 1.20 ? .895 : .84);
  const lineHeight = size*.94;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255,55,145,.75)';
  ctx.shadowBlur = size*.28;
  lines.forEach((line,i) => {
    const yy = y + (i-(lines.length-1)/2)*lineHeight;
    ctx.lineWidth = size*.16;
    ctx.strokeStyle = '#24142f';
    ctx.strokeText(line, w/2, yy, maxWidth);
    ctx.lineWidth = size*.035;
    ctx.strokeStyle = '#fff0df';
    ctx.strokeText(line, w/2, yy, maxWidth);
    ctx.fillStyle = '#fffaf0';
    ctx.fillText(line, w/2, yy, maxWidth);
  });
  ctx.restore();
}

function drawSun(ctx, w, h) {
  const y = h*.935;
  const r = Math.min(w,h)*.26;
  ctx.save();
  const g = ctx.createLinearGradient(0,y-r,0,y);
  g.addColorStop(0,'rgba(255,211,119,.86)');
  g.addColorStop(.55,'rgba(255,110,145,.82)');
  g.addColorStop(1,'rgba(214,74,154,.68)');
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.arc(w*.5,y,r,Math.PI,0);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w*.5,y,r,Math.PI,0);
  ctx.clip();
  ctx.fillStyle='rgba(28,20,58,.35)';
  for(let i=0;i<6;i++) ctx.fillRect(0,y-r*.72+i*h*.024,w,h*.008);
  ctx.restore();
}

export function drawCover(canvas, photos, caption, crops) {
  const ctx=canvas.getContext('2d');
  const w=canvas.width, h=canvas.height;
  const bg=ctx.createLinearGradient(0,0,w*.15,h);
  bg.addColorStop(0,'#431735');
  bg.addColorStop(.48,'#25204b');
  bg.addColorStop(1,'#101936');
  ctx.fillStyle=bg;
  ctx.fillRect(0,0,w,h);
  const panels=panelLayout(w,h);
  for(const name of ['main','mid','close']) {
    drawPhoto(ctx,photos[name],panels[name],crops[name]);
  }
  drawSun(ctx,w,h);
  ctx.save();
  ctx.strokeStyle='rgba(255,237,216,.9)';
  ctx.lineWidth=Math.max(2,w*.002);
  const edge=w*.018;
  ctx.strokeRect(edge,edge,w-edge*2,h-edge*2);
  ctx.fillStyle='#fff3df';
  ctx.font=`900 ${Math.max(12,w*.017)}px Arial,sans-serif`;
  ctx.letterSpacing=`${Math.max(1,w*.002)}px`;
  ctx.fillText('NEON HOURS',w*.045,h*.925);
  ctx.textAlign='right';
  ctx.fillStyle='#70dde6';
  ctx.font=`800 ${Math.max(10,w*.011)}px Arial,sans-serif`;
  ctx.fillText('NIGHT SERIES · VOL. 07',w*.955,h*.925);
  ctx.restore();
  drawTitle(ctx,caption,w,h);
  ctx.save();
  ctx.textAlign='center';
  ctx.fillStyle='rgba(255,244,226,.72)';
  ctx.font=`700 ${Math.max(8,w*.008)}px Arial,sans-serif`;
  ctx.fillText('THREE FRAMES · ONE NIGHT · YOUR STORY',w/2,h*.978);
  ctx.restore();
}
