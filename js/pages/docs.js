import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { Button } from '../components/Button.js';

function DocPanel({ key, href, icon }) {
  return html`
    <section class="panel">
      <h2>${t(`docs.${key}.title`)}</h2>
      <p>${t(`docs.${key}.description`)}</p>
      ${Button({ href, label: t(`docs.${key}.button`), icon, variant: 'primary', size: 'lg' })}
    </section>`;
}

export default {
  id: 'documentacion',
  title: () => t('nav.docs'),

  render: () => html`
    <h1>${t('docs.title')}</h1>

    <p>${t('docs.lead')}</p>

    ${DocPanel({ key: 'initial', href: site.docs.initial, icon: 'fa-solid fa-book' })}
    ${DocPanel({ key: 'full', href: site.docs.full, icon: 'fa-solid fa-code' })}
  `,
};
