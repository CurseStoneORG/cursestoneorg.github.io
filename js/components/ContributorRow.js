import { html, escapeHtml, escapeAttr } from '../utils/html.js';
import { t } from '../i18n/index.js';
import { formatCommits } from '../utils/format.js';
import { Avatar } from './Avatar.js';

const PODIUM_SIZE = 3;
const MIN_SHARE = 2;

export function ContributorRow(user, rank, maxCommits) {
  const profile = `https://github.com/${encodeURIComponent(user.login)}`;
  const share = Math.max(Math.round((user.commits / maxCommits) * 100), MIN_SHARE);
  const podium = rank <= PODIUM_SIZE ? ' data-podium' : '';

  return html`
    <li class="contributor"${podium}>
      <span class="contributor-rank">${String(rank).padStart(2, '0')}</span>
      ${Avatar(user, 56)}
      <div class="contributor-body">
        <strong class="contributor-name">${escapeHtml(user.login)}</strong>
        <span class="contributor-commits">${formatCommits(user.commits)}</span>
        <span class="contributor-bar" style="--share: ${share}"></span>
      </div>
      <a class="contributor-link" href="${escapeAttr(profile)}" target="_blank" rel="noopener noreferrer"
         aria-label="${escapeAttr(t('contributors.profileOf', { name: user.login }))}">
        <i class="fa-brands fa-github"></i>
        <span>${t('contributors.profile')}</span>
      </a>
    </li>`;
}
