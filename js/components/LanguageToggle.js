import { html } from '../utils/html.js';
import { languages, getLang, t } from '../i18n/index.js';

export function LanguageToggle() {
  const current = getLang();

  return html`
    <div class="lang-toggle" role="group" aria-label="${t('ui.language')}">
      ${languages.map(({ code, label }) => html`
        <button type="button" data-lang="${code}" aria-pressed="${code === current}">${label}</button>
      `)}
    </div>`;
}
