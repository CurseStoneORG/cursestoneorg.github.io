import { html, escapeAttr } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { Brand } from './Brand.js';
import { Logo } from './Logo.js';
import { TABS } from '../data/tabs.js';

function Sidebar(pages) {
  return html`
    <div class="sidebar-head">
      <a class="sidebar-title" href="#${pages[0].id}">${Logo({ size: 30 })}<span>${Brand()}</span></a>
      <div class="version"><i class="fa-solid fa-code-branch"></i> ${site.branch}</div>
      <form class="search" role="search">
        <input type="search" placeholder="${t('ui.search')}" aria-label="${t('ui.search')}" autocomplete="off">
      </form>
    </div>

    <ul class="sidebar-menu">
      ${pages.map(page => html`
        <li data-id="${page.id}">
          <a href="#${page.id}"><i class="${TABS[page.id].icon}" aria-hidden="true"></i>${page.title()}</a>
        </li>
      `)}
    </ul>

    <div class="sidebar-foot">
      ${site.socials.map(({ key, icon, url }) => html`
        <a class="icon-btn" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer"
           aria-label="${t(`socials.${key}.name`)}" title="${t(`socials.${key}.name`)}">
          <i class="${icon}"></i>
        </a>
      `)}
    </div>`;
}

export function renderSidebar(root, pages) {
  root.setAttribute('aria-label', t('nav.label'));
  root.innerHTML = Sidebar(pages);
}

export function initSidebar(root) {
  root.addEventListener('submit', event => event.preventDefault());

  root.addEventListener('input', event => {
    if (!event.target.matches('.search input')) return;

    const query = event.target.value.trim().toLowerCase();
    root.querySelectorAll('.sidebar-menu li').forEach(item => {
      item.hidden = !item.textContent.toLowerCase().includes(query);
    });
  });

  root.addEventListener('click', event => {
    if (event.target.closest('.sidebar-menu a')) {
      document.body.classList.remove('nav-open');
    }
  });
}

export function markActive(root, id) {
  root.querySelectorAll('.sidebar-menu li').forEach(item => {
    item.classList.toggle('current', item.dataset.id === id);
  });
}
