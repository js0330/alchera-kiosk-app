import type JSZip from 'jszip'
import { BRAND } from './guide'
import { uid } from './kits'
import { FREE_AREA } from './layouts'
import type { Area } from './freeObjects'
import { EMU_ATTR, all, boxFromXfrm, boxOf, ident, kid, kids, normPh, visibleChildren, type Box, type Xform } from './pptxXml'
import { SHAPES } from './shapes'
import type { FreeObj, Geom, LineDash, LineEnd } from './types'

const SHAPE_GEOMS = new Set<Geom>(SHAPES.map((s) => s.geom))

// "원본 배치 유지" 불러오기: 슬라이드의 도형·텍스트 상자·이미지·선·표를 위치와 모양 그대로 읽어
// 가이드 상단(타이틀·서브·로고) 아래 본문 영역에 비율을 유지해 옮깁니다. 결과는 편집 가능한 자유 배치 요소입니다.

const parse = (s: string) => new DOMParser().parseFromString(s, 'application/xml')

// ── 색 ──────────────────────────────────────────────────────────

export type ThemeColors = Record<string, string>

export async function readTheme(zip: JSZip): Promise<ThemeColors> {
  const name = Object.keys(zip.files).find((f) => /^ppt\/theme\/theme\d+\.xml$/.test(f))
  const colors: ThemeColors = { dk1: '000000', lt1: 'FFFFFF', dk2: '1F2937', lt2: 'E7E6E6', accent1: '4472C4' }
  if (!name) return colors
  const doc = parse(await zip.file(name)!.async('string'))
  const scheme = all(doc, 'a:clrScheme')[0]
  for (const c of scheme ? Array.from(scheme.children) : []) {
    const key = c.tagName.replace('a:', '')
    const srgb = kid(c, 'a:srgbClr')?.getAttribute('val') ?? kid(c, 'a:sysClr')?.getAttribute('lastClr')
    if (srgb) colors[key] = srgb
  }
  return colors
}

const SCHEME_ALIAS: Record<string, string> = { tx1: 'dk1', tx2: 'dk2', bg1: 'lt1', bg2: 'lt2' }
const PRESET: Record<string, string> = { black: '000000', white: 'FFFFFF', red: 'FF0000', blue: '0000FF', green: '008000', gray: '808080', yellow: 'FFFF00' }

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h / 6, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12
    const a = s * Math.min(l, 1 - l)
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  return [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
}

interface Color {
  hex: string
  alpha: number
}

// <a:solidFill> 같은 색 컨테이너에서 실제 색을 계산합니다 (테마색 · 밝기 조정 · 투명도 반영).
function resolveColor(container: Element | undefined, theme: ThemeColors): Color | null {
  if (!container) return null
  const c = Array.from(container.children).find((x) => /^a:(srgbClr|schemeClr|sysClr|prstClr|scrgbClr)$/.test(x.tagName))
  if (!c) return null
  let hex: string | undefined
  if (c.tagName === 'a:srgbClr') hex = c.getAttribute('val') ?? undefined
  else if (c.tagName === 'a:schemeClr') {
    const v = c.getAttribute('val') ?? ''
    hex = theme[SCHEME_ALIAS[v] ?? v]
  } else if (c.tagName === 'a:sysClr') hex = c.getAttribute('lastClr') ?? undefined
  else if (c.tagName === 'a:prstClr') hex = PRESET[c.getAttribute('val') ?? '']
  if (!hex || hex.length !== 6) return null
  let alpha = 1
  let [h, s, l] = hexToHsl(hex)
  let rgb: number[] | null = null
  for (const m of Array.from(c.children)) {
    const v = EMU_ATTR(m, 'val') / 100000
    if (m.tagName === 'a:lumMod') l *= v
    else if (m.tagName === 'a:lumOff') l += v
    else if (m.tagName === 'a:alpha') alpha = v
    else if (m.tagName === 'a:tint' || m.tagName === 'a:shade') {
      const base = hslToHex(h, s, Math.min(1, Math.max(0, l)))
      rgb = [0, 2, 4].map((i) => parseInt(base.slice(i, i + 2), 16))
      rgb = rgb.map((x) => (m.tagName === 'a:tint' ? x * v + 255 * (1 - v) : x * v))
      ;[h, s, l] = hexToHsl(rgb.map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''))
    }
  }
  return { hex: `#${hslToHex(h, s, Math.min(1, Math.max(0, l)))}`, alpha }
}

