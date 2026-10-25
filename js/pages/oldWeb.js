import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { Button } from '../components/Button.js';
import { LinkEmbed } from '../components/LinkEmbed.js';

export default {
  id: 'web-antigua',
  title: () => t('nav.old'),

  render: () => html`
    <h1>${t('old.title')}</h1>

    <p>${t('old.lead')}</p>

    ${LinkEmbed({
      author: site.oldSite.author,
      title: t('old.embed.title'),
      text: t('old.embed.text'),
      host: site.oldSite.host,
    })}

    <div class="button-row">
      ${Button({ href: site.oldSite.url, label: t('old.button'), icon: 'fa-solid fa-arrow-up-right-from-square', variant: 'primary', size: 'lg' })}
    </div>
  `,
};
