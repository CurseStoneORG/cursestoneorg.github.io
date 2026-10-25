export function html(strings, ...values) {
  return strings.reduce((result, chunk, index) => {
    const value = values[index - 1];
    const text = Array.isArray(value) ? value.join('') : value ?? '';
    return result + text + chunk;
  });
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const escapeAttr = escapeHtml;
