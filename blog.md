---
title: Blog
button_title: Blog
layout: default
filename: blog
---

# Blog Posts

---

<div class="grid">
  <article class="card">
    <img class="card-img" src="icons/multiverse.png" alt="Multiverse Computing">
    <div class="card-content">
      <h3 class="card-title">Quantization-Aware Healing: a compressed, 4-bit model that outperforms its full-precision original</h3>
      <p class="meta">Bakbergen Ryskulov, <ins>Iker García-Ferrero</ins>, David Montero, David Jansen, Ali Hashemi, Jezabel R. Garcia, Antonio Tiene, Román Orús.</p>
      <p><strong>TL;DR</strong>: Quantization-Aware Healing (QAH) distills a 4-bit compressed model directly from the original full-precision model instead of an already-degraded checkpoint, recovering a compressed LLM that matches or beats its full-precision source while using far fewer resources. Used to produce Hypernova-60B.</p>
      <p>📒 <a href="https://huggingface.co/blog/MultiverseComputingCAI/quantization-aware-healing">Blog Post</a></p>
    </div>
  </article>

  <article class="card">
    <img class="card-img" src="icons/multiverse.png" alt="Multiverse Computing">
    <div class="card-content">
      <h3 class="card-title">Making Knowledge Distillation Cheap Enough to Run at Scale</h3>
      <p class="meta">Bakbergen Ryskulov, <ins>Iker García-Ferrero</ins>, David Montero, David Jansen, Ali Hashemi, Jezabel R. Garcia, Antonio Tiene, Román Orús.</p>
      <p><strong>TL;DR</strong>: We introduce offline top-K logit distillation and a fused, chunked KL-divergence loss that make knowledge distillation dramatically cheaper: ~29% faster per training iteration, up to 41% higher throughput, and up to 4x longer context on a single GPU.</p>
      <p>📒 <a href="https://huggingface.co/blog/MultiverseComputingCAI/efficient-knowledge-distillation">Blog Post</a></p>
    </div>
  </article>

  <article class="card">
    <img class="card-img" src="icons/Krea.png" alt="Krea">
    <div class="card-content">
      <h3 class="card-title">Releasing Open Weights for FLUX.1 Krea</h3>
      <p class="meta">Sangwu Lee, Titus Ebbecke, Erwann Millon, Will Beddow, Le Zhuo, <ins>Iker García-Ferrero</ins>, Liam Esparraguera, Mihai Petrescu, Gian Saß, Gabriel Menezes, Victor Perez</p>
      <p><strong>TL;DR</strong>: Today, we're releasing an open version of Krea 1, our first image model trained in collaboration with Black Forest Labs to offer superior aesthetic control and image quality. This checkpoint is fully compatible with FLUX.1-dev.</p>
      <p>📒 <a href="https://www.krea.ai/blog/flux-krea-open-source-release">Blog Post</a></p>
    </div>
  </article>

  <article class="card">
    <img class="card-img" src="https://github.com/hitz-zentroa/GoLLIE/blob/main/assets/GoLLIE.png?raw=true" alt="GoLLIE">
    <div class="card-content">
      <h3 class="card-title">GoLLIE: Guideline-following Large Language Model for Information Extraction</h3>
      <p class="meta">Oscar Sainz, <ins>Iker García-Ferrero</ins>, Rodrigo Agerri, Oier Lopez de Lacalle, German Rigau and Eneko Agirre</p>
      <p><strong>TL;DR</strong>: We present GoLLIE, a Large Language Model trained to follow annotation guidelines. It outperforms previous approaches on zero-shot IE and supports schemas defined on the fly.</p>
      <p>📒 <a href="https://hitz-zentroa.github.io/GoLLIE/">Blog Post</a></p>
    </div>
  </article>

  <article class="card">
    <img class="card-img" src="icons/ChatGPT.svg" alt="ChatGPT contamination">
    <div class="card-content">
      <h3 class="card-title">Did ChatGPT cheat on your test? (2023)</h3>
      <p class="meta">Oscar Sainz, Jon Ander Campos, <ins>Iker García-Ferrero</ins>, Julen Etxaniz, Eneko Agirre</p>
      <p><strong>TL;DR</strong>: We show popular benchmark datasets are already memorized by ChatGPT and that one can prompt ChatGPT to regenerate them.</p>
      <p>📒 <a href="https://hitz-zentroa.github.io/lm-contamination/blog/">Blog Post</a></p>
    </div>
  </article>
</div>

