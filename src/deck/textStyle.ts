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
}

// "**굵게**" 표기를 굵기 구간으로 나눕니다. 한 줄 단위로 사용합니다.
export function parseRich(line: string): Run[] {
  const runs: Run[] = []
  line.split(/(\*\*[^*]+\*\*)/g).forEach((part) => {
    if (!part) return
    const bold = part.startsWith('**') && part.endsWith('**') && part.length > 4
    runs.push({ text: bold ? part.slice(2, -2) : part, bold })
  })
  return runs
}

export const BULLET = '• '

// 빈 칸 안내 문구의 진하기. 키 네임은 원래 연한 회색(#9CA3AF)이라 흐리게 하지 않고 그 색 그대로 보여 줍니다.
export const phOpacity = (el: TextEl) => (el.field === 'crumb' ? 1 : 0.35)
