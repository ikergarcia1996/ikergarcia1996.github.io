(function () {
  'use strict';
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  function syncThemeButton() {
    if (!toggle) return;
    var dark = root.getAttribute('data-theme') === 'dark';
    toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('title', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  syncThemeButton();
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeButton();
  });
  media.addEventListener('change', function (event) {
    var choice = null;
    try { choice = localStorage.getItem('theme'); } catch (e) {}
    if (choice !== 'light' && choice !== 'dark') {
      root.setAttribute('data-theme', event.matches ? 'dark' : 'light');
      syncThemeButton();
    }
  });

  // --- Subtle pointer-reactive light on the header (desktop only) ---
  var header = document.querySelector('.page-header');
  if (header && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(pointer: fine)').matches) {

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
  }

  // All publications are rendered in HTML; search is a progressive enhancement.
  var search = document.getElementById('publication-search');
  if (search) {
    var publications = Array.from(document.querySelectorAll('[data-publication]'));
    var years = Array.from(document.querySelectorAll('[data-publication-year]'));
    var normalize = function (value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); };
    var index = publications.map(function (item) { return normalize(item.textContent); });
    document.querySelector('.publication-search').hidden = false;
    function filter() {
      var terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      var count = 0;
      publications.forEach(function (item, i) {
        item.hidden = !terms.every(function (term) { return index[i].includes(term); });
        if (!item.hidden) count++;
      });
      years.forEach(function (year) {
        year.hidden = !Array.from(year.querySelectorAll('[data-publication]')).some(function (item) { return !item.hidden; });
        var jump = document.querySelector('.year-nav a[href="#' + year.id + '"]');
        if (jump) jump.hidden = year.hidden;
      });
      document.getElementById('search-status').textContent = count + ' of ' + publications.length + ' publications';
      document.getElementById('no-publications').hidden = count > 0;
    }
    search.addEventListener('input', filter);
    document.getElementById('clear-search').addEventListener('click', function () { search.value = ''; filter(); search.focus(); });
    filter();
  }
})();
