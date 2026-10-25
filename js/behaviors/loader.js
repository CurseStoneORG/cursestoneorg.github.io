import { t } from '../i18n/index.js';

const ASSET_TIMEOUT = 8000;
const TOTAL_STEPS = 4;
const HIDE_DELAY = 400;

const loader = document.getElementById('loader');
const label = document.getElementById('loader-text');

let completed = 0;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function advance(key) {
  completed = Math.min(completed + 1, TOTAL_STEPS);
  loader.style.setProperty('--progress', completed / TOTAL_STEPS);
  label.textContent = t(key);
}

function stylesheetReady(link) {
  if (link.sheet) return Promise.resolve();

  return new Promise(resolve => {
    link.addEventListener('load', resolve, { once: true });
    link.addEventListener('error', resolve, { once: true });
  });
}

export const stylesheetsReady = () =>
  Promise.all([...document.querySelectorAll('link[rel="stylesheet"]')].map(stylesheetReady));

export const fontsReady = () => document.fonts?.ready ?? Promise.resolve();

export function trackLoad(task, key) {
  return Promise.race([Promise.resolve(task), delay(ASSET_TIMEOUT)]).then(() => advance(key));
}

export function finishLoader() {
  advance('loader.ready');

  requestAnimationFrame(() => {
    loader.dataset.state = 'done';
    loader.classList.remove('has-error');
    loader.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
    setTimeout(() => loader.remove(), HIDE_DELAY);
  });
}

export function failLoader(error) {
  console.error(error);

  loader.dataset.state = 'error';
  loader.classList.add('has-error');
  label.textContent = t('loader.error');

  if (loader.querySelector('.loader-retry')) return;

  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'loader-retry';
  retry.textContent = t('loader.retry');
  retry.addEventListener('click', () => location.reload());
  loader.append(retry);
}
