---
title: Blog
layout: default
description: Articles about model compression, efficient training, LLM safety, and open research.
---

<div class="page-intro">
  <h1>Blog</h1>
  <p>Articles and technical reports from the projects I contribute to.</p>
</div>
<div class="writing-list">{% for post in site.data.writing %}{% include writing.html post=post %}{% endfor %}</div>
