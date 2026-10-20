"""구글 슬라이드 원본 → Deck Studio 샘플 덱 (원본 슬라이드: 배경·도형·글·이미지를 편집 가능한 요소로).

준비:
  1. Slides API presentations.get 결과를 <name>.json 으로 저장
     (fields: pageSize, slides(objectId,slideProperties,pageProperties.pageBackgroundFill,pageElements),
      layouts(objectId,pageProperties.pageBackgroundFill,pageElements), masters(objectId,pageProperties,pageElements))
  2. JSON 안의 모든 contentUrl 이미지를 raw/<name>-<md5(url 앞부분) 12자리> 로 내려받기 (URL 은 30분쯤 지나면 만료)
사용: python3 -I convert-google-slides.py <name> public/deck/samples/originals
결과: <out>/<name>.json (슬라이드별 background · objects) + <out>/<name>/ 이미지
"""
import hashlib
import io
import json
import os
import sys

from PIL import Image

NAME, OUT = sys.argv[1], sys.argv[2]
DATA = json.load(open(f'{NAME}.json'))['content']
PAGE_W = DATA['pageSize']['width']['magnitude']
PX = 1280 / PAGE_W  # EMU → px
os.makedirs(f'{OUT}/{NAME}', exist_ok=True)

GEOMS = {
    'RECTANGLE': 'rect', 'TEXT_BOX': 'rect', 'ROUND_RECTANGLE': 'roundRect', 'ELLIPSE': 'ellipse',
    'ROUND_2_SAME_RECTANGLE': 'round2SameRect', 'TRIANGLE': 'triangle', 'RIGHT_TRIANGLE': 'rtTriangle',
    'DIAMOND': 'diamond', 'PARALLELOGRAM': 'parallelogram', 'TRAPEZOID': 'trapezoid', 'HEXAGON': 'hexagon',
    'OCTAGON': 'octagon', 'HOME_PLATE': 'homePlate', 'CHEVRON': 'chevron', 'PLUS': 'plus', 'MATH_PLUS': 'plus',
    'STAR_5': 'star5', 'WEDGE_RECTANGLE_CALLOUT': 'wedgeRectCallout', 'WEDGE_ROUND_RECTANGLE_CALLOUT': 'wedgeRectCallout',
    'RIGHT_ARROW': 'rightArrow', 'LEFT_ARROW': 'leftArrow', 'UP_ARROW': 'upArrow', 'DOWN_ARROW': 'downArrow',
    'LEFT_RIGHT_ARROW': 'leftRightArrow', 'UP_DOWN_ARROW': 'upDownArrow', 'FLOW_CHART_PROCESS': 'rect',
    'FLOW_CHART_ALTERNATE_PROCESS': 'roundRect', 'FLOW_CHART_CONNECTOR': 'ellipse',
}

# ── 색 ─────────────────────────────────────────────
def scheme_of(master):
    out = {}
    for c in master.get('pageProperties', {}).get('colorScheme', {}).get('colors', []):
        rgb = c.get('color', {})
        out[c['type']] = '#%02X%02X%02X' % tuple(round(rgb.get(k, 0) * 255) for k in ('red', 'green', 'blue'))
    return out

MASTERS = {m['objectId']: m for m in DATA.get('masters', [])}
LAYOUTS = {l['objectId']: l for l in DATA.get('layouts', [])}
SCHEME = scheme_of(next(iter(MASTERS.values()))) if MASTERS else {}

def color_of(c):
    if not c:
        return None
    if 'rgbColor' in c:
        rgb = c['rgbColor']
        return '#%02X%02X%02X' % tuple(round(rgb.get(k, 0) * 255) for k in ('red', 'green', 'blue'))
    if 'themeColor' in c:
        return SCHEME.get(c['themeColor'], '#000000')
    return None

def solid(fill):
    """{solidFill:{color, alpha}} → (hex, alpha)"""
    if not fill or fill.get('propertyState') in ('NOT_RENDERED', 'INHERIT'):
        return None, 1
    s = fill.get('solidFill')
    if not s:
        return None, 1
    return color_of(s.get('color')), s.get('alpha', 1)

# ── 변환 행렬 ───────────────────────────────────────
def mat(t):
    t = t or {}
    return [t.get('scaleX', 0), t.get('shearY', 0), t.get('shearX', 0), t.get('scaleY', 0), t.get('translateX', 0), t.get('translateY', 0)]

def mul(a, b):
    return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]]

def apply(m, x, y):
    return m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]

r1 = lambda v: round(v * 10) / 10

# ── 이미지 ─────────────────────────────────────────
saved = {}

