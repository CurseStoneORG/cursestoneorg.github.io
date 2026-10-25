import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { Button } from '../components/Button.js';
import { CodeBlock } from '../components/CodeBlock.js';

export default {
  id: 'repositorio',
  title: () => t('nav.repo'),

  render: () => {
    const org = `<a href="${site.organization}" target="_blank" rel="noopener noreferrer">CurseStoneTeam</a>`;

    return html`
      <h1>${t('repo.title')}</h1>

      <p>${t('repo.lead', { org, branch: site.branch })}</p>

      <h2>${t('repo.clone')}</h2>
      ${CodeBlock(`git clone -b ${site.branch} ${site.repo.clone}`)}

      <div class="button-row">
        ${Button({ href: site.repo.url, label: t('repo.button'), icon: 'fa-brands fa-github', variant: 'primary' })}
        ${Button({ href: site.repo.issues, label: t('repo.issues'), icon: 'fa-solid fa-circle-dot' })}
        ${Button({ href: site.repo.pulls, label: t('repo.pulls'), icon: 'fa-solid fa-code-pull-request' })}
      </div>
    `;
  },
};