function styleRefColor(style: Element | undefined, ref: string, theme: ThemeColors): Color | null {
  const r = kid(style, ref)
  if (!r || r.getAttribute('idx') === '0') return null
  return resolveColor(r, theme)
}

// ── 원시 요소 (EMU 좌표) ─────────────────────────────────────────

interface RawText {
  text: string
  size: number
  color?: string
  bold: boolean
  align: 'left' | 'center' | 'right'
  valign: 'top' | 'middle' | 'bottom'
  lineHeight: number
  insets: [number, number, number, number]
  plain: string
  paras: number
}

export interface RawItem extends Box {
  kind: 'shape' | 'image' | 'line'
  rot?: number
  flipH?: boolean
  flipV?: boolean
  geom?: FreeObj['geom']
  radiusRatio?: number
  fill?: Color | null
  line?: Color | null
  lineW?: number
  dash?: LineDash
  arrowStart?: LineEnd
  arrowEnd?: LineEnd
  text?: RawText
  ph?: string
  src?: string
  crop?: [number, number, number, number]
  placeholder?: boolean
}

function readText(txBody: Element, theme: ThemeColors, style: Element | undefined, defSize: number, defAlign: RawText['align'] = 'left'): RawText | undefined {
  const bodyPr = kid(txBody, 'a:bodyPr')
  const fontScale = EMU_ATTR(kid(bodyPr, 'a:normAutofit'), 'fontScale') / 100000 || 1
  const fontRefColor = resolveColor(kid(style, 'a:fontRef'), theme)?.hex
  const lines: string[] = []
  let boldChars = 0
  let totalChars = 0
  const sizeVotes = new Map<number, number>()
  let color: string | undefined
  let align: RawText['align'] = defAlign
  let lnPct = 0
  let num = 0
  for (const [pi, p] of kids(txBody, 'a:p').entries()) {
    const pPr = kid(p, 'a:pPr')
    if (pi === 0) {
      const al = pPr?.getAttribute('algn')
      if (al) align = al === 'ctr' ? 'center' : al === 'r' ? 'right' : 'left'
      lnPct = EMU_ATTR(kid(kid(pPr, 'a:lnSpc'), 'a:spcPct'), 'val') / 100000
    }
    let line = ''
    for (const r of Array.from(p.children)) {
      if (r.tagName === 'a:br') {
        line += '\n'
        continue
      }
      if (r.tagName !== 'a:r' && r.tagName !== 'a:fld') continue
      const t = kid(r, 'a:t')?.textContent ?? ''
      if (!t || t === '‹#›') continue
      const rPr = kid(r, 'a:rPr')
      const sz = (EMU_ATTR(rPr, 'sz') / 100 || EMU_ATTR(kid(pPr, 'a:defRPr'), 'sz') / 100 || defSize) * fontScale
      sizeVotes.set(sz, (sizeVotes.get(sz) ?? 0) + t.length)
      const b = rPr?.getAttribute('b') === '1'
      totalChars += t.trim().length
      if (b) boldChars += t.trim().length
      color ??= resolveColor(kid(rPr, 'a:solidFill'), theme)?.hex
      line += b && t.trim() ? `**${t}**` : t
    }
    const plain = line.replace(/\*\*/g, '').trim()
    if (!plain) {
      lines.push('')
      continue
    }
    if (kid(pPr, 'a:buChar')) line = `• ${line.trimStart()}`
    else if (kid(pPr, 'a:buAutoNum')) line = `${++num}. ${line.trimStart()}`
    lines.push(line.replace(/\*\*(\s*)\*\*/g, '$1'))
  }
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  while (lines.length && !lines[0].trim()) lines.shift()
  if (!lines.length) return undefined
  const allBold = totalChars > 0 && boldChars >= totalChars
  const text = (allBold ? lines.map((l) => l.replace(/\*\*/g, '')) : lines).join('\n')
  const size = [...sizeVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? defSize
  const anchor = bodyPr?.getAttribute('anchor')
  const ins = (name: string, def: number) => (bodyPr?.hasAttribute(name) ? EMU_ATTR(bodyPr, name) : def)
  return {
    text,
    plain: text.replace(/\*\*/g, ''),
    size,
    color: color ?? fontRefColor,
    bold: allBold,
    align,
    valign: anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top',
    lineHeight: Math.max(1, Math.min(2.4, (lnPct || 1) * 1.2)),
    insets: [ins('lIns', 91440), ins('tIns', 45720), ins('rIns', 91440), ins('bIns', 45720)],
    paras: lines.length,
  }
}

function geomOf(spPr: Element | undefined): { geom: FreeObj['geom'] | 'line'; radiusRatio?: number } {
  const prst = kid(spPr, 'a:prstGeom')?.getAttribute('prst') ?? 'rect'
  if (/^(line|straightConnector1|bentConnector\d|curvedConnector\d)$/.test(prst)) return { geom: 'line' }
  if (prst === 'ellipse' || prst === 'circle') return { geom: 'ellipse' }
  if (prst === 'round2SameRect') return { geom: 'round2SameRect' }
  // 지원하는 기본 도형·화살표는 같은 이름으로
  if (SHAPE_GEOMS.has(prst as Geom)) return { geom: prst as Geom }
  if (/round|snip/i.test(prst)) {
    const adj = kid(kid(spPr, 'a:prstGeom'), 'a:avLst')?.getElementsByTagName('a:gd')[0]
    const v = adj ? Number((adj.getAttribute('fmla') ?? '').replace('val ', '')) / 100000 : 0.16667
    return { geom: 'roundRect', radiusRatio: Number.isFinite(v) ? v : 0.16667 }
  }
  return { geom: 'rect' }
}

function fillOf(spPr: Element | undefined, style: Element | undefined, theme: ThemeColors): Color | null | 'image' {
  if (!spPr) return styleRefColor(style, 'a:fillRef', theme)
  if (kid(spPr, 'a:noFill')) return null
  const solid = kid(spPr, 'a:solidFill')
  if (solid) return resolveColor(solid, theme)
  const grad = kid(spPr, 'a:gradFill')
  if (grad) return resolveColor(all(grad, 'a:gs')[0], theme)
  if (kid(spPr, 'a:blipFill')) return 'image'
  const patt = kid(spPr, 'a:pattFill')
  if (patt) return resolveColor(kid(patt, 'a:fgClr'), theme)
  return styleRefColor(style, 'a:fillRef', theme)
}

// 선 끝 모양: 화살촉 종류는 삼각형으로, 원·마름모는 원으로
const endOf = (el: Element | undefined): LineEnd | undefined => {
  const t = el?.getAttribute('type')
  if (!t || t === 'none') return undefined
  return t === 'oval' || t === 'diamond' ? 'oval' : 'triangle'
}

function lineOf(
  spPr: Element | undefined,
  style: Element | undefined,
  theme: ThemeColors,
): { color: Color | null; w: number; dash?: LineDash; head?: LineEnd; tail?: LineEnd } {
  const ln = kid(spPr, 'a:ln')
  if (ln) {
    if (kid(ln, 'a:noFill')) return { color: null, w: 0 }
    const c = resolveColor(kid(ln, 'a:solidFill'), theme) ?? resolveColor(all(ln, 'a:gs')[0], theme) ?? styleRefColor(style, 'a:lnRef', theme)
    const d = kid(ln, 'a:prstDash')?.getAttribute('val') ?? 'solid'
    const dash: LineDash | undefined = /dot/i.test(d) && !/dash/i.test(d) ? 'dot' : /dash/i.test(d) ? 'dash' : undefined
    return { color: c, w: EMU_ATTR(ln, 'w') / 12700 || 0.75, dash, head: endOf(kid(ln, 'a:headEnd')), tail: endOf(kid(ln, 'a:tailEnd')) }
  }
  return { color: styleRefColor(style, 'a:lnRef', theme), w: 0.75 }
}

const xfrmExtras = (xfrm: Element | undefined) => ({
  rot: EMU_ATTR(xfrm, 'rot') / 60000 || undefined,
  flipH: xfrm?.getAttribute('flipH') === '1' || undefined,
  flipV: xfrm?.getAttribute('flipV') === '1' || undefined,
})

export async function readSlideItems(
  zip: JSZip,
  path: string,
  rels: Record<string, { target: string; type: string }>,
  theme: ThemeColors,
  inherited: (ph: Element) => Box | undefined,
  W: number,
  H: number,
): Promise<RawItem[]> {
  const xml = parse(await zip.file(path)!.async('string'))
  const items: RawItem[] = []

  const media = async (rId: string | null | undefined) => {
    const rel = rId ? rels[rId] : undefined
    if (!rel || !/\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(rel.target)) return undefined
    const file = zip.file(rel.target)
    if (!file) return undefined
    const ext = rel.target.split('.').pop()!.toLowerCase()
    const mime = ext === 'svg' ? 'svg+xml' : ext.replace('jpg', 'jpeg')
    return `data:image/${mime};base64,${await file.async('base64')}`
  }
  const cropOf = (blipFill: Element | undefined): RawItem['crop'] => {
    const r = kid(blipFill, 'a:srcRect')
    if (!r) return undefined
    const v = (n: string) => EMU_ATTR(r, n) / 100000
    const c: [number, number, number, number] = [v('l'), v('t'), v('r'), v('b')]
    return c.some((x) => x !== 0) ? c : undefined
  }

  const walk = async (tree: Element, t: Xform, list: Element[] = Array.from(tree.children)) => {
    for (const el of list) {
      const tag = el.tagName
      if (tag === 'p:sp' || tag === 'p:cxnSp') {
        const spPr = kid(el, 'p:spPr')
        const style = kid(el, 'p:style')
        const nv = kid(kid(el, tag === 'p:sp' ? 'p:nvSpPr' : 'p:nvCxnSpPr'), 'p:nvPr')
        const ph = kid(nv, 'p:ph')
        const box = boxOf(spPr, t) ?? (ph ? inherited(ph) : undefined)
        if (!box) continue
        const extras = xfrmExtras(kid(spPr, 'a:xfrm'))
        const { geom, radiusRatio } = geomOf(spPr)
        const ln = lineOf(spPr, style, theme)
        if (geom === 'line' || tag === 'p:cxnSp') {
          if (ln.color) items.push({ kind: 'line', ...box, ...extras, line: ln.color, lineW: ln.w, dash: ln.dash, arrowStart: ln.head, arrowEnd: ln.tail })
          continue
        }
        const phType = ph ? normPh(ph.getAttribute('type')) : undefined
        if (phType && /^(sldNum|dt|ftr)$/.test(phType)) continue
        const fill = fillOf(spPr, style, theme)
        const tx = kid(el, 'p:txBody')
        const defSize = phType === 'title' ? 32 : phType === 'body' ? 18 : 18
        // 텍스트 상자가 아닌 도형의 글은 PowerPoint 기본값처럼 가운데 정렬
        const isTextBox = kid(kid(el, 'p:nvSpPr'), 'p:cNvSpPr')?.getAttribute('txBox') === '1'
        const text = tx ? readText(tx, theme, style, defSize, !isTextBox && !ph ? 'center' : 'left') : undefined
        if (fill === 'image') {
          const src = await media(all(el, 'a:blip')[0]?.getAttribute('r:embed'))
          if (src) items.push({ kind: 'image', ...box, ...extras, src, crop: cropOf(kid(spPr, 'a:blipFill')) })
          if (text) items.push({ kind: 'shape', ...box, ...extras, geom: 'rect', text, ph: phType })
          continue
        }
        if (!text && !fill && !ln.color) continue
        items.push({ kind: 'shape', ...box, ...extras, geom, radiusRatio, fill, line: ln.color, lineW: ln.w, dash: ln.dash, text, ph: phType })
      } else if (tag === 'p:pic') {
        const spPr = kid(el, 'p:spPr')
        const box = boxOf(spPr, t)
        if (!box) continue
        const blipFill = kid(el, 'p:blipFill')
        const src = await media(all(el, 'a:blip')[0]?.getAttribute('r:embed'))
        if (src) items.push({ kind: 'image', ...box, ...xfrmExtras(kid(spPr, 'a:xfrm')), src, crop: cropOf(blipFill) })
      } else if (tag === 'p:grpSp') {
        const xfrm = kid(kid(el, 'p:grpSpPr'), 'a:xfrm')
        const off = kid(xfrm, 'a:off')
        const ext = kid(xfrm, 'a:ext')
        const chOff = kid(xfrm, 'a:chOff')
        const chExt = kid(xfrm, 'a:chExt')
        let nt = t
        if (off && ext && chOff && chExt && EMU_ATTR(chExt, 'cx') && EMU_ATTR(chExt, 'cy')) {
          nt = {
            ox: t.ox + (EMU_ATTR(off, 'x') - t.cx) * t.sx,
            oy: t.oy + (EMU_ATTR(off, 'y') - t.cy) * t.sy,
            sx: (EMU_ATTR(ext, 'cx') / EMU_ATTR(chExt, 'cx')) * t.sx,
            sy: (EMU_ATTR(ext, 'cy') / EMU_ATTR(chExt, 'cy')) * t.sy,
            cx: EMU_ATTR(chOff, 'x'),
            cy: EMU_ATTR(chOff, 'y'),
          }
        }
        await walk(el, nt)
      } else if (tag === 'p:graphicFrame') {
        const box = boxFromXfrm(kid(el, 'p:xfrm'), t)
        if (!box) continue
        const uri = all(el, 'a:graphicData')[0]?.getAttribute('uri') ?? ''
        const tbl = all(el, 'a:tbl')[0]
        if (tbl) {
          // 표: 칸마다 테두리 있는 사각형 + 글
          const colW = all(tbl, 'a:gridCol').map((g) => EMU_ATTR(g, 'w') * t.sx)
          let y = box.y
          for (const tr of kids(tbl, 'a:tr')) {
            const rowH = EMU_ATTR(tr, 'h') * t.sy
            let x = box.x
            let ci = 0
            for (const tc of kids(tr, 'a:tc')) {
              const span = Number(tc.getAttribute('gridSpan') ?? 1)
              const w = colW.slice(ci, ci + span).reduce((a, b) => a + b, 0)
              const rowSpan = Number(tc.getAttribute('rowSpan') ?? 1)
              const merged = tc.getAttribute('hMerge') === '1' || tc.getAttribute('vMerge') === '1'
              if (!merged) {
                const tcPr = kid(tc, 'a:tcPr')
                const tx = kid(tc, 'a:txBody')
                items.push({
                  kind: 'shape',
                  x,
                  y,
                  w,
                  h: rowH * rowSpan,
                  geom: 'rect',
                  fill: resolveColor(kid(tcPr, 'a:solidFill'), theme),
                  line: { hex: BRAND.colors.line, alpha: 1 },
                  lineW: 0.75,
                  text: tx ? readText(tx, theme, undefined, 12) : undefined,
                })
              }
              x += w
              ci += span
            }
            y += rowH
          }
        } else {
          const label = uri.includes('chart') ? '차트 — 원본 차트는 이미지로 붙여 넣어 주세요' : uri.includes('diagram') ? 'SmartArt — 원본 도식은 이미지로 붙여 넣어 주세요' : '원본 개체'
          items.push({ kind: 'shape', ...box, geom: 'rect', fill: { hex: BRAND.colors.imageFill, alpha: 1 }, placeholder: true, text: placeholderText(label) })
        }
      }
    }
  }
  const tree = all(xml, 'p:spTree')[0]
  if (tree) await walk(tree, ident, visibleChildren(tree, W, H))
  return items
}

function placeholderText(label: string): RawText {
  return { text: label, plain: label, size: 12, color: BRAND.colors.gray, bold: false, align: 'center', valign: 'middle', lineHeight: 1.3, insets: [91440, 45720, 91440, 45720], paras: 1 }
}

// ── 이미지 자르기 · 줄이기 ─────────────────────────────────────────

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// 원본의 자르기(srcRect)를 적용하고 긴 변 1600px 로 줄입니다.
async function prepareImage(src: string, crop?: [number, number, number, number]): Promise<string> {
  const img = await loadImg(src)
  if (!img) return ''
  const [l, t, r, b] = crop ?? [0, 0, 0, 0]
  const sw = img.naturalWidth * (1 - l - r)
  const sh = img.naturalHeight * (1 - t - b)
  if (sw <= 0 || sh <= 0) return ''
  const k = Math.min(1, 1600 / Math.max(sw, sh))
  if (!crop && k === 1 && src.length < 800_000) return src
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sw * k))
  canvas.height = Math.max(1, Math.round(sh * k))
  canvas.getContext('2d')!.drawImage(img, img.naturalWidth * l, img.naturalHeight * t, sw, sh, 0, 0, canvas.width, canvas.height)
  return src.startsWith('data:image/jpeg') ? canvas.toDataURL('image/jpeg', 0.88) : canvas.toDataURL('image/png')
}

