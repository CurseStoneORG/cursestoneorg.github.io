import { html } from '../utils/html.js';
import { site } from '../data/site.js';
import { t } from '../i18n/index.js';
import { SocialCard } from '../components/SocialCard.js';

export default {
  id: 'redes',
  title: () => t('nav.socials'),

  render: () => html`
    <h1>${t('socials.title')}</h1>

    <p>${t('socials.lead')}</p>

    <div class="link-grid">
      ${site.socials.map(SocialCard)}
    </div>
  `,
};
