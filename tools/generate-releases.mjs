#!/usr/bin/env node
/**
 * Generador de páginas estáticas de releases y del sitemap de CurseStone.
 *
 * Qué hace:
 *   1. Descarga las releases publicadas de CurseStoneORG/CurseStone (API de GitHub).
 *   2. Genera `releases/index.html` (listado) y `releases/<tag>/index.html` (una página por release)
 *      con HTML estático rastreable: título, meta description, canonical, Open Graph,
 *      Twitter Cards y datos estructurados JSON-LD únicos por página.
 *   3. Regenera `sitemap.xml` con todas las URLs reales del sitio.
 *   4. Guarda una copia de los datos en `tools/releases-data.json` para poder
 *      regenerar sin conexión (`node tools/generate-releases.mjs --offline`).
 *   5. Elimina páginas de releases que ya no existan en GitHub (solo las generadas por este script).
 *
 * Uso:
 *   node tools/generate-releases.mjs                # descarga de GitHub (usa GITHUB_TOKEN si está definido)
 *   GITHUB_TOKEN=ghp_xxx node tools/generate-releases.mjs
 *   node tools/generate-releases.mjs --offline      # regenera con la última copia guardada
 *
 * Las fechas (lastmod) solo se emiten cuando hay una fecha real: cada release usa su
 * `published_at` y la home la fecha real de su último commit. /docs/ y /doxygen-docs/
 * viven en otros repositorios de la organización, así que se listan sin lastmod.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/* ---------- Configuración ---------- */

const SITE_URL = 'https://cursestoneorg.github.io';
const REPO = 'CurseStoneORG/CurseStone';
const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=100`;
const LOGO_URL = 'https://raw.githubusercontent.com/CurseStoneORG/CurseStone/stable/logo.svg';
const SOCIAL_IMAGE =
  'https://socialify.dev/CurseStoneORG/CurseStone/image?description=1&font=Inter&forks=1&issues=1' +
  `&logo=${encodeURIComponent(LOGO_URL)}&name=1&owner=1&pattern=Transparent&pulls=1&stargazers=1&theme=Dark`;

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const RELEASES_DIR = path.join(ROOT, 'releases');
const SNAPSHOT_PATH = path.join(ROOT, 'tools', 'releases-data.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');

const NOTES_MAX = 8000;          // Igual que js/services/release.js.
const META_DESC_MAX = 155;       // Longitud segura para resultados de Google.
const TAG_PATTERN = /^[\w.+-]+$/; // Solo caracteres seguros para URL y sistema de archivos.

// Páginas del sitio que no dependen de este script. lastmod solo con fecha real:
// la home se tocó por última vez en el commit de 2026-11-11 (UTC).
const FIXED_SITEMAP_URLS = [
  { loc: `${SITE_URL}/`, lastmod: '2026-11-11' },
  { loc: `${SITE_URL}/docs/` },                  // Repo CurseStoneORG/docs: sin fecha conocida.
  { loc: `${SITE_URL}/doxygen-docs/` },          // Repo CurseStoneORG/doxygen-docs: sin fecha conocida.
];

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* ---------- Utilidades ---------- */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const escapeAttr = escapeHtml;

/** "10 de noviembre de 2026" a partir de una fecha ISO (UTC, para que sea estable). */
function formatDateEs(iso) {
  const date = new Date(iso);
  return `${date.getUTCDate()} de ${MESES[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

/** "10 noviembre 2026", formato corto para las tarjetas del listado. */
function formatDateShortEs(iso) {
  const date = new Date(iso);
  return `${date.getUTCDate()} ${MESES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Misma lógica que js/utils/format.js (formatBytes) para que coincida con la SPA. */
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toLocaleString('es-ES', { maximumFractionDigits: index ? 1 : 0 })} ${units[index]}`;
}

/** Markdown de notas de GitHub → HTML. Escapa primero y remapea encabezados
 *  (h1→h2, h2→h3, h3+→h4) para respetar la jerarquía de la página. */
function renderMarkdown(source) {
  const inline = text => escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) =>
      `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`)
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, lead, url) =>
      `${lead}<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${url}</a>`);

  const out = [];
  let list = null;
  let paragraph = [];
  let fence = null;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };

  for (const raw of source.replace(/\r/g, '').split('\n')) {
    if (/^\s*```/.test(raw)) {
      if (fence) {
        out.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
        fence = null;
      } else {
        flushParagraph();
        closeList();
        fence = [];
      }
      continue;
    }
    if (fence) {
      fence.push(raw);
      continue;
    }

    const heading = raw.match(/^(#{1,6})\s+(.*)$/);
    const bullet = raw.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = raw.match(/^\s*\d+\.\s+(.*)$/);

    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 4); // h1→h2, h2→h3, resto→h4
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (bullet || numbered) {
      flushParagraph();
      const tag = bullet ? 'ul' : 'ol';
      if (list !== tag) {
        closeList();
        out.push(`<${tag}>`);
        list = tag;
      }
      out.push(`<li>${inline(bullet ? bullet[1] : numbered[1])}</li>`);
    } else if (raw.trim() === '') {
      flushParagraph();
      closeList();
    } else {
      paragraph.push(raw.trim());
    }
  }

  flushParagraph();
  closeList();
  if (fence) out.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
  return out.join('\n');
}

/** Markdown → texto plano para meta description (sin etiquetas ni sintaxis). */
function plainText(source) {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Recorta al límite sin cortar palabras. */
function truncate(text, max = META_DESC_MAX) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]+$/, '')}…`;
}

/** Une base y sufijo solo si la frase completa cabe; nunca deja frases a medias. */
function descriptionWithSuffix(base, suffix) {
  if (!suffix) return truncate(base);
  const full = `${base.replace(/[.\s]+$/, '')}. ${suffix}`;
  return full.length <= META_DESC_MAX ? full : truncate(base);
}

/** Descripción por release: texto real de las notas de GitHub. Nunca se inventa. */
function releaseDescription(release) {
  const text = plainText(release.notes) || `Release ${release.tag} de CurseStone.`;
  return truncate(text);
}

/* ---------- Datos ---------- */

async function fetchReleases() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(RELEASES_API, { headers });
  if (!response.ok) throw new Error(`La API de GitHub respondió ${response.status}`);
  return response.json();
}

