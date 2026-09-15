---
layout: default
title: Iker García-Ferrero
permalink: /
home: true
---

<section id="about" class="hero" aria-label="About me">
  <div class="hero-main">
    <p class="lead">Senior LLM Researcher at <a href="https://multiversecomputing.com">Multiverse Computing</a>. I train, compress, and optimize large-scale foundation models for both language and vision.</p>

    <p>PhD in Natural Language Processing from the <a href="https://www.ehu.eus/en/en-home">University of the Basque Country UPV/EHU</a>, developed at the <a href="https://www.ixa.eus/?language=en">IXA Group</a> and the <a href="https://www.hitz.eus/">HiTZ Basque Center for Language Technologies</a>.</p>

    <p>My work spans large-scale training, efficient inference, and model compression. At HiTZ I trained <a href="https://arxiv.org/abs/2506.07597">Latxa</a> on the <a href="https://leonardo-supercomputer.cineca.eu/hpc-system/">Leonardo Supercomputer</a> using up to 512 GPUs across 128 nodes. At <a href="https://www.krea.ai">Krea</a> I optimized fine-tuning pipelines for image and video diffusion models with distributed techniques such as FSDP2. Today, I work on making foundation models more efficient at Multiverse Computing.</p>

    <p><a href="https://www.goexponential.org/directory/fellows/iker-garcia-ferrero">Exponential Fellow 2025</a>. In my free time I build <a href="https://veridika.ai">veridika.ai</a>, an AI agent framework for real-time fact-checking.</p>
  </div>

  <aside class="hero-aside">
    <div class="profile-card">
      <img class="avatar" src="{{ '/images/avatar.jpg' | relative_url }}" alt="Iker García-Ferrero giving a talk" width="220" height="220" fetchpriority="high">
      <p class="profile-role">Senior LLM Researcher</p>
      <p class="profile-meta"><a href="https://multiversecomputing.com">Multiverse Computing</a></p>
      <p class="profile-meta">Donostia–San Sebastián · Spain</p>
      <p class="profile-meta"><a href="mailto:igarciaf896@gmail.com">igarciaf896@gmail.com</a></p>
      <a class="button profile-cv" href="{{ '/assets/Iker-Garcia-Ferrero-CV.pdf' | relative_url }}">Download CV <span class="file-type">PDF</span></a>
      <div class="badges">
        <a href="https://scholar.google.com/citations?user=yoOzj1MAAAAJ" title="Google Scholar"><img class="badge-icon" src="icons/google-scholar.png" alt="Google Scholar"></a>
        <a href="https://github.com/ikergarcia1996" title="GitHub"><img class="badge-icon" src="icons/github.png" alt="GitHub"></a>
        <a href="https://twitter.com/iker_garciaf" title="X"><img class="badge-icon" src="icons/X.png" alt="X"></a>
        <a href="https://www.linkedin.com/in/iker-garc%C3%ADa-ferrero-75343b172/?locale=en_US" title="LinkedIn"><img class="badge-icon" src="icons/linkedin.png" alt="LinkedIn"></a>
        <a href="https://www.semanticscholar.org/author/Iker-Garc%C3%ADa-Ferrero/1453724884" title="Semantic Scholar"><img class="badge-icon" src="icons/semantic-scholar.png" alt="Semantic Scholar"></a>
        <a href="https://orcid.org/0000-0001-9612-7134" title="ORCID"><img class="badge-icon" src="icons/orcid.png" alt="ORCID"></a>
      </div>
      <a class="profile-hf" href="https://huggingface.co/Iker">Hugging Face <span aria-hidden="true">↗</span></a>
    </div>
  </aside>
</section>

<section id="featured-models" class="home-section" aria-labelledby="models-title">
  <div class="section-head">
    <h2 id="models-title">Featured Models</h2>
    <a class="button" href="{{ '/software.html' | relative_url }}">All models &amp; code <span aria-hidden="true">→</span></a>
  </div>
  <div class="project-grid">
    {% for project in site.data.projects %}{% include project.html project=project compact=true %}{% endfor %}
  </div>
</section>

<section id="background" class="home-section section-anchor" aria-labelledby="background-title">
  <div class="section-head">
    <h2 id="background-title">Background</h2>
    <a class="button" href="{{ '/experience.html' | relative_url }}">Full career &amp; education <span aria-hidden="true">↗</span></a>
  </div>
  <div class="background-grid">
    <ol class="timeline">
      <li><span class="meta">2025–present</span><h3>Multiverse Computing</h3><p>Senior LLM Researcher. Model compression, synthetic training data, and efficient distillation. Training EU-focused large language models from scratch.</p></li>
      <li><span class="meta">2025</span><h3>Krea</h3><p>Machine Learning Researcher. Image and video generation, distributed fine-tuning, and artistic image retrieval.</p></li>
      <li><span class="meta">2020–2025</span><h3>HiTZ · University of the Basque Country</h3><p>PhD in NLP, advised by German Rigau and Rodrigo Agerri. Cross-lingual learning and language models.</p></li>
    </ol>
    <aside class="background-note">
      <h3>Beyond the lab</h3>
      <p>I was a visiting PhD student with Dan Roth at the University of Pennsylvania and an Applied Scientist Intern at Amazon.</p>
      <p><a href="https://www.goexponential.org/directory/fellows/iker-garcia-ferrero">Exponential Fellow 2025</a>. I also build <a href="https://veridika.ai">Veridika.ai</a>, an agent framework for real-time fact-checking.</p>
      <p>I co-organized the first <a href="https://conda-workshop.github.io/">CONDA workshop at ACL 2024</a> and taught introductory language technology courses.</p>
      <a class="more-link" href="{{ '/dissemination.html' | relative_url }}">Teaching &amp; outreach <span aria-hidden="true">↗</span></a>
    </aside>
  </div>
</section>

<section id="contact" class="contact-section section-anchor" aria-labelledby="contact-title">
  <p class="eyebrow">Get in touch</p>
  <h2 id="contact-title">Let’s talk about models.</h2>
  <p>For research conversations, collaborations, or questions about my work:</p>
  <a class="contact-email" href="mailto:igarciaf896@gmail.com">igarciaf896@gmail.com <span aria-hidden="true">↗</span></a>
</section>