def save_image(url, disp_w, disp_h):
    key = hashlib.md5(url.split('?')[0].encode()).hexdigest()[:12]
    raw = f'raw/{NAME}-{key}'
    if not os.path.exists(raw):
        return None
    if key in saved:
        return saved[key]
    im = Image.open(raw)
    im.load()
    has_alpha = im.mode in ('RGBA', 'LA', 'P') and (im.mode != 'P' or 'transparency' in im.info)
    # 화면 크기의 2배까지만 (최대 1920px)
    target = min(1920, max(64, int(max(disp_w, disp_h) * 2)))
    scale = min(1, target / max(im.size))
    if scale < 1:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    if has_alpha:
        im = im.convert('RGBA')
        alpha = im.getchannel('A')
        if alpha.getextrema()[0] < 250:
            fn = f'{key}.png'
            im.save(f'{OUT}/{NAME}/{fn}', optimize=True)
            saved[key] = f'deck/samples/originals/{NAME}/{fn}'
            return saved[key]
    fn = f'{key}.jpg'
    im.convert('RGB').save(f'{OUT}/{NAME}/{fn}', quality=84, optimize=True, progressive=True)
    saved[key] = f'deck/samples/originals/{NAME}/{fn}'
    return saved[key]

# ── 글 ────────────────────────────────────────────
def placeholder_parent(el):
    pid = el.get('shape', {}).get('placeholder', {}).get('parentObjectId')
    if not pid:
        return None
    for page in list(LAYOUTS.values()) + list(MASTERS.values()):
        for e in page.get('pageElements', []):
            if e['objectId'] == pid:
                return e
    return None

def first_run_style(el):
    for te in el.get('shape', {}).get('text', {}).get('textElements', []):
        if 'textRun' in te:
            return te['textRun'].get('style', {})
    return {}

def inherited_style(el):
    """자리표시자 글은 레이아웃·마스터의 글 서식을 이어받습니다"""
    chain = []
    p = placeholder_parent(el)
    while p is not None:
        chain.append(first_run_style(p))
        p = placeholder_parent(p)
    out = {}
    for s in reversed(chain):
        out.update({k: v for k, v in s.items() if v not in (None, {}, '')})
    return out

def text_of(el, scale):
    sh = el.get('shape', {})
    tes = sh.get('text', {}).get('textElements', [])
    if not tes:
        return None
    base = inherited_style(el)
    paras = []  # [(bullet, align, lineSpacing, [runs])]
    cur = None
    for te in tes:
        if 'paragraphMarker' in te:
            ps = te['paragraphMarker'].get('style', {})
            cur = {'bullet': 'bullet' in te['paragraphMarker'] and te['paragraphMarker']['bullet'].get('glyph'), 'align': ps.get('alignment'), 'ls': ps.get('lineSpacing'), 'runs': []}
            paras.append(cur)
        elif 'textRun' in te:
            if cur is None:
                cur = {'bullet': None, 'align': None, 'ls': None, 'runs': []}
                paras.append(cur)
            st = dict(base)
            st.update({k: v for k, v in te['textRun'].get('style', {}).items() if v not in (None, {})})
            content = te['textRun'].get('content', '').replace('\u000b', '\n')
            cur['runs'].append((content, st))
        elif 'autoText' in te:
            if cur is not None:
                cur['runs'].append(('{{n}}', te['autoText'].get('style', {})))
    lines = []
    sizes, colors = {}, {}
    all_bold = True
    visible = 0
    run_info = []
    for p in paras:
        for content, st in p['runs']:
            txt = content.replace('\n', '')
            if not txt.strip():
                continue
            size = (st.get('fontSize', {}) or {}).get('magnitude', 14) * scale
            col = color_of((st.get('foregroundColor') or {}).get('opaqueColor')) or '#000000'
            w = (st.get('weightedFontFamily') or {}).get('weight', 400)
            bold = bool(st.get('bold')) or w >= 600
            n = len(txt.strip())
            visible += n
            sizes[size] = sizes.get(size, 0) + n
            colors[col] = colors.get(col, 0) + n
            if not bold:
                all_bold = False
    if not visible:
        return None
    for p in paras:
        parts = []
        for content, st in p['runs']:
            txt = content.replace('\n', '')
            w = (st.get('weightedFontFamily') or {}).get('weight', 400)
            bold = bool(st.get('bold')) or w >= 600
            if bold and not all_bold and txt.strip():
                lead = txt[: len(txt) - len(txt.lstrip())]
                trail = txt[len(txt.rstrip()):]
                parts.append(f'{lead}**{txt.strip()}**{trail}')
            else:
                parts.append(txt)
        line = ''.join(parts).replace('****', '')
        if p['bullet'] and line.strip():
            g = str(p['bullet']).strip()
            # 번호 목록(1. · a.)은 원본 번호 그대로, 나머지 기호는 가이드처럼 텍스트 •
            line = (g if g[:1].isalnum() else '•') + ' ' + line.lstrip()
        lines.append(line)
    # 마지막 빈 문단(끝 줄바꿈) 정리
    while lines and not lines[-1].strip():
        lines.pop()
    first = next((p for p in paras if p['runs']), paras[0])
    align = {'CENTER': 'center', 'END': 'right', 'JUSTIFIED': 'left'}.get(first['align'] or '', 'left')
    ls = first['ls'] or 100
    return {
        'text': '\n'.join(lines),
        'size': round(max(sizes, key=sizes.get), 1),
        'color': max(colors, key=colors.get),
        'bold': all_bold,
        'align': align,
        'lineHeight': round(1.2 * ls / 100, 2),
    }

