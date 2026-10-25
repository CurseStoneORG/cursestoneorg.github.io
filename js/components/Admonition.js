import { html } from '../utils/html.js';

const ICONS = {
  note: 'fa-circle-info',
  tip: 'fa-lightbulb',
  warning: 'fa-triangle-exclamation',
};

export function Admonition({ type = 'note', title, body }) {
  return html`
    <div class="admonition ${type}">
      <p class="admonition-title"><i class="fa-solid ${ICONS[type]}"></i> ${title}</p>
      <p>${body}</p>
    </div>`;
}
