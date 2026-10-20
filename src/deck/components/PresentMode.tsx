import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SLIDE_H, SLIDE_W } from '../guide'
import { sectionFor } from '../layouts'
import type { Deck } from '../types'
import SlideCanvas from './SlideCanvas'

function fitWidth() {
  return Math.min(window.innerWidth, (window.innerHeight * SLIDE_W) / SLIDE_H)
}

export default function PresentMode({ deck, start, onExit }: { deck: Deck; start: number; onExit: (index: number) => void }) {
  const [index, setIndex] = useState(start)
  const [width, setWidth] = useState(fitWidth)
  const last = deck.slides.length - 1

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
    const onResize = () => setWidth(fitWidth())
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) setIndex((i) => Math.min(last, i + 1))
      else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) setIndex((i) => Math.max(0, i - 1))
      else if (e.key === 'Home') setIndex(0)
      else if (e.key === 'End') setIndex(last)
      else if (e.key === 'Escape') onExit(index)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [last, index, onExit])

  const slide = deck.slides[index]

  return (
    <div className="group fixed inset-0 z-[60] flex items-center justify-center bg-black">
      <div onClick={() => setIndex((i) => Math.min(last, i + 1))} className="cursor-pointer">
        <SlideCanvas
          slide={slide}
          index={index}
          section={sectionFor(deck.slides, index)}
          width={width}
          showPlaceholders={false}
        />
      </div>
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[13px] text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
        <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="이전">
          <ChevronLeft size={18} />
        </button>
        <span className="min-w-[64px] text-center tabular-nums">
          {index + 1} / {deck.slides.length}
        </span>
        <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={() => setIndex((i) => Math.min(last, i + 1))} aria-label="다음">
          <ChevronRight size={18} />
        </button>
        <button type="button" className="rounded-full p-2 hover:bg-white/10" onClick={() => onExit(index)} aria-label="발표 종료">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
