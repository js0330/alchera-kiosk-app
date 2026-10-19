import type PptxGenJS from 'pptxgenjs'
import { BRAND, PX_PER_IN, TONES } from './guide'
import { buildSlide, sectionFor, slideTone } from './layouts'
import { downloadBlob, safeFileName } from './store'
import type { Deck, TextEl } from './types'

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

function textRuns(el: TextEl, value: string): PptxGenJS.TextProps[] | string {
  if (!el.list) return value
  const lines = value.split('\n').filter((l) => l.trim())
  return lines.map((line, i) => ({
    text: line,
    options: {
      bullet: el.list === 'number' ? { type: 'number', indent: el.size * 1.6 } : { indent: el.size * 1.2 },
      breakLine: i < lines.length - 1,
    },
  }))
}

// 편집 화면과 같은 요소 목록(buildSlide)을 그대로 PPTX 도형·텍스트 상자로 옮깁니다.
// 결과물은 PowerPoint에서 바로 수정 가능한 네이티브 텍스트 상자입니다.
export async function exportDeckToPptx(deck: Deck) {
  const { default: Pptx } = await import('pptxgenjs')
  const pptx = new Pptx()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = deck.title
  pptx.company = BRAND.name
  pptx.theme = { headFontFace: BRAND.font.ppt, bodyFontFace: BRAND.font.ppt }

  const logos = {
    white: await urlToDataUrl(BRAND.logo.white),
    navy: await urlToDataUrl(BRAND.logo.navy),
  }

  for (const [index, slide] of deck.slides.entries()) {
    const s = pptx.addSlide()
    s.background = { color: hex(TONES[slideTone(slide)].bg) }
    if (slide.notes.trim()) s.addNotes(slide.notes)

    for (const el of buildSlide(slide, index, deck.footer, sectionFor(deck.slides, index))) {
      const box = { x: inch(el.x), y: inch(el.y), w: inch(el.w), h: inch(el.h) }
      switch (el.type) {
        case 'rect':
        case 'ellipse': {
          const shape = el.type === 'ellipse' ? pptx.ShapeType.ellipse : el.radius ? pptx.ShapeType.roundRect : pptx.ShapeType.rect
          s.addShape(shape, {
            ...box,
            fill: el.fill ? { color: hex(el.fill), transparency: transparency(el.opacity) } : undefined,
            line: el.line
              ? { color: hex(el.line), width: el.lineWidth ?? 1, transparency: transparency(el.opacity) }
              : { type: 'none' },
            rectRadius: el.radius ? inch(el.radius) : undefined,
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
          const value = el.field ? (slide.content[el.field] ?? '') : (el.text ?? '')
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
  }

  const blob = (await pptx.write({ outputType: 'blob' })) as Blob
  downloadBlob(blob, `${safeFileName(deck.title)}.pptx`)
}
