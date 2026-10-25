import es from './es.js';
import en from './en.js';

const STORAGE_KEY = 'cursestone-lang';
const dictionaries = { es, en };

export const languages = [
  { code: 'es', label: 'ESP' },
  { code: 'en', label: 'ENG' },
];

function detect() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored in dictionaries) return stored;
  } catch {
    // Sin almacenamiento: se usa el idioma del navegador.
  }

  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}

let current = detect();
document.documentElement.lang = current;

export const getLang = () => current;

export function setLang(code) {
  if (!(code in dictionaries) || code === current) return false;

  current = code;
  document.documentElement.lang = code;

  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // El idioma solo dura mientras la pestaña esté abierta.
  }

  return true;
}

export function t(key, params = {}) {
  const text = dictionaries[current][key] ?? dictionaries.es[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '');
}
