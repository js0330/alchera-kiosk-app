import { BRAND } from './guide'
import { LAYOUT_MAP } from './layouts'
import type { Deck, LayoutId, Slide } from './types'

interface KitSlide {
  layout: LayoutId
  content?: Record<string, string>
  notes?: string
}

export interface Kit {
  id: string
  name: string
  description: string
  slides: KitSlide[]
}

const contact = { title: '감사합니다.', contact: BRAND.contact }

// 시작 키트: 표지 → 목차 → 본문(라인형 1단 박스) → 마무리. 표지 제목 줄 수에 따라 두 가지.
// 본문 박스 안은 요소 라이브러리(가이드 박스·블록·아이콘)와 텍스트·이미지로 자유롭게 채웁니다.
const solution = (cover: LayoutId): KitSlide[] => [
  { layout: cover, notes: '고객사 이름과 미팅 목적을 먼저 말합니다.' },
  { layout: 'contents', content: { title: 'CONTENTS', items: '회사 소개\n문제 제기\n제품 소개\n작동 원리\n도입 효과' } },
  { layout: 'line-box' },
  { layout: 'closing', content: contact },
]

export const KITS: Kit[] = [
  { id: 'solution-1', name: '솔루션 소개서 (제목 1줄)', description: '표지 제목이 한 줄일 때. 표지 → 목차 → 본문(라인형 1단) → 마무리', slides: solution('cover-1') },
  { id: 'solution-2', name: '솔루션 소개서 (제목 2줄)', description: '표지 제목이 두 줄일 때. 표지 → 목차 → 본문(라인형 1단) → 마무리', slides: solution('cover') },
  {
    id: 'blank',
    name: '빈 문서',
    description: '표지 한 장에서 자유롭게 시작',
    slides: [{ layout: 'cover' }],
  },
]

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function makeSlide(layout: LayoutId, content: Record<string, string> = {}, notes = ''): Slide {
  return { id: uid(), layout, tone: LAYOUT_MAP[layout].tone, content: { ...content }, notes }
}

export function createDeckFromKit(kit: Kit, title?: string): Deck {
  const now = Date.now()
  return {
    id: uid(),
    title: title ?? (kit.id === 'blank' ? '제목 없는 문서' : `${kit.name} 초안`),
    slides: kit.slides.map((s) => makeSlide(s.layout, s.content, s.notes)),
    createdAt: now,
    updatedAt: now,
  }
}

// 레이아웃 갤러리에서 "이 레이아웃으로 시작"할 때: 표지 + 선택한 레이아웃(예시 내용 포함)
export function createDeckFromLayout(layout: LayoutId): Deck {
  const deck = createDeckFromKit(KITS.find((k) => k.id === 'blank')!)
  if (layout !== 'cover') deck.slides.push(makeSlide(layout, LAYOUT_MAP[layout].sample))
  return deck
}
