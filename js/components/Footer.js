import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';

export function Footer() {
  return html`<p>${t('footer.copyright', { year: new Date().getFullYear(), name: site.name })}</p>`;
}
