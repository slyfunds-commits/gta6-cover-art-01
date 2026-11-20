export function applyShotMode(mode) {
  document.body.classList.toggle("shot-cover", mode === "cover");
}

export function announceReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
