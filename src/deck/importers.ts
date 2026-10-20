import JSZip from 'jszip'
import { itemsToObjects, readSlideItems, readTheme } from './importKeep'
import { EMU_ATTR, all, boxFromXfrm, boxOf, ident, kid, kids, normPh, type Box, type Xform } from './pptxXml'
import { BRAND } from './guide'
import { makeSlide, uid } from './kits'
import { isDeck } from './store'
import type { Deck, LayoutId, Slide } from './types'

// 다른 사람이 만든 PPTX·텍스트를 불러와 가이드 레이아웃에 맞춰 다시 짭니다.
// 내용(글·이미지)만 가져오고, 글꼴·색·위치는 모두 가이드 레이아웃이 정합니다. 브라우저 안에서만 처리합니다.

export class ImportError extends Error {}

// ── 공통: 내용 블록 → 가이드 레이아웃 ─────────────────────────────

interface Block {
  title?: string
  sub?: string
  lines: string[]
}

interface ContentSlide {
  title: string
  sub?: string
  blocks: Block[]
  images: string[]
  notes?: string
}

const clip = (s: string | undefined, n: number) => {
  const t = (s ?? '').trim()
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t
}

// 가이드: 글머리 기호는 텍스트 "• " 로
function bulletize(lines: string[]) {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => (/^[•※]/.test(l) ? l : `• ${l.replace(/^([-·▪●◦‣]|\*(?!\*))\s*/, '')}`))
    .join('\n')
}

function contentToSlide(cs: ContentSlide): Slide {
  const blocks = cs.blocks.filter((b) => b.title || b.sub || b.lines.length)
  const base = { title: clip(cs.title, 60), sub: clip(cs.sub, 90) }
  const image = cs.images[0]
  const k = Math.max(blocks.length, 1)
  const b = (i: number): Block => blocks[i] ?? { lines: [] }

  if (k === 1) {
    const one = b(0)
    if (image) {
      return makeSlide('line-1', { ...base, cTitle: one.title ?? '', cSub: one.sub ?? '', body: bulletize(one.lines), image }, cs.notes)
    }
    return makeSlide('line-text', { ...base, cTitle: one.title ?? '', cSub: one.sub ?? '', body: bulletize(one.lines) }, cs.notes)
  }
  if (k === 2) {
    const [l, r] = [b(0), b(1)]
    if (image) {
      const rBody = bulletize([...(r.sub ? [r.sub] : []), ...r.lines])
      return makeSlide('line-2', { ...base, lTitle: l.title ?? '', lSub: l.sub ?? '', lBody: bulletize(l.lines), rTitle: r.title ?? '', rBody, rImage: image }, cs.notes)
    }
    return makeSlide(
      'line-2t',
      { ...base, lTitle: l.title ?? '', lSub: l.sub ?? '', lBody: bulletize(l.lines), rTitle: r.title ?? '', rSub: r.sub ?? '', rBody: bulletize(r.lines) },
      cs.notes,
    )
  }
  if (k === 3) {
    const c: Record<string, string> = { ...base }
    ;[0, 1, 2].forEach((i) => {
      c[`c${i + 1}Title`] = b(i).title ?? ''
      c[`c${i + 1}Sub`] = b(i).sub ?? ''
      c[`c${i + 1}Body`] = bulletize(b(i).lines)
    })
    return makeSlide('line-3', c, cs.notes)
  }
  // 4개 이상: 2×2 카드. 넘치는 블록은 마지막 카드에 이어 붙입니다.
  const c: Record<string, string> = { ...base }
  const four = [b(0), b(1), b(2), { lines: blocks.slice(3).flatMap((x) => [...(x.title ? [x.title] : []), ...x.lines]) } as Block]
  if (blocks.length === 4) four[3] = b(3)
  four.forEach((x, i) => {
    c[`g${i + 1}Sub`] = clip([x.title, x.sub].filter(Boolean).join(' · '), 60)
    c[`g${i + 1}Body`] = bulletize(x.lines)
  })
  return makeSlide('line-grid', c, cs.notes)
}

function finishDeck(title: string, slides: Slide[]): Deck {
  if (!slides.length) throw new ImportError('가져올 내용을 찾지 못했어요.')
  if (slides[0].layout !== 'cover') slides.unshift(makeSlide('cover', { title: clip(title, 36) }))
  if (slides[slides.length - 1].layout !== 'closing') slides.push(makeSlide('closing', { title: '감사합니다.', contact: BRAND.contact }))
  const now = Date.now()
  return { id: uid(), title: title || '가져온 문서', slides, createdAt: now, updatedAt: now }
}

