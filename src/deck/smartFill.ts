import { BRAND, ptToPx } from './guide'
import { NO_PAD, card, icon, line, pill, shape, text } from './library'
import type { FreeObj } from './types'

// 내용으로 요소 찾기: 붙여넣은 글의 생김새(항목 수 · 숫자 · 시점 · 순서 · 질문 · 전/후)를 보고
// 요소 라이브러리의 구성 중 맞는 것을 골라, 글을 그대로 칸에 채워 후보로 보여 줍니다.
// 글은 바꾸지 않습니다. 줄 앞의 글머리(-, •, 1.)와 '제목 - 설명' 사이 구분 기호만 칸을 나누는 데 쓰고 뺍니다.

const C = BRAND.colors

export interface Area {
  x: number
  y: number
  w: number
  h: number
}

export interface Item {
  title: string
  desc: string
}

export interface Parsed {
  items: Item[]
  // 순서가 있는 내용 (→ 로 이어지거나 1. 2. 3. / STEP / 단계로 시작)
  flow: boolean
  compare?: { before: { label: string; items: string[] }; after: { label: string; items: string[] } }
}

export interface Suggestion {
  id: string
  label: string
  reason: string
  objs: FreeObj[]
  warn?: string
}

// ── 글 읽기 ─────────────────────────────────────────────────────

// 글머리: 기호('- ', •) · 번호(1. 1) 뒤에 띄어쓰기) · 원 숫자. 5.1억 의 '5.' 나 **굵게** 의 '*' 는 건드리지 않습니다
const BULLET = /^\s*(?:-\s+|[•·▪●○◦]\s*|\*(?!\*)\s*|\d{1,2}[.)]\s+|[①-⑩]\s*)/
const NUMBERED = /^\s*(?:\d{1,2}[.)]\s|[①-⑩]|step\s*\d+|phase\s*\d+|\d+\s*단계)/i
const SPLIT = /\s+[-–—]\s+|\s*[:：]\s+|\s*\|\s*/
const ARROW = /\s*(?:→|->|=>|⇒|▶|>)\s*/
const BEFORE = /^(도입\s*전|기존(\s*방식)?|before|as[-\s]?is|현재|문제(점)?)\s*[:：]?$/i
const AFTER = /^(도입\s*후|개선(\s*후)?|after|to[-\s]?be|도입\s*효과|변화|해결(\s*방향)?)\s*[:：]?$/i

const strip = (l: string) => l.replace(BULLET, '').trim()

function splitItem(l: string): Item {
  const m = SPLIT.exec(l)
  if (m && m.index > 0) return { title: l.slice(0, m.index).trim(), desc: l.slice(m.index + m[0].length).trim() }
  return { title: l, desc: '' }
}

export function parseContent(raw: string): Parsed {
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const flow = lines.some((l) => NUMBERED.test(l))

  // 도입 전 / 도입 후 처럼 머리줄로 나뉜 비교
  const bi = lines.findIndex((l) => BEFORE.test(l))
  const ai = lines.findIndex((l) => AFTER.test(l))
  if (bi >= 0 && ai > bi + 1 && ai < lines.length - 1) {
    const label = (l: string) => l.replace(/\s*[:：]$/, '')
    return {
      items: [],
      flow: false,
      compare: {
        before: { label: label(lines[bi]), items: lines.slice(bi + 1, ai).map(strip) },
        after: { label: label(lines[ai]), items: lines.slice(ai + 1).map(strip) },
      },
    }
  }

  // 한 줄을 → 로 이은 흐름
  if (lines.length === 1 && ARROW.test(lines[0])) {
    const parts = lines[0].split(ARROW).map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) return { items: parts.map((title) => ({ title, desc: '' })), flow: true }
  }

  // 빈 줄로 나뉜 문단: 첫 줄은 제목, 나머지는 설명
  const groups = raw
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((g) =>
      g
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    )
    .filter((g) => g.length)
  if (groups.length >= 2 && groups.some((g) => g.length >= 2)) {
    return { items: groups.map((g) => ({ title: strip(g[0]), desc: g.slice(1).map(strip).join('\n') })), flow }
  }

  // 한 줄에 한 항목 ('제목 - 설명' · '제목: 설명' 이면 나눔)
  return { items: lines.map((l) => splitItem(strip(l))), flow }
}

