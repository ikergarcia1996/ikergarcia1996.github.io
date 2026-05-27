# Iker García-Ferrero — personal website

Source for [ikergarcia1996.github.io/Iker-Garcia-Ferrero](https://ikergarcia1996.github.io/Iker-Garcia-Ferrero/), a Jekyll site hosted on GitHub Pages.

## Structure

- `index.md` — homepage (bio + featured models)
- `publications.md`, `software.md`, `experience.md`, `dissemination.md`, `blog.md` — content pages
- `_layouts/`, `_includes/` — custom layout, header/nav, footer
- `assets/css/main.css` — design system (light/dark theming)
- `assets/js/main.js` — theme toggle + header interaction

## Run locally

With Docker (no local Ruby needed):

```bash
docker run --rm -p 4000:4000 -v "$PWD":/srv/jekyll -w /srv/jekyll \
  jekyll/jekyll:4 sh -c "bundle install && bundle exec jekyll serve --host 0.0.0.0"
```

Then open <http://localhost:4000/Iker-Garcia-Ferrero/>.