const isContents = (t: string) => /^(contents|table of contents|agenda|목차|차례)$/i.test(t.trim())
const isClosing = (t: string) => /^(감사합니다|thank\s*you|thanks|q\s*&\s*a)[.!]*$/i.test(t.trim())
const stripNumber = (s: string) => s.replace(/^\s*(\d+[.)]|[0-9]{2}\s|[-•·])\s*/, '').trim()

// ── 텍스트 · 마크다운 ────────────────────────────────────────────

// 규칙:  # 표지(첫 번째) / 간지(이후)   ## 슬라이드 제목   > 슬라이드 서브
//        ### 블록(칸) 제목   - 본문 줄   --- 슬라이드 나누기
// 마크다운 표시가 없으면 빈 줄로 나뉜 문단마다 한 장(첫 줄 = 제목, 나머지 = 본문)으로 만듭니다.
export function importText(text: string, fileTitle = ''): Deck {
  const src = text.replace(/\r\n?/g, '\n').trim()
  if (!src) throw new ImportError('텍스트가 비어 있어요.')
  const hasMarkdown = /^(#{1,3}\s|[-*]\s|>\s|---\s*$)/m.test(src)
  return hasMarkdown ? importMarkdown(src, fileTitle) : importParagraphs(src, fileTitle)
}

function importParagraphs(src: string, fileTitle: string): Deck {
  const paras = src.split(/\n\s*\n/).map((p) => p.split('\n').map((l) => l.trim()).filter(Boolean)).filter((p) => p.length)
  const slides: Slide[] = []
  paras.forEach((lines, i) => {
    const [head, ...rest] = lines
    if (i === 0) {
      slides.push(makeSlide('cover', { title: clip(head, 36), subtitle: clip(rest.join('\n'), 80) }))
    } else if (isClosing(head)) {
      slides.push(makeSlide('closing', { title: head, contact: BRAND.contact }))
    } else if (isContents(head)) {
      slides.push(makeSlide('contents', { title: 'CONTENTS', items: rest.map(stripNumber).join('\n') }))
    } else if (!rest.length) {
      slides.push(makeSlide('section', { title: clip(head, 24) }))
    } else {
      slides.push(contentToSlide({ title: head, blocks: [{ lines: rest }], images: [] }))
    }
  })
  return finishDeck(fileTitle || paras[0][0], slides)
}

function importMarkdown(src: string, fileTitle: string): Deck {
  const slides: Slide[] = []
  let deckTitle = fileTitle
  let cur: ContentSlide | null = null
  let coverLines: string[] | null = null
  let coverTitle = ''
  let pendingSection: { title: string; lines: string[] } | null = null

  const flush = () => {
    if (coverLines) {
      slides.push(makeSlide('cover', { title: clip(coverTitle, 36), subtitle: clip(coverLines.join('\n'), 80) }))
      coverLines = null
    }
    if (pendingSection) {
      const t = pendingSection.title
      if (isClosing(t)) slides.push(makeSlide('closing', { title: t, contact: BRAND.contact }))
      else slides.push(makeSlide('section', { title: clip(t, 24), description: clip(pendingSection.lines.join(' '), 60) }))
      pendingSection = null
    }
    if (cur) {
      if (isContents(cur.title)) {
        slides.push(makeSlide('contents', { title: 'CONTENTS', items: cur.blocks.flatMap((b) => [...(b.title ? [b.title] : []), ...b.lines]).map(stripNumber).join('\n') }))
      } else if (isClosing(cur.title)) {
        slides.push(makeSlide('closing', { title: cur.title, contact: BRAND.contact }))
      } else {
        slides.push(contentToSlide(cur))
      }
      cur = null
    }
  }

  const block = () => {
    if (!cur) cur = { title: '', blocks: [], images: [] }
    if (!cur.blocks.length) cur.blocks.push({ lines: [] })
    return cur.blocks[cur.blocks.length - 1]
  }

  for (const raw of src.split('\n')) {
    const line = raw.trimEnd()
    const t = line.trim()
    if (!t) continue
    if (/^---+$/.test(t)) {
      flush()
      continue
    }
    let m: RegExpMatchArray | null
    if ((m = t.match(/^#\s+(.*)$/))) {
      flush()
      if (!slides.length && !deckTitle) deckTitle = m[1]
      if (!slides.length) {
        coverTitle = m[1]
        coverLines = []
      } else pendingSection = { title: m[1], lines: [] }
    } else if ((m = t.match(/^##\s+(.*)$/))) {
      flush()
      cur = { title: m[1], blocks: [], images: [] }
    } else if ((m = t.match(/^###\s+(.*)$/))) {
      if (!cur) cur = { title: '', blocks: [], images: [] }
      cur.blocks.push({ title: m[1], lines: [] })
    } else if ((m = t.match(/^>\s*(.*)$/))) {
      if (cur && !cur.sub && !cur.blocks.length) cur.sub = m[1]
      else block().sub = block().sub ? `${block().sub}\n${m[1]}` : m[1]
    } else if (coverLines) {
      coverLines.push(t)
    } else if (pendingSection && !cur) {
      pendingSection.lines.push(t)
    } else {
      const bulleted = /^([-*•·]|\d+[.)])\s+/.test(t)
      const text = t.replace(/^[-*•·]\s+/, '').replace(/__(.+?)__/g, '**$1**')
      const b = block()
      // 블록 제목 바로 아래의 일반 문장은 콘텐츠 서브로
      if (!bulleted && b.title && !b.sub && !b.lines.length) b.sub = text
      else b.lines.push(text)
    }
  }
  flush()
  return finishDeck(deckTitle, slides)
}

// ── PPTX ─────────────────────────────────────────────────────────

interface Para {
  text: string
  plain: string
  bold: boolean
  size: number
  bullet: boolean
}

interface TextShape extends Box {
  ph?: string
  paras: Para[]
}

interface PicShape extends Box {
  src: string
}

function readParas(txBody: Element): Para[] {
  return kids(txBody, 'a:p')
    .map((p) => {
      const pPr = kid(p, 'a:pPr')
      const runs = Array.from(p.children).filter((c) => c.tagName === 'a:r' || c.tagName === 'a:br' || c.tagName === 'a:fld')
      let text = ''
      let plain = ''
      let boldChars = 0
      let size = 0
      for (const r of runs) {
        if (r.tagName === 'a:br') {
          text += ' '
          plain += ' '
          continue
        }
        const t = kid(r, 'a:t')?.textContent ?? ''
        const rPr = kid(r, 'a:rPr')
        const b = rPr?.getAttribute('b') === '1'
        size = Math.max(size, EMU_ATTR(rPr, 'sz') / 100)
        plain += t
        if (b && t.trim()) {
          boldChars += t.trim().length
          text += `**${t}**`
        } else text += t
      }
      plain = plain.replace(/\s+/g, ' ').trim()
      if (plain === '‹#›') plain = ''
      const allBold = plain.length > 0 && boldChars >= plain.replace(/\s/g, '').length
      return {
        // 문단 전체가 굵으면 ** 표시 대신 bold 플래그만 남깁니다
        text: allBold ? plain : text.replace(/\*\*\s*\*\*/g, '').replace(/\s+/g, ' ').trim(),
        plain,
        bold: allBold,
        size,
        bullet: !!(kid(pPr, 'a:buChar') || kid(pPr, 'a:buAutoNum')) || /^[•\-·▪●]\s/.test(plain),
      }
    })
    .filter((p) => p.plain)
}

async function readSlideShapes(zip: JSZip, path: string) {
  const parse = (s: string) => new DOMParser().parseFromString(s, 'application/xml')
  const xml = parse(await zip.file(path)!.async('string'))
  const relsPath = path.replace(/slides\/(slide\d+\.xml)$/, 'slides/_rels/$1.rels')
  const rels: Record<string, { target: string; type: string }> = {}
  const relsFile = zip.file(relsPath)
  if (relsFile) {
    for (const r of all(parse(await relsFile.async('string')), 'Relationship')) {
      const target = r.getAttribute('Target') ?? ''
      rels[r.getAttribute('Id') ?? ''] = { target: new URL(target, `https://x/${path}`).pathname.slice(1), type: r.getAttribute('Type') ?? '' }
    }
  }

  const texts: TextShape[] = []
  const pics: PicShape[] = []

  // 위치가 없는 자리표시자(placeholder)는 슬라이드 레이아웃 → 마스터에서 위치를 물려받습니다.
  const phBoxes = new Map<string, Box>()
  const collectPh = async (xmlPath: string | undefined, depth: number) => {
    if (!xmlPath || depth > 2) return
    const file = zip.file(xmlPath)
    if (!file) return
    const doc = parse(await file.async('string'))
    for (const sp of all(doc, 'p:sp')) {
      const ph = kid(kid(kid(sp, 'p:nvSpPr'), 'p:nvPr'), 'p:ph')
      const box = boxOf(kid(sp, 'p:spPr'), ident)
      if (!ph || !box) continue
      const type = normPh(ph.getAttribute('type'))
      const idx = ph.getAttribute('idx')
      if (idx && !phBoxes.has(`idx:${idx}`)) phBoxes.set(`idx:${idx}`, box)
      if (!phBoxes.has(`type:${type}`)) phBoxes.set(`type:${type}`, box)
    }
    const relsFile2 = zip.file(xmlPath.replace(/([^/]+)$/, '_rels/$1.rels'))
    if (!relsFile2) return
    const next = all(parse(await relsFile2.async('string')), 'Relationship').find((r) => /\/slide(Layout|Master)$/.test(r.getAttribute('Type') ?? ''))
    if (next) await collectPh(new URL(next.getAttribute('Target') ?? '', `https://x/${xmlPath}`).pathname.slice(1), depth + 1)
  }
  await collectPh(Object.values(rels).find((r) => r.type.endsWith('/slideLayout'))?.target, 0)
  const inherited = (ph: Element) => {
    const idx = ph.getAttribute('idx')
    return (idx ? phBoxes.get(`idx:${idx}`) : undefined) ?? phBoxes.get(`type:${normPh(ph.getAttribute('type'))}`)
  }

  const walk = async (tree: Element, t: Xform) => {
    for (const el of Array.from(tree.children)) {
      if (el.tagName === 'p:sp') {
        const box = boxOf(kid(el, 'p:spPr'), t)
        const ph = kid(kid(kid(el, 'p:nvSpPr'), 'p:nvPr'), 'p:ph')
        const tx = kid(el, 'p:txBody')
        if (!tx) continue
        const paras = readParas(tx)
        if (!paras.length) continue
        const resolved = box ?? (ph ? inherited(ph) : undefined) ?? { x: 0, y: ph ? 0 : 1, w: 1, h: 1 }
        const phType = ph ? normPh(ph.getAttribute('type')) : undefined
        // 본문 자리표시자의 문단은 레이아웃에서 글머리 기호를 물려받습니다
        if (phType === 'body') paras.forEach((p) => (p.bullet = true))
        texts.push({ ...resolved, ph: phType, paras })
      } else if (el.tagName === 'p:pic') {
        const box = boxOf(kid(el, 'p:spPr'), t)
        const embed = all(el, 'a:blip')[0]?.getAttribute('r:embed')
        const rel = embed ? rels[embed] : undefined
        if (!box || !rel) continue
        const file = zip.file(rel.target)
        if (!file || !/\.(png|jpe?g|gif|bmp|webp)$/i.test(rel.target)) continue
        const ext = rel.target.split('.').pop()!.toLowerCase().replace('jpg', 'jpeg')
        pics.push({ ...box, src: `data:image/${ext};base64,${await file.async('base64')}` })
      } else if (el.tagName === 'p:grpSp') {
        const xfrm = kid(kid(el, 'p:grpSpPr'), 'a:xfrm')
        const off = kid(xfrm, 'a:off')
        const ext = kid(xfrm, 'a:ext')
        const chOff = kid(xfrm, 'a:chOff')
        const chExt = kid(xfrm, 'a:chExt')
        let nt = t
        if (off && ext && chOff && chExt && EMU_ATTR(chExt, 'cx') && EMU_ATTR(chExt, 'cy')) {
          const sx = (EMU_ATTR(ext, 'cx') / EMU_ATTR(chExt, 'cx')) * t.sx
          const sy = (EMU_ATTR(ext, 'cy') / EMU_ATTR(chExt, 'cy')) * t.sy
          nt = {
            ox: t.ox + (EMU_ATTR(off, 'x') - t.cx) * t.sx,
            oy: t.oy + (EMU_ATTR(off, 'y') - t.cy) * t.sy,
            sx,
            sy,
            cx: EMU_ATTR(chOff, 'x'),
            cy: EMU_ATTR(chOff, 'y'),
          }
        }
        await walk(el, nt)
      } else if (el.tagName === 'p:graphicFrame') {
        // 표: 행마다 "칸 | 칸" 한 줄로
        const tbl = all(el, 'a:tbl')[0]
        if (!tbl) continue
        // graphicFrame 은 위치를 p:xfrm 에 둡니다
        const b = boxFromXfrm(kid(el, 'p:xfrm'), t) ?? { x: 0, y: 1, w: 1, h: 1 }
        const rows = all(tbl, 'a:tr').map((tr) =>
          all(tr, 'a:tc')
            .map((tc) => all(tc, 'a:t').map((x) => x.textContent).join('').trim())
            .filter(Boolean)
            .join(' | '),
        )
        const paras = rows.filter(Boolean).map((r) => ({ text: r, plain: r, bold: false, size: 0, bullet: true }))
        if (paras.length) texts.push({ ...b, paras })
      }
    }
  }
  const tree = all(xml, 'p:spTree')[0]
  if (tree) await walk(tree, ident)

  let notes = ''
  const notesRel = Object.values(rels).find((r) => r.type.endsWith('/notesSlide'))
  const notesFile = notesRel ? zip.file(notesRel.target) : null
  if (notesFile) {
    const nx = parse(await notesFile.async('string'))
    notes = all(nx, 'p:sp')
      .filter((sp) => kid(kid(kid(sp, 'p:nvSpPr'), 'p:nvPr'), 'p:ph')?.getAttribute('type') === 'body')
      .flatMap((sp) => all(sp, 'a:p').map((p) => all(p, 'a:t').map((t) => t.textContent).join('')))
      .join('\n')
      .trim()
  }
  return { texts, pics, notes, rels, inherited }
}

// 한 장의 도형들을 제목 · 서브 · 블록(열) · 이미지로 해석합니다.
function interpret(texts: TextShape[], pics: PicShape[], W: number, H: number) {
  const area = W * H
  // 페이지 번호·아주 작은 장식 글자 제외
  const useful = texts.filter((s) => !(s.ph === 'sldNum' || s.ph === 'dt' || s.ph === 'ftr') && s.paras.some((p) => !/^\d{1,3}$/.test(p.plain)))
  const images = pics
    .filter((p) => p.w * p.h > area * 0.04 && p.w * p.h < area * 0.85)
    .sort((a, b) => b.w * b.h - a.w * a.h)
    .map((p) => p.src)

  let titleShape = useful.find((s) => s.ph === 'title')
  if (!titleShape) {
    const top = useful.filter((s) => s.y < H * 0.2 && s.paras.length <= 3 && s.paras[0].plain.length <= 80)
    titleShape = top.sort((a, b) => Math.max(...b.paras.map((p) => p.size)) - Math.max(...a.paras.map((p) => p.size)) || a.y - b.y)[0]
  }
  const title = titleShape ? titleShape.paras.map((p) => p.plain).join(' ') : ''
  let rest = useful.filter((s) => s !== titleShape)

  // 제목 바로 아래 한 줄 → 슬라이드 서브
  let sub: string | undefined
  if (titleShape) {
    const below = rest
      .filter((s) => s.y >= titleShape!.y && s.y < titleShape!.y + titleShape!.h + H * 0.12 && s.paras.length === 1 && s.paras[0].plain.length <= 90)
      .sort((a, b) => a.y - b.y)[0]
    if (below && below.ph !== 'body') {
      sub = below.paras[0].plain
      rest = rest.filter((s) => s !== below)
    }
  }
  // 제목 위 작은 글자(상단 목차 등)는 버립니다
  if (titleShape) rest = rest.filter((s) => !(s.y + s.h <= titleShape!.y + 1 && s.paras.length === 1))

  // 가로 위치로 열 묶기
  const cols: TextShape[][] = []
  for (const s of [...rest].sort((a, b) => a.x - b.x)) {
    const col = cols.find((c) => {
      const l = Math.min(...c.map((x) => x.x))
      const r = Math.max(...c.map((x) => x.x + x.w))
      const overlap = Math.min(r, s.x + s.w) - Math.max(l, s.x)
      return overlap > Math.min(s.w, r - l) * 0.5
    })
    if (col) col.push(s)
    else cols.push([s])
  }
  const multi = cols.length > 1
  const blocks: Block[] = cols.map((col) => {
    const sorted = col.sort((a, b) => a.y - b.y)
    const paras = sorted.flatMap((s) => s.paras)
    const blk: Block = { lines: [] }
    let i = 0
    const bodySize = Math.max(0, ...paras.slice(1).map((p) => p.size))
    const headingLike =
      paras[0] &&
      (paras[0].bold || (paras[0].size > 0 && paras[0].size > bodySize + 1) || (sorted.length > 1 && sorted[0].paras.length === 1))
    // 여러 칸으로 나뉜 슬라이드에서는 짧은 첫 줄(예: "도입 전")을 칸 제목으로 봅니다
    const shortLead = multi && paras.length >= 3 && paras[0].plain.length <= 20
    if (paras.length > 1 && paras[0].plain.length <= 40 && ((!paras[0].bullet && headingLike) || shortLead)) {
      blk.title = paras[0].plain
      i = 1
      if (paras[1] && paras.length > 2 && paras[1].bold && paras[1].plain.length <= 60 && !paras[1].bullet) {
        blk.sub = paras[1].plain
        i = 2
      }
    }
    blk.lines = paras.slice(i).map((p) => (p.bold && p.plain.length <= 60 ? `**${p.plain}**` : p.text))
    return blk
  })
  return { title, sub, blocks, images, allText: useful.flatMap((s) => s.paras.map((p) => p.plain)) }
}

// 가져온 이미지는 긴 변 1600px 로 줄여 브라우저 저장 공간을 아낍니다.
function shrinkImage(src: string, max = 1600): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
      if (r === 1 && src.length < 600_000) return resolve(src)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * r)
      canvas.height = Math.round(img.naturalHeight * r)
      const ctx = canvas.getContext('2d')!
      const png = src.startsWith('data:image/png')
      if (!png) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(png ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve('')
    img.src = src
  })
}

export type PptxMode = 'keep' | 'rebuild'

// keep: 본문 슬라이드의 도형·텍스트·이미지를 원본 배치 그대로(자유 배치) · rebuild: 내용만 읽어 가이드 레이아웃으로 재구성
export async function importPptx(data: ArrayBuffer, fileTitle = '', mode: PptxMode = 'keep'): Promise<Deck> {
  let zip: JSZip
  try {
    zip = await JSZip.loadAsync(data)
  } catch {
    throw new ImportError('PPTX 파일을 열지 못했어요. 파일이 손상되지 않았는지 확인해 주세요.')
  }
  const presFile = zip.file('ppt/presentation.xml')
  if (!presFile) throw new ImportError('PowerPoint(.pptx) 파일이 아니에요.')
  const parse = (s: string) => new DOMParser().parseFromString(s, 'application/xml')
  const pres = parse(await presFile.async('string'))
  const sz = all(pres, 'p:sldSz')[0]
  const W = EMU_ATTR(sz, 'cx') || 9144000
  const H = EMU_ATTR(sz, 'cy') || 5143500
  const presRels = parse(await zip.file('ppt/_rels/presentation.xml.rels')!.async('string'))
  const relMap = Object.fromEntries(all(presRels, 'Relationship').map((r) => [r.getAttribute('Id'), r.getAttribute('Target')]))
  const order = all(pres, 'p:sldId').map((s) => relMap[s.getAttribute('r:id') ?? ''])
  const paths = order.filter(Boolean).map((t) => `ppt/${t!.replace(/^\/?ppt\//, '')}`)

  const theme = mode === 'keep' ? await readTheme(zip) : {}
  const slides: Slide[] = []
  let deckTitle = fileTitle
  for (const [i, path] of paths.entries()) {
    if (!zip.file(path)) continue
    const { texts, pics, notes, rels, inherited } = await readSlideShapes(zip, path)
    const s = interpret(texts, pics, W, H)
    if (s.images[0]) s.images = [await shrinkImage(s.images[0])].filter(Boolean)
    const last = i === paths.length - 1
    const textLen = s.allText.join('').length
    let layout: LayoutId | null = null
    if (i === 0) layout = 'cover'
    else if (isContents(s.title)) layout = 'contents'
    else if (last && (isClosing(s.title) || s.allText.some(isClosing))) layout = 'closing'
    else if (s.blocks.every((b) => b.lines.length + (b.sub ? 1 : 0) <= 1) && !s.images.length && textLen < 90) layout = 'section'

    if (!layout && mode === 'keep') {
      // 원본 배치 유지: 가이드 상단(타이틀·서브)에 들어갈 글과 그 위쪽 머리 영역을 빼고 나머지를 그대로 옮깁니다
      const items = await readSlideItems(zip, path, rels, theme, inherited)
      const titleItem = items.find((it) => it.ph === 'title') ?? items.find((it) => it.text && s.title && it.text.plain.replace(/\s+/g, ' ') === s.title)
      // 서브는 채우기·테두리 없는 글 상자일 때만 (도식 안의 박스를 서브로 오인하지 않도록)
      const subItem = s.sub ? items.find((it) => it !== titleItem && it.text && !it.fill && !it.line && it.text.plain.replace(/\s+/g, ' ') === s.sub) : undefined
      if (!subItem) s.sub = undefined
      const headerBottom = titleItem ? Math.max(titleItem.y + titleItem.h, subItem ? subItem.y + subItem.h : 0) : 0
      // 타이틀 위쪽 머리 영역(상단 목차·장식 띠)은 가이드 상단이 대신하므로 뺍니다
      const body = items.filter((it) => it !== titleItem && it !== subItem && !(titleItem && it.kind !== 'image' && it.y + it.h <= headerBottom + H * 0.01 && it.h < H * 0.12 && !it.fill))
      const objects = await itemsToObjects(body, W, H)
      if (objects.length) {
        const slide = makeSlide('free', { title: clip(s.title, 60), sub: clip(s.sub, 90) }, notes)
        slides.push({ ...slide, objects })
        continue
      }
    }

    if (layout === 'cover') {
      deckTitle ||= s.title
      const subtitle = [s.sub, ...s.blocks.flatMap((b) => [b.title, b.sub, ...b.lines])].filter(Boolean).map((x) => x!.replace(/\*\*/g, '')).join('\n')
      slides.push(makeSlide('cover', { title: clip(s.title || fileTitle, 36), subtitle: clip(subtitle, 80) }, notes))
    } else if (layout === 'contents') {
      const items = s.blocks.flatMap((b) => [b.title, b.sub, ...b.lines]).filter(Boolean).map((x) => stripNumber(x!.replace(/\*\*/g, '')))
      slides.push(makeSlide('contents', { title: 'CONTENTS', items: items.slice(0, 8).join('\n') }, notes))
    } else if (layout === 'closing') {
      slides.push(makeSlide('closing', { title: clip(s.title || '감사합니다.', 30), contact: BRAND.contact }, notes))
    } else if (layout === 'section') {
      const desc = [s.sub, ...s.blocks.flatMap((b) => [b.title, b.sub, ...b.lines])].filter(Boolean).join(' ').replace(/\*\*/g, '')
      slides.push(makeSlide('section', { title: clip(s.title || desc, 24), description: s.title ? clip(desc, 60) : '' }, notes))
    } else {
      slides.push(contentToSlide({ title: s.title, sub: s.sub, blocks: s.blocks, images: s.images, notes }))
    }
  }
  return finishDeck(deckTitle, slides)
}

// ── 진입점 ──────────────────────────────────────────────────────

export async function importFile(file: File, mode: PptxMode = 'keep'): Promise<Deck> {
  const name = file.name.replace(/\.[^.]+$/, '')
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (ext === 'pptx') return importPptx(await file.arrayBuffer(), name, mode)
  if (ext === 'txt' || ext === 'md' || ext === 'markdown') return importText(await file.text(), name)
  if (ext === 'json') {
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      throw new ImportError('편집 파일(.deck.json)을 읽지 못했어요.')
    }
    if (!isDeck(data)) throw new ImportError('Deck Studio 편집 파일(.deck.json)이 아니에요.')
    return { ...data, id: uid(), updatedAt: Date.now() }
  }
  if (ext === 'ppt' || ext === 'key' || ext === 'pdf') {
    throw new ImportError('이 형식은 바로 읽을 수 없어요. PowerPoint·Keynote·Google Slides에서 .pptx로 저장한 뒤 올려주세요.')
  }
  throw new ImportError('PPTX, 텍스트(.txt · .md), 편집 파일(.deck.json)만 불러올 수 있어요.')
}