// 숫자 + 단위로 시작하는 제목 (2020년 · 5.1억+ · 380+명 · 70%)
const NUM = /^(\d[\d,.]*\s*\+?\s*(?:%|배|년|억|만|천|조|명|개소|개국|개|건|곳|대|TB|GB|PB|[xX]|분|초|시간|일|원)?\+?)(?=\s|$)/
// 시점으로 시작하는 제목 (2020년 · 2024.03 · 3월 · 2분기 · Q1 · STEP 1)
const TIME = /^(\d{4}\s*(년|\.\s*\d{1,2}\.?)?|\d{1,2}\s*월|[1-4]\s*분기|Q[1-4]|\d{1,2}\s*(주|개월)\s*차?|step\s*\d+|phase\s*\d+|\d+\s*단계|[1-9]\s*차)(?=\s|$|[.:)])/i

interface Stat {
  num: string
  label: string
  desc: string
}

function statOf(it: Item): Stat | null {
  const m = NUM.exec(it.title)
  if (!m) return null
  const rest = it.title.slice(m[0].length).trim()
  if (rest) return { num: m[1].trim(), label: rest, desc: it.desc }
  if (!it.desc) return null
  const [label, ...more] = it.desc.split('\n')
  return { num: m[1].trim(), label, desc: more.join('\n') }
}

// ── 글 높이 어림 ────────────────────────────────────────────────

const charW = (ch: string, pt: number) => ptToPx(pt) * (/[\x20-\x7e]/.test(ch) ? 0.56 : 1)

function lineCount(s: string, pt: number, w: number) {
  return s
    .replace(/\*\*/g, '')
    .split('\n')
    .reduce((n, l) => n + Math.max(1, Math.ceil([...l].reduce((a, c) => a + charW(c, pt), 0) / Math.max(1, w))), 0)
}

const textH = (s: string, pt: number, w: number) => (s ? Math.ceil(lineCount(s, pt, w) * ptToPx(pt) * 1.3) + 2 : 0)

// 글 상자 (내용이 없으면 넣지 않음)
const tx = (x: number, y: number, w: number, value: string, pt: number, o: Parameters<typeof text>[5] = {}) =>
  value ? [text(x, y, w, textH(value, pt, w), value, { size: pt, ...o })] : []

// ── 구성 만들기 (항목 수에 맞춰 영역 너비를 나눠 씀) ──────────────────

const ICON_CYCLE = ['checkbox', 'gauge', 'frames', 'storage', 'sync', 'shield-check']

function stepBadges(items: Item[], a: Area): FreeObj[] {
  const n = items.length
  const cw = a.w / n
  return items.flatMap((it, i) => {
    const x = a.x + i * cw
    const w = cw - 20
    const th = textH(it.title, 10, w)
    return [
      shape(x + cw / 2 - 14, a.y, 28, 28, { geom: 'ellipse', fill: C.blue, text: String(i + 1), size: 10, bold: true, color: C.white, pad: NO_PAD }),
      ...tx(x + 10, a.y + 40, w, it.title, 10, { bold: true, align: 'center' }),
      ...tx(x + 10, a.y + 44 + th, w, it.desc, 9, { color: C.gray, align: 'center' }),
      ...(i < n - 1 ? [line(x + cw / 2 + 24, a.y + 14, x + cw * 1.5 - 24, a.y + 14, { color: C.line })] : []),
    ]
  })
}

function iconProcess(items: Item[], a: Area): FreeObj[] {
  const n = items.length
  const cw = a.w / n
  return items.flatMap((it, i) => {
    const x = a.x + i * cw
    const w = cw - 24
    const th = textH(it.title, 10, w)
    return [
      shape(x + cw / 2 - 35, a.y, 70, 70, { geom: 'ellipse', fill: C.imageFill }),
      icon(ICON_CYCLE[i % ICON_CYCLE.length], x + cw / 2 - 18, a.y + 17, 36),
      ...tx(x + 12, a.y + 84, w, it.title, 10, { bold: true, align: 'center' }),
      ...tx(x + 12, a.y + 88 + th, w, it.desc, 9, { color: C.gray, align: 'center' }),
      ...(i < n - 1 ? [line(x + cw / 2 + 48, a.y + 35, x + cw * 1.5 - 48, a.y + 35, { color: C.crumb, end: true })] : []),
    ]
  })
}

