import { html, escapeAttr } from '../utils/html.js';
import { t } from '../i18n/index.js';

export function CodeBlock(code) {
  return html`
    <div class="code-block">
      <pre><code>${code}</code></pre>
      <button class="icon-btn copy-btn" type="button" data-copy="${escapeAttr(code)}" aria-label="${t('ui.copy')}">
        <i class="fa-regular fa-copy"></i>
      </button>
    </div>`;
}
