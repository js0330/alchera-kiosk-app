import { BRAND, ptToPx } from './guide'
import { textInsets } from './shapes'
import { parseRich } from './textStyle'
import type { FreeObj } from './types'

// 글 맞춤: 가져오거나 붙여넣은 글이 상자보다 크면(원본 글꼴이 Noto Sans KR 보다 좁았던 경우 등)
// 상자 안에 들어갈 때까지 글자 크기를 조금씩 줄입니다. 화면(FreeLayer)과 같은 방식으로 재서 판단합니다.
// 글자 크기 비율이 원본과 같도록 먼저 모든 글을 같은 비율로 줄이고(최대 15%), 그래도 넘치는 상자만 더 줄입니다.
// 원래 크기의 60% 아래로는 줄이지 않습니다.

const MIN_RATIO = 0.6
const UNIFORM_MIN = 0.85
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
  // 상자마다 '이 크기면 들어가는가'를 잽니다
  const fitsAt = (o: FreeObj, s: number) => {
    const [pl, pt, pr, pb] = o.pad ?? [0, 0, 0, 0]
    const [il, it, ir, ib] = textInsets(o.geom, o.w, o.h)
    const w = o.w - pl - pr - il - ir
    const h = o.h - pt - pb - it - ib
    if (w < 4 || h < 4) return true
    const div = probeFor(o, s, w)
    document.body.appendChild(div)
    const ok = div.scrollHeight <= h + 2 && div.scrollWidth <= w + 2
    div.remove()
    return ok
  }
  // 들어가는 가장 큰 비율 (원래 크기 대비, 최소 60%)
  const neededRatio = (o: FreeObj) => {
    let k = 1
    while (k > MIN_RATIO && !fitsAt(o, o.size! * k)) k = Math.max(MIN_RATIO, k * 0.94)
    return k
  }
  const isText = (o: FreeObj) => o.kind === 'shape' && !!o.text?.trim() && !!o.size
  const ratios = new Map(objs.filter(isText).map((o) => [o.id, neededRatio(o)]))
  if (![...ratios.values()].some((k) => k < 1)) return objs
  // 원본처럼 글자 크기의 비율을 지키려고, 먼저 모든 글을 같은 비율로 줄입니다 (최대 15%까지).
  // 그래도 넘치는 상자만 따로 더 줄입니다.
  const uniform = Math.max(UNIFORM_MIN, Math.min(...ratios.values()))
  return objs.map((o) => {
    if (!isText(o)) return o
    return { ...o, size: r1(o.size! * Math.min(uniform, ratios.get(o.id) ?? 1)) }
  })
}
