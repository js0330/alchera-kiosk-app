import type { Tone } from './guide'

export type LayoutId =
  | 'cover'
  | 'contents'
  | 'section'
  | 'line-1'
  | 'line-text'
  | 'line-2'
  | 'line-2t'
  | 'line-3'
  | 'line-grid'
  | 'header-1'
  | 'header-2'
  | 'header-3'
  | 'closing'

export type FieldKind = 'text' | 'multiline' | 'bullets' | 'numbers' | 'image'

export interface FieldDef {
  key: string
  label: string
  kind: FieldKind
  placeholder: string
  max?: number
}

export interface Slide {
  id: string
  layout: LayoutId
  tone: Tone
  content: Record<string, string>
  notes: string
}

export interface Deck {
  id: string
  title: string
  slides: Slide[]
  createdAt: number
  updatedAt: number
}

// 슬라이드를 구성하는 요소. 좌표는 1280×720px, 글자 크기는 pt.
// 화면 렌더러와 PPTX 내보내기가 같은 요소 목록을 그리므로 결과가 일치합니다.
interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface ShapeEl extends Box {
  type: 'rect' | 'ellipse'
  fill?: string
  line?: string
  lineWidth?: number
  opacity?: number
  radius?: number
  // 둥근 모서리를 위쪽에만 (타이틀형 헤더 바)
  topOnly?: boolean
  // accent: 라인형 패널 위쪽의 파란 선(가이드의 위쪽 그림자) · soft: 타이틀형 본문의 옅은 그림자
  shadow?: 'accent' | 'soft'
}

export interface LineEl extends Box {
  type: 'line'
  color: string
  width: number
}

export interface ImageEl extends Box {
  type: 'image'
  field?: string
  logo?: 'white' | 'navy'
  fill: string
  muted: string
  radius?: number
}

export interface TextEl extends Box {
  type: 'text'
  field?: string
  text?: string
  size: number
  bold?: boolean
  color: string
  align?: 'left' | 'center' | 'right'
  lineHeight?: number
  paraSpace?: number
  letterSpacing?: number
  list?: 'bullet' | 'number'
  multiline?: boolean
  // **굵게** 표기를 허용하는 칸 (가이드: 강조는 Bold)
  rich?: boolean
  placeholder?: string
}

export type SlideEl = ShapeEl | LineEl | ImageEl | TextEl
