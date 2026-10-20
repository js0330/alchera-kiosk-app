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
