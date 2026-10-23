import { BRAND, ptToPx } from './guide'
import { uid } from './kits'
import type { FreeObj, Geom, LineEnd } from './types'

// 다른 프로그램에서 복사한 내용을 편집 가능한 요소로 바꿉니다. 모두 브라우저 안에서 처리합니다.
// - 구글 슬라이드: 복사하면 클립보드에 도형 목록(위치·크기·채우기·선·글·이미지)이 함께 실려 와서 그대로 옮깁니다.
// - PowerPoint · 웹 문서 등: 서식 있는 글(HTML)을 글 상자·표로 옮깁니다. (도형 정보는 브라우저에 전달되지 않음)

const C = BRAND.colors

export const GOOGLE_DRAWING_MIME = 'application/x-vnd.google-docs-drawings-object+wrapped'
const GOOGLE_IMAGE_MIME = 'application/x-vnd.google-docs-image-clip+wrapped'

// ── 구글 슬라이드 ───────────────────────────────────────────────
// 클립보드 좌표 단위 = 25 EMU. 구글 슬라이드 기본 너비 10in(9,144,000 EMU) 을 1280px 로 맞춥니다.
const UNIT_PX = 1280 / (9144000 / 25)
// 도형·글 상자의 기본 크기 (3,000,000 EMU) — 위치·크기는 이 상자에 변환 행렬을 곱해 정해집니다.
const BASE = 3000000 / 25
const DEFAULT_PAD = 91440 / 25 // 글 상자 기본 안쪽 여백 0.1in

// 구글 내부 도형 번호 → 도형 이름 (Slides API ShapeType 순서 + 4)
const GOOGLE_GEOMS: Record<number, Geom> = {
  6: 'rect',
  7: 'roundRect',
  8: 'ellipse',
  17: 'chevron',
  28: 'diamond',
  32: 'downArrow',
  39: 'hexagon',
  40: 'homePlate',
  44: 'leftArrow',
  48: 'leftRightArrow',
  58: 'plus',
  62: 'octagon',
  63: 'parallelogram',
  67: 'plus',
  72: 'rightArrow',
  78: 'round2SameRect',
  79: 'rtTriangle',
  91: 'star5',
  97: 'trapezoid',
  98: 'triangle',
  99: 'upArrow',
  101: 'upDownArrow',
  106: 'wedgeRectCallout',
  107: 'wedgeRectCallout',
}
const IMAGE = 3
// 직접 그린 도형(자유형). 지원하지 않는 다른 도형도 윤곽(path)이 실려 오면 자유형처럼 그립니다
const FREEFORM = 1
const TEXT_BOX = 108
const isLineCode = (code: number) => code >= 144 && code <= 158

// 속성 번호
const P = {
  adj1: 0,
  imageId: 49,
  imageW: 8,
  imageH: 9,
  path: 12,
  fillOn: 14,
  fill: 15,
  fillAlpha: 16,
  lineOn: 18,
  line: 19,
  lineWeight: 22,
  arrowStart: 26,
  arrowEnd: 29,
  valign: 44,
  insets: 53,
} as const
const T = { bold: 0, color: 4, size: 6, align: 12 } as const

type Matrix = [number, number, number, number, number, number]
const mul = (a: Matrix, b: Matrix): Matrix => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
]
const apply = (m: Matrix, x: number, y: number) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] })

const props = (list: unknown): Map<number, unknown> => {
  const m = new Map<number, unknown>()
  if (Array.isArray(list)) for (let i = 0; i + 1 < list.length; i += 2) m.set(list[i] as number, list[i + 1])
  return m
}

// 화살촉: 내부 번호 = Slides API ArrowStyle 순서 − 1 (0 없음, 1·2·6 화살, 3·7 원, 그 외 사각·마름모)
const arrowOf = (v: unknown): LineEnd | undefined => {
  const n = Number(v)
  if (!n) return undefined
  return n === 1 || n === 2 || n === 6 ? 'triangle' : 'oval'
}

const r1 = (n: number) => Math.round(n * 10) / 10

