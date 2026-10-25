import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { loadLatestRelease } from '../services/release.js';
import { LangIcon } from '../components/LangIcon.js';
import { Button } from '../components/Button.js';

const SPECS = [
  { key: 'target', value: '0.15.x' },
  { key: 'core', value: 'C', icon: 'c' },
  { key: 'logic', value: 'C++20', icon: 'cpp' },
  { key: 'script', value: 'Lua 5.4', icon: 'lua' },
];

const PLATFORMS = ['windows', 'linux', 'android'];

// Cómo se reconoce el binario de cada plataforma en los archivos de la release.
const ASSET_PATTERNS = {
  android: /android|\.apk$/i,
  linux: /linux/i,
  windows: /windows|win32|win64|\.exe$|\.msi$/i,
};

const platformName = name => name[0].toUpperCase() + name.slice(1);

function Spec({ key, value, icon }) {
  return html`
    <div class="spec">
      <dt>${t(`intro.spec.${key}`)}</dt>
      <dd>${icon ? LangIcon(icon, { size: 22 }) : ''}<span>${value}</span></dd>
    </div>`;
}

function Platforms() {
  return html`
    <div class="platforms">
      <p class="platforms-label">${t('intro.platforms')}</p>
      <ul class="platforms-list">
        ${PLATFORMS.map(name => html`<li>${LangIcon(name, { size: 22 })}<span>${platformName(name)}</span></li>`)}
      </ul>
    </div>`;
}

function DownloadMenu() {
  return html`
    <details class="download" data-download>
      <summary class="btn btn-primary btn-lg">
        <i class="fa-solid fa-download" aria-hidden="true"></i>
        <span>${t('cta.download')}</span>
        <i class="fa-solid fa-chevron-down download-chevron" aria-hidden="true"></i>
      </summary>
      <ul class="download-menu">
        ${PLATFORMS.map(name => html`
          <li>
            <a class="download-item" data-platform="${name}" href="${site.repo.releases}" target="_blank" rel="noopener noreferrer">
              ${LangIcon(name, { size: 22 })}
              <span class="download-name">${platformName(name)}</span>
              <i class="fa-solid fa-download download-go" aria-hidden="true"></i>
            </a>
          </li>`)}
      </ul>
    </details>`;
}

function closeOnOutsideClick(details) {
  const close = event => {
    if (!details.isConnected) {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
      return;
    }
    if (event.type === 'keydown' ? event.key === 'Escape' : !details.contains(event.target)) {
      details.open = false;
    }
  };

  document.addEventListener('click', close);
  document.addEventListener('keydown', close);
}

async function mountDownload(root) {
  const details = root.querySelector('[data-download]');
  if (!details) return;

  closeOnOutsideClick(details);

  let release = null;

  try {
    release = await loadLatestRelease();
  } catch {
    // Sin release los enlaces se quedan apuntando a la página de releases de GitHub.
  }

  if (!release || !details.isConnected) return;

  details.querySelectorAll('[data-platform]').forEach(link => {
    const asset = release.assets.find(item => ASSET_PATTERNS[link.dataset.platform].test(item.name));

    if (asset) {
      link.href = asset.url;
      link.title = asset.name;
      return;
    }

    // No hay binario de esa plataforma en la última release.
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.setAttribute('aria-disabled', 'true');
    link.querySelector('.download-go').outerHTML = `<span class="download-na">${t('cta.unavailable')}</span>`;
  });
}

export default {
  id: 'introduccion',
  title: () => t('nav.intro'),

  render: () => html`
    <h1>${t('intro.title')}</h1>

    <p class="lead">${t('intro.lead')}</p>

    <div class="button-row">
      ${DownloadMenu()}
      ${Button({ href: '#documentacion', label: t('cta.docs'), icon: 'fa-solid fa-book', size: 'lg' })}
    </div>

    <figure class="banner">
      <a href="${site.repo.url}" target="_blank" rel="noopener noreferrer">
        <img class="banner-light" src="${site.banner.light}" alt="${t('intro.bannerAlt')}" width="1280" height="640" loading="lazy">
        <img class="banner-dark" src="${site.banner.dark}" alt="" width="1280" height="640" loading="lazy">
      </a>
    </figure>

    ${Platforms()}

    <dl class="spec-row">
      ${SPECS.map(Spec)}
    </dl>
  `,

  mount: mountDownload,
};
