import type PptxGenJS from 'pptxgenjs'
import { BRAND, PX_PER_IN, SLIDE_IN, TONES } from './guide'
import { buildSlide, sectionFor, slideTone } from './layouts'
import { downloadBlob, safeFileName } from './store'
import { parseRich } from './textStyle'
import type { Deck, FreeObj, ShapeEl, TextEl } from './types'

const inch = (px: number) => px / PX_PER_IN
const hex = (c: string) => c.replace('#', '').toUpperCase()
const transparency = (opacity?: number) => (opacity === undefined ? undefined : Math.round((1 - opacity) * 100))

async function urlToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

// 화면의 object-fit: cover 와 같은 결과가 나오도록 이미지를 영역 비율에 맞게 잘라서 넣습니다.
function coverCrop(dataUrl: string, w: number, h: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(2, Math.max(1, img.naturalWidth / w))
      const cw = Math.round(w * scale)
      const ch = Math.round(h * scale)
      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      const ctx = canvas.getContext('2d')!
      const r = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const dw = img.naturalWidth * r
      const dh = img.naturalHeight * r
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh)
      resolve(dataUrl.startsWith('data:image/png') ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

// 목차 항목은 PPT 자동 번호, 본문은 줄마다 텍스트(• 포함)로 넣고 **굵게** 구간만 Bold 로 나눕니다.
function textRuns(el: TextEl, value: string): PptxGenJS.TextProps[] | string {
  if (el.list === 'number') {
    const lines = value.split('\n').filter((l) => l.trim())
    return lines.map((line, i) => ({
      text: line,
      options: { bullet: { type: 'number', indent: el.size * 1.6 }, breakLine: i < lines.length - 1 },
    }))
  }
  if (!el.rich) return value
  const lines = value.split('\n')
  return lines.flatMap((line, i) => {
    const runs = parseRich(line)
    if (!runs.length) runs.push({ text: '', bold: false })
    return runs.map((r, j) => ({
      text: r.text,
      options: { bold: r.bold || !!el.bold, breakLine: j === runs.length - 1 && i < lines.length - 1 },
    }))
  })
}

// 가이드: 라인형 패널은 위쪽 파란 그림자(2.25pt), 타이틀형 본문은 옅은 아래 그림자
function shadow(el: ShapeEl): PptxGenJS.ShadowProps | undefined {
  // blur 0 은 pptxgenjs 가 기본값(8pt)으로 바꾸므로 0에 가까운 값을 넣어 가이드처럼 선명한 선을 만듭니다.
  if (el.shadow === 'accent') return { type: 'outer', angle: 270, blur: 0.001, offset: 2.25, color: '0000A5', opacity: 1 }
  if (el.shadow === 'soft') return { type: 'outer', angle: 90, blur: 3, offset: 2, color: '000000', opacity: 0.05 }
  return undefined
}

const pt = (px: number) => (px / PX_PER_IN) * 72

function richRuns(text: string, bold: boolean): PptxGenJS.TextProps[] {
  const lines = text.split('\n')
  return lines.flatMap((line, i) => {
    const runs = parseRich(line)
    if (!runs.length) runs.push({ text: '', bold: false })
    return runs.map((r, j) => ({ text: r.text, options: { bold: r.bold || bold, breakLine: j === runs.length - 1 && i < lines.length - 1 } }))
  })
}

// 자유 배치 요소 → PPTX 네이티브 도형·텍스트 상자·이미지·선
async function addFreeObject(pptx: PptxGenJS, s: PptxGenJS.Slide, o: FreeObj) {
  const box = { x: inch(o.x), y: inch(o.y), w: inch(o.w), h: inch(o.h), rotate: o.rot || undefined }
  if (o.kind === 'image') {
    if (!o.src) return
    s.addImage({ ...box, data: o.src.startsWith('data:') ? o.src : await urlToDataUrl(o.src) })
    return
  }
  if (o.kind === 'line') {
    s.addShape(pptx.ShapeType.line, { ...box, line: { color: hex(o.line ?? '#000038'), width: o.lineWidth ?? 1 }, flipH: o.flipH, flipV: o.flipV })
    return
  }
  const shape = o.geom === 'ellipse' ? pptx.ShapeType.ellipse : o.geom === 'roundRect' ? pptx.ShapeType.roundRect : pptx.ShapeType.rect
  const common = {
    ...box,
    fill: o.fill ? { color: hex(o.fill), transparency: transparency(o.opacity) } : undefined,
    line: o.line ? { color: hex(o.line), width: o.lineWidth ?? 0.75 } : undefined,
    rectRadius: o.geom === 'roundRect' ? inch(o.radius ?? 12) : undefined,
  }
  if (!o.text?.trim()) {
    if (o.fill || o.line) s.addShape(shape, { ...common, line: common.line ?? { type: 'none' } })
    return
  }
  const [l, t, r, b] = o.pad ?? [0, 0, 0, 0]
  s.addText(richRuns(o.text, !!o.bold), {
    ...common,
    shape,
    fontFace: BRAND.font.ppt,
    fontSize: o.size ?? 10,
    color: hex(o.color ?? '#000038'),
    align: o.align ?? 'left',
    valign: o.valign ?? 'top',
    margin: [pt(l), pt(r), pt(b), pt(t)],
    lineSpacingMultiple: o.lineHeight ?? 1.3,
  })
}

// 편집 화면과 같은 요소 목록(buildSlide)을 그대로 PPTX 도형·텍스트 상자로 옮깁니다.
// 결과물은 PowerPoint에서 바로 수정 가능한 네이티브 텍스트 상자입니다.
export async function exportDeckToPptx(deck: Deck) {
  const { default: Pptx } = await import('pptxgenjs')
  const pptx = new Pptx()
  pptx.defineLayout({ name: 'ALCHERA', width: SLIDE_IN.w, height: SLIDE_IN.h })
  pptx.layout = 'ALCHERA'
  pptx.title = deck.title
  pptx.company = BRAND.name
  pptx.theme = { headFontFace: BRAND.font.ppt, bodyFontFace: BRAND.font.ppt }

  const logos = {
    white: await urlToDataUrl(BRAND.logo.white),
    navy: await urlToDataUrl(BRAND.logo.navy),
  }
  const coverBg = await urlToDataUrl(BRAND.coverBg)

  for (const [index, slide] of deck.slides.entries()) {
    const s = pptx.addSlide()
    const palette = TONES[slideTone(slide)]
    s.background = palette.bgImage ? { data: coverBg } : { color: hex(palette.bg) }
    if (slide.notes.trim()) s.addNotes(slide.notes)

    for (const el of buildSlide(slide, index, sectionFor(deck.slides, index))) {
      const box = { x: inch(el.x), y: inch(el.y), w: inch(el.w), h: inch(el.h) }
      switch (el.type) {
        case 'rect':
        case 'ellipse': {
          const shape =
            el.type === 'ellipse'
              ? pptx.ShapeType.ellipse
              : el.topOnly
                ? pptx.ShapeType.round2SameRect
                : el.radius
                  ? pptx.ShapeType.roundRect
                  : pptx.ShapeType.rect
          s.addShape(shape, {
            ...box,
            fill: el.fill ? { color: hex(el.fill), transparency: transparency(el.opacity) } : undefined,
            line: el.line
              ? { color: hex(el.line), width: el.lineWidth ?? 1, transparency: transparency(el.opacity) }
              : { type: 'none' },
            rectRadius: el.radius && !el.topOnly ? inch(el.radius) : undefined,
            shadow: shadow(el),
          })
          break
        }
        case 'line':
          s.addShape(pptx.ShapeType.line, { ...box, line: { color: hex(el.color), width: el.width } })
          break
        case 'image': {
          if (el.logo) {
            s.addImage({ ...box, data: logos[el.logo] })
          } else if (el.field && slide.content[el.field]) {
            s.addImage({ ...box, data: await coverCrop(slide.content[el.field], el.w, el.h) })
          }
          break
        }
        case 'text': {
          const raw = el.field ? (slide.content[el.field] ?? '') : (el.text ?? '')
          const value = raw.trim() ? raw : (el.fallback ?? raw)
          if (!value.trim()) break
          s.addText(textRuns(el, value), {
            ...box,
            fontFace: BRAND.font.ppt,
            fontSize: el.size,
            color: hex(el.color),
            bold: !!el.bold,
            align: el.align ?? 'left',
            valign: 'top',
            margin: 0,
            lineSpacingMultiple: el.lineHeight ?? 1.2,
            paraSpaceAfter: el.paraSpace,
            charSpacing: el.letterSpacing,
          })
          break
        }
      }
    }
    if (slide.layout === 'free') {
      for (const o of slide.objects ?? []) await addFreeObject(pptx, s, o)
    }
  }

  const blob = (await pptx.write({ outputType: 'blob' })) as Blob
  downloadBlob(blob, `${safeFileName(deck.title)}.pptx`)
}
