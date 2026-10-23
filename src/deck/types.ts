import type { Tone } from './guide'

export type LayoutId =
  | 'original'
  | 'cover'
  | 'cover-1'
  | 'line-box'
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
  | 'free'
  | 'free-section'
  | 'free-blank'
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
  // 자유 배치(원본 유지) 슬라이드의 도형·텍스트·이미지
  objects?: FreeObj[]
  // 원본 슬라이드의 배경 (색 또는 그림). 없으면 레이아웃 톤의 배경
  background?: { color?: string; image?: string }
}

// 자유 배치 요소. 좌표는 1280×720px, 글자 크기는 pt.
// PPTX 를 "원본 배치 유지"로 불러오면 원본의 도형·텍스트 상자·이미지·선·표가 이 형태로 들어옵니다.
export interface FreeObj {
  id: string
  kind: 'shape' | 'image' | 'line'
  x: number
  y: number
  w: number
  h: number
  rot?: number
  // shape — 도형 종류는 shapes.ts 의 SHAPES 참고 (PowerPoint 기본 도형 이름과 같음)
  geom?: Geom
  // 직접 그린 도형(자유형)의 윤곽 — SVG 경로, 상자 기준 0~1000 비율 좌표. 있으면 geom 대신 이 모양으로 그립니다
  path?: string
  fill?: string
  line?: string
  lineWidth?: number
  radius?: number
  opacity?: number
  // 가이드 패널 효과: 라인형 위쪽 파란 선(accent) · 타이틀형 본문 옅은 그림자(soft)
  shadow?: 'accent' | 'soft'
  // 잠금: 클릭·끌기·선택이 되지 않는 요소 (가이드 박스를 고정할 때)
  locked?: boolean
  // shape 안의 글 (줄바꿈 + **굵게**)
  text?: string
  size?: number
  color?: string
  bold?: boolean
  // 글 전체 밑줄 (일부만은 글 안에 __밑줄__)
  underline?: boolean
  // 글 전체 기울임 (일부만은 글 안에 ~~기울임~~)
  italic?: boolean
  align?: 'left' | 'center' | 'right'
  valign?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  // 안쪽 여백 [왼, 위, 오른, 아래] px
  pad?: [number, number, number, number]
  // image
  src?: string
  // 라이브러리 아이콘: 원본 아이콘 경로. 색을 바꾸면 src 를 그 색으로 다시 칠합니다.
  icon?: string
  // line — 점선 · 양 끝 화살표
  flipH?: boolean
  flipV?: boolean
  dash?: LineDash
  arrowStart?: LineEnd
  arrowEnd?: LineEnd
}

export type Geom =
  | 'rect'
  | 'roundRect'
  | 'round2SameRect'
  | 'ellipse'
  | 'triangle'
  | 'rtTriangle'
  | 'diamond'
  | 'parallelogram'
  | 'trapezoid'
  | 'hexagon'
  | 'octagon'
  | 'homePlate'
  | 'chevron'
  | 'plus'
  | 'star5'
  | 'wedgeRectCallout'
  | 'rightArrow'
  | 'leftArrow'
  | 'upArrow'
  | 'downArrow'
  | 'leftRightArrow'
  | 'upDownArrow'

export type LineDash = 'solid' | 'dash' | 'dot'
export type LineEnd = 'none' | 'triangle' | 'oval'

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
  // 칸이 비어 있을 때 대신 보여 주고 내보낼 글 (예: 키 네임 → 간지 제목)
  fallback?: string
}

export type SlideEl = ShapeEl | LineEl | ImageEl | TextEl
