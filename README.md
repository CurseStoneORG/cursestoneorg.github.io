# cursestoneorg.github.io

Web oficial de CurseStone: servidor de código abierto para Minecraft: Pocket Edition 0.15.x.

## Estructura

- `index.html` — sitio principal (SPA ligera con fallback SEO estático).
- `releases/` — páginas estáticas de las releases (listado y una página por versión).
- `tools/generate-releases.mjs` — generador de las páginas de releases y del `sitemap.xml`.
- `docs/` y `doxygen-docs/` viven en los repositorios `CurseStoneORG/docs` y `CurseStoneORG/doxygen-docs`,
  publicados como subrutas del mismo dominio.

## Regenerar las páginas de releases

Las páginas de `releases/` y `sitemap.xml` se generan a partir de los releases reales de GitHub.
Después de publicar una release nueva, ejecuta:

```bash
npm run generate:releases            # descarga los datos de la API de GitHub
GITHUB_TOKEN=ghp_xxx npm run generate:releases   # con token (más límite de peticiones)
npm run generate:releases:offline    # regenera con la copia local (tools/releases-data.json)
```

y haz commit de los cambios. El script crea una página por release con su título, descripción,
canonical, Open Graph y datos estructurados, y elimina las páginas de releases que ya no
existan en GitHub.
