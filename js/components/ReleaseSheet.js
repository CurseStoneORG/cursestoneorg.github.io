import { html, escapeHtml, escapeAttr } from '../utils/html.js';
import { t } from '../i18n/index.js';
import { formatBytes, formatDate, formatNumber } from '../utils/format.js';
import { renderMarkdown } from '../utils/markdown.js';
import { totalDownloads } from '../services/release.js';

const registry = new Map();
let dialog = null;

export const registerReleases = list => list.forEach(release => registry.set(release.tag, release));

export function ReleaseBadge(release, isLatest) {
  if (release.prerelease) return html`<span class="release-badge is-pre">${t('release.prerelease')}</span>`;
  return isLatest ? html`<span class="release-badge">${t('release.latest')}</span>` : '';
}

export function FileList(release) {
  if (!release.assets.length) return html`<p class="status">${t('release.noFiles')}</p>`;

  return html`
    <ul class="release-assets">
      ${release.assets.map(asset => html`
        <li>
          <a class="release-asset" href="${escapeAttr(asset.url)}" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-file-arrow-down"></i>
            <span class="release-asset-name">${escapeHtml(asset.name)}</span>
            <span class="release-asset-meta">${formatBytes(asset.size)} · ${t('release.downloads', { count: formatNumber(asset.downloads) })}</span>
          </a>
        </li>`)}
    </ul>`;
}

export function Notes(release) {
  const text = release.notes.trim();
  return text
    ? html`<div class="md">${renderMarkdown(text)}</div>`
    : html`<p class="status">${t('release.noNotes')}</p>`;
}

function content(release, mode) {
  const full = mode === 'full';

  return html`
    <div class="sheet-grab" aria-hidden="true"></div>
    <header class="sheet-head">
      <div>
        <p class="release-tag">
          <span class="release-version">${escapeHtml(release.tag)}</span>
          ${ReleaseBadge(release, release.isLatest)}
        </p>
        <p class="release-date">${t('release.published', { date: formatDate(release.publishedAt) })}${full ? ` · ${t('release.downloads', { count: formatNumber(totalDownloads(release)) })}` : ''}</p>
      </div>
      <button class="icon-btn" type="button" data-sheet-close aria-label="${t('release.close')}">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </header>

    <div class="sheet-body">
      ${full ? html`
        <h3>${t('release.assets')}</h3>
        ${FileList(release)}
      ` : ''}

      <h3>${t('release.notes')}</h3>
      ${Notes(release)}

      <div class="button-row sheet-actions">
        <a class="btn btn-lg" href="${escapeAttr(release.url)}" target="_blank" rel="noopener noreferrer">
          <i class="fa-brands fa-github"></i> ${t('release.viewOnGithub')}
        </a>
      </div>
    </div>`;
}

function ensureDialog() {
  if (dialog) return dialog;

  dialog = document.createElement('dialog');
  dialog.className = 'sheet';
  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.closest('[data-sheet-close]')) dialog.close();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('sheet-open'));
  document.body.append(dialog);
  return dialog;
}

export function openReleaseSheet(release, mode = 'full') {
  const sheet = ensureDialog();
  sheet.setAttribute('aria-label', release.tag);
  sheet.innerHTML = content(release, mode);
  document.body.classList.add('sheet-open');
  if (!sheet.open) sheet.showModal();
  sheet.querySelector('.sheet-body').scrollTop = 0;
}

// Un solo listener global: cualquier elemento con data-open-release abre la hoja de esa release.
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-open-release]');
  const release = trigger && registry.get(trigger.dataset.openRelease);
  if (release) openReleaseSheet(release, trigger.dataset.mode || 'full');
});
