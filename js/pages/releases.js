import { html, escapeHtml, escapeAttr } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { formatDate, formatNumber } from '../utils/format.js';
import { loadReleases } from '../services/release.js';
import { Admonition } from '../components/Admonition.js';
import { Button } from '../components/Button.js';
import { ReleaseBadge, registerReleases } from '../components/ReleaseSheet.js';

const SKELETON_TILES = 4;

function Tile(release, isLatest) {
  return html`
    <li>
      <button class="embed release-tile" type="button" data-open-release="${escapeAttr(release.tag)}" aria-label="${t('release.open')} ${escapeAttr(release.tag)}">
        <span class="embed-title">
          <span class="release-version">${escapeHtml(release.tag)}</span>
          ${ReleaseBadge(release, isLatest)}
        </span>
        ${release.name !== release.tag ? html`<span class="embed-name">${escapeHtml(release.name)}</span>` : ''}
        <span class="release-tile-date">${formatDate(release.publishedAt)}</span>
      </button>
    </li>`;
}

function Skeleton() {
  return html`
    <ul class="release-grid" aria-hidden="true">
      ${Array.from({ length: SKELETON_TILES }, () => html`
        <li class="embed release-tile skeleton"><span class="skeleton-line"></span><span class="skeleton-line short"></span><span class="skeleton-line"></span></li>`)}
    </ul>`;
}

function failureNotice() {
  const link = `<a href="${site.repo.releases}" target="_blank" rel="noopener noreferrer">GitHub</a>`;
  return Admonition({ type: 'warning', title: t('release.failTitle'), body: t('release.failBody', { link }) });
}

export default {
  id: 'releases',
  title: () => t('nav.releases'),

  render: () => html`
    <h1>${t('releases.title')}</h1>
    <p>${t('releases.lead')}</p>

    <div data-releases aria-live="polite" aria-busy="true">
      <p class="status">${t('releases.loading')}</p>
      ${Skeleton()}
    </div>

    <div class="button-row releases-foot">
      ${Button({ href: site.repo.releases, label: t('release.allReleases'), icon: 'fa-brands fa-github', size: 'lg' })}
    </div>
  `,

  async mount(root) {
    const target = root.querySelector('[data-releases]');
    let content;

    try {
      const list = await loadReleases();
      registerReleases(list);
      const latest = list.find(release => !release.prerelease);

      content = list.length
        ? html`
            <p class="status">${t('releases.count', { count: formatNumber(list.length) })}</p>
            <ul class="release-grid">${list.map(release => Tile(release, release === latest))}</ul>`
        : Admonition({ type: 'note', title: t('release.emptyTitle'), body: t('release.emptyBody') });

      // La hoja de detalle necesita saber si es la "última" para mostrar su insignia.
      if (latest) latest.isLatest = true;
    } catch {
      content = failureNotice();
    }

    if (!target.isConnected) return;
    target.innerHTML = content;
    target.setAttribute('aria-busy', 'false');
  },
};