/** Normaliza al mismo formato que js/services/release.js (slim). */
function slim(release) {
  return {
    tag: release.tag_name,
    name: release.name || release.tag_name,
    url: release.html_url,
    publishedAt: release.published_at || release.created_at,
    prerelease: Boolean(release.prerelease),
    notes: (release.body || '').slice(0, NOTES_MAX),
    assets: (release.assets ?? []).map(asset => ({
      name: asset.name,
      size: asset.size,
      downloads: asset.download_count,
      url: asset.browser_download_url,
    })),
  };
}

async function loadReleases(offline) {
  if (!offline) {
    try {
      const raw = await fetchReleases();
      const releases = raw.filter(release => !release.draft).map(slim).reverse(); // antiguas → nuevas
      writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(releases, null, 2)}\n`);
      return { releases, source: 'api' };
    } catch (error) {
      if (!existsSync(SNAPSHOT_PATH)) throw error;
      console.warn(`Aviso: no se pudo consultar GitHub (${error.message}). Uso la copia guardada.`);
    }
  }
  return { releases: JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')), source: 'snapshot' };
}

/* ---------- Plantillas ---------- */

const ICONS = {
  arrowLeft: '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.78 3.22a.75.75 0 0 1 0 1.06L6.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06L4.44 8.53a.75.75 0 0 1 0-1.06l4.28-4.25a.75.75 0 0 1 1.06 0z"/></svg>',
  github: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>',
  download: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/></svg>',
};

const SHELL_CSS = `
  .static-shell { max-width: 880px; margin: 0 auto; padding: 28px 20px 48px; }
  .static-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
  .static-header img { width: 30px; height: 30px; object-fit: contain; }
  .static-brand { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-head);
    font-weight: 700; font-size: 1.15rem; color: var(--heading); text-decoration: none; }
  .static-brand:hover { color: var(--heading); }
  .static-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
    gap: 12px; margin: 18px 0 30px; }
  .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem;
    color: var(--muted); text-decoration: none; }
  .back-link:hover { color: var(--link); }
  .release-head { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; margin-bottom: 4px; }
  .release-head .release-version { font-size: 1.8rem; }
  .release-date { color: var(--muted); margin: 0 0 26px; }
  a.release-tile { text-decoration: none; }  /* Igual que la versión botón de la SPA. */
  .static-footer { margin-top: 44px; font-size: 0.82rem; color: var(--muted); }
  .static-footer p { margin: 0; }
`;

/** Cabecera y pie comunes a las páginas estáticas. */
function layout({ title, description, canonical, ogType, publishedTime, jsonLd, content }) {
  const og = [
    `<meta property="og:type" content="${ogType}">`,
    '<meta property="og:site_name" content="CurseStone">',
    '<meta property="og:locale" content="es_ES">',
    `<meta property="og:url" content="${escapeAttr(canonical)}">`,
    `<meta property="og:title" content="${escapeAttr(title)}">`,
    `<meta property="og:description" content="${escapeAttr(description)}">`,
    `<meta property="og:image" content="${escapeAttr(SOCIAL_IMAGE)}">`,
    '<meta property="og:image:alt" content="CurseStone, servidor de Minecraft Pocket Edition">',
    publishedTime ? `<meta property="article:published_time" content="${escapeAttr(publishedTime)}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeAttr(title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(description)}">`,
    `<meta name="twitter:image" content="${escapeAttr(SOCIAL_IMAGE)}">`,
  ].filter(Boolean).join('\n  ');

  return `<!DOCTYPE html>
