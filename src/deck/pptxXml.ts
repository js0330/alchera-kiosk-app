// PPTX(OOXML) 읽기 공통 도우미. 좌표 단위는 EMU (1in = 914400).

export const EMU_ATTR = (el: Element | null | undefined, name: string) => Number(el?.getAttribute(name) ?? 0)
export const kids = (el: Element, name: string) => Array.from(el.children).filter((c) => c.tagName === name)
export const kid = (el: Element | null | undefined, name: string) => (el ? Array.from(el.children).find((c) => c.tagName === name) : undefined)
export const all = (el: Element | Document, name: string) => Array.from(el.getElementsByTagName(name))

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface Xform {
  ox: number
  oy: number
  sx: number
  sy: number
  cx: number
  cy: number
}

export const ident: Xform = { ox: 0, oy: 0, sx: 1, sy: 1, cx: 0, cy: 0 }

// 자리표시자 종류 정리: 제목류 → title, 본문류 → body
export function normPh(type: string | null): string {
  if (!type || type === 'obj' || type === 'body') return 'body'
  if (type === 'ctrTitle' || type === 'title') return 'title'
  return type
}

export function boxOf(spPr: Element | undefined, t: Xform): Box | null {
  return boxFromXfrm(kid(spPr, 'a:xfrm'), t)
}

export function boxFromXfrm(xfrm: Element | undefined, t: Xform): Box | null {
  const off = kid(xfrm, 'a:off')
  const ext = kid(xfrm, 'a:ext')
  if (!off || !ext) return null
  return {
    x: t.ox + (EMU_ATTR(off, 'x') - t.cx) * t.sx,
    y: t.oy + (EMU_ATTR(off, 'y') - t.cy) * t.sy,
    w: EMU_ATTR(ext, 'cx') * t.sx,
    h: EMU_ATTR(ext, 'cy') * t.sy,
  }
}

// 슬라이드 전체를 덮는 불투명한 도형·그림 아래(앞쪽)에 있는 요소는 화면에 보이지 않습니다.
// (예: 예전 버전 위에 흰 사각형을 덮고 새 버전을 다시 그린 장) 맨 위 덮개부터의 요소만 돌려줍니다.
export function visibleChildren(tree: Element, W: number, H: number): Element[] {
  const list = Array.from(tree.children)
  let start = 0
  list.forEach((el, i) => {
    if (coversSlide(el, W, H)) start = i
  })
  return list.slice(start)
}

function coversSlide(el: Element, W: number, H: number): boolean {
  if (el.tagName !== 'p:sp' && el.tagName !== 'p:pic') return false
  const spPr = kid(el, 'p:spPr')
  const xfrm = kid(spPr, 'a:xfrm')
  const off = kid(xfrm, 'a:off')
  const ext = kid(xfrm, 'a:ext')
  if (!off || !ext) return false
  const x = EMU_ATTR(off, 'x')
  const y = EMU_ATTR(off, 'y')
  const r = x + EMU_ATTR(ext, 'cx')
  const b = y + EMU_ATTR(ext, 'cy')
  if (x > W * 0.02 || y > H * 0.02 || r < W * 0.98 || b < H * 0.98) return false
  if (el.tagName === 'p:pic') return true
  const fill = kid(spPr, 'a:solidFill') ?? kid(spPr, 'a:blipFill')
  if (!fill) return false
  const alpha = all(fill, 'a:alpha')[0]
  return !alpha || EMU_ATTR(alpha, 'val') >= 100000
}