// ── 본문 영역에 맞춰 배치 ──────────────────────────────────────

const hexOf = (c: Color | null | undefined) => (c ? c.hex : undefined)

// 제목·서브·장식(배경·로고·페이지 번호)을 뺀 나머지를 영역 안에 비율 유지로 옮깁니다.
// 기본은 자유 배치 본문 영역(FREE_AREA, 위 10px 띄움). 라인형 1단이면 가이드 박스 안쪽(inside)에 꼭 맞춥니다.
export async function itemsToObjects(items: RawItem[], slideW: number, slideH: number, inside?: Area): Promise<FreeObj[]> {
  const area = slideW * slideH
  const keep = items.filter((it) => {
    const a = it.w * it.h
    if (it.kind !== 'line' && a > area * 0.9 && !it.text) return false // 배경
    if (it.kind === 'image' && a < area * 0.03 && (it.y < slideH * 0.16 || it.y > slideH * 0.86)) return false // 로고
    if (it.text && /^\d{1,3}(\s*\/\s*\d{1,3})?$/.test(it.text.plain.trim()) && it.y > slideH * 0.85) return false // 페이지 번호 (3 · 03 / 16)
    if (it.text && /^alchera\b/i.test(it.text.plain.trim()) && it.text.plain.length < 60 && it.y > slideH * 0.88) return false // 원본 아래 꼬리말 (가이드 로고가 대신)
    return true
  })
  if (!keep.length) return []
  const minX = Math.min(...keep.map((i) => i.x))
  const minY = Math.min(...keep.map((i) => i.y))
  const maxX = Math.max(...keep.map((i) => i.x + i.w))
  const maxY = Math.max(...keep.map((i) => i.y + i.h))
  const bw = Math.max(1, maxX - minX)
  const bh = Math.max(1, maxY - minY)
  const base = 1280 / slideW
  const a = inside ?? { x: FREE_AREA.x, y: FREE_AREA.y + 10, w: FREE_AREA.w, h: FREE_AREA.h - 10 }
  const k = Math.min(a.w / bw, a.h / bh, base)
  const ox = a.x + (a.w - bw * k) / 2
  const oy = a.y
  const ptScale = k * 7143.75 // 원본 pt → 캔버스 기준 pt
  const r1 = (n: number) => Math.round(n * 10) / 10

  const out: FreeObj[] = []
  for (const it of keep) {
    const geo = { x: r1(ox + (it.x - minX) * k), y: r1(oy + (it.y - minY) * k), w: r1(Math.max(2, it.w * k)), h: r1(Math.max(2, it.h * k)), rot: it.rot }
    if (it.kind === 'image') {
      const src = await prepareImage(it.src!, it.crop)
      if (src) out.push({ id: uid(), kind: 'image', ...geo, src })
      continue
    }
    if (it.kind === 'line') {
      out.push({ id: uid(), kind: 'line', ...geo, flipH: it.flipH, flipV: it.flipV, line: hexOf(it.line) ?? BRAND.colors.navy, lineWidth: r1(Math.max(0.5, (it.lineW ?? 0.75) * ptScale)), dash: it.dash, arrowStart: it.arrowStart, arrowEnd: it.arrowEnd })
      continue
    }
    const t = it.text
    out.push({
      id: uid(),
      kind: 'shape',
      ...geo,
      geom: it.geom,
      radius: it.geom === 'roundRect' ? r1(Math.min(it.w, it.h) * k * Math.min(0.5, it.radiusRatio ?? 0.16667)) : undefined,
      fill: hexOf(it.fill as Color | null),
      opacity: it.fill && (it.fill as Color).alpha < 1 ? (it.fill as Color).alpha : undefined,
      line: hexOf(it.line),
      lineWidth: it.line ? r1(Math.max(0.5, (it.lineW ?? 0.75) * ptScale)) : undefined,
      dash: it.line ? it.dash : undefined,
      text: t?.text,
      size: t ? r1(Math.max(6, t.size * ptScale)) : undefined,
      color: t?.color ?? (it.placeholder ? BRAND.colors.gray : '#000000'),
      bold: t?.bold,
      align: t?.align,
      valign: t?.valign,
      lineHeight: t?.lineHeight,
      pad: t ? (t.insets.map((v) => r1(v * k)) as [number, number, number, number]) : undefined,
    })
  }
  return out
}
