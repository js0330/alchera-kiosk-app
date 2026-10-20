import { BRAND } from './guide'
import { FREE_AREA } from './layouts'
import { uid } from './kits'
import { textInsets } from './shapes'
import type { FreeObj, Geom, LineDash, LineEnd, TextEl } from './types'

const C = BRAND.colors

// 자유 배치에서 고를 수 있는 값은 가이드 안의 값으로만 제한합니다.
export const GUIDE_TEXT_SIZES = [16, 12, 10, 9, 8] as const
export const GUIDE_TEXT_COLORS = [C.navy, C.blue, C.gray, C.crumb, C.white] as const
export const GUIDE_FILLS = [C.white, C.imageFill, C.line, C.navy, C.blue] as const
export const GUIDE_LINES = [C.line, C.crumb, C.gray, C.blue, C.navy, C.white] as const
export const GUIDE_ICON_COLORS = [C.blue, C.navy, C.gray, C.crumb, C.white] as const

const DEFAULT_PAD: [number, number, number, number] = [12.8, 6.4, 12.8, 6.4]

export function newText(at?: Partial<FreeObj>): FreeObj {
  return {
    id: uid(),
    kind: 'shape',
    geom: 'rect',
    x: FREE_AREA.x + 40,
    y: FREE_AREA.y + 40,
    w: 420,
    h: 60,
    text: '텍스트를 입력하세요',
    size: 10,
    color: C.navy,
    align: 'left',
    valign: 'top',
    lineHeight: 1.3,
    pad: DEFAULT_PAD,
    ...at,
  }
}

export function newBox(at?: Partial<FreeObj>): FreeObj {
  return {
    id: uid(),
    kind: 'shape',
    geom: 'roundRect',
    x: FREE_AREA.x + 80,
    y: FREE_AREA.y + 80,
    w: 360,
    h: 200,
    fill: C.white,
    line: C.line,
    lineWidth: 0.75,
    radius: 12,
    text: '',
    size: 10,
    color: C.navy,
    align: 'left',
    valign: 'top',
    lineHeight: 1.3,
    pad: [20, 16, 20, 16],
    ...at,
  }
}

// 도형 메뉴에서 고른 도형. 화살표 도형은 가로로 긴 기본 크기, 나머지는 정사각형에 가깝게.
export function newShape(geom: Geom): FreeObj {
  const wide = /Arrow|homePlate|chevron|parallelogram|trapezoid|round2SameRect|wedgeRectCallout/.test(geom) && !/^(up|down|upDown)Arrow$/.test(geom)
  const tall = /^(up|down|upDown)Arrow$/.test(geom)
  const w = wide ? 220 : tall ? 100 : 160
  const h = wide ? 100 : tall ? 200 : 160
  return newBox({
    geom,
    w,
    h,
    x: FREE_AREA.x + (FREE_AREA.w - w) / 2,
    y: FREE_AREA.y + (FREE_AREA.h - h) / 2,
    fill: C.blue,
    line: undefined,
    color: C.white,
    align: 'center',
    valign: 'middle',
    pad: [12, 8, 12, 8],
    radius: geom === 'roundRect' ? 16 : undefined,
  })
}

export interface LineKind {
  id: string
  label: string
  dash?: LineDash
  arrowStart?: LineEnd
  arrowEnd?: LineEnd
}

export const LINE_KINDS: LineKind[] = [
  { id: 'line', label: '선' },
  { id: 'arrow', label: '화살표', arrowEnd: 'triangle' },
  { id: 'double', label: '양쪽 화살표', arrowStart: 'triangle', arrowEnd: 'triangle' },
  { id: 'dash', label: '점선', dash: 'dash' },
  { id: 'dash-arrow', label: '점선 화살표', dash: 'dash', arrowEnd: 'triangle' },
  { id: 'dot-end', label: '끝점 원', arrowStart: 'oval', arrowEnd: 'oval' },
]

export function newLine(kind: LineKind): FreeObj {
  return {
    id: uid(),
    kind: 'line',
    x: FREE_AREA.x + FREE_AREA.w / 2 - 150,
    y: FREE_AREA.y + FREE_AREA.h / 2,
    w: 300,
    h: 0,
    line: C.navy,
    lineWidth: 1.5,
    dash: kind.dash,
    arrowStart: kind.arrowStart,
    arrowEnd: kind.arrowEnd,
  }
}

export function newImage(src: string, naturalW: number, naturalH: number): FreeObj {
  const w = Math.min(520, FREE_AREA.w - 80)
  const h = Math.min((w * naturalH) / naturalW, FREE_AREA.h - 80)
  return { id: uid(), kind: 'image', x: FREE_AREA.x + 60, y: FREE_AREA.y + 50, w: (h * naturalW) / naturalH, h, src }
}

