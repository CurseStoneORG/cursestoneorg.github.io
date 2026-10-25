import { getLang, t } from '../i18n/index.js';

export const formatNumber = value => new Intl.NumberFormat(getLang()).format(value);

export const formatCommits = value =>
  `${formatNumber(value)} ${t(value === 1 ? 'contributors.commit.one' : 'contributors.commit.other')}`;

export const formatDate = value =>
  new Intl.DateTimeFormat(getLang(), { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${new Intl.NumberFormat(getLang(), { maximumFractionDigits: index ? 1 : 0 }).format(value)} ${units[index]}`;
}
