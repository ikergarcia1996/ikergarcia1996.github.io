# Iker García-Ferrero — personal website

Source for [ikergarcia1996.github.io](https://ikergarcia1996.github.io/), a Jekyll site hosted on GitHub Pages.

## Structure

The site uses the original blue banner and page tabs. Every tab opens a complete page, with no hidden archives or extra expansion step.

- `index.md` — biography, profile, six featured models, background timeline, and contact
- `_data/projects.json` — shared model descriptions and personal contributions
- `_data/publications.json` — complete publication archive, with optional research summaries
- `_data/writing.json` — shared articles, summaries, and verified publication dates
- `publications.md`, `software.md`, `experience.md`, `dissemination.md`, `blog.md` — full archives
- `_layouts/`, `_includes/` — shared layout and reusable content templates
- `assets/css/main.css` — responsive layout and light/dark themes
- `assets/js/main.js` — theme preference, pointer-reactive banner, and publication search
- `assets/Iker-Garcia-Ferrero-CV.pdf` — downloadable public CV
- `Iker-Garcia-Ferrero/index.html` — redirects the old homepage URL to the current homepage
- `Iker-Garcia-Ferrero/images/Iker.jpeg` — JPEG copy of `images/avatar.jpg` for old portrait links and image embeds (including the old double-slash URL)

Publication search is optional JavaScript; the full archive, year links, and research summaries remain available without it. Dates are displayed only where known, with a year used when an exact date is unavailable.

CSS and JavaScript URLs include the Jekyll build timestamp. Each deployment gets a new asset URL so a cached stylesheet or script from an earlier design cannot be reused with the new HTML.

## Run locally

With Docker:

```bash
docker run --rm -p 127.0.0.1:4000:4000 -e BUNDLE_PATH=/srv/jekyll/vendor/bundle \
  -v "$PWD":/srv/jekyll -w /srv/jekyll jekyll/jekyll:4 \
  sh -c "bundle install && bundle exec jekyll serve --host 0.0.0.0 --force_polling"
```

Open <http://localhost:4000/>. Dependencies in `vendor/` and generated files in `_site/` are ignored by Git.

After building, validate internal links and anchors:

```bash
python3 scripts/check_site.py
```

## CV and content maintenance

The public PDF is based on the supplied LaTeX CV, with email as its contact method, an updated role and publication list, and corrected layout spacing. The original CV repository is unchanged. Replace the public PDF when refreshing the CV; it is a static download.

Add publications and articles to the data files in reverse chronological order. Set a publication's `summary` for an expandable research summary. All six models appear on the homepage; Models & Code also includes personal contributions and the complete software collection.

When replacing `images/avatar.jpg`, also update `Iker-Garcia-Ferrero/images/Iker.jpeg` so existing portrait links keep showing the same image. The legacy path serves an actual image so external image embeds continue to work.

The AI4HF logo in `icons/ai4hf.svg` is the original vector logo from [AI4HF's website](https://www.ai4hf.com/).