// 자유형 윤곽 → SVG 경로 (상자 기준 0~1000). 윤곽 = [[?, ?, [명령, 숫자 개수, …], [x, y, …], …], …]
// 명령: 0 이동 · 1 직선 · 2 곡선(3점) · 3 곡선(2점) · 5 닫기. 모르는 명령이 있으면 null.
function pathOf(v: unknown, pw: number, ph: number, flip: boolean): string | null {
  if (!Array.isArray(v) || !pw || !ph) return null
  const pt = (x: number, y: number) => `${Math.round(((flip ? pw - x : x) / pw) * 1000)} ${Math.round((y / ph) * 1000)}`
  let d = ''
  for (const sub of v) {
    const [ops, xy] = Array.isArray(sub) ? [sub[2], sub[3]] : []
    if (!Array.isArray(ops) || !Array.isArray(xy)) return null
    let k = 0
    for (let i = 0; i + 1 < ops.length; i += 2) {
      const [op, n] = [Number(ops[i]), Number(ops[i + 1])]
      const pts: string[] = []
      for (let j = 0; j + 1 < n; j += 2) pts.push(pt(Number(xy[k + j]), Number(xy[k + j + 1])))
      k += n
      if (op === 0) d += pts.map((q) => `M${q}`).join('')
      else if (op === 1) d += pts.map((q) => `L${q}`).join('')
      else if (op === 2 && pts.length % 3 === 0) for (let j = 0; j < pts.length; j += 3) d += `C${pts[j]} ${pts[j + 1]} ${pts[j + 2]}`
      else if (op === 3 && pts.length % 2 === 0) for (let j = 0; j < pts.length; j += 2) d += `Q${pts[j]} ${pts[j + 1]}`
      else if (op === 5) d += 'Z'
      else return null
    }
  }
  return d || null
}

interface StyleRange {
  start: number
  end: number
  p: Map<number, unknown>
}

// 글 + 글자별 서식 → 한 덩어리 글(**굵게**) 과 대표 크기·색·정렬
function buildText(text: string, ranges: StyleRange[], defAlign: FreeObj['align']) {
  const n = text.length
  const bold = new Array<boolean>(n).fill(false)
  const size = new Array<number>(n).fill(0)
  const color = new Array<string>(n).fill('')
  let align: FreeObj['align']
  for (const r of ranges) {
    for (let i = Math.max(0, r.start); i < Math.min(n, r.end); i++) {
      if (r.p.has(T.bold)) bold[i] = !!r.p.get(T.bold)
      if (r.p.has(T.size)) size[i] = Number(r.p.get(T.size))
      if (r.p.has(T.color)) color[i] = String(r.p.get(T.color))
    }
    if (!align && r.p.has(T.align)) {
      const a = Number(r.p.get(T.align))
      align = a === 2 ? 'center' : a === 3 ? 'right' : 'left'
    }
  }
  const visible = [...text].map((ch, i) => (ch.trim() ? i : -1)).filter((i) => i >= 0)
  const majority = <V>(arr: V[], empty: V) => {
    const count = new Map<V, number>()
    for (const i of visible) if (arr[i] !== empty) count.set(arr[i], (count.get(arr[i]) ?? 0) + 1)
    return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  }
  const allBold = visible.length > 0 && visible.every((i) => bold[i])
  const baseSize = majority(size, 0) ?? 14
  const baseColor = (majority(color, '') ?? '#000000').toUpperCase()
  // 대표와 다른 색·크기는 그 부분만 표기 ({{#색:…}} · {{x배율:…}}) — 예: '국내 1 위' 의 크고 파란 1
  const colorAt = (i: number) => {
    const c = color[i].toUpperCase()
    return /^#[0-9A-F]{6}$/.test(c) && c !== baseColor ? c : ''
  }
  const scaleAt = (i: number) => (size[i] && Math.abs(size[i] / baseSize - 1) > 0.04 ? Math.round((size[i] / baseSize) * 100) / 100 : 0)
  let out = ''
  let i = 0
  while (i < n) {
    if (text[i] === '\n') {
      out += '\n'
      i++
      continue
    }
    // 같은 색·크기가 이어지는 구간 (사이 빈칸은 앞 구간에 붙임)
    const c = colorAt(i)
    const x = scaleAt(i)
    let j = i + 1
    while (j < n && text[j] !== '\n' && (!text[j].trim() || (colorAt(j) === c && scaleAt(j) === x))) j++
    let seg = ''
    let open = false
    for (let k = i; k < j; k++) {
      const b = !allBold && bold[k]
      if (b !== open && (text[k].trim() || !b)) {
        seg += '**'
        open = b
      }
      seg += text[k]
    }
    if (open) seg += '**'
    if (x) seg = `{{x${x}:${seg}}}`
    if (c) seg = `{{${c}:${seg}}}`
    out += seg
    i = j
  }
  return {
    text: out.replace(/\*\*\*\*/g, '').replace(/\n+$/, ''),
    size: baseSize,
    color: baseColor,
    bold: allBold,
    align: align ?? defAlign,
  }
}

