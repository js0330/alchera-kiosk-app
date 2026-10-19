import type { Tone } from './guide'

export type LayoutId =
  | 'cover'
  | 'agenda'
  | 'section'
  | 'statement'
  | 'title-body'
  | 'two-column'
  | 'three-cards'
  | 'kpi'
  | 'image-text'
  | 'timeline'
  | 'quote'
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
  footer: string
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
  placeholder?: string
}

export type SlideEl = ShapeEl | LineEl | ImageEl | TextEl
