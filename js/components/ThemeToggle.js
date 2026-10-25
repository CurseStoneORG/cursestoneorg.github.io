import { html } from '../utils/html.js';
import { t } from '../i18n/index.js';

export function ThemeToggle() {
  return html`
    <button class="icon-btn" type="button" data-theme-toggle
            aria-label="${t('ui.themeLabel')}" title="${t('ui.theme')}">
      <i class="fa-solid fa-moon theme-icon-moon"></i>
      <i class="fa-solid fa-sun theme-icon-sun"></i>
    </button>`;
}
