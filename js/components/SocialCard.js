import { html, escapeAttr } from '../utils/html.js';
import { t } from '../i18n/index.js';

export function SocialCard({ key, icon, url }) {
  return html`
    <a class="link-card" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">
      <span class="link-icon"><i class="${icon}"></i></span>
      <span class="link-text">
        <strong>${t(`socials.${key}.name`)}</strong>
        <span>${t(`socials.${key}.description`)}</span>
      </span>
    </a>`;
}
