import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { formatNumber } from '../utils/format.js';
import { ContributorRow } from './ContributorRow.js';

function Stats({ people, totalCommits }) {
  return html`
    <dl class="stats">
      <div class="stat"><dt>${t('contributors.people')}</dt><dd>${formatNumber(people.length)}</dd></div>
      <div class="stat"><dt>${t('contributors.commits')}</dt><dd>${formatNumber(totalCommits)}</dd></div>
    </dl>`;
}

export function ContributorList(data) {
  const { people } = data;
  const { limit } = site.contributors;

  if (!people.length) {
    return html`<p class="status">${t('contributors.empty')}</p>`;
  }

  const top = people.slice(0, limit);
  const maxCommits = top[0].commits;

  return html`
    ${Stats(data)}

    <ol class="contributor-list">
      ${top.map((user, index) => ContributorRow(user, index + 1, maxCommits))}
    </ol>`;
}
