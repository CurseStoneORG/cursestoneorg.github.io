import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { ThemeToggle } from './ThemeToggle.js';
import { LanguageToggle } from './LanguageToggle.js';

export function Breadcrumbs(page) {
  return html`
    <nav class="breadcrumbs" aria-label="${t('ui.path')}">
      <ul>
        <li><a href="#introduccion">${site.name}</a><span aria-hidden="true">/</span></li>
        <li aria-current="page">${page.title()}</li>
      </ul>
      <div class="toolbar">
        <a class="toolbar-link" href="${site.repo.url}" target="_blank" rel="noopener noreferrer" aria-label="${t('ui.github')}">
          <i class="fa-brands fa-github" aria-hidden="true"></i> <span>${t('ui.github')}</span>
        </a>
        ${LanguageToggle()}
        ${ThemeToggle()}
      </div>
    </nav>`;
}
