// Neon Hours — poster studio editor.
//
// Owns the controls, the live preview canvas and the export. The poster
// itself is drawn by cover.js; this file only decides what goes into it:
// which photos sit in which panels, how each panel is cropped, what the
// headline says, and which post size the poster is rendered at.

import { drawPoster } from './cover.js';

const FORMATS = {
  square: { label: 'SQUARE · 1080×1080', width: 1080, height: 1080 },
  portrait: { label: 'PORTRAIT · 1080×1350', width: 1080, height: 1350 },
  wide: { label: 'WIDE · 1920×1080', width: 1920, height: 1080 },
};

const PANELS = ['main', 'mid', 'close'];

const SAMPLE_FILES = [
  { name: 'boulevard.jpg', src: 'samples/boulevard.jpg' },
  { name: 'pier.jpg', src: 'samples/pier.jpg' },
];

const PRESETS = ['AFTER THE LAST CALL', 'NEVER LOOK BACK'];

const state = {
  photos: [], // { name, img } in load order
  assign: { main: null, mid: null, close: null }, // photo index per panel, or null
  crops: {
    main: { zoom: 1, x: 0, y: 0 },
    mid: { zoom: 1, x: 0, y: 0 },
    close: { zoom: 1, x: 0, y: 0 },
  },
  activePanel: 'main',
  headline: 'MIDNIGHT HEAT',
  format: 'square',
};

const $ = (id) => document.getElementById(id);
const canvas = $('poster');
const sizeLabel = $('canvasSize');
const statusLine = $('statusLine');

function photoFor(panel) {
  const index = state.assign[panel];
  if (index === null || index === undefined) return null;
  const entry = state.photos[index];
  return entry ? entry.img : null;
}

