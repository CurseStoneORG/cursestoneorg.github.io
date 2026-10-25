import { site } from '../data/site.js';

const { api, cacheKey, ttl, retryDelay, ignore } = site.contributors;

let pending = null;

function slim(user) {
  return {
    login: user.login,
    avatar: user.avatar_url,
    commits: user.contributions,
    bot: user.type === 'Bot' || /\[bot\]$/i.test(user.login),
  };
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    return Array.isArray(cached?.users) ? cached : null;
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // Sin almacenamiento disponible: se consulta la API en cada visita.
  }
}

async function request(cached) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (cached?.etag) headers['If-None-Match'] = cached.etag;

  const response = await fetch(api, { headers });

  if (response.status === 304 && cached) {
    writeCache({ ...cached, savedAt: Date.now() });
    return cached.users;
  }
  if (!response.ok && response.status !== 204) {
    throw new Error(`GitHub respondió ${response.status}`);
  }

  const data = response.status === 204 ? [] : await response.json();
  const users = data.map(slim);
  writeCache({ etag: response.headers.get('ETag'), savedAt: Date.now(), users });
  return users;
}

function select(users) {
  const people = users
    .filter(user => !user.bot && !ignore.includes(user.login.toLowerCase()))
    .sort((a, b) => b.commits - a.commits);

  return {
    people,
    totalCommits: people.reduce((sum, user) => sum + user.commits, 0),
  };
}

export async function loadContributors() {
  const cached = readCache();

  if (cached && Date.now() - cached.savedAt < ttl) {
    return select(cached.users);
  }

  pending ??= request(cached)
    .catch(error => {
      if (!cached) throw error;
      writeCache({ ...cached, savedAt: Date.now() - ttl + retryDelay });
      return cached.users;
    })
    .finally(() => {
      pending = null;
    });

  return select(await pending);
}
