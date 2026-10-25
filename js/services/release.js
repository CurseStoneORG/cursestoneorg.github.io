import { site } from '../data/site.js';

const { api, listApi, cacheKey, listCacheKey, ttl, retryDelay } = site.release;
const NOTES_MAX = 8000;

function slim(release) {
  return {
    tag: release.tag_name,
    name: release.name || release.tag_name,
    url: release.html_url,
    publishedAt: release.published_at || release.created_at,
    prerelease: Boolean(release.prerelease),
    notes: (release.body || '').slice(0, NOTES_MAX),
    // Solo los archivos que se subieron a la release: el código fuente (zip/tar.gz) se ignora a propósito.
    assets: (release.assets ?? []).map(asset => ({
      name: asset.name,
      size: asset.size,
      downloads: asset.download_count,
      url: asset.browser_download_url,
    })),
  };
}

/** Crea un cargador con caché en localStorage, ETag y reintento diferido si GitHub falla. */
function cachedLoader({ url, key, parse, empty }) {
  let pending = null;

  const read = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      return cached && 'data' in cached ? cached : null;
    } catch {
      return null;
    }
  };

  const write = entry => {
    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Sin almacenamiento disponible: se consulta la API en cada visita.
    }
  };

  async function request(cached) {
    const headers = { Accept: 'application/vnd.github+json' };
    if (cached?.etag) headers['If-None-Match'] = cached.etag;

    const response = await fetch(url, { headers });

    if (response.status === 304 && cached) {
      write({ ...cached, savedAt: Date.now() });
      return cached.data;
    }

    // 404: el repositorio todavía no tiene ninguna release publicada.
    if (response.status === 404) {
      write({ etag: null, savedAt: Date.now(), data: empty });
      return empty;
    }

    if (!response.ok) throw new Error(`GitHub respondió ${response.status}`);

    const data = parse(await response.json());
    write({ etag: response.headers.get('ETag'), savedAt: Date.now(), data });
    return data;
  }

  return async function load() {
    const cached = read();
    if (cached && Date.now() - cached.savedAt < ttl) return cached.data;

    pending ??= request(cached)
      .catch(error => {
        if (!cached) throw error;
        write({ ...cached, savedAt: Date.now() - ttl + retryDelay });
        return cached.data;
      })
      .finally(() => {
        pending = null;
      });

    return pending;
  };
}

/** Última release estable, o `null` si el repositorio no tiene ninguna. */
export const loadLatestRelease = cachedLoader({ url: api, key: cacheKey, parse: slim, empty: null });

/** Todas las releases y pre-releases publicadas (la más reciente primero). */
export const loadReleases = cachedLoader({
  url: listApi,
  key: listCacheKey,
  parse: list => list.filter(release => !release.draft).map(slim),
  empty: [],
});

export const totalDownloads = release => release.assets.reduce((sum, asset) => sum + (asset.downloads || 0), 0);
