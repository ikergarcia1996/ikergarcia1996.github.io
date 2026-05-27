(function () {
  // --- Theme toggle ---
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Follow OS changes only when the user hasn't chosen explicitly.
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', function (e) {
    var hasChoice = false;
    try { hasChoice = !!localStorage.getItem('theme'); } catch (err) {}
    if (!hasChoice) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });

  // --- Subtle pointer-reactive light on the header (desktop only) ---
  var header = document.querySelector('.page-header');
  if (!header || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function onMove(e) {
    var rect = header.getBoundingClientRect();
    var x = ((e.clientX - rect.left) / rect.width) * 100;
    var y = ((e.clientY - rect.top) / rect.height) * 100;
    header.style.setProperty('--mx', x.toFixed(1) + '%');
    header.style.setProperty('--my', y.toFixed(1) + '%');
    header.classList.add('is-interactive');
  }
  function onLeave() {
    header.classList.remove('is-interactive');
  }
  header.addEventListener('pointermove', onMove, { passive: true });
  header.addEventListener('pointerleave', onLeave);
})();
