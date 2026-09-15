---
title: Publications
layout: default
description: Research papers on efficient foundation models, controllable model behaviour, and cross-lingual NLP.
---

<div class="page-intro">
  <h1>Publications</h1>
  <p>Research on efficient foundation models, controllable model behaviour, and cross-lingual NLP.</p>
  <a class="more-link" href="https://scholar.google.com/citations?user=yoOzj1MAAAAJ">Google Scholar <span aria-hidden="true">↗</span></a>
</div>

<div class="publication-search" hidden>
  <label for="publication-search">Find a publication</label>
  <div class="search-controls"><input id="publication-search" type="search" placeholder="Search title, author, venue, or year…" autocomplete="off" aria-describedby="search-status"><button type="button" id="clear-search">Clear</button></div>
  <p id="search-status" class="meta" role="status" aria-live="polite"></p>
</div>

{% assign years = site.data.publications | group_by: 'year' | sort: 'name' | reverse %}
<nav class="year-nav" aria-label="Publication years">{% for year in years %}<a href="#year-{{ year.name }}">{{ year.name }}</a>{% endfor %}</nav>
{% for year in years %}
<section id="year-{{ year.name }}" class="publication-year section-anchor" data-publication-year>
  <h2>{{ year.name }}</h2>
  <div class="publication-list">{% for publication in year.items %}{% include publication.html publication=publication %}{% endfor %}</div>
</section>
{% endfor %}
<p id="no-publications" hidden>No publications match your search. Try another term or clear the search.</p>
