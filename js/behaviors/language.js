import { setLang } from '../i18n/index.js';

export function initLanguage(onChange) {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-lang]');
    if (!button) return;

    if (setLang(button.dataset.lang)) onChange();
  });
}
