export async function runShot(name, query, loadCaption) {
  if (name === 'cover') document.body.classList.add('shot-cover');
  await loadCaption(query.get('caption') ?? 'MIDNIGHT HEAT');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