# ── 요소 ──────────────────────────────────────────
DASH = {'DASH': 'dash', 'LONG_DASH': 'dash', 'DASH_DOT': 'dash', 'LONG_DASH_DOT': 'dash', 'DOT': 'dot', 'ROUND_DOT': 'dot', 'SQUARE_DOT': 'dot'}

def arrow(a):
    if not a or a == 'NONE':
        return None
    return 'oval' if 'CIRCLE' in a or 'DIAMOND' in a or 'SQUARE' in a else 'triangle'

counter = [0]

def oid():
    counter[0] += 1
    return f'o{counter[0]}'

def convert(el, parent_m, out, slide_no, skipped):
    m = mul(parent_m, mat(el.get('transform')))
    if 'elementGroup' in el:
        for c in el['elementGroup'].get('children', []):
            convert(c, m, out, slide_no, skipped)
        return
    size = el.get('size') or {}
    w0 = (size.get('width') or {}).get('magnitude', 0)
    h0 = (size.get('height') or {}).get('magnitude', 0)
    if 'shape' in el and (not el.get('transform') or not size):
        par = placeholder_parent(el)
        if par is not None:
            m = mul(parent_m, mat(par.get('transform')))
            ps = par.get('size') or {}
            w0 = (ps.get('width') or {}).get('magnitude', 0)
            h0 = (ps.get('height') or {}).get('magnitude', 0)

    if 'line' in el:
        lp = el['line'].get('lineProperties', {})
        col, _ = solid(lp.get('lineFill'))
        x1, y1 = apply(m, 0, 0)
        x2, y2 = apply(m, w0, h0)
        x1, y1, x2, y2 = x1 * PX, y1 * PX, x2 * PX, y2 * PX
        out.append({
            'id': oid(), 'kind': 'line', 'x': r1(min(x1, x2)), 'y': r1(min(y1, y2)), 'w': r1(abs(x2 - x1)), 'h': r1(abs(y2 - y1)),
            'flipH': True if x1 > x2 else None, 'flipV': True if y1 > y2 else None,
            'line': col or '#000000', 'lineWidth': r1((lp.get('weight') or {}).get('magnitude', 9525) / 12700),
            'dash': DASH.get(lp.get('dashStyle')), 'arrowStart': arrow(lp.get('startArrow')), 'arrowEnd': arrow(lp.get('endArrow')),
        })
        return

    sx = (m[0] ** 2 + m[1] ** 2) ** 0.5
    sy = (m[2] ** 2 + m[3] ** 2) ** 0.5
    w, h = w0 * sx * PX, h0 * sy * PX
    if w < 0.5 or h < 0.5:
        return
    cx, cy = apply(m, w0 / 2, h0 / 2)
    import math
    rot = round(math.degrees(math.atan2(m[1], m[0])), 1)
    box = {'x': r1(cx * PX - w / 2), 'y': r1(cy * PX - h / 2), 'w': r1(w), 'h': r1(h)}
    if rot:
        box['rot'] = rot

    if 'image' in el:
        url = el['image'].get('contentUrl')
        src = save_image(url, w, h) if url else None
        if src:
            out.append({'id': oid(), 'kind': 'image', **box, 'src': src})
        return

    sh = el.get('shape')
    if not sh:
        skipped.append(next((k for k in el if k not in ('objectId', 'size', 'transform', 'title', 'description')), '?'))
        return
    ph = (sh.get('placeholder') or {}).get('type')
    st = sh.get('shapeType', 'TEXT_BOX')
    props = sh.get('shapeProperties', {})
    if ph == 'SLIDE_NUMBER':
        t = text_of(el, 1) or {'size': 8, 'color': '#BFBFBF', 'align': 'right', 'bold': False, 'lineHeight': 1.2}
        t['text'] = str(slide_no)
    else:
        fs = (props.get('autofit') or {}).get('fontScale', 1) or 1
        t = text_of(el, fs)
        if t:
            t['text'] = t['text'].replace('{{n}}', str(slide_no))
    fill, alpha = solid(props.get('shapeBackgroundFill'))
    ol = props.get('outline') or {}
    line_col, _ = solid(ol.get('outlineFill')) if ol.get('propertyState') not in ('NOT_RENDERED', 'INHERIT') else (None, 1)
    if st == 'TEXT_BOX' and not props.get('shapeBackgroundFill', {}).get('solidFill'):
        fill = None
    # 투명한 채우기: 거의 투명하면 없음, 반투명이면 글이 있을 땐 흰 바탕과 섞은 색으로 (불투명도는 글까지 흐리게 하므로)
    opacity = None
    if fill and alpha < 0.05:
        fill = None
    elif fill and alpha < 1:
        if t:
            rgb = [int(fill[i:i + 2], 16) for i in (1, 3, 5)]
            fill = '#%02X%02X%02X' % tuple(round(c * alpha + 255 * (1 - alpha)) for c in rgb)
        else:
            opacity = round(alpha, 2)
    if not t and not fill and not line_col:
        return
    geom = GEOMS.get(st)
    if geom is None:
        skipped.append(st)
        if not t:
            return
        geom = 'rect'
    va = {'TOP': 'top', 'MIDDLE': 'middle', 'BOTTOM': 'bottom'}.get(props.get('contentAlignment'), 'top' if st == 'TEXT_BOX' else 'middle')
    o = {
        'id': oid(), 'kind': 'shape', 'geom': geom, **box,
        'fill': fill, 'opacity': opacity,
        'line': line_col, 'lineWidth': r1((ol.get('weight') or {}).get('magnitude', 9525) / 12700) if line_col else None,
        'dash': DASH.get(ol.get('dashStyle')) if line_col else None,
        # 둥근 사각형 모서리 값은 API 에 없어서, 원본과 비교해 기본 비율을 13px 로 제한
        'radius': r1(min(min(w, h) * 0.16667, 13)) if geom == 'roundRect' else None,
        'text': t['text'] if t else '', 'size': t['size'] if t else 14, 'color': t['color'] if t else '#000000',
        'bold': True if t and t['bold'] else None, 'align': t['align'] if t else 'center', 'valign': va,
        'lineHeight': t['lineHeight'] if t else 1.2,
        # 안쪽 여백: API 에 값이 없어 글 상자는 0, 도형은 작게 (원본과 비교해 맞춘 값)
        'pad': [0, 0, 0, 0] if st == 'TEXT_BOX' else [6.4, 3.2, 6.4, 3.2],
    }
    # 그림자: 위쪽으로 선명한 파란 선(가이드 라인형 패널) → accent, 아래로 번지는 그림자 → soft
    sd = props.get('shadow') or {}
    if sd and sd.get('propertyState') not in ('NOT_RENDERED', 'INHERIT') and sd.get('alpha', 1) > 0.02:
        dy = (sd.get('transform') or {}).get('translateY', 0)
        blur = (sd.get('blurRadius') or {}).get('magnitude', 0)
        o['shadow'] = 'accent' if dy < 0 and blur < 1000 else 'soft'
    out.append(o)

