import { pages } from './pages/index.js';
import { site } from './data/site.js';
import { t } from './i18n/index.js';
import { initSidebar, renderSidebar, markActive } from './components/Sidebar.js';
import { Breadcrumbs } from './components/Breadcrumbs.js';
import { Pager } from './components/Pager.js';
import { Footer } from './components/Footer.js';
import { initCopyButtons } from './behaviors/copy.js';
import { initTheme } from './behaviors/theme.js';
import { initLanguage } from './behaviors/language.js';
import { stylesheetsReady, fontsReady, trackLoad, finishLoader, failLoader } from './behaviors/loader.js';

const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('nav-scrim');
const breadcrumbs = document.getElementById('breadcrumbs');
const page = document.getElementById('page');
const pager = document.getElementById('pager');
const footer = document.getElementById('footer');
const menuToggle = document.getElementById('menu-toggle');
const description = document.querySelector('meta[name="description"]');

function currentIndex() {
  const id = location.hash.slice(1);
  return Math.max(pages.findIndex(item => item.id === id), 0);
}

function renderPage({ resetScroll = true } = {}) {
  const index = currentIndex();
  const current = pages[index];

  document.title = `${current.title()} — ${site.name}`;
  description.content = t('meta.description');
  menuToggle.setAttribute('aria-label', t('nav.open'));

  renderSidebar(sidebar, pages);
  markActive(sidebar, current.id);

  breadcrumbs.innerHTML = Breadcrumbs(current);
  page.innerHTML = current.render();
  pager.innerHTML = Pager(pages[index - 1], pages[index + 1]);
  footer.innerHTML = Footer();

  if (resetScroll) window.scrollTo(0, 0);

  current.mount?.(page);
}

initSidebar(sidebar);
initCopyButtons();
initTheme();
initLanguage(() => renderPage({ resetScroll: false }));

menuToggle.addEventListener('click', () => {
  document.body.classList.toggle('nav-open');
});

scrim.addEventListener('click', () => document.body.classList.remove('nav-open'));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') document.body.classList.remove('nav-open');
});

window.addEventListener('hashchange', () => renderPage());

async function boot() {
  try {
    await Promise.all([
      trackLoad(stylesheetsReady(), 'loader.styles'),
      trackLoad(fontsReady(), 'loader.fonts'),
    ]);

    await trackLoad(renderPage(), 'loader.components');
    finishLoader();
  } catch (error) {
    failLoader(error);
  }
}

boot();
