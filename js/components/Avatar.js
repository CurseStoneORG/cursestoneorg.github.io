import { html, escapeAttr } from '../utils/html.js';

const AVATAR_HOST = 'https://avatars.githubusercontent.com/';

function avatarSrc(user, size) {
  if (user.avatar?.startsWith(AVATAR_HOST)) {
    const separator = user.avatar.includes('?') ? '&' : '?';
    return `${user.avatar}${separator}s=${size * 2}`;
  }
  return `https://github.com/${encodeURIComponent(user.login)}.png?size=${size * 2}`;
}

export function Avatar(user, size) {
  return html`<img class="avatar" src="${escapeAttr(avatarSrc(user, size))}" alt="" width="${size}" height="${size}" loading="lazy">`;
}
