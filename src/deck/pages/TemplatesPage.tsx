import { ArrowRight, Copy, ExternalLink, Trash2, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import FitWidth from '../components/FitWidth'
import ImportDialog from '../components/ImportDialog'
import { LayoutThumb } from '../components/LayoutPicker'
import SlideCanvas from '../components/SlideCanvas'
import { KITS, createDeckFromKit, createDeckFromLayout, uid, type Kit } from '../kits'
import { SAMPLES, createDeckFromSample, loadSampleSlides, type Sample } from '../samples'
import { VISIBLE_LAYOUTS } from '../layouts'
import { BRAND } from '../guide'
import type { Deck, Slide } from '../types'

interface TemplatesPageProps {
  decks: Deck[]
  onOpen: (deck: Deck) => void
  onImported: (deck: Deck, source: string) => void
  onRemove: (id: string) => void
}

function KitPreview({ kit }: { kit: Kit }) {
  // 키트의 앞 3장을 겹쳐서 보여줍니다. 빈 칸은 안내 문구로 보입니다.
  const deck = createDeckFromKit(kit)
  const shown = deck.slides.slice(0, 3)
  return (
    <div className="relative h-[136px]">
      {shown
        .map((s, i) => (
          <div
            key={s.id}
            className="absolute overflow-hidden rounded-md shadow-[0_4px_14px_rgba(0,0,56,0.14)] ring-1 ring-black/5"
            style={{ left: i * 18, top: i * 14, zIndex: 3 - i, opacity: 1 - i * 0.15 }}
          >
            <SlideCanvas slide={s} index={i} width={190} />
          </div>
        ))
        .reverse()}
    </div>
  )
}

// 원본 샘플 덱 앞 3장을 겹쳐서 (불러오는 동안은 빈 자리)
function SamplePreview({ sample }: { sample: Sample }) {
  const [slides, setSlides] = useState<Slide[] | null>(null)
  useEffect(() => {
    let alive = true
    loadSampleSlides(sample)
      .then((list) => alive && setSlides(list.slice(0, 3)))
      .catch(() => alive && setSlides([]))
    return () => {
      alive = false
    }
  }, [sample])
  return (
    <div className="relative h-[136px]">
      {!slides && <div className="h-[107px] w-[190px] animate-pulse rounded-md bg-[#EEF1F7]" />}
      {slides
        ?.map((s, i) => (
          <div
            key={s.id}
            className="absolute overflow-hidden rounded-md shadow-[0_4px_14px_rgba(0,0,56,0.14)] ring-1 ring-black/5"
            style={{ left: i * 18, top: i * 14, zIndex: 3 - i, opacity: 1 - i * 0.15 }}
          >
            <SlideCanvas slide={s} index={i} width={190} showPlaceholders={false} />
          </div>
        ))
        .reverse()}
    </div>
  )
}

const formatDate = (t: number) =>
  new Date(t).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function TemplatesPage({ decks, onOpen, onImported, onRemove }: TemplatesPageProps) {
  const [importing, setImporting] = useState(false)
  const [opening, setOpening] = useState<string | null>(null)
  const openSample = (s: Sample) => {
    if (opening) return
    setOpening(s.id)
    createDeckFromSample(s)
      .then(onOpen)
      .catch(() => alert('샘플을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'))
      .finally(() => setOpening(null))
  }
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const recent = [...decks].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="text-white" style={{ background: `#000038 url(${BRAND.coverBg}) right center / cover no-repeat` }}>
        <div className="relative mx-auto max-w-[1200px] overflow-hidden px-4 py-14 sm:px-6">
          <p className="text-[12px] font-bold tracking-[0.12em] text-[#7B8CFF]">ALCHERA PPT TEMPLATE · ver.260507</p>
          <h1 className="mt-3 text-[30px] font-bold leading-tight sm:text-[38px]">
            내용만 쓰세요.
            <br />
            디자인은 가이드가 맞춥니다.
          </h1>
          <p className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-[#D3D7EE]">
            알체라 PPT 가이드의 레이아웃을 고르고 칸에 글만 채우세요. 글꼴·크기·색·위치는 가이드 그대로 들어가고, 다운로드한 PPTX는 다시 손볼 필요가 없어요.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <button type="button" className="deck-btn deck-btn-primary h-10 px-5" onClick={() => setImporting(true)}>
              <Upload size={16} /> PPT · 텍스트 불러와서 가이드에 맞추기
            </button>
            <button
              type="button"
              className="deck-btn h-10 border-white/20 bg-white/10 px-5 text-white hover:bg-white/20"
              onClick={() => onOpen(createDeckFromKit(KITS[0]))}
            >
              솔루션 소개서로 새로 시작 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* 시작 키트 */}
        <section className="mt-12">
          <h2 className="text-[20px] font-bold text-[#000038]">어떤 자료를 만드세요?</h2>
          <p className="mt-1 text-[13px] text-[#7A8099]">상황에 맞는 슬라이드 흐름이 미리 짜여 있어요. 칸마다 무엇을 쓸지 안내가 들어 있습니다.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KITS.map((kit) => (
              <button
                key={kit.id}
                type="button"
                onClick={() => onOpen(createDeckFromKit(kit))}
                className="group rounded-2xl border border-[#E0E5F0] bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#4D6BFF] hover:shadow-lg"
              >
                <KitPreview kit={kit} />
                <div className="mt-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-[#000038]">{kit.name}</h3>
                  <span className="rounded-full bg-[#F2F4FB] px-2 py-0.5 text-[11px] font-semibold text-[#0000A5]">{kit.slides.length}장</span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-[#7A8099]">{kit.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* 샘플 덱 */}
        <section className="mt-14">
          <h2 className="text-[20px] font-bold text-[#000038]">알체라 샘플 덱</h2>
          <p className="mt-1 text-[13px] text-[#7A8099]">알체라 세일즈덱 원본 그대로예요. 배경·도형·글·이미지 모두 편집할 수 있어서, 복사해서 필요한 장을 고쳐 쓰거나 다른 문서로 복사해 붙여넣을 수 있어요.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {SAMPLES.map((s) => (
              <div key={s.id} className="group flex flex-col rounded-2xl border border-[#E0E5F0] bg-white p-5 transition hover:border-[#4D6BFF] hover:shadow-lg">
                <button type="button" className="text-left" onClick={() => openSample(s)}>
                  <SamplePreview sample={s} />
                  <div className="mt-4 flex items-start justify-between gap-2">
                    <h3 className="text-[15px] font-bold text-[#000038]">{s.name}</h3>
                    <span className="flex-shrink-0 rounded-full bg-[#F2F4FB] px-2 py-0.5 text-[11px] font-semibold text-[#0000A5]">{s.count}장</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#7A8099]">{s.description}</p>
                </button>
                <div className="mt-auto flex items-center gap-3 pt-4 text-[12px] font-semibold">
                  <button type="button" className="text-[#0000A5] hover:underline disabled:opacity-50" disabled={opening === s.id} onClick={() => openSample(s)}>
                    {opening === s.id ? '불러오는 중…' : '복사해서 쓰기 →'}
                  </button>
                  <a href={s.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#7A8099] hover:text-[#000038]">
                    원본 <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 내 문서 */}
        {recent.length > 0 && (
          <section className="mt-14">
            <h2 className="text-[20px] font-bold text-[#000038]">내 문서</h2>
            <p className="mt-1 text-[13px] text-[#7A8099]">이 브라우저에 저장돼요. 팀원과 나누려면 스튜디오의 ‘편집 파일’로 내보내세요.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((d) => (
                <div key={d.id} className="group overflow-hidden rounded-2xl border border-[#E0E5F0] bg-white transition hover:shadow-lg">
                  <button type="button" className="block w-full bg-[#EEF1F7] p-3" onClick={() => onOpen(d)}>
                    <div className="overflow-hidden rounded-md shadow-sm">
                      <FitWidth>{(w) => <SlideCanvas slide={d.slides[0]} index={0} width={w} />}</FitWidth>
                    </div>
                  </button>
                  <div className="flex items-start justify-between gap-2 p-4">
                    <button type="button" className="min-w-0 text-left" onClick={() => onOpen(d)}>
                      <p className="truncate text-[14px] font-bold text-[#000038]">{d.title || '제목 없는 문서'}</p>
                      <p className="mt-0.5 text-[12px] text-[#7A8099]">
                        {d.slides.length}장 · {formatDate(d.updatedAt)}
                      </p>
                    </button>
                    <div className={`flex flex-shrink-0 transition group-hover:opacity-100 ${pendingDelete === d.id ? 'opacity-100' : 'opacity-0'}`}>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-[#7A8099] hover:bg-[#F5F7FC] hover:text-[#000038]"
                        title="복제"
                        onClick={() => onOpen({ ...d, id: uid(), title: `${d.title} 사본`, createdAt: Date.now() })}
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-[#7A8099] hover:bg-[#FDECEE] hover:text-[#E84B55]"
                        title="삭제"
                        onClick={() => (pendingDelete === d.id ? onRemove(d.id) : setPendingDelete(d.id))}
                        onBlur={() => setPendingDelete(null)}
                      >
                        {pendingDelete === d.id ? <span className="px-1 text-[12px] font-bold">삭제 확인</span> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 레이아웃 라이브러리 */}
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-bold text-[#000038]">레이아웃 라이브러리</h2>
              <p className="mt-1 text-[13px] text-[#7A8099]">표지·목차·간지·본문·마무리 {VISIBLE_LAYOUTS.length}가지. 본문 안의 칸은 요소 라이브러리의 가이드 박스·블록으로 채워요.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VISIBLE_LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => onOpen(createDeckFromLayout(l.id))}
                className="group rounded-2xl border border-[#E0E5F0] bg-white p-3 text-left transition hover:border-[#4D6BFF] hover:shadow-lg"
              >
                <div className="overflow-hidden rounded-lg ring-1 ring-[#E0E5F0]">
                  <FitWidth>{(w) => <LayoutThumb id={l.id} width={w} />}</FitWidth>
                </div>
                <div className="flex items-center justify-between px-1 pb-1 pt-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#000038]">{l.name}</p>
                    <p className="text-[12px] text-[#7A8099]">{l.description}</p>
                  </div>
                  <span className="text-[12px] font-semibold text-[#0000A5] opacity-0 transition group-hover:opacity-100">시작 →</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onImported={(deck, source) => {
            setImporting(false)
            onImported(deck, source)
          }}
        />
      )}
    </div>
  )
}