<html lang="es" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#151618">
  <meta name="color-scheme" content="dark light">
  <meta name="generator" content="cursestone-releases-generator">

  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeAttr(canonical)}">

  ${og}

  <script type="application/ld+json">
  ${jsonLd}
  </script>

  <link rel="icon" href="${escapeAttr(LOGO_URL)}" type="image/svg+xml">

  <script src="/js/theme-init.js"></script>

  <link rel="preload" href="/fonts/Minecraft.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/fonts/Minecraft-Bold.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/components.css">
  <style>${SHELL_CSS}</style>
</head>
<body>
  <div class="static-shell">
    <header class="static-header">
      <a class="static-brand" href="/">
        <img src="${escapeAttr(LOGO_URL)}" alt="" width="30" height="30" onerror="this.hidden=true">
        <span><span class="tone-a">Curse</span><span class="tone-b">Stone</span></span>
      </a>
    </header>

${content}

    <footer class="static-footer">
      <p>© ${new Date().getUTCFullYear()} CurseStone Team · <a href="/">Sitio principal</a> · <a href="https://github.com/${REPO}" target="_blank" rel="noopener noreferrer">GitHub</a></p>
    </footer>
  </div>
</body>
</html>
`;
}

/** Insignia de versión con la misma lógica que la SPA (js/pages/releases.js). */
function badge(release, isLatest) {
  if (release.prerelease) return '<span class="release-badge is-pre">Pre-release</span>';
  return isLatest ? '<span class="release-badge">Última</span>' : '';
}

function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

/* ---------- Página de una release ---------- */

function renderReleasePage(releases, release) {
  const isLatest = releases.find(item => !item.prerelease) === release;
  const canonical = `${SITE_URL}/releases/${release.tag}/`;
  const description = releaseDescription(release);
  const totalDownloads = release.assets.reduce((sum, asset) => sum + (asset.downloads || 0), 0);
  const systems = [...new Set(release.assets.map(asset =>
    /android/i.test(asset.name) ? 'Android' :
    /linux/i.test(asset.name) ? 'Linux' :
    /windows|\.exe$|\.msi$/i.test(asset.name) ? 'Windows' : null).filter(Boolean))].join(', ');

  const assetsSection = release.assets.length ? `
    <h2>Archivos</h2>
    <ul class="release-assets">
${release.assets.map(asset => `      <li><a class="release-asset" href="${escapeAttr(asset.url)}" target="_blank" rel="noopener noreferrer">
        ${ICONS.download}
        <span class="release-asset-name">${escapeHtml(asset.name)}</span>
        <span class="release-asset-meta">${formatBytes(asset.size)} · ${asset.downloads.toLocaleString('es-ES')} descargas</span>
      </a></li>`).join('\n')}
    </ul>` : '';

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: `CurseStone ${release.tag}`,
        softwareVersion: release.tag,
        datePublished: release.publishedAt,
        ...(systems ? { operatingSystem: systems } : {}),
        applicationCategory: 'Game server software',
        description,
        url: canonical,
        downloadUrl: release.url,
        publisher: { '@type': 'Organization', name: 'CurseStone Team', url: `${SITE_URL}/` },
      },
      breadcrumbJsonLd([
        { name: 'CurseStone', url: `${SITE_URL}/` },
        { name: 'Releases', url: `${SITE_URL}/releases/` },
        { name: release.tag },
      ]),
    ],
  }, null, 2);

  const content = `
    <header class="static-top">
      <a class="back-link" href="/releases/">${ICONS.arrowLeft} Releases</a>
      <a class="btn" href="${escapeAttr(release.url)}" target="_blank" rel="noopener noreferrer">${ICONS.github} Ver en GitHub</a>
    </header>

    <article>
      <h1 class="release-head"><span class="release-version">${escapeHtml(release.tag)}</span>${badge(release, isLatest)}</h1>
      <p class="release-date">Publicada el ${formatDateEs(release.publishedAt)}${release.assets.length ? ` · ${totalDownloads.toLocaleString('es-ES')} descargas` : ''}</p>
