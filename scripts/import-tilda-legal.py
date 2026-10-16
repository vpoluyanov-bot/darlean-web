"""
Converts one regional version of a legal page exported from Tilda into the
block model the site renders from src/i18n/en.json.

    python3 scripts/import-tilda-legal.py <pageNNN.html> <region>

The old site kept every region of a document on one page — EU, UK and US —
and showed one of them by `?region=`. Each region is a run of records tagged
`uc-reg<region>`: a notice saying who the version applies to, a title record
(t795) and the article itself (t123, a nested <ol> numbered by CSS counters).
The privacy policy also carries an untagged zero block after the article, the
Darvis AI addendum, which Tilda showed to every region.

Numbering is written into the text, the way the CSS counters drew it: "1." on
sections, "1.1" and "1.1.1" on the items inside them. Inline markup is reduced
to links, bold runs and line breaks; everything else, styles included, goes.
"""
import json
import re
import sys
from html import escape, unescape
from html.parser import HTMLParser

VOID = {'br', 'img', 'hr', 'input', 'meta', 'link', 'wbr'}
BLOCK = {'h1', 'h2', 'h3', 'h4', 'h5', 'p', 'ul', 'ol', 'li', 'table', 'div'}
REGION_NAMES = {'us': 'the United States', 'uk': 'the United Kingdom', 'eu': 'the European Union'}


class Node:
    def __init__(self, tag, attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs or []), parent, []


class TreeBuilder(HTMLParser):
    """A forgiving DOM: Tilda's markup has <p> inside <ul> and unclosed items."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = self.cur = Node('root')

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs, self.cur)
        self.cur.children.append(node)
        if tag not in VOID:
            self.cur = node

    def handle_endtag(self, tag):
        node = self.cur
        while node is not self.root and node.tag != tag:
            node = node.parent
        if node is not self.root:
            self.cur = node.parent

    def handle_data(self, data):
        self.cur.children.append(data)


def parse_html(fragment: str) -> Node:
    builder = TreeBuilder()
    builder.feed(re.sub(r'<!--.*?-->', '', fragment, flags=re.S))
    return builder.root


def fix_href(href: str, region: str) -> str:
    """Links between the legal documents point at this region's copy."""
    href = unescape(href).strip()
    page = re.match(r'https?://(?:www\.)?darlean\.com/en/(terms|policy|cookies)\b', href)
    if page:
        return f'/en/{page.group(1)}?region={region}'
    # Drop Google's cross-domain linker, which carries someone's client id.
    return re.sub(r'\?_gl=[^#\s]*', '', href)


def inline(nodes, region: str) -> str:
    out = []
    for node in nodes:
        if isinstance(node, str):
            out.append(escape(node, quote=False))
        elif node.tag == 'br':
            out.append('<br>')
        elif node.tag in ('strong', 'b') or (
            node.tag == 'span' and re.search(r'font-weight:\s*[67]00', node.attrs.get('style', ''))
        ):
            inner = inline(node.children, region)
            out.append(f'<strong>{inner}</strong>' if inner.strip() else inner)
        elif node.tag == 'a':
            href = node.attrs.get('href', '')
            inner = inline(node.children, region)
            # The cookie banner link opened a Tilda widget the new site lacks.
            if not href or href.startswith('#'):
                out.append(inner)
            else:
                out.append(f'<a href="{escape(fix_href(href, region))}">{inner}</a>')
        elif node.tag in ('script', 'style'):
            continue
        else:
            out.append(inline(node.children, region))
    html = re.sub(r'\s+', ' ', ''.join(out))
    html = re.sub(r'\s*<br>\s*', '<br>', html)
    html = re.sub(r'<strong>\s*</strong>', '', html)
    # "<strong>Log files:</strong>We collect" — the label ran into its text.
    html = re.sub(r'\s*</strong>(?=\w)', '</strong> ', html)
    html = re.sub(r'(?<=\w)<strong>\s*', ' <strong>', html)
    return re.sub(r'^(<br>)+|(<br>)+$', '', html.strip()).strip()


def text(node, region='') -> str:
    """Plain text, for headings and column names: Astro escapes these itself."""
    plain = re.sub(r'<br>', ' ', inline([node], region))
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', '', plain))).strip()