// 레이아웃 미리보기용 예시
export const DEMO_OBJECTS: FreeObj[] = [
  newBox({ id: 'demo-1', x: 50, y: 164, w: 570, h: 300, text: '**원본 도형과 텍스트**\n• 위치·크기를 끌어서 조정\n• 더블클릭해서 글 수정', pad: [24, 22, 24, 22] }),
  newBox({ id: 'demo-2', x: 650, y: 164, w: 579, h: 300, fill: C.imageFill, line: undefined, text: '이미지 · 표 · 도형', align: 'center', valign: 'middle', color: C.gray }),
  newText({ id: 'demo-3', x: 50, y: 490, w: 1179, h: 40, text: '※ "가이드 서식 맞추기"로 글자 크기·색을 가이드 값에 맞출 수 있어요', size: 8, color: C.gray }),
]

// ── 가이드 서식 맞추기 ─────────────────────────────────────────

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
const dist = (a: string, b: string) => {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  return (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
}
export const nearest = <T extends string>(hex: string, palette: readonly T[]): T => palette.reduce((best, c) => (dist(hex, c) < dist(hex, best) ? c : best), palette[0])
const nearestSize = (pt: number) => GUIDE_TEXT_SIZES.reduce((best, s) => (Math.abs(s - pt) < Math.abs(best - pt) ? s : best), GUIDE_TEXT_SIZES[0] as number)

const lightness = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  return { l, s }
}

// 배경색: 채도 있는 강조색 → 알체라 블루, 아주 어두우면 네이비, 밝으면 흰색·패널색, 회색은 가까운 회색으로
function guideFill(hex: string) {
  const { l, s } = lightness(hex)
  if (l > 0.93) return C.white
  if (l > 0.82) return C.imageFill
  if (l < 0.22) return C.navy
  if (s > 0.3) return C.blue
  return l > 0.6 ? C.line : C.navy
}

// 밝은 배경 위 글자색: 밝은 글자는 읽히도록 네이비로, 채도 있는 강조색은 블루로, 나머지는 네이비·그레이 중 가까운 색
function guideTextColor(hex: string) {
  const { l, s } = lightness(hex)
  if (l > 0.7) return C.navy
  if (s > 0.3 && l > 0.25) return C.blue
  return nearest(hex, [C.navy, C.gray] as const)
}

// 글자 크기는 가이드 단계(16/12/10/9/8pt)로, 색은 가이드 팔레트의 같은 역할 색으로 바꿉니다.
// 배경이 어두운 칸의 글은 흰색을 유지합니다. 이미지·위치는 그대로 둡니다.
export function snapToGuide(obj: FreeObj): FreeObj {
  if (obj.kind === 'image') return obj
  if (obj.kind === 'line') return { ...obj, line: obj.line ? nearest(obj.line, GUIDE_LINES) : obj.line, lineWidth: Math.min(obj.lineWidth ?? 0.75, 1.5) }
  const fill = obj.fill ? guideFill(obj.fill) : undefined
  const darkBg = fill === C.navy || fill === C.blue
  return {
    ...obj,
    fill,
    line: obj.line ? nearest(obj.line, GUIDE_LINES) : undefined,
    lineWidth: obj.line ? 0.75 : undefined,
    size: obj.text ? nearestSize(obj.size ?? 10) : obj.size,
    color: obj.text ? (darkBg ? C.white : guideTextColor(obj.color ?? C.navy)) : obj.color,
    lineHeight: obj.text ? 1.3 : obj.lineHeight,
  }
}

// 자유 배치 요소의 글을 편집기(EditableText)에 넘길 텍스트 요소로 바꿉니다. 좌표는 요소 안쪽 기준.
export function objTextEl(o: FreeObj): TextEl {
  const [pl, pt, pr, pb] = o.pad ?? [0, 0, 0, 0]
  const [il, it, ir, ib] = textInsets(o.geom, o.w, o.h)
  const [l, t, r, b] = [pl + il, pt + it, pr + ir, pb + ib]
  return {
    type: 'text',
    field: o.id,
    x: l,
    y: t,
    w: Math.max(10, o.w - l - r),
    h: Math.max(10, o.h - t - b),
    size: o.size ?? 10,
    bold: o.bold,
    color: o.color ?? BRAND.colors.navy,
    align: o.align,
    lineHeight: o.lineHeight ?? 1.3,
    multiline: true,
    rich: true,
    placeholder: '텍스트 입력',
  }
}
