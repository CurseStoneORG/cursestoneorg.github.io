import { escapeHtml } from './html.js';

const LINK = 'target="_blank" rel="noopener noreferrer"';

function inline(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => `<a href="${url}" ${LINK}>${label}</a>`)
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, lead, url) => `${lead}<a href="${url}" ${LINK}>${url}</a>`);
}

/** Convierte el markdown básico de las notas de GitHub en HTML. Todo el texto se escapa primero. */
export function renderMarkdown(source) {
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

    const heading = raw.match(/^#{1,6}\s+(.*)$/);
    const bullet = raw.match(/^\s*[-*+]\s+(.*)$/);
    const numbered = raw.match(/^\s*\d+\.\s+(.*)$/);

    if (heading) {
      flushParagraph();
      closeList();
      out.push(`<h4>${inline(heading[1])}</h4>`);
    } else if (bullet || numbered) {
      flushParagraph();
      const tag = bullet ? 'ul' : 'ol';
      if (list !== tag) {
        closeList();
        out.push(`<${tag}>`);
        list = tag;
      }
      out.push(`<li>${inline((bullet || numbered)[1])}</li>`);
    } else if (!raw.trim()) {
      flushParagraph();
      closeList();
    } else {
      closeList();
      paragraph.push(raw.trim());
    }
  }

  if (fence) out.push(`<pre><code>${escapeHtml(fence.join('\n'))}</code></pre>`);
  flushParagraph();
  closeList();
  return out.join('');
}

/** Versión en texto plano para las vistas previas (sin sintaxis markdown). */
export function plainText(source) {
  return source
    .replace(/```/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*`]/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