function statCards(stats: Stat[], a: Area): FreeObj[] {
  const n = stats.length
  const gap = 20
  const cw = Math.min(380, (a.w - gap * (n - 1)) / n)
  const left = a.x + (a.w - (cw * n + gap * (n - 1))) / 2
  const w = cw - 40
  const hs = stats.map((s) => 18 + textH(s.num, 16, w) + 6 + textH(s.label, 10, w) + (s.desc ? 6 + textH(s.desc, 9, w) : 0) + 20)
  const h = Math.max(...hs)
  return stats.flatMap((s, i) => {
    const x = left + i * (cw + gap)
    const nh = textH(s.num, 16, w)
    const lh = textH(s.label, 10, w)
    return [
      card(x, a.y, cw, h),
      ...tx(x + 20, a.y + 18, w, s.num, 16, { bold: true, color: C.blue, align: 'center' }),
      ...tx(x + 20, a.y + 24 + nh, w, s.label, 10, { bold: true, align: 'center' }),
      ...tx(x + 20, a.y + 30 + nh + lh, w, s.desc, 9, { color: C.gray, align: 'center' }),
    ]
  })
}

function navyHighlight(s: Stat, a: Area): FreeObj[] {
  const w = 300
  const inner = w - 40
  const lh = textH(s.label, 10, inner)
  const dh = textH(s.desc, 9, inner)
  const h = 30 + textH(s.num, 16, inner) + 8 + lh + (dh ? 6 + dh : 0) + 26
  const nh = textH(s.num, 16, inner)
  return [
    shape(a.x, a.y, w, h, { geom: 'roundRect', fill: C.navy, radius: 12 }),
    ...tx(a.x + 20, a.y + 30, inner, s.num, 16, { bold: true, color: C.white, align: 'center' }),
    ...tx(a.x + 20, a.y + 38 + nh, inner, s.label, 10, { bold: true, color: C.white, align: 'center' }),
    ...tx(a.x + 20, a.y + 44 + nh + lh, inner, s.desc, 9, { color: C.white, align: 'center' }),
  ]
}

function numberedCards(items: Item[], a: Area): FreeObj[] {
  const n = items.length
  const gap = 20
  const cw = (a.w - gap * (n - 1)) / n
  const w = cw - 48
  const h = Math.max(...items.map((it) => 20 + 40 + textH(it.title, 12, w) + (it.desc ? 10 + textH(it.desc, 9, w) : 0) + 24))
  return items.flatMap((it, i) => {
    const x = a.x + i * (cw + gap)
    const th = textH(it.title, 12, w)
    return [
      card(x, a.y, cw, h),
      ...tx(x + 24, a.y + 20, w, String(i + 1).padStart(2, '0'), 16, { bold: true, color: C.blue }),
      ...tx(x + 24, a.y + 60, w, it.title, 12, { bold: true }),
      ...tx(x + 24, a.y + 70 + th, w, it.desc, 9, { color: C.gray }),
    ]
  })
}

function chevronFlow(items: Item[], a: Area): FreeObj[] {
  const n = items.length
  const step = (a.w - 12) / n
  const sw = step + 12
  const h = Math.max(52, ...items.map((it) => textH(it.title, 10, sw - 48) + 18))
  return items.flatMap((it, i) => {
    const x = a.x + i * step
    return [
      shape(x, a.y, sw, h, {
        geom: i === 0 ? 'homePlate' : 'chevron',
        fill: i === n - 1 ? C.navy : C.blue,
        text: it.title,
        size: 10,
        bold: true,
        color: C.white,
        pad: i === 0 ? [16, 0, 16, 0] : [24, 0, 16, 0],
      }),
      ...tx(x + 16, a.y + h + 14, sw - 32, it.desc, 9, { color: C.gray, align: 'center' }),
    ]
  })
}