function repaint() {
  const format = FORMATS[state.format];
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext('2d');
  drawPoster(ctx, format.width, format.height, {
    photos: { main: photoFor('main'), mid: photoFor('mid'), close: photoFor('close') },
    crops: state.crops,
    headline: state.headline,
  });
  sizeLabel.textContent = `${format.width} × ${format.height}`;
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function rebuildPhotoControls() {
  // Chips showing every loaded photo by name.
  const chips = $('photoChips');
  chips.innerHTML = '';
  state.photos.forEach((entry, index) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = entry.name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'chip-remove';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${entry.name}`);
    remove.addEventListener('click', () => {
      state.photos.splice(index, 1);
      for (const panel of PANELS) {
        if (state.assign[panel] === index) state.assign[panel] = null;
        else if (state.assign[panel] !== null && state.assign[panel] > index) state.assign[panel] -= 1;
      }
      rebuildPhotoControls();
      repaint();
    });
    chip.appendChild(remove);
    chips.appendChild(chip);
  });

  // One dropdown per panel, assigning a loaded photo to that panel.
  for (const panel of PANELS) {
    const select = $(`select-${panel}`);
    const current = state.assign[panel];
    select.innerHTML = '';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No photo';
    select.appendChild(none);
    state.photos.forEach((entry, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = entry.name;
      select.appendChild(option);
    });
    select.value = current === null || current === undefined ? '' : String(current);
  }
}

function syncCropControls() {
  const crop = state.crops[state.activePanel];
  $('zoomRange').value = String(crop.zoom);
  $('zoomValue').textContent = `${crop.zoom.toFixed(2)}×`;
  $('xRange').value = String(crop.x);
  $('xValue').textContent = crop.x > 0 ? `+${crop.x}` : `${crop.x}`;
  $('yRange').value = String(crop.y);
  $('yValue').textContent = crop.y > 0 ? `+${crop.y}` : `${crop.y}`;
  document.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.panel === state.activePanel);
  });
}

function markReady() {
  // Two animation frames after the samples settle, so the harness only
  // screenshots a fully painted poster.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.__shotReady = true;
    });
  });
}

async function loadSamples(firstName) {
  const ordered = [...SAMPLE_FILES].sort((a, b) => {
    if (a.name === firstName) return -1;
    if (b.name === firstName) return 1;
    return 0;
  });
  for (const file of ordered) {
    const img = await loadImage(file.src);
    if (img) state.photos.push({ name: file.name, img });
  }
  if (state.photos.length > 0) {
    state.assign.main = 0;
    state.assign.mid = state.photos.length > 1 ? 1 : 0;
    state.assign.close = state.photos.length > 1 ? 1 : 0;
  }
  rebuildPhotoControls();
  repaint();
  markReady();
}

function addFiles(files) {
  const images = [...files].filter((file) => file.type.startsWith('image/'));
  if (images.length === 0) return;
  let pending = images.length;
  for (const file of images) {
    const url = URL.createObjectURL(file);
    loadImage(url).then((img) => {
      if (img) {
        state.photos.push({ name: file.name, img });
        rebuildPhotoControls();
        repaint();
      } else {
        URL.revokeObjectURL(url);
      }
      pending -= 1;
      if (pending === 0) statusLine.textContent = `${images.length} photo${images.length > 1 ? 's' : ''} added. Your photo stays on this device.`;
    });
  }
}

function exportPng() {
  const format = FORMATS[state.format];
  const fileName = `neon-hours-${format.width}x${format.height}.png`;
  canvas.toBlob((blob) => {
    if (!blob) {
      statusLine.textContent = 'Export failed in this browser. Try again.';
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    statusLine.textContent = `Exported ${fileName}. Your photo stays on this device.`;
  }, 'image/png');
}

function formatForViewport() {
  const ratio = window.innerWidth / window.innerHeight;
  if (ratio >= 1.35) return 'wide';
  if (window.innerHeight / window.innerWidth >= 1.2) return 'portrait';
  return 'square';
}

function init() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('caption')) {
    state.headline = params.get('caption').slice(0, 32);
  }

  const shot = params.get('shot');
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.format = formatForViewport();
  }

  const headlineInput = $('headlineInput');
  headlineInput.value = state.headline;
  headlineInput.setAttribute('maxlength', '32');
  headlineInput.addEventListener('input', () => {
    state.headline = headlineInput.value.slice(0, 32);
    repaint();
  });

  document.querySelectorAll('.headline-preset').forEach((button) => {
    button.addEventListener('click', () => {
      state.headline = button.dataset.headline;
      headlineInput.value = state.headline;
      repaint();
    });
  });

  const dropzone = $('dropzone');
  const fileInput = $('fileInput');
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('dragging');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('dragging');
    addFiles(event.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => {
    addFiles(fileInput.files);
    fileInput.value = '';
  });

  for (const panel of PANELS) {
    $(`select-${panel}`).addEventListener('change', (event) => {
      state.assign[panel] = event.target.value === '' ? null : Number(event.target.value);
      repaint();
    });
  }

  document.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      state.activePanel = tab.dataset.panel;
      syncCropControls();
    });
  });

  $('zoomRange').addEventListener('input', (event) => {
    state.crops[state.activePanel].zoom = Number(event.target.value);
    syncCropControls();
    repaint();
  });
  $('xRange').addEventListener('input', (event) => {
    state.crops[state.activePanel].x = Number(event.target.value);
    syncCropControls();
    repaint();
  });
  $('yRange').addEventListener('input', (event) => {
    state.crops[state.activePanel].y = Number(event.target.value);
    syncCropControls();
    repaint();
  });

  const formatSelect = $('formatSelect');
  formatSelect.value = state.format;
  formatSelect.addEventListener('change', () => {
    state.format = formatSelect.value;
    repaint();
  });

  $('exportButton').addEventListener('click', exportPng);

  syncCropControls();
  repaint();
  loadSamples(params.get('photo') === 'pier' ? 'pier.jpg' : 'boulevard.jpg');
}

init();
