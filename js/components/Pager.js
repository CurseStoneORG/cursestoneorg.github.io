import { html } from '../utils/html.js';
import { t } from '../i18n/index.js';

export function Pager(previous, next) {
  return html`
    <div class="pager">
      ${previous ? html`
        <a class="btn" href="#${previous.id}">
          <i class="fa-solid fa-arrow-left"></i> ${t('ui.prev')}
        </a>` : ''}
      ${next ? html`
        <a class="btn" href="#${next.id}">
          ${t('ui.next')} <i class="fa-solid fa-arrow-right"></i>
        </a>` : ''}
    </div>`;
}
