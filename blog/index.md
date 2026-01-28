---
layout: default
title: Blog
---

<section id="blog" class="section section-blog">
  <div class="section-inner">
    <h2 class="section-title">Blog</h2>
    <p class="section-description">Thoughts on sound, storytelling, and making things for screens.</p>

    <div class="blog-grid">
      {% for post in site.posts %}
      <article class="blog-card">
        <h3 class="blog-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p class="blog-meta">{{ post.date | date: "%b %Y" }}</p>
        <p class="blog-excerpt">{{ post.excerpt | strip_html | truncate: 160 }}</p>
        <a href="{{ post.url | relative_url }}" class="blog-link">Read more</a>
      </article>
      {% endfor %}
    </div>
  </div>
</section>
