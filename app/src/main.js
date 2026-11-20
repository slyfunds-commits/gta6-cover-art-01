import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const caption = document.getElementById('caption');
const status = document.getElementById('status');
const panelNames = ['hero', 'top', 'bottom'];
const sizes = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };
const photos = new Map();
const selected = { hero: null, top: null, bottom: null };
const crops = {
  hero: { zoom: 1, x: 0, y: 0 },
  top: { zoom: 1, x: 0, y: 0 },
  bottom: { zoom: 1, x: 0, y: 0 },
};
let activePanel = 'hero';
let photoNumber = 0;

function redraw() {
  drawCover(canvas, Object.fromEntries(panelNames.map(name => [name, photos.get(selected[name])?.image ?? null])), caption.value, crops);
}

function readImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = url;
  });
}

function photoLabel(photo) {
  return photo.name.length > 20 ? `${photo.name.slice(0, 17)}…` : photo.name;
}

function refreshPhotoControls() {
  const chips = document.getElementById('photo-list');
  chips.replaceChildren();
  for (const [id, photo] of photos) {
    const chip = document.createElement('span');
    chip.className = 'photo-chip';
    chip.textContent = photoLabel(photo);
    chip.title = photo.name;
    chips.append(chip);
  }
  for (const panel of panelNames) {
    const select = document.getElementById(`photo-${panel}`);
    const previous = selected[panel];
    select.replaceChildren();
    for (const [id, photo] of photos) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = photoLabel(photo);
      select.append(option);
    }
    if (photos.has(previous)) select.value = previous;
    else if (photos.size) {
      selected[panel] = photos.keys().next().value;
      select.value = selected[panel];
    }
  }
}

async function addPhoto(url, name, file) {
  const image = await readImage(url);
  const id = `photo-${++photoNumber}`;
  photos.set(id, { image, name, file, url });
  return id;
}

function setActivePanel(panel) {
  activePanel = panel;
  document.querySelectorAll('.crop-tab').forEach(button => {
    button.classList.toggle('active', button.dataset.panel === panel);
  });
  const crop = crops[panel];
  document.getElementById('zoom').value = crop.zoom;
  document.getElementById('zoom-value').value = `${Number(crop.zoom).toFixed(1)}×`;
  document.getElementById('offset-x').value = crop.x;
  document.getElementById('offset-y').value = crop.y;
}

document.getElementById('photos').addEventListener('change', async event => {
  const files = [...event.target.files].filter(file => file.type.startsWith('image/'));
  if (!files.length) return;
  status.textContent = `Adding ${files.length} photo${files.length === 1 ? '' : 's'} locally…`;
  try {
    const ids = await Promise.all(files.map(file => addPhoto(URL.createObjectURL(file), file.name, file)));
    refreshPhotoControls();
    for (const panel of panelNames) selected[panel] = ids[0];
    refreshPhotoControls();
    redraw();
    status.textContent = `${files.length} photo${files.length === 1 ? '' : 's'} ready — nothing was uploaded.`;
  } catch (error) {
    status.textContent = error.message;
  }
  event.target.value = '';
});

for (const panel of panelNames) {
  document.getElementById(`photo-${panel}`).addEventListener('change', event => {
    selected[panel] = event.target.value;
    redraw();
  });
}

document.querySelectorAll('.crop-tab').forEach(button => {
  button.addEventListener('click', () => setActivePanel(button.dataset.panel));
});

document.getElementById('zoom').addEventListener('input', event => {
  crops[activePanel].zoom = Number(event.target.value);
  document.getElementById('zoom-value').value = `${crops[activePanel].zoom.toFixed(1)}×`;
  redraw();
});
document.getElementById('offset-x').addEventListener('input', event => {
  crops[activePanel].x = Number(event.target.value);
  redraw();
});
document.getElementById('offset-y').addEventListener('input', event => {
  crops[activePanel].y = Number(event.target.value);
  redraw();
});

caption.addEventListener('input', redraw);
document.querySelectorAll('[data-caption]').forEach(button => {
  button.addEventListener('click', () => {
    caption.value = button.dataset.caption;
    redraw();
  });
});

document.getElementById('size').addEventListener('change', event => {
  const [width, height] = sizes[event.target.value];
  canvas.width = width;
  canvas.height = height;
  document.getElementById('preview-dimensions').textContent = `${width} × ${height} PX`;
  redraw();
});

document.getElementById('export').addEventListener('click', () => {
  canvas.toBlob(blob => {
    if (!blob) {
      status.textContent = 'PNG export failed. Please try again.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `neon-hours-${canvas.width}x${canvas.height}.png`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = `Saved neon-hours-${canvas.width}x${canvas.height}.png`;
  }, 'image/png');
});

async function initialize() {
  const shotQuery = new URLSearchParams(location.search);
  const shot = shotQuery.get('shot');
  const firstSample = shotQuery.get('photo') ?? 'boulevard';
  const samples = shot === 'editor'
    ? [firstSample, firstSample === 'pier' ? 'boulevard' : 'pier']
    : shot ? [firstSample] : ['boulevard', 'pier'];
  const ids = [];
  for (const name of [...new Set(samples)]) {
    ids.push(await addPhoto(`samples/${name}.jpg`, name, null));
  }
  if (shot === 'editor' && ids.length > 1) {
    selected.hero = ids[0];
    selected.top = ids[1];
    selected.bottom = ids[0];
  } else if (shot) {
    const id = ids[0];
    for (const panel of panelNames) selected[panel] = id;
  } else {
    selected.hero = ids[0];
    selected.top = ids[1];
    selected.bottom = ids[0];
  }
  if (shot) caption.value = shotQuery.get('caption') ?? 'After the Last Call';
  refreshPhotoControls();
  setActivePanel('hero');
  redraw();
  if (shot) {
    await runShot(shot, shotQuery, async (_sample, text) => {
      caption.value = text;
      redraw();
    });
  } else {
    window.__shotReady = true;
  }
}

initialize().catch(error => {
  status.textContent = error.message;
  console.error(error);
});
