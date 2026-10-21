import { ArrowRight, Check, Copy, Sparkle, Trash2 } from 'lucide-react'
import { useState } from 'react'
import FitWidth from '../components/FitWidth'
import ImportDialog from '../components/ImportDialog'
import { LayoutThumb } from '../components/LayoutPicker'
import SlideCanvas from '../components/SlideCanvas'
import { KITS, createDeckFromKit, createDeckFromLayout, uid, type Kit } from '../kits'
import DeckCard from '../components/DeckCard'
import { VISIBLE_LAYOUTS } from '../layouts'
import type { Deck } from '../types'

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
    <div className="relative h-[136px] w-[226px]">
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

// 섹션 머리: 제목 + 개수 + 오른쪽 링크
function SectionHead({ title, count, link }: { title: string; count?: number; link?: { href: string; label: string } }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="flex items-baseline gap-2 text-[19px] font-bold tracking-[-0.01em] text-[#000038]">
        {title}
        {count !== undefined && <span className="text-[13px] font-medium text-[#8A90A6]">{String(count).padStart(2, '0')}</span>}
      </h2>
      {link && (
        <a href={link.href} className="inline-flex items-center gap-1 text-[12px] text-[#5A6080] hover:text-[#0000A5]">
          {link.label} <ArrowRight size={13} />
        </a>
      )}
    </div>
  )
}

// Hero 오른쪽 그림: 격자 · 원 · 기울어진 슬라이드 · 떠 있는 확인 카드 (넓은 화면에서만)
function HeroArt() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] lg:block" aria-hidden>
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'linear-gradient(#D9DEF5 1px, transparent 1px), linear-gradient(90deg, #D9DEF5 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'linear-gradient(90deg, transparent, #000 35%)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 35%)',
        }}
      />
      <div className="absolute left-[22%] top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full border border-[#C3CAF0]" />
      <div className="absolute left-[30%] top-1/2 h-[220px] w-[220px] -translate-y-1/2 rounded-full border border-[#D3D8F4]" />
      {/* 슬라이드 */}
      <div className="absolute left-[8%] top-[18%] w-[300px] -rotate-[5deg] rounded-xl border border-[#D5DAF2] bg-white p-4 shadow-[0_18px_40px_rgba(26,29,61,0.10)]">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1 w-1 rounded-full bg-[#A9B1DA]" />
          ))}
        </div>
        <div className="mt-4 flex gap-4">
          <div className="w-[70px] space-y-2 pt-1">
            {[44, 34, 48, 38].map((w, i) => (
              <span key={i} className="block h-1.5 rounded-full bg-[#D5DAF2]" style={{ width: w }} />
            ))}
          </div>
          <div className="flex-1">
            <span className="block h-2 w-[120px] rounded-full bg-[#5A6BC0]" />
            <span className="mt-2 block h-1.5 w-[86px] rounded-full bg-[#D5DAF2]" />
            <div className="mt-4 flex gap-2.5">
              <div className="flex h-[66px] w-[66px] items-center justify-center rounded-md bg-[#A3AEF2]">
                <span className="h-6 w-6 rotate-45 border-2 border-[#5A6BC0]" />
              </div>
              <div className="h-[66px] w-[66px] rounded-md bg-[#EEF0FB]" />
            </div>
          </div>
        </div>
      </div>
      {/* 확인 카드 */}
      <div className="absolute right-[9%] top-[44%] flex rotate-[4deg] items-center gap-3 rounded-xl border border-[#D5DAF2] bg-white px-4 py-3 shadow-[0_12px_30px_rgba(26,29,61,0.10)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF0FB] text-[#3A4BB0]">
          <Check size={14} strokeWidth={2.5} />
        </span>
        <span className="text-[13px] font-semibold text-[#1A1D3D]">On guide, every slide.</span>
      </div>
      <Sparkle size={26} strokeWidth={1.4} className="absolute right-[8%] top-[14%] text-[#5A6BC0]" />
      <p className="absolute bottom-6 right-8 text-[10px] font-medium tracking-[0.22em] text-[#8A90B8]">YOUR CONTENT, ON GUIDE</p>
    </div>
  )
}