${assetsSection}
      <h2>Notas de la versión</h2>
      <div class="md">${release.notes.trim() ? renderMarkdown(release.notes) : '<p class="status">Esta release no tiene notas.</p>'}</div>
    </article>`;

  return layout({
    title: `Release ${release.tag} — CurseStone`,
    description,
    canonical,
    ogType: 'article',
    publishedTime: release.publishedAt,
    jsonLd,
    content,
  });
}

/* ---------- Listado de releases ---------- */

function renderReleasesIndex(releases) {
  const latest = releases.find(release => !release.prerelease);
  const canonical = `${SITE_URL}/releases/`;
  const description = descriptionWithSuffix(
    'Todas las versiones publicadas de CurseStone, servidor de Minecraft PE 0.15.x, con notas completas, novedades y descargas',
    latest ? `Última versión: ${latest.tag}.` : '',
  );

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'Releases de CurseStone',
        description,
        url: canonical,
        isPartOf: { '@type': 'WebSite', name: 'CurseStone', url: `${SITE_URL}/` },
      },
      breadcrumbJsonLd([
        { name: 'CurseStone', url: `${SITE_URL}/` },
        { name: 'Releases' },
      ]),
    ],
  }, null, 2);

  const content = `
    <header class="static-top">
      <a class="back-link" href="/">Inicio</a>
      <a class="btn" href="https://github.com/${REPO}/releases" target="_blank" rel="noopener noreferrer">${ICONS.github} Releases en GitHub</a>
    </header>

    <article>
      <h1>Releases de CurseStone</h1>
      <p>Todas las versiones publicadas del servidor, con sus notas completas, sus archivos y sus novedades.</p>
      <p class="status">${releases.length.toLocaleString('es-ES')} versiones publicadas.</p>

      <ul class="release-grid">
${[...releases].reverse().map(release => `        <li><a class="embed release-tile" href="/releases/${escapeAttr(release.tag)}/">
          <span class="embed-title"><span class="release-version">${escapeHtml(release.tag)}</span>${badge(release, release === latest)}</span>
          ${release.name !== release.tag ? `<span class="embed-name">${escapeHtml(release.name)}</span>` : ''}
          <span class="release-tile-date">${formatDateShortEs(release.publishedAt)}</span>
        </a></li>`).join('\n')}
      </ul>
    </article>`;

  return layout({
    title: 'Releases — CurseStone',
    description,
    canonical,
    ogType: 'website',
    jsonLd,
    content,
  });
}

/* ---------- Sitemap ---------- */

function renderSitemap(releases) {
  const urls = [
    ...FIXED_SITEMAP_URLS,
    // El listado cambia cuando se publica una release nueva: su última
    // modificación real es la fecha de la release más reciente.
    { loc: `${SITE_URL}/releases/`, lastmod: releases[0]?.publishedAt.slice(0, 10) },
    ...releases.map(release => ({
      loc: `${SITE_URL}/releases/${release.tag}/`,
      lastmod: release.publishedAt.slice(0, 10),
    })),
  ];

  const items = urls.map(url => `  <url>
    <loc>${escapeHtml(url.loc)}</loc>${url.lastmod ? `
    <lastmod>${url.lastmod}</lastmod>` : ''}
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>
`;
}

/* ---------- Principal ---------- */

function pruneStalePages(tags) {
  if (!existsSync(RELEASES_DIR)) return [];

  const removed = [];
  for (const entry of readdirSync(RELEASES_DIR)) {
    const dir = path.join(RELEASES_DIR, entry);
    const indexFile = path.join(dir, 'index.html');
    if (tags.has(entry) || !existsSync(indexFile)) continue;

    const html = readFileSync(indexFile, 'utf8');
    if (!html.includes('cursestone-releases-generator')) continue; // No tocar páginas ajenas.

    rmSync(dir, { recursive: true, force: true });
    removed.push(entry);
  }
  return removed;
}

async function main() {
  const offline = process.argv.includes('--offline');
  const { releases, source } = await loadReleases(offline);
  const invalid = releases.filter(release => !TAG_PATTERN.test(release.tag));
  if (invalid.length) throw new Error(`Tags con caracteres no seguros para URL: ${invalid.map(r => r.tag).join(', ')}`);

  // Más nueva primero, como las devuelve la API de GitHub.
  const newestFirst = [...releases].reverse();

  mkdirSync(RELEASES_DIR, { recursive: true });
  for (const release of releases) {
    const dir = path.join(RELEASES_DIR, release.tag);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), renderReleasePage(newestFirst, release));
  }
  writeFileSync(path.join(RELEASES_DIR, 'index.html'), renderReleasesIndex(newestFirst));
  writeFileSync(SITEMAP_PATH, renderSitemap(newestFirst));

  const removed = pruneStalePages(new Set(releases.map(release => release.tag)));

  console.log(`Fuente de datos: ${source === 'api' ? 'API de GitHub' : 'copia local (tools/releases-data.json)'}`);
  console.log(`Releases generadas: ${releases.length} (${newestFirst.map(r => r.tag).join(', ')})`);
  console.log('Escritos: releases/index.html, sitemap.xml y una página por release en releases/<tag>/');
  if (removed.length) console.log(`Páginas obsoletas eliminadas: ${removed.join(', ')}`);
}

main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
