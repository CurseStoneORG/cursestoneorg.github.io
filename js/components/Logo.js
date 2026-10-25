import { html, escapeAttr } from '../utils/html.js';
import { site } from '../data/site.js';

export function Logo({ size = 28, className = 'logo' } = {}) {
  return html`<img class="${className}" src="${escapeAttr(site.logo)}" alt="" width="${size}" height="${size}" decoding="async" onerror="this.hidden=true">`;
}
