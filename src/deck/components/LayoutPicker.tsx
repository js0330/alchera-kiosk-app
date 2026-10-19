import { X } from 'lucide-react'
import { useEffect } from 'react'
import { BRAND } from '../guide'
import { LAYOUT_CATEGORIES, LAYOUTS } from '../layouts'
import type { LayoutId } from '../types'
import { makeSlide } from '../kits'
import SlideCanvas from './SlideCanvas'

// 미리보기용 슬라이드(예시 내용)는 한 번만 만들어 둡니다.
const SAMPLE_SLIDES = Object.fromEntries(LAYOUTS.map((l) => [l.id, { ...makeSlide(l.id, l.sample), id: `sample-${l.id}` }]))

export function LayoutThumb({ id, width }: { id: LayoutId; width: number }) {
  return <SlideCanvas slide={SAMPLE_SLIDES[id]} index={1} footer={BRAND.footer} section="01  섹션 제목" width={width} />
}

interface LayoutPickerProps {
  title: string
  current?: LayoutId
  onPick: (id: LayoutId) => void
  onClose: () => void
}

export default function LayoutPicker({ title, current, onPick, onClose }: LayoutPickerProps) {
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
          {LAYOUT_CATEGORIES.map((cat) => (
            <section key={cat} className="mt-5">
              <h3 className="deck-label mb-3">{cat}</h3>
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
        </div>
      </div>
    </div>
  )
}
