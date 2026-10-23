import type { CSSProperties } from 'react'
import { ptToPx } from './guide'
import type { TextEl } from './types'

// 텍스트 요소의 pt 기반 서식을 화면용 CSS 로 옮깁니다.
export function textStyle(el: TextEl): CSSProperties {
  return {
    fontSize: ptToPx(el.size),
    fontWeight: el.bold ? 700 : 400,
    color: el.color,
    textAlign: el.align ?? 'left',
    lineHeight: el.lineHeight ?? 1.2,
    letterSpacing: el.letterSpacing ? ptToPx(el.letterSpacing) : undefined,
    whiteSpace: 'pre-wrap',
    wordBreak: 'keep-all',
    overflowWrap: 'anywhere',
  }
}

// 목차 항목만 PPT 자동 번호를 씁니다. 본문 글머리(•)는 가이드대로 텍스트입니다.
export function listClass(el: TextEl) {
  return el.list === 'number' ? 'deck-list deck-num' : ''
}

export interface Run {
  text: string
  bold: boolean
  underline?: boolean
  italic?: boolean
  color?: string
  // 글 상자 글자 크기 대비 배율 (예: 2.5 = 2.5배). 상자 크기를 바꾸면 함께 커지고 작아집니다
  scale?: number
}

// 글 일부의 서식 표기 (한 줄 단위):
//   **굵게**   __밑줄__   ~~기울임~~   {{#E53935:색}}   {{x2.5:크게}}   — 서로 겹쳐 쓸 수 있습니다 (예: {{#E53935:**굵은 빨강**}})
// 표기를 구간(run)으로 나눕니다.
const TOKEN = /(\*\*|__|~~|\{\{#[0-9A-Fa-f]{6}:|\{\{x\d+(?:\.\d+)?:|\}\})/
export function parseRich(line: string): Run[] {
  const runs: Run[] = []
  let bold = false
  let underline = false
  let italic = false
  // 색·배율은 }} 로 닫으므로 연 순서대로 쌓아 둡니다
  const open: { color?: string; scale?: number }[] = []
  for (const part of line.split(TOKEN)) {
    if (!part) continue
    if (part === '**') bold = !bold
    else if (part === '__') underline = !underline
    else if (part === '~~') italic = !italic
    else if (part.startsWith('{{#')) open.push({ color: part.slice(2, 9).toUpperCase() })
    else if (part.startsWith('{{x')) open.push({ scale: Number(part.slice(3, -1)) })
    else if (part === '}}' && open.length) open.pop()
    else {
      const run: Run = { text: part, bold }
      if (underline) run.underline = true
      if (italic) run.italic = true
      const color = open.findLast((o) => o.color)?.color
      const scale = open.findLast((o) => o.scale)?.scale
      if (color) run.color = color
      if (scale && scale !== 1) run.scale = scale
      runs.push(run)
    }
  }
  return runs
}

// 구간 하나의 화면 서식
export const runStyle = (r: Run): CSSProperties => ({
  fontWeight: r.bold ? 700 : undefined,
  textDecoration: r.underline ? 'underline' : undefined,
  fontStyle: r.italic ? 'italic' : undefined,
  color: r.color,
  fontSize: r.scale ? `${r.scale}em` : undefined,
})

// 표기 없이 글자만
export const plainText = (s: string) => parseRich(s).map((r) => r.text).join('')

export const BULLET = '• '

// 빈 칸 안내 문구의 진하기. 키 네임은 원래 연한 회색(#9CA3AF)이라 흐리게 하지 않고 그 색 그대로 보여 줍니다.
export const phOpacity = (el: TextEl) => (el.field === 'crumb' ? 1 : 0.35)
