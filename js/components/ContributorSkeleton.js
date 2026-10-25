import { html } from '../utils/html.js';

const ROWS = 6;

export function ContributorSkeleton() {
  return html`
    <ol class="contributor-list" aria-hidden="true">
      ${Array.from({ length: ROWS }, () => html`
        <li class="contributor skeleton">
          <span class="contributor-rank"></span>
          <span class="avatar"></span>
          <div class="contributor-body">
            <span class="skeleton-line"></span>
            <span class="skeleton-line short"></span>
          </div>
        </li>
      `)}
    </ol>`;
}
