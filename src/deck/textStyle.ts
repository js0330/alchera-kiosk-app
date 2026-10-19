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

export function listClass(el: TextEl) {
  return el.list === 'number' ? 'deck-list deck-num' : el.list === 'bullet' ? 'deck-list' : ''
}