// 그림 받기: 먼저 파일로 받아 문서 안에 저장하고, 막혀 있으면(회사 공유 파일 등)
// 내 구글 로그인으로 그림 주소를 그대로 열어 봅니다 — 열리면 그 주소로 보여 줍니다.
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = res.ok ? await res.blob() : null
    if (blob?.type.startsWith('image/'))
      return await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result as string)
        r.onerror = reject
        r.readAsDataURL(blob)
      })
  } catch {
    // 아래에서 주소로 열어 봅니다
  }
  return new Promise((resolve) => {
    const img = new Image()
    const timer = setTimeout(() => resolve(null), 8000)
    img.onload = () => {
      clearTimeout(timer)
      resolve(img.naturalWidth > 0 ? url : null)
    }
    img.onerror = () => {
      clearTimeout(timer)
      resolve(null)
    }
    img.src = url
  })
}

export function hasGoogleShapes(data: Pick<DataTransfer, 'types'>) {
  return data.types.includes(GOOGLE_DRAWING_MIME)
}

// 구글 슬라이드가 도형 정보를 일반 붙여넣기에는 싣지 않고 클립보드 안쪽('web …' 형식)에만 둔 경우, 직접 읽어 옵니다.
// 브라우저가 처음 한 번 '클립보드 보기 허용'을 물을 수 있습니다. 없거나 막히면 null.
// 허용 창에 답이 없으면 붙여넣기가 멈추지 않도록 3초까지만 기다립니다.
export async function readGoogleClipboard(): Promise<Pick<DataTransfer, 'types' | 'getData'> | null> {
  try {
    const items = await Promise.race([navigator.clipboard.read(), new Promise<null>((r) => setTimeout(() => r(null), 3000))])
    for (const item of items ?? []) {
      if (!item.types.includes(`web ${GOOGLE_DRAWING_MIME}`)) continue
      const map = new Map<string, string>()
      for (const t of item.types) if (t.startsWith('web ')) map.set(t.slice(4), await (await item.getType(t)).text())
      return { types: [...map.keys()], getData: (t: string) => map.get(t) ?? '' }
    }
  } catch {
    // 읽을 수 없으면 보통 붙여넣기로
  }
  return null
}

const unwrap = (raw: string) => {
  const outer = JSON.parse(raw)
  return typeof outer.data === 'string' ? JSON.parse(outer.data) : outer.data
}

