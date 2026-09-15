"""Check generated local links and anchor targets after a Jekyll build."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1] / '_site'
ORIGIN = 'https://ikergarcia1996.github.io'

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.duplicates = [], set(), []
        self.feed(path.read_text())
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs:
            if attrs['id'] in self.ids:
                self.duplicates.append(attrs['id'])
            self.ids.add(attrs['id'])
        for attr in ('href', 'src'):
            if attr in attrs:
                self.links.append(attrs[attr])

pages = {path: Page(path) for path in ROOT.rglob('*.html')}
errors = []
assert pages, 'Build the site before checking it.'
for path, page in pages.items():
    relative = path.relative_to(ROOT).as_posix()
    errors.extend(f'{relative}: duplicate id {value}' for value in page.duplicates)
    for link in page.links:
        url = urlsplit(urljoin(ORIGIN + '/' + relative, link))
        if url.scheme not in ('http', 'https') or url.netloc != urlsplit(ORIGIN).netloc:
            continue
        target = ROOT / unquote(url.path).lstrip('/')
        if target.is_dir():
            target /= 'index.html'
        if not target.is_file():
            errors.append(f'{relative}: missing target {link}')
        elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            errors.append(f'{relative}: missing anchor {link}')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: internal links, assets, anchor targets, and unique IDs on {len(pages)} pages')
