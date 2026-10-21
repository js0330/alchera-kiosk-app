import { BRAND, ptToPx } from './guide'
import { textInsets } from './shapes'
import { parseRich } from './textStyle'
import type { FreeObj } from './types'

// 글 맞춤: 가져오거나 붙여넣은 글이 상자보다 크면(원본 글꼴이 Noto Sans KR 보다 좁았던 경우 등)
// 상자 안에 들어갈 때까지 글자 크기를 조금씩 줄입니다. 화면(FreeLayer)과 같은 방식으로 재서 판단합니다.
// 원래 크기의 60% 아래로는 줄이지 않습니다.

const MIN_RATIO = 0.6
const r1 = (n: number) => Math.round(n * 10) / 10

function probeFor(o: FreeObj, size: number, width: number): HTMLDivElement {
  const div = document.createElement('div')
  Object.assign(div.style, {
    position: 'absolute',
    left: '-99999px',
    top: '0',
    visibility: 'hidden',
    width: `${width}px`,
    fontFamily: BRAND.font.web,
    fontSize: `${ptToPx(size)}px`,
    fontWeight: o.bold ? '700' : '400',
    lineHeight: String(o.lineHeight ?? 1.3),
    whiteSpace: 'pre-wrap',
    wordBreak: 'keep-all',
    overflowWrap: 'normal',
  })
  for (const line of (o.text ?? '').split('\n')) {
    const row = document.createElement('div')
    if (!line) row.textContent = ' '
    for (const run of parseRich(line)) {
      const el = document.createElement(run.bold ? 'b' : 'span')
      el.textContent = run.text
      row.appendChild(el)
    }
    div.appendChild(row)
  }
  return div
}

export async function fitTextToBoxes(objs: FreeObj[]): Promise<FreeObj[]> {
  if (typeof document === 'undefined') return objs
  // 글꼴은 쓰이는 글자 묶음별로 내려받으므로, 재기 전에 이 글들에 쓰인 글자의 본문 글꼴(보통·굵게)을 먼저 불러 둡니다
  const chars = [...new Set(objs.map((o) => o.text ?? '').join('').replace(/\s|\*/g, ''))].join('')
  try {
    if (chars) await Promise.all(['400', '700'].map((w) => document.fonts.load(`${w} 16px "Noto Sans KR"`, chars)))
  } catch {
    // 글꼴을 못 불러도 대체 글꼴로 잽니다
  }
  return objs.map((o) => {
    if (o.kind !== 'shape' || !o.text?.trim() || !o.size) return o
    const [pl, pt, pr, pb] = o.pad ?? [0, 0, 0, 0]
    const [il, it, ir, ib] = textInsets(o.geom, o.w, o.h)
    const w = o.w - pl - pr - il - ir
    const h = o.h - pt - pb - it - ib
    if (w < 4 || h < 4) return o
    let size = o.size
    const fits = (s: number) => {
      const div = probeFor(o, s, w)
      document.body.appendChild(div)
      const ok = div.scrollHeight <= h + 2 && div.scrollWidth <= w + 2
      div.remove()
      return ok
    }
    if (fits(size)) return o
    const min = o.size * MIN_RATIO
    while (size > min) {
      size = Math.max(min, size * 0.94)
      if (fits(size)) break
    }
    return { ...o, size: r1(size) }
  })
}