def page_bg(page):
    f = (page.get('pageProperties') or {}).get('pageBackgroundFill') or {}
    if f.get('propertyState') == 'INHERIT' or not f:
        return None
    if 'stretchedPictureFill' in f:
        src = save_image(f['stretchedPictureFill']['contentUrl'], 1280, 720)
        return {'image': src} if src else None
    col, _ = solid(f)
    return {'color': col} if col else None

ID = [1.0, 0, 0, 1.0, 0, 0]
slides_out = []
all_skipped = []
for i, s in enumerate(DATA['slides']):
    props = s.get('slideProperties', {})
    layout = LAYOUTS.get(props.get('layoutObjectId'), {})
    master = MASTERS.get(props.get('masterObjectId'), {})
    bg = page_bg(s) or page_bg(layout) or page_bg(master) or {'color': '#FFFFFF'}
    objs = []
    skipped = []
    # 레이아웃·마스터의 자리표시자가 아닌 요소(로고·배경 그림 등)를 먼저 깝니다
    for page in (master, layout):
        for e in page.get('pageElements', []):
            if (e.get('shape') or {}).get('placeholder'):
                continue
            convert(e, ID, objs, i + 1, skipped)
    for e in s.get('pageElements', []):
        convert(e, ID, objs, i + 1, skipped)
    # 값이 None 인 키는 뺍니다
    objs = [{k: v for k, v in o.items() if v is not None} for o in objs]
    slides_out.append({'background': bg, 'objects': objs})
    all_skipped += skipped

json.dump({'slides': slides_out}, open(f'{OUT}/{NAME}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
size = sum(os.path.getsize(f'{OUT}/{NAME}/{f}') for f in os.listdir(f'{OUT}/{NAME}'))
print(NAME, len(slides_out), 'slides', sum(len(s['objects']) for s in slides_out), 'objects', 'skipped', sorted(set(all_skipped)), 'images MB', round(size / 1e6, 2), 'json KB', os.path.getsize(f'{OUT}/{NAME}.json') // 1024)
