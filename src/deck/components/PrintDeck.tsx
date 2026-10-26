import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SLIDE_W } from '../guide'
import { sectionFor } from '../layouts'
import type { Deck } from '../types'
import SlideCanvas from './SlideCanvas'

// PDF 저장: 모든 슬라이드를 한 장씩(16:9) 인쇄 화면으로 그리고 브라우저 인쇄 창을 엽니다.
// 인쇄 창에서 'PDF로 저장'을 고르면 글자가 선명한(검색·복사되는) PDF 가 됩니다. 파일은 서버로 가지 않습니다.
// 화면에는 보이지 않고, 인쇄할 때만 이 내용만 찍힙니다. 인쇄 설정(PRINT_CSS)은 PDF 를 저장하는 동안에만 붙어 있어 다른 화면의 인쇄에는 영향이 없습니다.
// 줄이지 않은 원래 크기로 그립니다 (줄여서 그리면 인쇄할 때 페이지를 다 채우지 못함)
const PAGE_W = SLIDE_W

const PRINT_CSS = `
#deck-print { display: none; }
@media print {
  @page { size: 1280px 720px; margin: 0; }
  html, body { width: 1280px !important; min-width: 0 !important; height: auto !important; margin: 0 !important; overflow: visible !important; background: #fff !important; }
  body > *:not(#deck-print) { display: none !important; }
  #deck-print { display: block; width: 1280px; }
  #deck-print .deck-print-page { width: 1280px; height: 720px; overflow: hidden; break-after: page; }
  #deck-print .deck-print-page:last-child { break-after: auto; }
  #deck-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`

export default function PrintDeck({ deck, onDone }: { deck: Deck; onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  // 인쇄 창은 처음 그릴 때 한 번만 엽니다 (편집 화면이 다시 그려져도 다시 열지 않게)
  const latest = useRef({ deck, onDone })
  useEffect(() => {
    latest.current = { deck, onDone }
  })

  useEffect(() => {
    let cancelled = false
    const title = document.title
    const finish = () => {
      document.title = title
      latest.current.onDone()
    }
    ;(async () => {
      // 글꼴·그림이 다 그려진 뒤에 인쇄합니다
      await document.fonts.ready
      const imgs = Array.from(root.current?.querySelectorAll('img') ?? [])
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? null
            : new Promise((r) => {
                img.addEventListener('load', r, { once: true })
                img.addEventListener('error', r, { once: true })
              }),
        ),
      )
      if (cancelled) return
      // 저장할 때 파일 이름 = 문서 제목
      document.title = latest.current.deck.title || 'Deck'
      window.addEventListener('afterprint', finish, { once: true })
      window.print()
    })()
    return () => {
      cancelled = true
      window.removeEventListener('afterprint', finish)
      document.title = title
    }
  }, [])

  return createPortal(
    <div id="deck-print" ref={root} aria-hidden>
      <style>{PRINT_CSS}</style>
      {deck.slides.map((s, i) => (
        <div key={s.id} className="deck-print-page">
          <SlideCanvas slide={s} index={i} section={sectionFor(deck.slides, i)} width={PAGE_W} showPlaceholders={false} />
        </div>
      ))}
    </div>,
    document.body,
  )
}
