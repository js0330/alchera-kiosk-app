import { ChevronLeft, ChevronRight, GalleryHorizontal, LayoutGrid, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SLIDE_H, SLIDE_W } from '../guide'
import { sectionFor } from '../layouts'
import type { Deck } from '../types'
import FitWidth from './FitWidth'
import SlideCanvas from './SlideCanvas'

interface PreviewDialogProps {
  deck: Deck
  start: number
  onClose: (index: number) => void
}

// 미리보기: 편집 표시(점선·안내 문구·선택 상자) 없이 완성된 모습으로 봅니다.
// 한 장씩 크게 보거나, 전체를 한눈에 보며 흐름을 확인합니다. 슬라이드를 고르면 그 장으로 돌아갑니다.
export default function PreviewDialog({ deck, start, onClose }: PreviewDialogProps) {
  const [index, setIndex] = useState(start)
  const [grid, setGrid] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(960)
  const last = deck.slides.length - 1

  useLayoutEffect(() => {
    const node = stage.current
    if (!node) return
    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect
      setWidth(Math.max(320, Math.min(w - 48, ((h - 48) * SLIDE_W) / SLIDE_H)))
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [grid])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(index)
      else if (grid) return
      else if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) setIndex((i) => Math.min(last, i + 1))
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) setIndex((i) => Math.max(0, i - 1))
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grid, index, last, onClose])

  useEffect(() => {
    document.getElementById(`preview-thumb-${index}`)?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [index])

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-[#0B0D1F] text-white">
      <div className="flex h-14 flex-shrink-0 items-center gap-3 px-5">
        <h2 className="text-[15px] font-bold">미리보기</h2>
        <span className="text-[12px] text-white/50">편집 표시 없이 완성된 모습 · ← → 로 넘기기 · Esc 닫기</span>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-white/10 p-0.5">
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold ${!grid ? 'bg-white text-[#000038]' : 'text-white/70 hover:text-white'}`}
            onClick={() => setGrid(false)}
          >
            <GalleryHorizontal size={14} /> 한 장씩
          </button>
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold ${grid ? 'bg-white text-[#000038]' : 'text-white/70 hover:text-white'}`}
            onClick={() => setGrid(true)}
          >
            <LayoutGrid size={14} /> 한눈에
          </button>
        </div>
        <button type="button" className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => onClose(index)} aria-label="미리보기 닫기">
          <X size={20} />
        </button>
      </div>

      {grid ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8 pt-3">
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-4">
            {deck.slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`group text-left ${i === index ? 'outline outline-2 outline-offset-4 outline-[#7B8CFF]' : ''} rounded-sm`}
                onClick={() => {
                  setIndex(i)
                  setGrid(false)
                }}
              >
                <div className="overflow-hidden rounded-sm shadow-lg ring-1 ring-white/10 transition group-hover:ring-[#7B8CFF]">
                  <FitWidth>{(w) => <SlideCanvas slide={s} index={i} section={sectionFor(deck.slides, i)} width={w} showPlaceholders={false} />}</FitWidth>
                </div>
                <span className="mt-1.5 block text-[12px] tabular-nums text-white/60">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div ref={stage} className="relative flex min-h-0 flex-1 items-center justify-center">
            <button
              type="button"
              className="absolute left-3 rounded-full p-3 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              aria-label="이전 슬라이드"
            >
              <ChevronLeft size={28} />
            </button>
            <div className="shadow-2xl">
              <SlideCanvas slide={deck.slides[index]} index={index} section={sectionFor(deck.slides, index)} width={width} showPlaceholders={false} />
            </div>
            <button
              type="button"
              className="absolute right-3 rounded-full p-3 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
              disabled={index === last}
              onClick={() => setIndex((i) => Math.min(last, i + 1))}
              aria-label="다음 슬라이드"
            >
              <ChevronRight size={28} />
            </button>
          </div>
          <div className="flex h-[104px] flex-shrink-0 items-center gap-3 overflow-x-auto px-5 pb-3">
            <span className="w-14 flex-shrink-0 text-center text-[13px] tabular-nums text-white/70">
              {index + 1} / {deck.slides.length}
            </span>
            {deck.slides.map((s, i) => (
              <button
                key={s.id}
                id={`preview-thumb-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                className={`flex-shrink-0 overflow-hidden rounded-sm ring-2 transition ${i === index ? 'ring-[#7B8CFF]' : 'opacity-60 ring-transparent hover:opacity-100'}`}
              >
                <SlideCanvas slide={s} index={i} section={sectionFor(deck.slides, i)} width={128} showPlaceholders={false} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