// 구글 슬라이드에서 복사한 도형 목록 → 자유 배치 요소.
// 자유형(직접 그린) 도형과 지원하지 않는 도형(원호·파이 등)은 건너뛰고 개수만 알려 줍니다.
export async function objectsFromGoogle(data: Pick<DataTransfer, 'types' | 'getData'>): Promise<{ objs: FreeObj[]; skipped: number; missingImages: number }> {
  const inner = unwrap(data.getData(GOOGLE_DRAWING_MIME))
  const cmds: unknown[][] = inner?.resolved ?? []
  let imageUrls: Record<string, string> = {}
  try {
    imageUrls = unwrap(data.getData(GOOGLE_IMAGE_MIME))?.image_urls ?? {}
  } catch {
    // 이미지가 없으면 없음
  }

  const created: { id: string; code: number; m: Matrix; p: Map<number, unknown> }[] = []
  const parent = new Map<string, string>()
  const groupM = new Map<string, Matrix>()
  const texts = new Map<string, string>()
  const styles = new Map<string, StyleRange[]>()
  for (const c of cmds) {
    if (!Array.isArray(c)) continue
    const [op, id] = c as [number, string]
    if (op === 3) created.push({ id, code: Number(c[2]), m: c[3] as Matrix, p: props(c[4]) })
    else if (op === 2) {
      groupM.set(id, c[3] as Matrix)
      for (const child of (c[2] as string[]) ?? []) parent.set(child, id)
    } else if (op === 15) {
      const at = Number(c[3]) || 0
      const prev = texts.get(id) ?? ''
      texts.set(id, prev.slice(0, at) + String(c[4] ?? '') + prev.slice(at))
    } else if (op === 17) {
      const list = styles.get(id) ?? []
      list.push({ start: Number(c[3]), end: Number(c[4]), p: props(c[6]) })
      styles.set(id, list)
    }
  }
  // 그룹 안 요소는 그룹 변환을 차례로 곱해 슬라이드 기준 위치로
  const absolute = (id: string, m: Matrix): Matrix => {
    let out = m
    for (let g = parent.get(id); g; g = parent.get(g)) out = mul(groupM.get(g) ?? [1, 0, 0, 1, 0, 0], out)
    return out
  }

  const out: FreeObj[] = []
  let skipped = 0
  let missingImages = 0
  for (const it of created) {
    const free = !GOOGLE_GEOMS[it.code] && (it.code === FREEFORM || Array.isArray(it.p.get(P.path)))
    if (it.code !== IMAGE && it.code !== TEXT_BOX && !isLineCode(it.code) && !GOOGLE_GEOMS[it.code] && !free) {
      skipped++
      continue
    }
    const m = absolute(it.id, it.m)
    const p = it.p
    const lineColor = p.get(P.lineOn) === 1 ? String(p.get(P.line) ?? '#000000') : undefined
    const lineWidth = r1(Number(p.get(P.lineWeight) ?? 381) / 508)

    if (isLineCode(it.code)) {
      const a = apply(m, 0, 0)
      const b = apply(m, BASE, BASE)
      const p1 = { x: a.x * UNIT_PX, y: a.y * UNIT_PX }
      const p2 = { x: b.x * UNIT_PX, y: b.y * UNIT_PX }
      out.push({
        id: uid(),
        kind: 'line',
        x: r1(Math.min(p1.x, p2.x)),
        y: r1(Math.min(p1.y, p2.y)),
        w: r1(Math.abs(p2.x - p1.x)),
        h: r1(Math.abs(p2.y - p1.y)),
        flipH: p1.x > p2.x || undefined,
        flipV: p1.y > p2.y || undefined,
        line: lineColor ?? C.navy,
        lineWidth,
        arrowStart: arrowOf(p.get(P.arrowStart)),
        arrowEnd: arrowOf(p.get(P.arrowEnd)),
      })
      continue
    }

    // 그림·자유형은 자기 크기(8·9번 속성)를, 나머지 도형은 기본 상자를 변환합니다
    const w0 = it.code === IMAGE || free ? Number(p.get(P.imageW)) || BASE : BASE
    const h0 = it.code === IMAGE || free ? Number(p.get(P.imageH)) || BASE : BASE
    const sx = Math.hypot(m[0], m[1])
    const sy = Math.hypot(m[2], m[3])
    const w = w0 * sx * UNIT_PX
    const h = h0 * sy * UNIT_PX
    const center = apply(m, w0 / 2, h0 / 2)
    // 좌우가 뒤집힌 자유형은 윤곽을 뒤집고, 회전은 뒤집기 전 기준으로
    const flip = free && m[0] * m[3] - m[1] * m[2] < 0
    const rot = Math.round(((Math.atan2(flip ? -m[1] : m[1], flip ? -m[0] : m[0]) * 180) / Math.PI) * 10) / 10
    const box = { x: r1(center.x * UNIT_PX - w / 2), y: r1(center.y * UNIT_PX - h / 2), w: r1(w), h: r1(h), rot: rot ? rot : undefined }
    if (w < 1 || h < 1) continue

    if (it.code === IMAGE) {
      const url = imageUrls[String(p.get(P.imageId))]
      const src = url ? await toDataUrl(url) : null
      // 회사 계정으로만 열리는 원본의 그림은 구글이 다른 사이트에 주지 않아 받을 수 없습니다 → 같은 자리·크기의 '이미지 자리'
      if (!src) missingImages++
      out.push(src ? { id: uid(), kind: 'image', ...box, src } : { id: uid(), kind: 'image', ...box })
      continue
    }

    // 페이지 번호 같은 자동 글자(제어 문자)는 뺍니다
    const raw = [...(texts.get(it.id) ?? '')].filter((ch) => ch === '\n' || ch.charCodeAt(0) >= 32).join('')
    // 정렬 기본값: 글 상자는 왼쪽, 도형 안 글은 가운데 (구글 슬라이드와 같음)
    const t = raw.trim() ? buildText(raw, styles.get(it.id) ?? [], it.code === TEXT_BOX ? 'left' : 'center') : null
    const fill = p.get(P.fillOn) === 1 && p.get(P.fill) ? String(p.get(P.fill)) : undefined
    const opacity = fill && p.has(P.fillAlpha) && Number(p.get(P.fillAlpha)) < 1 ? Number(p.get(P.fillAlpha)) : undefined
    if (!t && !fill && !lineColor) continue
    const geom: Geom = it.code === TEXT_BOX || free ? 'rect' : GOOGLE_GEOMS[it.code]
    const path = free ? pathOf(p.get(P.path), w0, h0, flip) : null
    if (free && !path) {
      skipped++
      continue
    }
    const ins = Array.isArray(p.get(P.insets)) ? (p.get(P.insets) as number[]) : null
    // 안쪽 여백: [위, 오른, 아래, 왼] 순서 (CSS 와 같음)
    const pad: [number, number, number, number] = ins
      ? [r1(ins[3] * UNIT_PX), r1(ins[0] * UNIT_PX), r1(ins[1] * UNIT_PX), r1(ins[2] * UNIT_PX)]
      : [r1(DEFAULT_PAD * UNIT_PX), r1(DEFAULT_PAD * UNIT_PX), r1(DEFAULT_PAD * UNIT_PX), r1(DEFAULT_PAD * UNIT_PX)]
    const va = p.has(P.valign) ? Number(p.get(P.valign)) : it.code === TEXT_BOX ? 0 : 1
    const adj = Number(p.get(P.adj1))
    out.push({
      id: uid(),
      kind: 'shape',
      geom,
      path: path ?? undefined,
      ...box,
      radius: geom === 'roundRect' ? r1(Math.min(w, h) * (Number.isFinite(adj) && p.has(P.adj1) ? adj / 100000 : 0.16667)) : undefined,
      fill,
      opacity,
      line: lineColor,
      lineWidth: lineColor ? lineWidth : undefined,
      text: t?.text ?? '',
      size: t?.size ?? 14,
      color: t?.color ?? '#000000',
      bold: t?.bold || undefined,
      align: t?.align ?? 'center',
      valign: va === 2 ? 'bottom' : va === 1 ? 'middle' : 'top',
      lineHeight: 1.2,
      pad,
    })
  }
  return { objs: out, skipped, missingImages }
}

