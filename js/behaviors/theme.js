const STORAGE_KEY = 'cursestone-theme';

export function initTheme() {
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-theme-toggle]')) return;

    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'dark' ? '#151618' : '#fcfcfc');

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // El tema solo dura mientras la pestaña esté abierta.
    }
  });
}