class Emitter:
    def __init__(self, region):
        self.region, self.blocks = region, []
        self.zero_seen = False

    def p(self, html, prefix=''):
        if html:
            self.blocks.append({'type': 'p', 'html': f'{prefix} {html}'.strip()})

    def heading(self, level, value):
        if value:
            self.blocks.append({'type': level, 'text': value})

    def flow(self, nodes, number=None, scope=None):
        """Renders mixed content. `number` prefixes the first paragraph only;
        `scope` is the item's own number, which nested lists count under."""
        scope = scope or number
        run = []

        def flush():
            nonlocal number
            html = inline(run, self.region)
            run.clear()
            if html:
                self.p(html, number or '')
                number = None

        for node in nodes:
            if isinstance(node, str) or node.tag not in BLOCK | {'thead', 'tbody'}:
                run.append(node)
                continue
            flush()
            tag = node.tag
            if tag in ('h1', 'h2', 'h3', 'h4', 'h5'):
                level = 'h2' if tag in ('h1', 'h2') else 'h3'
                label = text(node, self.region)
                self.heading(level, f'{number} {label}' if number else label)
                number = None
            elif tag == 'p':
                self.p(inline(node.children, self.region), number or '')
                number = None
            elif tag == 'ul':
                self.ul(node)
            elif tag == 'ol':
                if not is_toc(node):
                    self.ol(node, scope)
            elif tag == 'table':
                self.table(node)
            else:  # div, a stray li
                self.flow(node.children, number, scope)
                number = None
        flush()

    def ul(self, node):
        items, strays = [], []
        for child in node.children:
            if isinstance(child, str):
                continue
            if child.tag == 'li':
                html = inline(child.children, self.region)
                if html:
                    items.append(html)
            elif child.tag == 'p':  # Tilda put paragraphs inside lists
                if items:
                    self.blocks.append({'type': 'ul', 'items': items})
                    items = []
                self.p(inline(child.children, self.region))
        if items:
            if self.blocks and self.blocks[-1]['type'] == 'ul':
                self.blocks[-1]['items'].extend(items)  # one list, split by markup
            else:
                self.blocks.append({'type': 'ul', 'items': items})

    def ol(self, node, parent=None):
        index = 0
        for child in node.children:
            if isinstance(child, str):
                continue
            if child.tag != 'li':
                # Tilda left some paragraphs between the items, unnumbered.
                self.flow([child])
                continue
            index += 1
            # Sections read "1.", items inside them "1.1" — as the CSS drew it.
            number = f'{parent.rstrip(".")}.{index}' if parent else f'{index}.'
            self.flow(child.children, number)

    def table(self, node):
        columns = [text(th, self.region) for th in find_all(node, 'th')]
        rows = []
        for tr in find_all(node, 'tr'):
            cells = [inline(td.children, self.region) for td in find_all(tr, 'td')]
            if cells:
                rows.append(cells)
        block = {'type': 'table', 'columns': columns, 'rows': rows}
        for i, column in enumerate(columns):
            if column.lower() == 'cookie name':
                block['mono'] = i
        self.blocks.append(block)


def is_toc(node) -> bool:
    """A list whose every item is a single in-page link: a table of contents."""
    def only_anchor(li):
        content = [c for c in li.children if not isinstance(c, str) or c.strip()]
        return (
            len(content) == 1
            and not isinstance(content[0], str)
            and content[0].tag == 'a'
            and content[0].attrs.get('href', '').startswith('#')
        )

    items = [c for c in node.children if not isinstance(c, str) and c.tag == 'li']
    return bool(items) and all(only_anchor(li) for li in items)


def find_all(node, tag):
    found = []
    for child in node.children:
        if isinstance(child, str):
            continue
        if child.tag == tag:
            found.append(child)
        else:
            found.extend(find_all(child, tag))
    return found


def find_class(node, cls):
    for child in node.children:
        if isinstance(child, str):
            continue
        if cls in child.attrs.get('class', '').split():
            return child
        hit = find_class(child, cls)
        if hit:
            return hit
    return None


def records(page: str):
    """Yields (id, classes, type, html) for every top-level record."""
    heads = list(re.finditer(r'<div id="rec(\d+)" class="r t-rec([^"]*)"[^>]*data-record-type="(\d+)"', page))
    for i, head in enumerate(heads):
        end = heads[i + 1].start() if i + 1 < len(heads) else page.index('</div><!--/allrecords-->') if '</div><!--/allrecords-->' in page else len(page)
        yield head.group(1), head.group(2).split(), head.group(3), page[head.start():end]