function timeline(items: Item[], a: Area, timed: boolean): FreeObj[] {
  const n = items.length
  const cw = a.w / n
  const first = a.x + cw / 2
  return [
    line(first, a.y + 40, first + cw * (n - 1), a.y + 40, { color: C.line, width: 1.5 }),
    ...items.flatMap((it, i) => {
      const cx = first + i * cw
      const w = cw - 20
      // 시점이 있으면 점 위에 시점, 아래에 설명의 첫 줄을 굵게
      const top = timed ? it.title : `STEP ${String(i + 1).padStart(2, '0')}`
      const [head, ...rest] = timed ? it.desc.split('\n') : [it.title, it.desc]
      const body = rest.join('\n')
      const hh = textH(head ?? '', 10, w)
      return [
        ...tx(cx - w / 2, a.y + 4, w, top, 9, { bold: true, color: C.blue, align: 'center' }),
        shape(cx - 9, a.y + 31, 18, 18, { geom: 'ellipse', fill: i === n - 1 ? C.blue : C.white, line: C.blue, pad: NO_PAD }),
        ...tx(cx - w / 2, a.y + 62, w, head ?? '', 10, { bold: true, align: 'center' }),
        ...tx(cx - w / 2, a.y + 66 + hh, w, body, 9, { color: C.gray, align: 'center' }),
      ]
    }),
  ]
}

function checkList(items: Item[], a: Area): FreeObj[] {
  const w = a.w - 40
  let y = a.y
  return items.flatMap((it) => {
    const value = it.desc ? `**${it.title}** — ${it.desc.replace(/\n/g, ' ')}` : it.title
    const h = Math.max(24, textH(value, 10, w))
    const out = [icon('checkbox', a.x, y, 24), text(a.x + 36, y + 2, w, h, value, { size: 10 })]
    y += h + 16
    return out
  })
}

// 라벨 칩 너비: 글자 수에 맞춰 (최소 110)
const pillW = (label: string) => Math.max(110, Math.ceil([...label].reduce((s, ch) => s + charW(ch, 9), 0)) + 30)

function beforeAfter(c: NonNullable<Parsed['compare']>, a: Area): FreeObj[] {
  const cw = (a.w - 130) / 2
  const w = cw - 48
  const body = (list: string[]) => list.map((l) => `• ${l}`).join('\n')
  const bb = body(c.before.items)
  const ab = body(c.after.items)
  const h = Math.max(textH(bb, 10, w), textH(ab, 10, w)) + 90
  const rx = a.x + cw + 130
  return [
    card(a.x, a.y, cw, h),
    pill(a.x + 24, a.y + 22, pillW(c.before.label), c.before.label, C.gray),
    text(a.x + 24, a.y + 66, w, textH(bb, 10, w), bb, { size: 10 }),
    shape(a.x + cw + 30, a.y + h / 2 - 25, 70, 50, { geom: 'rightArrow', fill: C.blue }),
    shape(rx, a.y, cw, h, { geom: 'roundRect', fill: C.white, line: C.blue, radius: 12 }),
    pill(rx + 24, a.y + 22, pillW(c.after.label), c.after.label),
    text(rx + 24, a.y + 66, w, textH(ab, 10, w), ab, { size: 10 }),
  ]
}

function bottomBar(value: string, a: Area): FreeObj[] {
  const h = Math.max(44, textH(value, 10, a.w - 40) + 20)
  return [shape(a.x, a.y + a.h - h, a.w, h, { geom: 'roundRect', fill: C.navy, radius: 8, text: value, size: 10, color: C.white, pad: [20, 6, 20, 6] })]
}

// ── 후보 고르기 ─────────────────────────────────────────────────

const bottomOf = (objs: FreeObj[]) => Math.max(...objs.map((o) => o.y + o.h)) - Math.min(...objs.map((o) => o.y))

