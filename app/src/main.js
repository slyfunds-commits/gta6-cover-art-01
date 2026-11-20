import { drawCover } from "./cover.js";
import { announceReady, applyShotMode } from "./shots.js";

const canvas = document.querySelector("#poster");
const contextControls = {
  files: document.querySelector("#photo-files"),
  chips: document.querySelector("#photo-chips"),
  headline: document.querySelector("#headline"),
  format: document.querySelector("#format"),
  size: document.querySelector("#canvas-size"),
  zoom: document.querySelector("#zoom"),
  zoomValue: document.querySelector("#zoom-value"),
  panX: document.querySelector("#pan-x"),
  panY: document.querySelector("#pan-y"),
  status: document.querySelector("#export-status"),
};
const formats = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};
const sceneSelects = {
  main: document.querySelector("#photo-main"),
  mid: document.querySelector("#photo-mid"),
  close: document.querySelector("#photo-close"),
};
const scenes = [];
const crops = {
  main: { zoom: 1, x: 0, y: 0 },
  mid: { zoom: 1, x: 0, y: 0 },
  close: { zoom: 1, x: 0, y: 0 },
};
let activePanel = "main";

function renderChips() {
  contextControls.chips.replaceChildren();
  scenes.forEach((scene, index) => {
    const chip = document.createElement("span");
    chip.className = "photo-chip";
    chip.textContent = scene.name;
    chip.title = `Photo ${index + 1}: ${scene.name}`;
    contextControls.chips.append(chip);
  });
}

function refreshSceneSelectors() {
  Object.entries(sceneSelects).forEach(([panel, select]) => {
    const previous = select.value;
    select.replaceChildren();
    scenes.forEach((scene, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = scene.name;
      select.append(option);
    });
    if (scenes.length) {
      const fallback = panel === "main" ? 0 : Math.min(1, scenes.length - 1);
      select.value = scenes.some((_, index) => String(index) === previous) ? previous : String(fallback);
    }
  });
}

function repaint() {
  const [width, height] = formats[contextControls.format.value];
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  contextControls.size.value = `${width} × ${height}`;
  const images = Object.fromEntries(Object.entries(sceneSelects).map(([panel, select]) => {
    return [panel, scenes[Number(select.value)]?.image ?? null];
  }));
  drawCover(canvas, images, contextControls.headline.value, crops);
}

function addLocalPhoto(file, url = URL.createObjectURL(file)) {
  const image = new Image();
  image.onload = () => {
    scenes.push({ name: file.name, image, url });
    renderChips();
    refreshSceneSelectors();
    repaint();
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    contextControls.status.textContent = `Could not read ${file.name}. Choose a different image.`;
  };
  image.src = url;
}

function loadBundledPhoto(name) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      scenes.push({ name, image, url: image.src });
      renderChips();
      refreshSceneSelectors();
      repaint();
      resolve();
    };
    image.onerror = () => {
      contextControls.status.textContent = `Bundled sample ${name} could not be loaded.`;
      resolve();
    };
    image.src = `./samples/${name}`;
  });
}

contextControls.files.addEventListener("change", (event) => {
  for (const file of event.target.files) {
    if (file.type.startsWith("image/")) addLocalPhoto(file);
  }
  event.target.value = "";
});

Object.entries(sceneSelects).forEach(([panel, select]) => {
  select.addEventListener("change", () => {
    if (panel === activePanel) repaint();
    else repaint();
  });
});

document.querySelectorAll(".panel-tabs button").forEach((button) => {
  button.addEventListener("click", () => {
    activePanel = button.dataset.panel;
    document.querySelector(".panel-tabs .active")?.classList.remove("active");
    button.classList.add("active");
    const crop = crops[activePanel];
    contextControls.zoom.value = String(crop.zoom);
    contextControls.zoomValue.value = `${crop.zoom.toFixed(2)}×`;
    contextControls.panX.value = String(crop.x);
    contextControls.panY.value = String(crop.y);
  });
});

contextControls.zoom.addEventListener("input", () => {
  crops[activePanel].zoom = Number(contextControls.zoom.value);
  contextControls.zoomValue.value = `${crops[activePanel].zoom.toFixed(2)}×`;
  repaint();
});
contextControls.panX.addEventListener("input", () => {
  crops[activePanel].x = Number(contextControls.panX.value);
  repaint();
});
contextControls.panY.addEventListener("input", () => {
  crops[activePanel].y = Number(contextControls.panY.value);
  repaint();
});

contextControls.headline.addEventListener("input", repaint);
contextControls.format.addEventListener("change", repaint);
document.querySelectorAll("[data-caption]").forEach((button) => {
  button.addEventListener("click", () => {
    contextControls.headline.value = button.dataset.caption;
    repaint();
  });
});

document.querySelector("#export").addEventListener("click", () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      contextControls.status.textContent = "PNG export failed. Please try again.";
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `neon-hours-${canvas.width}x${canvas.height}.png`;
    link.click();
    URL.revokeObjectURL(url);
    contextControls.status.textContent = `Exported neon-hours-${canvas.width}x${canvas.height}.png`;
  }, "image/png");
});

const query = new URLSearchParams(location.search);
if (query.has("caption")) contextControls.headline.value = query.get("caption").slice(0, 32);
applyShotMode(query.get("shot"));
if (query.get("shot") === "cover") {
  const aspect = window.innerWidth / window.innerHeight;
  contextControls.format.value = aspect >= 1.35 ? "wide" : window.innerHeight / window.innerWidth >= 1.2 ? "portrait" : "square";
}
repaint();
const firstSample = query.get("photo") === "pier" ? "pier.jpg" : "boulevard.jpg";
const secondSample = firstSample === "pier.jpg" ? "boulevard.jpg" : "pier.jpg";
Promise.all([loadBundledPhoto(firstSample), loadBundledPhoto(secondSample)]).then(() => {
  sceneSelects.main.value = "0";
  sceneSelects.mid.value = scenes.length > 1 ? "1" : "0";
  sceneSelects.close.value = scenes.length > 1 ? "1" : "0";
  repaint();
  announceReady();
});