// ── HTML (PowerPoint · 웹 · 문서) ───────────────────────────────

const ptOf = (style: string): number | undefined => {
  const m = /font-size:\s*([\d.]+)(pt|px)/i.exec(style)
  if (!m) return undefined
  return m[2].toLowerCase() === 'px' ? Number(m[1]) * 0.75 : Number(m[1])
}
const colorOf = (style: string): string | undefined => {
  const m = /(?:^|;)\s*color:\s*(#[0-9a-f]{3,6}|rgb\([^)]*\))/i.exec(style)
  if (!m) return undefined
  const v = m[1]
  if (v.startsWith('#')) return v.length === 4 ? `#${[...v.slice(1)].map((c) => c + c).join('')}` : v.toUpperCase()
  const [r, g, b] = v.match(/\d+/g)!.map(Number)
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

interface Run {
  text: string
  bold: boolean
  size?: number
  color?: string
}

// 블록 하나(문단·목록 항목·칸)의 글을 서식 조각으로
function runsOf(node: Node, inherited: { bold: boolean; size?: number; color?: string } = { bold: false }): Run[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ')
    return text ? [{ text, ...inherited }] : []
  }
  if (!(node instanceof Element)) return []
  if (node.tagName === 'BR') return [{ text: '\n', bold: false }]
  const style = node.getAttribute('style') ?? ''
  const weight = /font-weight:\s*(\d+|bold|normal)/i.exec(style)?.[1]
  const bold = /^(B|STRONG)$/.test(node.tagName) ? true : weight ? weight === 'bold' || Number(weight) >= 600 : inherited.bold
  const next = { bold, size: ptOf(style) ?? inherited.size, color: colorOf(style) ?? inherited.color }
  return Array.from(node.childNodes).flatMap((c) => runsOf(c, next))
}

const BLOCK_SELECTOR = 'p, div, li, h1, h2, h3, h4, h5, h6, td, th, tr, table, ul, ol, blockquote, pre, section, article'

// 블록 요소를 문단 목록으로 (안쪽에 블록이 있으면 더 깊이)
function paragraphs(root: Element): { runs: Run[]; li: boolean; align?: string }[] {
  const out: { runs: Run[]; li: boolean; align?: string }[] = []
  const walk = (el: Element) => {
    if (el.tagName === 'TABLE') return
    const hasBlockInside = !!el.querySelector(BLOCK_SELECTOR)
    if (!hasBlockInside || el.tagName === 'LI') {
      const runs = runsOf(el)
      if (runs.some((r) => r.text.trim())) {
        const align = /text-align:\s*(left|center|right|start|end)/i.exec(el.getAttribute('style') ?? '')?.[1]
        out.push({ runs, li: el.tagName === 'LI', align })
      }
      return
    }
    // 블록이 섞인 요소: 자식 요소는 더 깊이, 바로 들어 있는 글은 한 문단으로
    for (const c of Array.from(el.childNodes)) {
      if (c instanceof Element) walk(c)
      else if (c.nodeType === Node.TEXT_NODE && c.textContent?.trim()) out.push({ runs: runsOf(c), li: false })
    }
  }
  walk(root)
  return out
}

function textFromParagraphs(list: { runs: Run[]; li: boolean }[]) {
  const all = list.flatMap((p) => p.runs).filter((r) => r.text.trim())
  const chars = (pick: (r: Run) => string | number | undefined) => {
    const count = new Map<string | number, number>()
    for (const r of all) {
      const k = pick(r)
      if (k !== undefined) count.set(k, (count.get(k) ?? 0) + r.text.length)
    }
    return [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  }
  const allBold = all.length > 0 && all.every((r) => r.bold)
  const lines = list.map((p) => {
    const body = p.runs.map((r) => (r.bold && !allBold && r.text.trim() ? `**${r.text.trim()}**${/\s$/.test(r.text) ? ' ' : ''}` : r.text)).join('')
    const clean = body.replace(/\*\*\s*\*\*/g, ' ').replace(/[ \t]+/g, ' ').trim()
    return p.li ? `• ${clean}` : clean
  })
  return { text: lines.join('\n'), size: Number(chars((r) => r.size)) || 10, color: String(chars((r) => r.color) ?? C.navy), bold: allBold }
}

// 붙여넣은 HTML → 글 상자 1개 + 표는 칸마다 상자
export function objectsFromHtml(html: string, at = { x: 90, y: 180 }): FreeObj[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('style, script, meta, title, head').forEach((n) => n.remove())
  const out: FreeObj[] = []
  let y = at.y
  // 글자 크기가 바뀌는 곳(제목 → 본문)에서 글 상자를 나눠 각자 크기를 지킵니다
  const groups: ReturnType<typeof paragraphs>[] = []
  for (const para of paragraphs(doc.body)) {
    const size = textFromParagraphs([para]).size
    const last = groups[groups.length - 1]
    if (last && Math.abs(textFromParagraphs(last).size - size) < 1) last.push(para)
    else groups.push([para])
  }
  for (const group of groups) {
    const t = textFromParagraphs(group)
    const lineH = ptToPx(t.size) * 1.3
    const h = Math.min(520, t.text.split('\n').length * lineH + 8)
    const align = group[0].align === 'center' ? 'center' : group[0].align === 'right' || group[0].align === 'end' ? 'right' : 'left'
    out.push({ id: uid(), kind: 'shape', geom: 'rect', x: at.x, y, w: 760, h: r1(h), text: t.text, size: t.size, color: t.color, bold: t.bold || undefined, align, valign: 'top', lineHeight: 1.3, pad: [8, 4, 8, 4] })
    y += h + 8
  }
  if (groups.length) y += 8
  for (const table of Array.from(doc.querySelectorAll('table'))) {
    const rows = Array.from(table.querySelectorAll('tr')).map((tr) => Array.from(tr.querySelectorAll('td, th')))
    const cols = Math.max(0, ...rows.map((r) => r.length))
    if (!cols) continue
    const cw = Math.min(220, 1100 / cols)
    for (const [ri, row] of rows.entries()) {
      for (const [ci, cell] of row.entries()) {
        const t = textFromParagraphs(paragraphs(cell).length ? paragraphs(cell) : [{ runs: runsOf(cell), li: false }])
        out.push({
          id: uid(),
          kind: 'shape',
          geom: 'rect',
          x: r1(at.x + ci * cw),
          y: r1(y + ri * 40),
          w: r1(cw),
          h: 40,
          fill: ri === 0 ? C.imageFill : C.white,
          line: C.line,
          lineWidth: 0.75,
          text: t.text,
          size: Math.min(t.size, 12),
          color: t.color,
          bold: ri === 0 || t.bold || undefined,
          align: 'center',
          valign: 'middle',
          lineHeight: 1.2,
          pad: [6, 2, 6, 2],
        })
      }
    }
    y += rows.length * 40 + 16
  }
  return out
}

// HTML 안에 붙여넣을 만한 글이 있는지
export function htmlHasText(html: string) {
  if (!html) return false
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return !!doc.body.textContent?.trim()
}
