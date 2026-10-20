import { ChevronDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { LAYOUTS, LAYOUT_MAP, type LayoutCategory } from '../layouts'
import type { LayoutId } from '../types'
import { DEMO_OBJECTS } from '../freeObjects'
import { makeSlide } from '../kits'
import SlideCanvas from './SlideCanvas'

// 미리보기용 슬라이드(예시 내용)는 한 번만 만들어 둡니다.
const SAMPLE_SLIDES = Object.fromEntries(
  LAYOUTS.map((l) => [l.id, { ...makeSlide(l.id, l.sample), id: `sample-${l.id}`, objects: l.id === 'free' ? DEMO_OBJECTS : undefined }]),
)

export function LayoutThumb({ id, width }: { id: LayoutId; width: number }) {
  return <SlideCanvas slide={SAMPLE_SLIDES[id]} index={4} section="2. 제품 소개" width={width} />
}

interface LayoutPickerProps {
  title: string
  current?: LayoutId
  onPick: (id: LayoutId) => void
  onClose: () => void
}

// 본문은 '자유 배치' + 요소 라이브러리의 가이드 박스로 만드는 것을 기본으로 하고,
// 칸이 고정된 라인형·타이틀형 레이아웃은 접어 둡니다 (지금 그 레이아웃이면 펼친 채로).
export default function LayoutPicker({ title, current, onPick, onClose }: LayoutPickerProps) {
  const fixed = (c: LayoutCategory) => c === '라인형' || c === '타이틀형'
  const [showFixed, setShowFixed] = useState(() => !!current && fixed(LAYOUT_MAP[current].category))
  const sections: [LayoutCategory, string][] = [
    ['자유 배치', '본문 — 타이틀 가이드 + 요소 라이브러리로 자유롭게'],
    ['표지·구성', '표지 · 목차 · 간지 · 마무리'],
    ...(showFixed
      ? ([
          ['라인형', '칸이 고정된 레이아웃 · 라인형'],
          ['타이틀형', '칸이 고정된 레이아웃 · 타이틀형'],
        ] as [LayoutCategory, string][])
      : []),
  ]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000038]/40 p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-[1040px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E0E5F0] px-6 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-[#000038]">{title}</h2>
            <p className="mt-0.5 text-[13px] text-[#7A8099]">레이아웃을 고르면 글꼴·색·여백은 가이드대로 자동 적용돼요.</p>
          </div>
          <button type="button" className="deck-btn deck-btn-ghost" onClick={onClose} aria-label="닫기">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">
          {sections.map(([cat, label]) => (
            <section key={cat} className="mt-5">
              <h3 className="deck-label mb-3">{label}</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {LAYOUTS.filter((l) => l.category === cat).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onPick(l.id)}
                    className={`group rounded-xl border p-2 text-left transition hover:border-[#4D6BFF] hover:shadow-md ${
                      current === l.id ? 'border-[#0000A5] ring-2 ring-[#0000A5]/20' : 'border-[#E0E5F0]'
                    }`}
                  >
                    <div className="overflow-hidden rounded-md border border-[#E0E5F0]">
                      <LayoutThumb id={l.id} width={224} />
                    </div>
                    <p className="mt-2 px-1 text-[13px] font-bold text-[#000038]">{l.name}</p>
                    <p className="px-1 text-[12px] text-[#7A8099]">{l.description}</p>
                  </button>
                ))}
              </div>
            </section>
          ))}
          <button
            type="button"
            className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C9D0E4] py-3 text-[13px] font-semibold text-[#5A6380] hover:border-[#4D6BFF] hover:text-[#0000A5]"
            onClick={() => setShowFixed((v) => !v)}
          >
            칸이 고정된 레이아웃 {showFixed ? '접기' : '보기'} (라인형 · 타이틀형)
            <ChevronDown size={15} className={showFixed ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>
    </div>
  )
}