const formatDate = (t: number) =>
  new Date(t).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function TemplatesPage({ decks, onOpen, onImported, onRemove }: TemplatesPageProps) {
  const [importing, setImporting] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const recent = [...decks].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="pb-20">
      <div className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
        {/* Hero: 연한 라벤더 카드 + 오른쪽 슬라이드 일러스트 */}
        <section className="relative overflow-hidden rounded-3xl border border-[#DDE2F6] bg-gradient-to-br from-[#EEF0FC] to-[#E6E9FA]">
          <div className="relative z-10 px-7 py-12 sm:px-12 sm:py-14 lg:max-w-[560px]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-[#3A3F7A]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3A3F7A]" />
              ALCHERA PPT TEMPLATE · VER.260507
            </p>
            <h1 className="mt-5 break-keep text-[30px] font-bold leading-[1.25] tracking-[-0.02em] text-[#1A1D3D] sm:text-[38px]">
              내용만 쓰세요.
              <br />
              디자인은 가이드가 맞춥니다.
            </h1>
            <p className="mt-4 text-[13px] text-[#5A6080]">가이드 레이아웃 · 요소 라이브러리 · PPTX 다운로드</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="button" className="deck-btn deck-btn-primary h-10 rounded-lg px-5" onClick={() => onOpen(createDeckFromKit(KITS[0]))}>
                솔루션 소개서로 시작 <ArrowRight size={15} />
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2A2F8F] hover:underline" onClick={() => setImporting(true)}>
                PPT · 구글 슬라이드 불러오기 <ArrowRight size={14} />
              </button>
            </div>
          </div>
          <HeroArt />
        </section>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* 시작 키트 */}
        <section className="mt-14">
          <SectionHead title="어떤 자료를 만드세요?" count={KITS.length} />
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {KITS.map((kit, i) => (
              <DeckCard
                key={kit.id}
                onClick={() => onOpen(createDeckFromKit(kit))}
                index={`KIT / ${String(i + 1).padStart(2, '0')}`}
                kicker={kit.id === 'blank' ? 'Free start' : 'Solution deck'}
                tag={`${kit.slides.length}장`}
                title={kit.name}
                // 설명 '표지 제목이 한 줄일 때. 표지 → 목차 → …' 의 앞은 설명, 뒤의 흐름은 아래 줄로
                desc={kit.description.split('. ')[0]}
                footer={kit.description.split('. ')[1] ?? '새 문서로 시작'}
                preview={<KitPreview kit={kit} />}
              />
            ))}
          </div>
        </section>

        {/* 내 문서 */}
        {recent.length > 0 && (
          <section className="mt-14">
            <SectionHead title="내 문서" count={recent.length} />
            <p className="mt-1 text-[12px] text-[#8A90A6]">이 브라우저에 저장돼요. 팀원과 나누려면 스튜디오의 ‘편집 파일’로 내보내세요.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((d) => (
                <div key={d.id} className="group overflow-hidden rounded-2xl border border-[#E6EAF3] bg-white transition hover:shadow-[0_8px_24px_rgba(0,0,56,0.06)]">
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
          <SectionHead title="레이아웃 라이브러리" count={VISIBLE_LAYOUTS.length} />
          <p className="mt-1 text-[12px] text-[#8A90A6]">본문 안의 칸은 요소 라이브러리의 가이드 박스·블록으로 채워요.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VISIBLE_LAYOUTS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => onOpen(createDeckFromLayout(l.id))}
                className="group rounded-2xl border border-[#E6EAF3] bg-white p-3 text-left transition hover:border-[#C9D1F5] hover:shadow-[0_8px_24px_rgba(0,0,56,0.06)]"
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
