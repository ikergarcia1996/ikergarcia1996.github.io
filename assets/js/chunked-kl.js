// Interactive figures for the fused chunked KL post.
// Every figure is drawn as inline SVG against the post's CSS tokens, so the
// light and dark themes come for free and all figures share one style.
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Helpers ---------------------------------------------------------------
  function el(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    for (var key in attrs) {
      if (key === 'text') node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    }
    if (parent) parent.appendChild(node);
    return node;
  }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function ease(x) { x = clamp(x, 0, 1); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function seg(u, a, b) { return clamp((u - a) / (b - a), 0, 1); }
  function fmt(x, digits) {
    return x.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }
  function setPressed(group, button) {
    group.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
  }
  function onSeg(group, handler) {
    group.addEventListener('click', function (event) {
      var button = event.target.closest('button');
      if (!button) return;
      setPressed(group, button);
      handler(button);
    });
  }
  function pressed(group) { return group.querySelector('[aria-pressed="true"]'); }
  function niceStep(max, target) {
    var raw = max / target;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    return (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  }
  // Redraw a figure whenever its container changes width.
  function responsive(host, draw) {
    var width = 0;
    var ro = new ResizeObserver(function () {
      var w = Math.round(host.clientWidth);
      if (w && w !== width) { width = w; draw(w); }
    });
    ro.observe(host);
  }
  // Animate numeric attributes between their current and target values.
  function tween(node, targets, ms) {
    if (reduceMotion) ms = 0;
    var from = {};
    for (var k in targets) from[k] = parseFloat(node.getAttribute(k)) || 0;
    var start = performance.now();
    if (node._tween) cancelAnimationFrame(node._tween);
    function frame(now) {
      var p = ms ? ease((now - start) / ms) : 1;
      for (var key in targets) node.setAttribute(key, from[key] + (targets[key] - from[key]) * p);
      if (p < 1) node._tween = requestAnimationFrame(frame);
    }
    frame(start);
  }

  // A column with a rounded data end and a square base, as a path.
  function roundedColumn(x0, w, base, h) {
    var x1 = x0 + w, yTop = base - h, r = Math.min(4, h, w / 2);
    return 'M' + x0 + ',' + base + 'V' + (yTop + r) + 'Q' + x0 + ',' + yTop + ' ' + (x0 + r) + ',' + yTop +
      'H' + (x1 - r) + 'Q' + x1 + ',' + yTop + ' ' + x1 + ',' + (yTop + r) + 'V' + base + 'Z';
  }

  // A looping clock for the animated figures. It pauses off-screen, while
  // `held` is set (for example during hover) and under reduced motion.
  var ICON_PAUSE = 'M3 1.5h3v11H3zM8 1.5h3v11H8z', ICON_PLAY = 'M3.5 1.5v11l9-5.5z';
  function player(root, total, render, button, still) {
    var p = { t: reduceMotion && still != null ? still : 0, total: total, playing: false, held: false, visible: true, last: null };
    var icon = button && button.querySelector('[data-icon]');
    function tick(now) {
      if (!p.playing) return;
      if (p.visible && !p.held) {
        if (p.last != null) {
          p.t += (now - p.last) / 1000;
          if (p.t >= p.total) p.t = 0;
          render(p.t);
        }
        p.last = now;
      } else p.last = null;
      requestAnimationFrame(tick);
    }
    p.play = function (on) {
      var start = on && !p.playing;
      p.playing = on;
      p.last = null;
      if (button) {
        button.setAttribute('aria-label', on ? 'Pause' : 'Play');
        icon.setAttribute('d', on ? ICON_PAUSE : ICON_PLAY);
      }
      if (start) requestAnimationFrame(tick);
    };
    p.seek = function (t) { p.t = t; render(t); };
    if (button) button.addEventListener('click', function () { p.play(!p.playing); });
    new IntersectionObserver(function (entries) { p.visible = entries[0].isIntersecting; }).observe(root);
    render(p.t);
    p.play(!reduceMotion);
    return p;
  }

  // A floating tooltip anchored inside a figure frame.
  function tooltip(frame) {
    var tip = frame.querySelector('.tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'tooltip';
      tip.setAttribute('role', 'status');
      frame.appendChild(tip);
    }
    return {
      show: function (html, event) {
        tip.innerHTML = html;
        var box = frame.getBoundingClientRect();
        var x = event.clientX - box.left + 14;
        var y = event.clientY - box.top + 14;
        tip.classList.add('is-visible');
        var w = tip.offsetWidth;
        if (x + w > box.width - 8) x = event.clientX - box.left - w - 14;
        tip.style.left = Math.max(8, x) + 'px';
        tip.style.top = y + 'px';
      },
      hide: function () { tip.classList.remove('is-visible'); }
    };
  }
  function hover(node, tip, html) {
    node.addEventListener('pointermove', function (event) { tip.show(typeof html === 'function' ? html() : html, event); });
    node.addEventListener('pointerleave', tip.hide);
  }

  // A horizontal bar chart with one row per series and an optional marker line.
  function barChart(host, options) {
    var rows = options.rows;
    var state = { values: null, domain: options.domain, nodes: null, width: 0 };
    var tip = tooltip(host.closest('.figure-frame'));
    var labelW = options.labelWidth || 0;
    var rowH = 40, top = 24, bottom = 26, barH = 20;

    function x(v, width) { return labelW + (v / state.domain) * (width - labelW - 64); }

    function draw(width) {
      state.width = width;
      host.innerHTML = '';
      var height = top + rows.length * rowH + bottom;
      var svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height }, host);
      var grid = el('g', {}, svg);
      var marks = el('g', {}, svg);
      state.nodes = { svg: svg, grid: grid, rows: [], height: height };
      rows.forEach(function (row, i) {
        var y = top + i * rowH + (rowH - barH) / 2;
        var g = el('g', {}, marks);
        if (labelW) el('text', { x: 0, y: y + barH / 2 + 4, 'font-size': 12, style: 'fill: var(--fig-ink-2)', text: row.label }, g);
        var bar = el('rect', { x: labelW, y: y, width: 0, height: barH, rx: 4, style: 'fill: ' + row.color }, g);
        var value = el('text', { x: labelW + 6, y: y + barH / 2 + 4, 'font-size': 12, 'font-weight': 600, style: 'fill: var(--fig-ink)' }, g);
        var hit = el('rect', { x: 0, y: top + i * rowH, width: width, height: rowH, fill: 'transparent' }, g);
        hover(hit, tip, function () { return row.tip(state.values[i]); });
        state.nodes.rows.push({ bar: bar, value: value, y: y });
      });
      if (options.marker) {
        state.nodes.marker = el('line', { y1: 16, y2: height - bottom + 2, 'stroke-width': 1.5, 'stroke-dasharray': '4 4', style: 'stroke: var(--fig-ink-2)' }, svg);
        state.nodes.markerLabel = el('text', { y: 11, 'font-size': 11, 'text-anchor': 'middle', style: 'fill: var(--fig-ink-2)', text: options.marker.label }, svg);
      }
      if (state.values) update(state.values, state.domain, true);
    }

    function update(values, domain, instant) {
      state.values = values;
      state.domain = domain;
      if (!state.nodes) return;
      var width = state.width, n = state.nodes;
      // Gridlines and ticks for the current domain.
      n.grid.innerHTML = '';
      var step = niceStep(domain, width < 360 ? 3 : 5);
      for (var t = 0; t <= domain + 1e-9; t += step) {
        var gx = x(t, width);
        el('line', { x1: gx, x2: gx, y1: top - 2, y2: n.height - bottom + 2, 'stroke-width': 1, style: 'stroke: ' + (t === 0 ? 'var(--fig-axis)' : 'var(--fig-grid)') }, n.grid);
        el('text', { x: gx, y: n.height - 8, 'font-size': 11, 'text-anchor': 'middle', style: 'fill: var(--fig-muted)', text: options.tick(t) }, n.grid);
      }
      values.forEach(function (v, i) {
        var r = n.rows[i];
        var w = v == null ? 0 : Math.max(2, x(v, width) - labelW);
        tween(r.bar, { width: w }, instant ? 0 : 650);
        // Long bars carry their value inside the data end, clear of the marker line.
        var inside = v != null && w > (width - labelW - 64) * 0.6;
        r.value.textContent = v == null ? '✕  Out of memory' : options.format(v);
        r.value.style.fill = v == null ? 'var(--fig-muted)' : inside ? '#fff' : 'var(--fig-ink)';
        r.value.setAttribute('font-weight', v == null ? 500 : 600);
        r.value.setAttribute('text-anchor', inside ? 'end' : 'start');
        tween(r.value, { x: inside ? labelW + w - 8 : labelW + w + 8 }, instant ? 0 : 650);
      });
      if (n.marker) {
        var mx = x(options.marker.value, width);
        n.marker.setAttribute('x1', mx); n.marker.setAttribute('x2', mx);
        n.markerLabel.setAttribute('x', mx);
        n.marker.style.display = n.markerLabel.style.display = options.marker.value <= domain ? '' : 'none';
      }
    }

    responsive(host, draw);
    return { update: update };
  }

  // A column chart, used for the chunk-size sweep.
  function columnChart(host, options) {
    var state = { values: null, domain: 1, nodes: null, width: 0 };
    var tip = tooltip(host.closest('.figure-frame'));
    var height = 190, top = 22, bottom = 26, left = 44;

    function y(v) { return top + (1 - v / state.domain) * (height - top - bottom); }

    function draw(width) {
      state.width = width;
      host.innerHTML = '';
      var svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height }, host);
      var grid = el('g', {}, svg);
      var n = { grid: grid, cols: [] };
      var band = (width - left) / options.categories.length;
      var colW = Math.min(28, band * 0.5);
      options.categories.forEach(function (cat, i) {
        var cx = left + band * (i + 0.5);
        var g = el('g', {}, svg);
        var bar = el('path', { style: 'fill: var(--s-fused)', opacity: cat.highlight ? 1 : 0.32 }, g);
        var value = el('text', { x: cx, 'font-size': 11, 'font-weight': 600, 'text-anchor': 'middle', style: 'fill: var(--fig-ink)' }, g);
        el('text', { x: cx, y: height - 8, 'font-size': 11, 'text-anchor': 'middle', style: 'fill: ' + (cat.highlight ? 'var(--fig-ink)' : 'var(--fig-muted)'), 'font-weight': cat.highlight ? 600 : 400, text: cat.label }, g);
        var hit = el('rect', { x: cx - band / 2, y: 0, width: band, height: height, fill: 'transparent' }, g);
        hover(hit, tip, function () { return options.tip(cat, state.values[i]); });
        n.cols.push({ bar: bar, value: value, cx: cx, w: colW, h: 0 });
      });
      el('line', { x1: left, x2: width, y1: height - bottom, y2: height - bottom, style: 'stroke: var(--fig-axis)' }, svg);
      state.nodes = n;
      if (state.values) update(state.values, state.domain, true);
    }

    function colPath(c, h) { return roundedColumn(c.cx - c.w / 2, c.w, height - bottom, h); }

    function update(values, domain, instant) {
      state.values = values;
      state.domain = domain;
      if (!state.nodes) return;
      var n = state.nodes;
      n.grid.innerHTML = '';
      var step = niceStep(domain, 3);
      for (var t = step; t <= domain + 1e-9; t += step) {
        el('line', { x1: left, x2: state.width, y1: y(t), y2: y(t), style: 'stroke: var(--fig-grid)' }, n.grid);
        el('text', { x: 0, y: y(t) + 4, 'font-size': 10, style: 'fill: var(--fig-muted)', text: options.tick(t) }, n.grid);
      }
      values.forEach(function (v, i) {
        var c = n.cols[i];
        var target = (height - bottom) - y(v);
        var from = c.h, start = performance.now(), ms = instant || reduceMotion ? 0 : 650;
        if (c.raf) cancelAnimationFrame(c.raf);
        c.value.textContent = options.format(v);
        (function frame(now) {
          var p = ms ? ease((now - start) / ms) : 1;
          c.h = from + (target - from) * p;
          c.bar.setAttribute('d', colPath(c, c.h));
          c.value.setAttribute('y', height - bottom - c.h - 7);
          if (p < 1) c.raf = requestAnimationFrame(frame);
        })(start);
      });
    }

    responsive(host, draw);
    return { update: update };
  }

  // ---- Figure 1: the logit wall ---------------------------------------------
  // GPT-OSS logits for one sequence in fp32, as the context doubles from 4K to
  // 256K tokens. Columns rise one length at a time; hovering inspects a column.
  function initWall(root) {
    var host = root.querySelector('[data-wall-chart]');
    var fullOut = root.querySelector('[data-wall-full]');
    var seqOut = root.querySelector('[data-wall-seq]');
    var tip = tooltip(root.querySelector('.figure-frame'));
    var VOCAB = 201088, CHUNK = 4096, H200 = 141, DOMAIN = 225;
    var SEQS = [4096, 8192, 16384, 32768, 65536, 131072, 262144];
    var LABELS = ['4K', '8K', '16K', '32K', '64K', '128K', '256K'];
    var STEP = 1.1, GROW = 0.75, HOLD = 2.8;
    var TOTAL = SEQS.length * STEP + HOLD;
    function gb(s) { return s * VOCAB * 4 / 1e9; }
    var TILE = gb(CHUNK);
    var height = 260, top = 28, bottom = 30, left = 46;
    var nodes = null, hoverIdx = -1, lastT = 0, clock = null;

    function y(v) { return top + (1 - v / DOMAIN) * (height - top - bottom); }

    function draw(width) {
      host.innerHTML = '';
      var svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height }, host);
      var plotW = width - left, base = height - bottom;
      for (var t = 50; t <= 200; t += 50) {
        el('line', { x1: left, x2: width, y1: y(t), y2: y(t), style: 'stroke: var(--fig-grid)' }, svg);
        el('text', { x: 0, y: y(t) + 4, 'font-size': 11, style: 'fill: var(--fig-muted)', text: t + ' GB' }, svg);
      }
      var band = plotW / SEQS.length, cw = Math.min(24, band * 0.3);
      nodes = { cols: [] };
      SEQS.forEach(function (s, i) {
        var cx = left + band * (i + 0.5);
        var g = el('g', {}, svg);
        var c = {
          xf: cx - cw - 1.5, xt: cx + 1.5, cw: cw,
          full: el('path', { style: 'fill: var(--s-dense)' }, g),
          tile: el('path', { style: 'fill: var(--s-fused)' }, g),
          val: el('text', { x: cx - cw / 2 - 1.5, 'font-size': 11.5, 'font-weight': 650, 'text-anchor': 'middle', style: 'fill: var(--fig-ink)' }, g),
          lab: el('text', { x: cx, y: height - 9, 'font-size': 11, 'text-anchor': 'middle', text: LABELS[i] }, g)
        };
        var hit = el('rect', { x: cx - band / 2, y: 0, width: band, height: height, fill: 'transparent' }, g);
        hover(hit, tip, '<b>' + fmt(s, 0) + ' tokens</b><br><span class="tt-k">Full logits</span> ' + fmt(gb(s), 1) +
          ' GB<br><span class="tt-k">One chunk</span> ' + fmt(TILE, 1) + ' GB');
        hit.addEventListener('pointerenter', function () { hoverIdx = i; clock.held = true; render(lastT); });
        hit.addEventListener('pointerleave', function () { hoverIdx = -1; clock.held = false; render(lastT); });
        nodes.cols.push(c);
      });
      el('line', { x1: left, x2: width, y1: base + 0.5, y2: base + 0.5, style: 'stroke: var(--fig-axis)' }, svg);
      el('line', { x1: left, x2: width, y1: y(H200), y2: y(H200), 'stroke-width': 1.5, 'stroke-dasharray': '4 4', style: 'stroke: var(--fig-ink-2)' }, svg);
      el('text', { x: left + 4, y: y(H200) - 7, 'font-size': 11, style: 'fill: var(--fig-ink-2)', text: 'H200 · 141 GB' }, svg);
      render(lastT);
    }

    function render(t) {
      lastT = t;
      if (!nodes) return;
      var inspect = hoverIdx >= 0;
      var active = inspect ? hoverIdx : Math.min(SEQS.length - 1, Math.floor(t / STEP));
      var base = height - bottom;
      nodes.cols.forEach(function (c, i) {
        var f = inspect ? 1 : ease((t - i * STEP) / GROW);
        var v = gb(SEQS[i]), on = i === active;
        c.full.setAttribute('d', roundedColumn(c.xf, c.cw, base, (base - y(v)) * f));
        c.tile.setAttribute('d', roundedColumn(c.xt, c.cw, base, (base - y(TILE)) * f));
        c.full.setAttribute('opacity', inspect && !on ? 0.35 : 1);
        c.tile.setAttribute('opacity', inspect && !on ? 0.35 : 1);
        c.val.textContent = on && f > 0.02 ? fmt(v * f, v < 10 ? 1 : 0) + ' GB' : '';
        c.val.setAttribute('y', y(v * f) - 7);
        c.lab.style.fill = on ? 'var(--fig-ink)' : 'var(--fig-muted)';
        c.lab.setAttribute('font-weight', on ? 650 : 400);
      });
      var fa = inspect ? 1 : ease((t - active * STEP) / GROW);
      fullOut.textContent = fmt(gb(SEQS[active]) * fa, 1) + ' GB';
      seqOut.textContent = fmt(SEQS[active], 0);
    }

    clock = player(root, TOTAL, render, root.querySelector('[data-wall-play]'), TOTAL - 0.01);
    responsive(host, draw);
  }

  // ---- Figure 2: anatomy of a row --------------------------------------------
  function initRow(root) {
    var host = root.querySelector('[data-row-chart]');
    var tip = tooltip(root.querySelector('.figure-frame'));
    // A deterministic pseudo-random row: logits for the strip and a handful of
    // teacher entries standing in for the top-K.
    var CELLS = 160;
    var seed = 7;
    function rand() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var logits = [];
    for (var i = 0; i < CELLS; i++) logits.push(rand());
    var teacher = [[23, 0.41], [61, 0.22], [88, 0.12], [9, 0.07], [117, 0.05], [140, 0.04], [47, 0.03], [102, 0.02]];
    teacher.forEach(function (t) { logits[t[0]] = 0.75 + t[1] * 0.6; });

    function draw(width) {
      host.innerHTML = '';
      var narrow = width < 520;
      var height = narrow ? 196 : 176;
      var svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height }, host);
      var x0 = 0, x1 = width, stripY = 62, stripH = 44;
      var cw = (x1 - x0) / CELLS;
      // Top bracket: sparse terms.
      var tx = teacher.map(function (t) { return x0 + (t[0] + 0.5) * cw; });
      var minX = Math.min.apply(null, tx), maxX = Math.max.apply(null, tx);
      el('text', { x: (minX + maxX) / 2, y: 16, 'font-size': 12.5, 'font-weight': 600, 'text-anchor': 'middle', style: 'fill: var(--fig-ink)', text: 'H, C and M read only the K = 100 teacher entries' }, svg);
      teacher.forEach(function (t, k) {
        el('line', { x1: tx[k], x2: tx[k], y1: 28, y2: stripY - 4, 'stroke-width': 1, style: 'stroke: var(--s-teacher)', opacity: 0.7 }, svg);
      });
      el('line', { x1: minX, x2: maxX, y1: 28, y2: 28, 'stroke-width': 1, style: 'stroke: var(--fig-axis)' }, svg);
      // Strip of logits: height carries the logit value.
      for (var c = 0; c < CELLS; c++) {
        var isT = teacher.find(function (t) { return t[0] === c; });
        var h = 6 + logits[c] * (stripH - 6);
        var cell = el('rect', {
          x: x0 + c * cw + 0.5, y: stripY + stripH - h, width: Math.max(0.8, cw - 1), height: h, rx: Math.min(2, cw / 3),
          style: 'fill: ' + (isT ? 'var(--s-teacher)' : 'var(--s-neutral-2)')
        }, svg);
        if (isT) {
          (function (t) {
            var hit = el('rect', { x: x0 + t[0] * cw - 6, y: stripY - 8, width: cw + 12, height: stripH + 16, fill: 'transparent' }, svg);
            hover(hit, tip, '<b>Teacher entry</b><br><span class="tt-k">p<sub>v</sub></span> ' + t[1].toFixed(2) + ' &nbsp;<span class="tt-k">used in H, C, M</span>');
          })(isT);
        }
      }
      el('line', { x1: x0, x2: x1, y1: stripY + stripH + 0.5, y2: stripY + stripH + 0.5, style: 'stroke: var(--fig-axis)' }, svg);
      // Bottom bracket: the normalizer collapses the row to one scalar.
      var by = stripY + stripH + 16;
      el('path', { d: 'M' + (x0 + 1) + ',' + by + 'v8H' + (x1 - 1) + 'v-8', fill: 'none', 'stroke-width': 1, style: 'stroke: var(--fig-axis)' }, svg);
      el('line', { x1: width / 2, x2: width / 2, y1: by + 8, y2: by + 22, style: 'stroke: var(--fig-axis)' }, svg);
      var label = narrow ? ['log Z spans all V entries', '→ one scalar per token'] : ['log Z is the only term that spans all V entries, and it reduces the row to one scalar'];
      label.forEach(function (line, k) {
        el('text', { x: width / 2, y: by + 38 + k * 17, 'font-size': 12.5, 'font-weight': 600, 'text-anchor': 'middle', style: 'fill: var(--fig-ink)', text: line }, svg);
      });
    }
    responsive(host, draw);
  }

  // ---- Figure 3: the kernel ---------------------------------------------------
  // The standard and fused paths run side by side on one clock. Each of the
  // three phases takes the same time in both, so the panels stay comparable.
  var KERNEL_N = 6;
  var KERNEL_PHASES = {
    fused: [
      { id: 'p1', title: 'Pass 1 · Find the normalizer', text: 'Project one chunk of H into a C × V tile of logits. Reduce each row to its max and sum of exponentials, keep log Z (one float per token), and discard the tile.' },
      { id: 'p2', title: 'Pass 2 · Score against the teacher', text: 'Recompute the same tile, gather the logits at the teacher’s top-K token ids, and combine them with log Z into the per-token loss. The tile is discarded again.' },
      { id: 'bw', title: 'Backward · Recompute, don’t store', text: 'Recompute the tile once more and turn it into G = M·softmax(z) − p in place. Multiply by W for this chunk’s ∂H, add Gᵀh into ∂W, and free the tile.' }
    ],
    dense: [
      { id: 'fw', title: 'Forward · Materialize every logit', text: 'The head projects all S positions. Every row of logits stays in memory, because autograd needs them for the backward pass.' },
      { id: 'loss', title: 'Loss · More vocabulary-sized copies', text: 'The top-K teacher is scattered into a dense S × V distribution and compared with the student’s S × V log-softmax. Three full-vocabulary tensors are now alive.' },
      { id: 'bw', title: 'Backward · A gradient for every logit', text: 'Autograd allocates ∂z with the same S × V shape before reducing it into ∂H and ∂W. Peak memory is reached here.' }
    ]
  };

  function kernelPanel(panel, mode) {
    var N = KERNEL_N, phases = KERNEL_PHASES[mode];
    var host = panel.querySelector('[data-kernel-svg]');
    var ksT = panel.querySelector('[data-ks-t]');
    var ksD = panel.querySelector('[data-ks-d]');
    var mmFill = panel.querySelector('[data-mm-fill]');
    var mmVal = panel.querySelector('[data-mm-val]');
    var color = mode === 'dense' ? 'var(--s-dense)' : 'var(--s-fused)';
    var geo = null, nodes = null, last = null;

    function layout(width) {
      // The viewBox follows the container so labels render near 13px; below
      // 600px the drawing scales down and the type grows to compensate.
      var narrow = width < 600;
      var VW = Math.max(600, Math.min(width, 1100));
      var fs = clamp(13 * VW / width, 13, 22);
      var hw = narrow ? 40 : 54, gap = narrow ? 12 : 14;
      var dHx = narrow ? 8 : 16;
      var Hx = dHx + hw + gap;
      var LX = Hx + hw + (narrow ? 18 : 26);
      var colW = 24, colGap = narrow ? 20 : 14;
      var LW = VW - LX - 2 * colW - 2 * colGap - (narrow ? 8 : 12);
      var WY = narrow ? 40 : 34, WH = narrow ? 50 : 56;
      var TY = WY + WH + (narrow ? 44 : 40), TH = narrow ? 300 : 270;
      return {
        VW: VW, VH: TY + TH + 12, fs: fs, hw: hw, dHx: dHx, Hx: Hx, LX: LX, LW: LW, WY: WY, WH: WH, TY: TY, TH: TH,
        zx: LX + LW + colGap, lx: LX + LW + colGap * 2 + colW, colW: colW, band: TH / N, narrow: narrow
      };
    }

    function build(width) {
      geo = layout(width);
      var g = geo;
      host.innerHTML = '';
      var svg = el('svg', { viewBox: '0 0 ' + g.VW + ' ' + g.VH, 'font-size': g.fs }, host);
      var defs = el('defs', {}, svg);
      var clipId = 'k-clip-' + mode;
      var clip = el('clipPath', { id: clipId }, defs);
      el('rect', { x: g.LX, y: g.TY, width: g.LW, height: g.TH, rx: 6 }, clip);
      nodes = {};
      function label(x, y, text, anchor, weight, fill) {
        return el('text', { x: x, y: y, 'text-anchor': anchor || 'middle', 'font-weight': weight || 600, style: 'fill: ' + (fill || 'var(--fig-ink)'), text: text }, svg);
      }
      function dim(x, y, text, anchor) { return label(x, y, text, anchor, 400, 'var(--fig-muted)'); }

      // Output head W^T across the top and the dW accumulator beside it.
      el('rect', { x: g.LX, y: g.WY, width: g.LW, height: g.WH, rx: 6, style: 'fill: var(--s-neutral)' }, svg);
      nodes.Wglow = el('rect', { x: g.LX, y: g.WY, width: g.LW, height: g.WH, rx: 6, style: 'fill: ' + color, opacity: 0 }, svg);
      label(g.LX + 14, g.WY + g.WH / 2 + g.fs * 0.35, 'Wᵀ', 'start');
      dim(g.LX + g.LW - 14, g.WY + g.WH / 2 + g.fs * 0.35, 'd × V', 'end');
      dim(g.LX + g.LW / 2, g.WY - 12, 'output head');
      var dWw = g.Hx + g.hw - g.dHx;
      el('rect', { x: g.dHx, y: g.WY, width: dWw, height: g.WH, rx: 6, style: 'fill: var(--fig-soft); stroke: var(--fig-axis)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
      nodes.dW = el('rect', { x: g.dHx, y: g.WY, width: 0, height: g.WH, rx: 6, style: 'fill: var(--s-grad)' }, svg);
      label(g.dHx + dWw / 2, g.WY + g.WH / 2 + g.fs * 0.35, '∂W');

      // Hidden states, their gradient, and the logit region.
      el('rect', { x: g.Hx, y: g.TY, width: g.hw, height: g.TH, rx: 6, style: 'fill: var(--s-neutral)' }, svg);
      el('rect', { x: g.dHx, y: g.TY, width: g.hw, height: g.TH, rx: 6, style: 'fill: var(--fig-soft); stroke: var(--fig-axis)', 'stroke-dasharray': '3 3' }, svg);
      label(g.Hx + g.hw / 2, g.TY - 16, 'H');
      label(g.dHx + g.hw / 2, g.TY - 16, '∂H');
      var region = el('rect', { x: g.LX, y: g.TY, width: g.LW, height: g.TH, rx: 6, style: 'fill: var(--fig-soft); stroke: var(--fig-axis)', 'stroke-dasharray': '4 4' }, svg);
      label(g.LX + g.LW / 2, g.TY - 16, 'logits z = H Wᵀ');
      dim(g.LX + g.LW / 2, g.TY + g.TH / 2 + g.fs * 0.35, mode === 'fused' ? 'S × V · never stored' : 'S × V');
      label(g.zx + g.colW / 2, g.TY - 16, 'log Z').setAttribute('font-size', g.narrow ? g.fs * 0.72 : g.fs);
      label(g.lx + g.colW / 2, g.TY - 16, 'L');
      ['zx', 'lx'].forEach(function (k) {
        el('rect', { x: g[k], y: g.TY, width: g.colW, height: g.TH, rx: 5, style: 'fill: var(--fig-soft); stroke: var(--fig-axis)', 'stroke-dasharray': '3 3' }, svg);
      });

      // Dense-mode copies stacked behind the logit region.
      nodes.ghosts = mode === 'dense' ? [1, 2].map(function (k) {
        var o = k * 4;
        var r = el('rect', { x: g.LX + o, y: g.TY - o, width: g.LW - o, height: g.TH, rx: 6, style: 'fill: var(--s-dense)', opacity: 0 }, svg);
        svg.insertBefore(r, region);
        return r;
      }) : [];

      // Per-chunk cells.
      nodes.chunks = [];
      var tiles = el('g', { 'clip-path': 'url(#' + clipId + ')' }, svg);
      for (var c = 0; c < N; c++) {
        var y = g.TY + c * g.band;
        var ch = {};
        ch.H = el('rect', { x: g.Hx, y: y + 1, width: g.hw, height: g.band - 2, rx: 4, style: 'fill: ' + color, opacity: 0 }, svg);
        ch.dH = el('rect', { x: g.dHx, y: y + 1, width: g.hw, height: g.band - 2, rx: 4, style: 'fill: var(--s-grad)', opacity: 0 }, svg);
        ch.z = el('rect', { x: g.zx, y: y + 1, width: g.colW, height: g.band - 2, rx: 4, style: 'fill: ' + color, opacity: 0 }, svg);
        ch.l = el('rect', { x: g.lx, y: y + 1, width: g.colW, height: g.band - 2, rx: 4, style: 'fill: ' + color, opacity: 0 }, svg);
        ch.tile = el('rect', { x: g.LX, y: y + 1, width: 0, height: g.band - 2, rx: 4, style: 'fill: ' + color }, tiles);
        ch.grad = el('rect', { x: g.LX, y: y + 1, width: 0, height: g.band - 2, rx: 4, style: 'fill: var(--s-grad)', opacity: 0 }, tiles);
        ch.edge = el('rect', { x: g.LX, y: y + 1, width: 2, height: g.band - 2, style: 'fill: var(--fig-surface)', opacity: 0 }, tiles);
        // Sparse teacher entries: a few per row, at fixed pseudo-random columns.
        ch.dots = [];
        for (var r = 0; r < 3; r++) {
          for (var k = 0; k < 4; k++) {
            var fx = ((c * 37 + r * 53 + k * 71) % 97) / 97;
            ch.dots.push(el('circle', { cx: g.LX + 10 + fx * (g.LW - 20), cy: y + g.band * (r + 1) / 4, r: g.narrow ? 3 : 2.5, style: 'fill: var(--s-teacher)', opacity: 0.35 }, tiles));
          }
        }
        nodes.chunks.push(ch);
      }
      // Chunk separators across the full height.
      for (var s = 1; s < N; s++) {
        var sy = g.TY + s * g.band;
        el('line', { x1: g.dHx, x2: g.lx + g.colW, y1: sy, y2: sy, 'stroke-width': 1, style: 'stroke: var(--fig-surface)', opacity: 0.9 }, svg);
      }
      if (last) render(last);
    }

    // `s` is the shared clock state: phase index, chunk, progress in the chunk
    // (u) and in the phase (pu). The dense loss acts on all rows at once.
    function render(s) {
      last = s;
      if (!nodes) return;
      var g = geo, done = s.done;
      var phase = phases[s.phase];
      var chunk = mode === 'dense' && phase.id === 'loss' ? -1 : s.chunk;
      var u = chunk < 0 ? s.pu : s.u;
      // Progress through a phase, in chunks, for cells that accumulate.
      function progress(phaseId) {
        var idx = phases.findIndex(function (p) { return p.id === phaseId; });
        if (s.phase > idx || done) return N;
        if (s.phase < idx) return 0;
        return chunk < 0 ? N * u : chunk + u;
      }
      var tilesAlive = 0, Wactive = 0;

      nodes.chunks.forEach(function (ch, c) {
        var tileW = 0, tileX = g.LX, gradO = 0, gradW, Hhi = 0, dotO = 0.35, dotR = g.narrow ? 3 : 2.5, edge = 0;
        if (mode === 'fused') {
          if (!done && chunk === c) {
            var sweep = ease(seg(u, 0, 0.4));
            Hhi = sweep > 0 && sweep < 1 ? 0.55 : 0.55 * (1 - seg(u, 0.4, 0.5));
            Wactive = sweep < 1 ? 0.35 : 0;
            edge = sweep > 0 && sweep < 1 ? 1 : 0;
            if (phase.id === 'p1' || phase.id === 'p2') {
              var collapse = ease(seg(u, phase.id === 'p1' ? 0.5 : 0.7, 0.92));
              tileX = g.LX + g.LW * collapse;
              tileW = g.LW * sweep * (1 - collapse);
              if (phase.id === 'p2') {
                var gather = seg(u, 0.42, 0.52) * (1 - seg(u, 0.7, 0.8));
                dotO = 0.35 + 0.65 * gather;
                dotR += gather * 1.5;
              }
            } else {
              tileW = g.LW * sweep * (1 - ease(seg(u, 0.62, 0.92)));
              gradO = ease(seg(u, 0.4, 0.58));
            }
            tilesAlive = tileW / g.LW;
          }
          gradW = tileW;
        } else {
          var fw = clamp(progress('fw') - c, 0, 1);
          tileW = g.LW * ease(fw);
          edge = fw > 0 && fw < 1 ? 1 : 0;
          Hhi = fw > 0 && fw < 1 ? 0.55 : 0;
          if (fw > 0 && fw < 1) Wactive = 0.35;
          var bwp = ease(seg(clamp(progress('bw') - c, 0, 1), 0, 0.6));
          gradO = bwp;
          gradW = g.LW * bwp;
          if (phase.id === 'loss' && !done) dotO = 0.35 + 0.65 * Math.sin(Math.PI * u);
        }
        ch.tile.setAttribute('x', tileX);
        ch.tile.setAttribute('width', tileW);
        ch.grad.setAttribute('x', tileX);
        ch.grad.setAttribute('width', gradW);
        ch.grad.setAttribute('opacity', gradO);
        ch.edge.setAttribute('x', tileX + tileW - 2);
        ch.edge.setAttribute('opacity', edge * 0.8);
        ch.H.setAttribute('opacity', Hhi);
        ch.dots.forEach(function (d) { d.setAttribute('opacity', dotO); d.setAttribute('r', dotR); });

        // Accumulating outputs.
        var zFill, lFill, dHFill;
        if (mode === 'fused') {
          zFill = clamp(progress('p1') - c - 0.55, 0, 0.35) / 0.35;
          lFill = clamp(progress('p2') - c - 0.75, 0, 0.2) / 0.2;
          dHFill = clamp(progress('bw') - c - 0.65, 0, 0.3) / 0.3;
        } else {
          zFill = lFill = clamp(progress('loss') - c, 0, 1);
          dHFill = clamp(progress('bw') - c - 0.4, 0, 0.6) / 0.6;
        }
        ch.z.setAttribute('opacity', zFill);
        ch.l.setAttribute('opacity', lFill);
        ch.dH.setAttribute('opacity', dHFill);
      });

      nodes.Wglow.setAttribute('opacity', Wactive);
      nodes.dW.setAttribute('width', (g.Hx + g.hw - g.dHx) * clamp(progress('bw') / N, 0, 1));
      var ghostO = mode === 'dense' ? ease(clamp(progress('loss') / N, 0, 1)) * 0.45 : 0;
      nodes.ghosts.forEach(function (r, k) { r.setAttribute('opacity', ghostO * (k === 0 ? 1 : 0.6)); });

      // Memory meter, counted in C × V tiles on a scale shared by both panels.
      // The dense path peaks at four S × V tensors (logits, log-softmax, dense
      // teacher, logit gradient).
      var live = mode === 'fused' ? (done ? 0 : tilesAlive) : progress('fw') + 2 * progress('loss') + progress('bw');
      mmFill.style.width = (100 * live / (4 * N)) + '%';
      if (mode === 'fused') mmVal.textContent = live > 0.01 ? 'one C × V tile' : 'none';
      else mmVal.textContent = (live / N).toFixed(1) + ' × S × V';

      ksT.textContent = done ? (mode === 'fused' ? 'Same loss, same gradients' : 'Peak reached') : phase.title;
      ksD.textContent = done
        ? (mode === 'fused'
          ? 'Every chunk was projected three times, and no more than one C × V tile was ever alive. Only H, W, log Z, M and the sparse teacher entries were kept.'
          : 'In this sketch, four full S × V tensors are alive at the peak. At 256K tokens and a 131K vocabulary, each one is 128 GiB in fp32.')
        : phase.text;
    }

    responsive(host, build);
    return { render: render };
  }

  function initKernel(root) {
    var N = KERNEL_N, STEP = 1.15, HOLD = 2, PH = N * STEP, TOTAL = 3 * PH + HOLD;
    var scrub = root.querySelector('[data-kernel-scrub]');
    var counter = root.querySelector('[data-ks-n]');
    var chips = root.querySelectorAll('[data-kernel-chips] button');
    var panels = ['dense', 'fused'].map(function (mode) {
      return kernelPanel(root.querySelector('[data-kernel-panel="' + mode + '"]'), mode);
    });

    function stateAt(t) {
      if (t >= 3 * PH) return { done: true, phase: 2, chunk: N - 1, u: 1, pu: 1 };
      var p = Math.floor(t / PH), w = t - p * PH, c = Math.min(N - 1, Math.floor(w / STEP));
      return { done: false, phase: p, chunk: c, u: (w - c * STEP) / STEP, pu: w / PH };
    }
    function render(t) {
      var s = stateAt(t);
      panels.forEach(function (k) { k.render(s); });
      counter.textContent = s.done ? 'Done' : 'Chunk ' + (s.chunk + 1) + ' of ' + N;
      Array.prototype.forEach.call(chips, function (b, p) { b.classList.toggle('is-active', !s.done && p === s.phase); });
      scrub.value = Math.round(1000 * t / TOTAL);
    }

    // Under reduced motion, hold a frame in the middle of the second phase.
    var clock = player(root, TOTAL, render, root.querySelector('[data-kernel-play]'), PH + 2.5 * STEP);
    scrub.addEventListener('input', function () {
      clock.play(false);
      clock.seek((scrub.value / 1000) * TOTAL);
    });
    Array.prototype.forEach.call(chips, function (b, p) {
      b.addEventListener('click', function () { clock.seek(p * PH + 0.001); });
    });
  }

  // ---- Figure 4: memory through one iteration at 32K ------------------------
  // A trace of the paper's 32K run, read off its memory profile: weights and
  // optimizer state stay constant, activations build up through the forward
  // pass and drain in the backward pass, and the loss adds its
  // vocabulary-sized tensors right at the turn.
  var MEM_LAYERS = [
    { key: 'weights', label: 'Model weights', color: 'var(--m-weights)' },
    { key: 'optim', label: 'Optimizer states', color: 'var(--m-optim)' },
    { key: 'grads', label: 'Gradients', color: 'var(--s-grad)' },
    { key: 'acts', label: 'Activations', color: 'var(--m-acts)' },
    { key: 'logits', label: 'Loss and logits', color: null }
  ];
  var MEM_PEAK_T = 0.485;
  function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function memAt(t, dense) {
    var d = t - MEM_PEAK_T;
    var acts = d <= 0 ? 77 * Math.pow(smooth(t / MEM_PEAK_T), 0.75) : 2 + 75 * Math.exp(-Math.pow(d / 0.129, 1.3));
    var width = dense ? (d < 0 ? 0.035 : 0.028) : 0.02;
    return {
      weights: 18, optim: 30,
      grads: 12 * smooth((t - 0.46) / 0.36),
      acts: acts,
      logits: (dense ? 125 : 3) * Math.exp(-Math.pow(d / width, 2))
    };
  }
  function memTotal(m) { return m.weights + m.optim + m.grads + m.acts + m.logits; }

  function initLLM(root) {
    var tip = tooltip(root.querySelector('.figure-frame'));
    var phaseOut = root.querySelector('[data-mem-phase]');
    var DOMAIN = 270, H200 = 141, SWEEP = 7.5, HOLD = 2.5, SAMPLES = 240;
    var height = 260, top = 24, bottom = 30, left = 44;
    var cursor = 0, clock = null;
    var charts = [
      { dense: true, name: 'Dense KL', color: 'var(--s-dense)' },
      { dense: false, name: 'Fused chunked KL', color: 'var(--s-fused)' }
    ];
    var PHASE_TEXT = [
      [0.42, '<strong>Forward pass.</strong> Activations build up layer by layer on top of the weights and optimizer state.'],
      [0.56, '<strong>Loss.</strong> The dense loss materializes the student logits, their log-softmax and a dense teacher, right when activations peak. The fused loss only ever holds one chunk.'],
      [1.01, '<strong>Backward pass.</strong> Activations are released layer by layer while gradients accumulate.']
    ];

    charts.forEach(function (c, ci) {
      c.host = root.querySelector('[data-mem-chart="' + (c.dense ? 'dense' : 'fused') + '"]');
      c.now = root.querySelector('[data-mem-now="' + (c.dense ? 'dense' : 'fused') + '"]');
      c.peak = memTotal(memAt(MEM_PEAK_T, c.dense));
      responsive(c.host, function (w) { draw(c, ci, w); });
    });

    function draw(c, ci, width) {
      c.host.innerHTML = '';
      var svg = el('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height }, c.host);
      var plotW = width - left - 4, base = height - bottom;
      function X(t) { return left + t * plotW; }
      function Y(v) { return top + (1 - v / DOMAIN) * (base - top); }
      c.X = X; c.Y = Y; c.plotW = plotW;

      // Everything above the H200's capacity is shaded.
      el('rect', { x: left, y: Y(DOMAIN), width: plotW, height: Y(H200) - Y(DOMAIN), style: 'fill: var(--s-dense-soft)', opacity: 0.45 }, svg);
      for (var t = 50; t <= 250; t += 50) {
        el('line', { x1: left, x2: left + plotW, y1: Y(t), y2: Y(t), style: 'stroke: var(--fig-grid)' }, svg);
        el('text', { x: 0, y: Y(t) + 4, 'font-size': 11, style: 'fill: var(--fig-muted)', text: t + ' GB' }, svg);
      }

      // Stacked layers, revealed left to right through a clip.
      var clipId = 'mem-clip-' + ci;
      c.clip = el('rect', { x: left, y: 0, width: 0, height: height }, el('clipPath', { id: clipId }, el('defs', {}, svg)));
      var areas = el('g', { 'clip-path': 'url(#' + clipId + ')' }, svg);
      var samples = [];
      for (var i = 0; i <= SAMPLES; i++) samples.push(memAt(i / SAMPLES, c.dense));
      var lower = samples.map(function () { return 0; });
      MEM_LAYERS.forEach(function (layer) {
        var upper = samples.map(function (m, i) { return lower[i] + m[layer.key]; });
        var d = 'M' + upper.map(function (v, i) { return X(i / SAMPLES).toFixed(1) + ',' + Y(v).toFixed(1); }).join('L');
        for (var j = SAMPLES; j >= 0; j--) d += 'L' + X(j / SAMPLES).toFixed(1) + ',' + Y(lower[j]).toFixed(1);
        el('path', { d: d + 'Z', 'stroke-width': 1, style: 'fill: ' + (layer.color || c.color) + '; stroke: var(--fig-surface)' }, areas);
        lower = upper;
      });

      el('line', { x1: left, x2: left + plotW, y1: base + 0.5, y2: base + 0.5, style: 'stroke: var(--fig-axis)' }, svg);
      el('line', { x1: left, x2: left + plotW, y1: Y(H200), y2: Y(H200), 'stroke-width': 1.5, 'stroke-dasharray': '4 4', style: 'stroke: var(--fig-ink-2)' }, svg);
      el('text', { x: left + 4, y: Y(H200) - 7, 'font-size': 11, style: 'fill: var(--fig-ink-2)', text: 'H200 · 141 GB' }, svg);
      [[0.2, 'Forward'], [MEM_PEAK_T, 'Loss'], [0.78, 'Backward']].forEach(function (p) {
        el('text', { x: X(p[0]), y: height - 9, 'font-size': 11, 'text-anchor': 'middle', style: 'fill: var(--fig-muted)', text: p[1] }, svg);
      });

      // Peak marker, shown once the cursor has passed it.
      var px = X(MEM_PEAK_T), py = Y(c.peak);
      c.peakG = el('g', { opacity: 0 }, svg);
      el('circle', { cx: px, cy: py, r: 4.5, 'stroke-width': 2, style: 'fill: var(--fig-ink); stroke: var(--fig-surface)' }, c.peakG);
      el('text', { x: px + 10, y: py + (c.dense ? 4 : -20), 'font-size': 12.5, 'font-weight': 650, style: 'fill: var(--fig-ink)', text: 'peak ≈ ' + Math.round(c.peak) + ' GB' }, c.peakG);

      // Cursor.
      c.cur = el('line', { y1: top - 6, y2: base, 'stroke-width': 1, style: 'stroke: var(--fig-ink-2)' }, svg);
      c.dot = el('circle', { r: 3.5, 'stroke-width': 2, style: 'fill: ' + c.color + '; stroke: var(--fig-surface)' }, svg);

      var hit = el('rect', { x: left, y: 0, width: plotW, height: height, fill: 'transparent' }, svg);
      hit.addEventListener('pointermove', function (event) {
        var box = hit.getBoundingClientRect();
        clock.held = true;
        update(clamp((event.clientX - box.left) / box.width, 0, 1));
        var m = memAt(cursor, c.dense);
        tip.show('<b>' + c.name + ' · ' + fmt(memTotal(m), 0) + ' GB</b>' + MEM_LAYERS.slice().reverse().map(function (l) {
          return '<br><span class="tt-k">' + l.label + '</span> ' + fmt(m[l.key], 0) + ' GB';
        }).join(''), event);
      });
      hit.addEventListener('pointerleave', function () { clock.held = false; tip.hide(); });
      update(cursor);
    }

    function update(t) {
      cursor = t;
      charts.forEach(function (c) {
        if (!c.X) return;
        var total = memTotal(memAt(t, c.dense));
        var x = c.X(t);
        c.clip.setAttribute('width', Math.max(0, x - c.X(0)));
        c.cur.setAttribute('x1', x); c.cur.setAttribute('x2', x);
        c.dot.setAttribute('cx', x); c.dot.setAttribute('cy', c.Y(total));
        c.peakG.setAttribute('opacity', t >= MEM_PEAK_T ? 1 : 0);
        c.now.textContent = fmt(total, 0) + ' GB' + (total > H200 ? ' · does not fit' : '');
      });
      phaseOut.innerHTML = PHASE_TEXT.find(function (p) { return t < p[0]; })[1];
    }

    clock = player(root, SWEEP + HOLD, function (t) { update(Math.min(1, t / SWEEP)); }, root.querySelector('[data-mem-play]'), SWEEP);
  }

  // ---- Figure 5: loss-only benchmark ------------------------------------------
  // Values from kd_benchmark_results.csv, chunk size 4,096.
  var BENCH = {
    '32K': { mem: [85.21, 17.70, 5.45], ms: [218.0, 183.3, 198.5] },
    '256K': { mem: [null, 134.19, 11.59], ms: [null, 5257.0, 1587.8] }
  };
  var METHODS = [
    { label: 'Dense KL', color: 'var(--s-dense)' },
    { label: 'Forward-chunked', color: 'var(--s-fwd)' },
    { label: 'Fused chunked', color: 'var(--s-fused)' }
  ];
  function msFormat(v) { return v >= 1000 ? fmt(v / 1000, 2) + ' s' : fmt(v, 0) + ' ms'; }

  function initBench(root) {
    var group = root.querySelector('[data-bench-seq]');
    var callout = root.querySelector('[data-bench-callout]');
    var narrowLabels = root.clientWidth < 520;
    var labelW = narrowLabels ? 0 : 112;
    var rows = METHODS.map(function (m, i) {
      return {
        label: m.label, color: m.color,
        tip: function (v) { return '<b>' + m.label + '</b><br>' + (v == null ? 'Out of memory' : '<span class="tt-k">Peak</span> ' + fmt(v, 2) + ' GiB'); }
      };
    });
    var mem = barChart(root.querySelector('[data-bench-mem]'), {
      rows: rows, labelWidth: labelW, domain: 150,
      marker: { value: 139.7, label: 'H200 · 139.7 GiB' },
      format: function (v) { return fmt(v, v < 10 ? 2 : 1) + ' GiB'; },
      tick: function (t) { return String(t); }
    });
    var time = barChart(root.querySelector('[data-bench-time]'), {
      rows: METHODS.map(function (m) {
        return { label: m.label, color: m.color, tip: function (v) { return '<b>' + m.label + '</b><br>' + (v == null ? 'Out of memory' : '<span class="tt-k">Forward + backward</span> ' + msFormat(v)); } };
      }),
      labelWidth: labelW, domain: 6000,
      format: msFormat,
      tick: function (t) { return t >= 1000 ? t / 1000 + ' s' : t + (t ? ' ms' : ''); }
    });
    var COPY = {
      '32K': '<strong>15.6× less memory</strong> than the dense loss. The forward-chunked loss is about 8% faster at this length, since it projects each chunk only once.',
      '256K': 'Dense KL does not fit. Against the forward-chunked loss, the fused loss uses <strong>11.6× less memory</strong> and is <strong>3.3× faster</strong>.'
    };
    function update() {
      var key = pressed(group).dataset.seq;
      var d = BENCH[key];
      mem.update(d.mem, 150);
      var maxMs = Math.max.apply(null, d.ms.filter(function (v) { return v != null; }));
      time.update(d.ms, niceStep(maxMs, 4) * Math.ceil(maxMs / niceStep(maxMs, 4)));
      callout.innerHTML = COPY[key];
    }
    onSeg(group, update);
    update();
  }

  // ---- Figure 6: chunk-size sweep ---------------------------------------------
  var CHUNKS = {
    '32K': { mem: [4.13, 4.32, 4.70, 5.45, 8.46], ms: [430.4, 298.1, 230.6, 198.5, 181.8] },
    '256K': { mem: [10.28, 10.47, 10.84, 11.59, 14.60], ms: [3465.8, 2382.5, 1835.9, 1587.8, 1454.5] }
  };
  function initChunk(root) {
    var group = root.querySelector('[data-chunk-seq]');
    var cats = [
      { label: '512', tokens: '512' }, { label: '1K', tokens: '1,024' }, { label: '2K', tokens: '2,048' },
      { label: '4K', tokens: '4,096', highlight: true }, { label: '8K', tokens: '8,196' }
    ];
    var mem = columnChart(root.querySelector('[data-chunk-mem]'), {
      categories: cats,
      format: function (v) { return fmt(v, 1); },
      tick: function (t) { return t + ' GiB'; },
      tip: function (c, v) { return '<b>Chunk ' + c.tokens + ' tokens</b><br><span class="tt-k">Peak</span> ' + fmt(v, 2) + ' GiB'; }
    });
    var time = columnChart(root.querySelector('[data-chunk-time]'), {
      categories: cats,
      format: msFormat,
      tick: function (t) { return t >= 1000 ? t / 1000 + ' s' : t + ' ms'; },
      tip: function (c, v) { return '<b>Chunk ' + c.tokens + ' tokens</b><br><span class="tt-k">Iteration</span> ' + msFormat(v); }
    });
    function roundUp(max) { var s = niceStep(max, 3); return s * Math.ceil(max / s); }
    function update() {
      var d = CHUNKS[pressed(group).dataset.seq];
      mem.update(d.mem, roundUp(Math.max.apply(null, d.mem) * 1.08));
      time.update(d.ms, roundUp(Math.max.apply(null, d.ms) * 1.08));
    }
    onSeg(group, update);
    update();
  }

  // ---- Boot -------------------------------------------------------------------
  function boot() {
    if (window.renderMathInElement) {
      window.renderMathInElement(document.querySelector('.post-body'), {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '\\(', right: '\\)', display: false }],
        throwOnError: false
      });
    }
    var figures = [
      ['#fig-wall', initWall], ['#fig-row', initRow], ['#fig-kernel', initKernel],
      ['#fig-32k', initLLM], ['#fig-bench', initBench], ['#fig-chunk', initChunk]
    ];
    figures.forEach(function (f) {
      var node = document.querySelector(f[0]);
      if (node) f[1](node);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
