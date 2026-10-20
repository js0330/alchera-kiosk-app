import { Copy, ExternalLink, FilePlus2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import FitWidth from '../components/FitWidth'
import PreviewDialog from '../components/PreviewDialog'
import SlideCanvas from '../components/SlideCanvas'
import { uid } from '../kits'
import { SAMPLES, loadSampleSlides, sampleSlideUrl, type Sample } from '../samples'
import type { Deck, Slide } from '../types'

// 세일즈덱 모아보기: 알체라 세일즈덱 원본을 한곳에서 읽기 전용으로 봅니다.
// 여기서는 고칠 수 없고, 쓰고 싶은 덱이나 장을 '복사'하면 내 문서로 만들어 편집합니다.
// (덱 목록은 samples.ts 의 SAMPLES)

const newDeck = (title: string, slides: Slide[]): Deck => {
  const now = Date.now()
  return { id: uid(), title, slides: slides.map((s) => ({ ...s, id: uid() })), createdAt: now, updatedAt: now }
}

function SalesDeck({ sample, onOpen }: { sample: Sample; onOpen: (deck: Deck) => void }) {
  const [slides, setSlides] = useState<Slide[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [viewing, setViewing] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    loadSampleSlides(sample)
      .then((list) => alive && setSlides(list))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [sample])

  const openOriginal = (index: number) => {
    // 팝업 차단을 피하려고 창을 먼저 열고 주소를 넣습니다
    const win = window.open('', '_blank')
    sampleSlideUrl(sample, index).then((url) => {
      if (win) win.location.href = url
      else window.open(url, '_blank')
    })
  }

  return (
    <section id={sample.id} className="mt-12 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-[#000038]">
            {sample.name}
            <span className="ml-2 align-middle rounded-full bg-[#F2F4FB] px-2 py-0.5 text-[11px] font-semibold text-[#0000A5]">{sample.count}장</span>
          </h2>
          <p className="mt-1 text-[13px] text-[#7A8099]">{sample.description}</p>
        </div>
        <div className="flex gap-2">
          <a href={sample.source} target="_blank" rel="noreferrer" className="deck-btn">
            원본 구글 슬라이드 <ExternalLink size={14} />
          </a>
          <button type="button" className="deck-btn deck-btn-primary" disabled={!slides} onClick={() => slides && onOpen(newDeck(sample.name, slides))}>
            <Copy size={14} /> 덱 전체 복사해서 쓰기
          </button>
        </div>
      </div>

      {failed && <p className="mt-5 text-[13px] text-[#E84B55]">덱을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(slides ?? Array.from({ length: sample.count }, () => null)).map((s, i) => (
          <button
            key={s?.id ?? i}
            type="button"
            disabled={!s}
            onClick={() => setViewing(i)}
            className="group text-left"
            title="크게 보기"
          >
            {/* 칸 높이를 미리 잡아 두어 불러오는 중에도 위치가 흔들리지 않게 */}
            <div className="aspect-video overflow-hidden rounded-md bg-[#EEF1F7] shadow-sm ring-1 ring-black/5 transition group-hover:ring-2 group-hover:ring-[#4D6BFF]">
              {s ? <FitWidth>{(w) => <SlideCanvas slide={s} index={i} width={w} showPlaceholders={false} />}</FitWidth> : <div className="h-full animate-pulse" />}
            </div>
            <span className="mt-1 block text-[11px] text-[#7A8099]">{i + 1}</span>
          </button>
        ))}
      </div>

      {slides && viewing !== null && (
        <PreviewDialog
          deck={{ id: sample.id, title: sample.name, slides, createdAt: 0, updatedAt: 0 }}
          start={viewing}
          title={sample.name}
          hint="보기 전용 · 쓰려면 복사하세요 · ← → 로 넘기기 · Esc 닫기"
          onClose={() => setViewing(null)}
          actions={(index) => (
            <>
              <button type="button" className="deck-btn h-8 border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => openOriginal(index)}>
                원본 이 장 <ExternalLink size={13} />
              </button>
              <button
                type="button"
                className="deck-btn h-8 border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => onOpen(newDeck(`${sample.name} ${index + 1}장`, [slides[index]]))}
              >
                <FilePlus2 size={13} /> 이 장만 새 문서로
              </button>
              <button type="button" className="deck-btn deck-btn-primary h-8" onClick={() => onOpen(newDeck(sample.name, slides))}>
                <Copy size={13} /> 덱 전체 복사
              </button>
            </>
          )}
        />
      )}
    </section>
  )
}

export default function SalesDeckPage({ focus, onOpen }: { focus?: string; onOpen: (deck: Deck) => void }) {
  // #sales/<덱 id> 로 들어오면 그 덱으로 내려갑니다
  useEffect(() => {
    if (focus) document.getElementById(focus)?.scrollIntoView()
  }, [focus])
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-10 sm:px-6">
      <h1 className="text-[26px] font-bold text-[#000038]">알체라 세일즈덱</h1>
      <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-[#7A8099]">
        회사 세일즈덱 원본을 한곳에 모았어요. 여기서는 보기만 할 수 있어서 원본이 바뀌지 않아요. 쓰고 싶은 덱이나 장을 ‘복사’하면 내 문서로 열려서 마음껏 고칠 수 있어요.
      </p>
      <nav className="mt-5 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <a
            key={s.id}
            href={`#sales/${s.id}`}
            className="rounded-full border border-[#E0E5F0] bg-white px-3 py-1 text-[12px] font-semibold text-[#000038] hover:border-[#4D6BFF]">
            {s.name}
          </a>
        ))}
      </nav>
      {SAMPLES.map((s) => (
        <SalesDeck key={s.id} sample={s} onOpen={onOpen} />
      ))}
    </div>
  )
}
