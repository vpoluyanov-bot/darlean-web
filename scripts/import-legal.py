"""
Converts a legal page exported from Claude Design into the block model the
site renders from src/i18n/en.json.

    python3 scripts/import-legal.py <source.html> <key>

Only the document structure survives: every inline style is dropped, because
the comp hardcodes colours and sizes that the site takes from tokens instead.
Inline links and bold runs are kept — they carry meaning in legal prose.
"""
import json
import re
import sys
from html import unescape

KEEP_INLINE = {'a', 'strong', 'br'}


def clean_inline(fragment: str) -> str:
    """Strips presentation, keeps the few tags that carry meaning."""
    # Anchors keep their href, and an aria-label when one names a vague target.
    def anchor(match: re.Match) -> str:
        href = re.search(r'href="([^"]*)"', match.group(0))
        label = re.search(r'aria-label="([^"]*)"', match.group(0))
        attrs = f'href="{href.group(1) if href else ""}"'
        if label:
            attrs += f' aria-label="{label.group(1)}"'
        return f'<a {attrs}>'

    fragment = re.sub(r'<a\b[^>]*>', anchor, fragment)
    fragment = re.sub(r'<(strong|br)\b[^>]*>', r'<\1>', fragment)

    # Everything else goes, tags and all, leaving its text behind.
    fragment = re.sub(
        r'</?(?!/?(?:a|strong|br)\b)[a-zA-Z][a-zA-Z0-9-]*\b[^>]*>', '', fragment
    )
    return re.sub(r'\s+', ' ', fragment).strip()


def parse_table(block: str) -> dict:
    head = re.search(r'<thead>(.*?)</thead>', block, re.S)
    columns = [clean_inline(c) for c in re.findall(r'<th\b[^>]*>(.*?)</th>', head.group(1), re.S)] if head else []

    rows = []
    body = re.search(r'<tbody>(.*?)</tbody>', block, re.S)
    for row in re.findall(r'<tr\b[^>]*>(.*?)</tr>', body.group(1) if body else '', re.S):
        rows.append([clean_inline(c) for c in re.findall(r'<td\b[^>]*>(.*?)</td>', row, re.S)])

    return {'type': 'table', 'columns': columns, 'rows': rows}


def parse(html: str) -> dict:
    article = html[html.index('<article'): html.index('</article>')]

    title = clean_inline(re.search(r'<h1\b[^>]*>(.*?)</h1>', article, re.S).group(1))
    blocks = []

    pattern = re.compile(
        r'<(h2|h3)\b[^>]*>(.*?)</\1>'          # headings
        r'|<p\b[^>]*>(.*?)</p>'                 # paragraphs
        r'|<ul\b[^>]*>(.*?)</ul>'               # lists
        r'|(<div\b[^>]*>\s*<table\b.*?</table>\s*</div>)',  # tables, wrapped
        re.S,
    )

    for match in pattern.finditer(article):
        level, heading, paragraph, list_html, table = match.groups()

        if heading is not None:
            blocks.append({'type': level, 'text': clean_inline(heading)})
        elif paragraph is not None:
            text = clean_inline(paragraph)
            if text:
                blocks.append({'type': 'p', 'html': text})
        elif list_html is not None:
            items = [clean_inline(i) for i in re.findall(r'<li\b[^>]*>(.*?)</li>', list_html, re.S)]
            blocks.append({'type': 'ul', 'items': [i for i in items if i]})
        elif table is not None:
            blocks.append(parse_table(table))

    return {'title': title, 'blocks': blocks}


if __name__ == '__main__':
    source, key = sys.argv[1], sys.argv[2]
    document = parse(open(source, encoding='utf-8').read())

    counts = {}
    for block in document['blocks']:
        counts[block['type']] = counts.get(block['type'], 0) + 1

    print(f'{key}: "{document["title"]}" — {counts}')
    print(json.dumps(document, ensure_ascii=False))
