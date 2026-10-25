import { html, escapeHtml } from '../utils/html.js';

/** Embed de un enlace externo: autor, título, descripción y dominio en el pie. */
export function LinkEmbed({ author, title, text, host }) {
  return html`
    <article class="embed">
      <p class="embed-author"><i class="fa-solid fa-user" aria-hidden="true"></i> ${escapeHtml(author)}</p>
      <h3 class="embed-title">${title}</h3>
      <p class="embed-text">${text}</p>
      <p class="embed-footer"><span><i class="fa-solid fa-link" aria-hidden="true"></i>${escapeHtml(host)}</span></p>
    </article>`;
}