def zero_block(html: str, region: str, emit: Emitter):
    """Tilda's zero block positions text absolutely; reading order is by top.

    Its editors pasted some copy twice — a paragraph at the end of one box and
    again at the start of the next, a question and answer repeated whole — and
    on the old page the boxes simply overlapped. Exact repeats are dropped.
    """
    elems = []
    for m in re.finditer(r"<div class='t396__elem tn-elem[^']*'([^>]*)>\s*<div class='tn-atom'[^>]*>(.*?)</div>\s*</div>", html, re.S):
        attrs = m.group(1)
        top = re.search(r"data-field-top-value=\"(-?\d+)\"", attrs)
        size = re.search(r"data-field-fontsize-value=\"(\d+)\"", attrs)
        elems.append((int(top.group(1)) if top else 0, int(size.group(1)) if size else 16, m.group(2)))
    elems.sort(key=lambda e: e[0])

    parts = []
    for _, size, atom in elems:
        if size >= 20:
            parts.append(('h', text(parse_html(atom), region)))
            continue
        # Body copy: a blank line (<br><br>) separates paragraphs; lists stand alone.
        for chunk in re.split(r'(<ul\b.*?</ul>)|(?:<br\s*/?>\s*){2,}', atom, flags=re.S):
            if not chunk or not chunk.strip():
                continue
            if chunk.lstrip().startswith('<ul'):
                parts.append(('ul', chunk))
            else:
                parts.append(('p', inline(parse_html(chunk).children, region)))

    # A heading and its body repeated back to back are kept once.
    groups = []
    for part in parts:
        if part[0] == 'h' or not groups:
            groups.append([])
        groups[-1].append(part)
    parts = [part for i, group in enumerate(groups) if not i or group != groups[i - 1] for part in group]

    # A paragraph that reappears later is kept where it appears last.
    parts = [part for i, part in enumerate(parts) if part[0] != 'p' or part not in parts[i + 1:]]

    for i, (kind, value) in enumerate(parts):
        if kind == 'h':
            # The first box of the first zero block names the addendum itself.
            level = 'h2' if i == 0 and not emit.zero_seen else 'h3'
            emit.heading(level, value)
        elif kind == 'ul':
            emit.ul(parse_html(value).children[0])
        else:
            previous = parts[i - 1] if i else None
            if previous and previous[0] == 'h':
                # A box that restates the heading above it as its first line.
                value = re.sub('^' + re.escape(escape(previous[1], quote=False)) + r'\s*<br>', '', value)
            emit.p(value)
    emit.zero_seen = True


def convert(page: str, region: str) -> dict:
    title = unescape(re.search(r'<title>(.*?)</title>', page, re.S).group(1)).strip()
    emit = Emitter(region)
    lede = []
    notice = f'This version only applies to Users within {REGION_NAMES.get(region, region.upper())}.'
    seen_region = False

    for rec_id, classes, rtype, html in records(page):
        regions = [c for c in classes if c.startswith('uc-reg')]
        if regions:
            seen_region = True
            if f'uc-reg{region}' not in regions:
                continue

        tree = parse_html(html)
        if regions and rtype == '248':
            # "This version only applies to Users within …" — minus the pointer
            # to Tilda's dropdown. The cookie-banner notice has no banner here.
            line = re.sub(r'\s*To adjust the region.*$', '', text(tree, region))
            if line and 'Consent Tool' not in line:
                notice = line
        elif regions and rtype == '795':
            heading = find_class(tree, 't795__title')
            descr = find_class(tree, 't795__descr')
            line = re.sub(r'\s+', ' ', text(heading, region)) if heading else ''
            # "Privacy Statement<br>for the use…" — the break stood for a space.
            line = re.sub(r'(Statement|Policy)(for)', r'\1 \2', line)
            line = line.replace(' of of ', ' of ')
            if descr:
                line += ' · ' + text(descr, region)
            lede.append(line)
        elif regions and rtype == '131':
            # The privacy policy opens with a table of contents; flow() skips it.
            emit.flow(find_class(tree, 'article').children)
        elif (
            not regions
            and seen_region
            and rtype == '396'
            and not {'uc-header', 'uc-footer'} & set(classes)
        ):
            # An untagged zero block among the documents is shown to every region.
            zero_block(html, region, emit)

    lede_blocks = [{'type': 'p', 'html': escape(line, quote=False), 'lede': True} for line in lede if line]
    lede_blocks.append({'type': 'p', 'html': escape(notice, quote=False), 'lede': True})
    return {'title': title, 'blocks': lede_blocks + emit.blocks}


if __name__ == '__main__':
    # With a third argument — a dotted key such as legalRegional.terms.versions.us —
    # the document is written into the copy file instead of printed.
    source, region = sys.argv[1], sys.argv[2]
    document = convert(open(source, encoding='utf-8').read(), region)

    counts = {}
    for block in document['blocks']:
        counts[block['type']] = counts.get(block['type'], 0) + 1

    print(f'{region}: "{document["title"]}" — {counts}', file=sys.stderr)

    if len(sys.argv) > 3:
        path = 'src/i18n/en.json'
        copy = json.load(open(path, encoding='utf-8'))
        entry = copy
        for part in sys.argv[3].split('.'):
            entry = entry.setdefault(part, {})
        entry['document'] = document
        with open(path, 'w', encoding='utf-8') as out:
            out.write(json.dumps(copy, ensure_ascii=False, indent=2) + '\n')
    else:
        print(json.dumps(document, ensure_ascii=False))
