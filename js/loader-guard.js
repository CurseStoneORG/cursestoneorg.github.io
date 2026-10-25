(function () {
  var TIMEOUT = 12000;

  var texts = {
    es: {
      loading: 'Cargando…',
      timeout: 'El sitio está tardando demasiado en cargar.',
      file: 'Este sitio usa módulos ES y no funciona abriendo el archivo directamente.',
      hint: 'Sírvelo por HTTP, por ejemplo: python3 -m http.server 8000',
      retry: 'Reintentar',
    },
    en: {
      loading: 'Loading…',
      timeout: 'The site is taking too long to load.',
      file: 'This site uses ES modules and cannot run from a file opened directly.',
      hint: 'Serve it over HTTP, for example: python3 -m http.server 8000',
      retry: 'Retry',
    },
  };

  var loader = document.getElementById('loader');
  var label = document.getElementById('loader-text');

  function language() {
    var stored = null;

    try {
      stored = localStorage.getItem('cursestone-lang');
    } catch (error) {}

    if (stored === 'es' || stored === 'en') return stored;
    return (navigator.language || '').toLowerCase().indexOf('es') === 0 ? 'es' : 'en';
  }

  var copy = texts[language()];
  label.textContent = copy.loading;

  function fail(message, hint) {
    if (loader.dataset.state === 'done') return;

    loader.dataset.state = 'error';
    loader.classList.add('has-error');
    label.textContent = message;

    if (hint) {
      var note = document.createElement('p');
      note.className = 'loader-hint';
      note.textContent = hint;
      loader.appendChild(note);
    }

    var retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'loader-retry';
    retry.textContent = copy.retry;
    retry.addEventListener('click', function () {
      location.reload();
    });
    loader.appendChild(retry);
  }

  if (location.protocol === 'file:') {
    fail(copy.file, copy.hint);
    return;
  }

  setTimeout(function () {
    if (loader.dataset.state === 'loading') fail(copy.timeout);
  }, TIMEOUT);
})();