export function suggest(raw: string, a: Area): Suggestion[] {
  if (!raw.trim()) return []
  const p = parseContent(raw)
  const out: (Suggestion & { score: number })[] = []
  const add = (id: string, label: string, reason: string, score: number, objs: FreeObj[]) => {
    if (!objs.length) return
    const tall = bottomOf(objs) > a.h
    out.push({ id, label, reason, objs, score: tall ? score - 30 : score, warn: tall ? '글이 길어서 넣으면 칸이 작아져요. 글을 줄이거나 다른 구성을 골라 보세요.' : undefined })
  }

  if (p.compare) {
    add('before-after', '도입 전 → 후', `‘${p.compare.before.label}’과 ‘${p.compare.after.label}’을 나란히 비교해요`, 100, beforeAfter(p.compare, a))
    return out
  }

  const items = p.items
  const n = items.length
  const hasDesc = items.some((it) => it.desc)
  const stats = items.map(statOf)
  const allStat = stats.every(Boolean)
  const allTime = n >= 2 && items.every((it) => TIME.test(it.title))
  const questions = items.every((it) => /[?？]$/.test(it.title))
  const short = items.every((it) => [...it.title].length <= 14)
  const count = `항목 ${n}개`

  if (n === 1) {
    if (allStat) add('navy-highlight', '강조 카드 (네이비)', '숫자 하나를 크게 강조해요', 90, navyHighlight(stats[0]!, a))
    if (!hasDesc) add('bottom-bar', '하단 결론 바', '한 문장 결론을 슬라이드 아래에 둬요', 70, bottomBar(items[0].title, a))
    add('check-list', '체크 리스트', '한 줄 핵심 내용', 40, checkList(items, a))
    return out.sort((x, y) => y.score - x.score)
  }

  if (allStat && n <= 4) add('stat-cards', `숫자 카드 ${n}개`, '숫자로 시작하는 항목이에요', allTime ? 80 : 95, statCards(stats as Stat[], a))
  if (n <= 6) add('timeline', '타임라인', allTime ? '연도·시점 순서예요' : p.flow ? '순서가 있는 흐름이에요' : count, allTime ? 92 : p.flow ? 70 : 35, timeline(items, a, allTime))
  if (n <= 4) add('numbered-cards', `번호 카드 ${n}개`, questions ? '질문형 항목이에요' : hasDesc ? '제목과 설명이 있는 항목이에요' : count, questions ? 90 : hasDesc ? 62 : 40, numberedCards(items, a))
  if (n <= 5) add('step-badges', '번호 단계', p.flow ? '순서가 있는 흐름이에요' : count, p.flow ? 82 : 55, stepBadges(items, a))
  if (n <= 6 && short) add('chevron-flow', '갈매기형 흐름', p.flow ? '짧은 단계가 이어져요' : '짧은 항목이 이어져요', p.flow ? 78 : hasDesc ? 40 : 52, chevronFlow(items, a))
  if (n <= 5) add('icon-process', '아이콘 프로세스', hasDesc ? '단계마다 설명이 있어요' : count, p.flow ? 75 : hasDesc ? 58 : 45, iconProcess(items, a))
  add('check-list', '체크 리스트', n >= 5 ? '항목이 많아요' : '핵심 내용을 줄줄이', n >= 5 ? 85 : 50, checkList(items, a))

  return out.sort((x, y) => y.score - x.score).slice(0, 4)
}

export const SMART_EXAMPLES = [
  '2020년 KOSDAQ 상장 - 독보적 기술력 및 재무 안정성 인정\n5.1억+ 전 세계 AI 사용자 - 국내외 B2C, B2B, B2G 포함\n380+명 AI 전문 인력 - 글로벌 지사 운영',
  '1. 요구사항 분석 - 고객이 원하는 데이터 정의\n2. 수집 설계 - 촬영 환경과 시나리오 설계\n3. 수집 운영 - 현장 수집과 품질 관리\n4. 검수·납품 - 기준에 맞춰 검수 후 납품',
  '도입 전\n개별 수치만 보고 판단\n영상과 센서 정보가 따로 관리됨\n문제가 생긴 뒤에 대응\n도입 후\n영상·센서를 한 화면에서 통합 분석\n위험을 미리 예측해 알림\n현장 대응 시간 단축',
]
