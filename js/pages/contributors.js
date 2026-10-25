import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { loadContributors } from '../services/contributors.js';
import { Admonition } from '../components/Admonition.js';
import { Button } from '../components/Button.js';
import { ContributorList } from '../components/ContributorList.js';
import { ContributorSkeleton } from '../components/ContributorSkeleton.js';

function failureNotice() {
  const link = `<a href="${site.repo.graphs}" target="_blank" rel="noopener noreferrer">GitHub</a>`;

  return Admonition({
    type: 'warning',
    title: t('contributors.failTitle'),
    body: t('contributors.failBody', { link }),
  });
}

export default {
  id: 'contribuidores',
  title: () => t('nav.contributors'),

  render: () => html`
    <h1>${t('contributors.title')}</h1>

    <p>${t('contributors.lead', { count: site.contributors.limit })}</p>

    <div data-contributors aria-live="polite" aria-busy="true">
      <p class="status">${t('contributors.loading')}</p>
      ${ContributorSkeleton()}
    </div>

    <section class="panel">
      <h2>${t('contributors.cta.title')}</h2>
      <p>${t('contributors.cta.body')}</p>
      <div class="button-row">
        ${Button({ href: site.repo.issues, label: t('repo.issues'), icon: 'fa-solid fa-circle-dot', variant: 'primary' })}
        ${Button({ href: site.repo.pulls, label: t('repo.pulls'), icon: 'fa-solid fa-code-pull-request' })}
        ${Button({ href: site.discord, label: 'Discord', icon: 'fa-brands fa-discord' })}
      </div>
    </section>
  `,

  async mount(root) {
    const target = root.querySelector('[data-contributors]');
    let content;

    try {
      content = ContributorList(await loadContributors());
    } catch {
      content = failureNotice();
    }

    if (!target.isConnected) return;
    target.innerHTML = content;
    target.setAttribute('aria-busy', 'false');
  },
};
