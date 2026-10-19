import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FileJson,
  LayoutTemplate,
  LoaderCircle,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import LayoutPicker from '../components/LayoutPicker'
import PresentMode from '../components/PresentMode'
import SlideCanvas from '../components/SlideCanvas'
import { TONES, SLIDE_H, SLIDE_W } from '../guide'
import { makeSlide, uid } from '../kits'
import { LAYOUT_MAP, checkSlide, sectionFor, slideTone } from '../layouts'
import { downloadBlob, safeFileName, type SaveState } from '../store'
import type { Deck, LayoutId, Slide } from '../types'

interface StudioPageProps {
  deck: Deck
  saveState: SaveState
  onChange: (deck: Deck) => void
}

// 업로드한 이미지는 긴 변 1920px 로 줄여 저장 공간을 아낍니다.
function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const src = reader.result as string
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const max = 1920
        const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
        if (r === 1 && file.size < 400_000) return resolve(src)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.naturalWidth * r)
        canvas.height = Math.round(img.naturalHeight * r)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(file.type === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  })
}

export default function StudioPage({ deck, saveState, onChange }: StudioPageProps) {
  const [current, setCurrent] = useState(0)
  const [picker, setPicker] = useState<'add' | 'change' | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ text: string; undo?: () => void } | null>(null)
  const imageField = useRef<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [canvasW, setCanvasW] = useState(960)

  const index = Math.min(current, deck.slides.length - 1)
  const slide = deck.slides[index]
  const layout = LAYOUT_MAP[slide.layout]
  const issues = checkSlide(slide)
  const allIssues = deck.slides.map((s, i) => ({ i, issues: checkSlide(s) })).filter((x) => x.issues.length)

  // 최신 deck 을 ref 로 들고 있어야 빠르게 입력해도 이전 값으로 덮어쓰지 않습니다.
  const deckRef = useRef(deck)
  deckRef.current = deck

  const setSlides = useCallback(
    (fn: (slides: Slide[]) => Slide[]) => onChange({ ...deckRef.current, slides: fn(deckRef.current.slides) }),
    [onChange],
  )

  const updateSlide = useCallback(
    (id: string, fn: (s: Slide) => Slide) => setSlides((slides) => slides.map((s) => (s.id === id ? fn(s) : s))),
    [setSlides],
  )

  const setField = useCallback(
    (key: string, value: string) => updateSlide(slide.id, (s) => ({ ...s, content: { ...s.content, [key]: value } })),
    [slide.id, updateSlide],
  )

  useLayoutEffect(() => {
    const node = stage.current
    if (!node) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setCanvasW(Math.max(320, Math.min(width - 64, ((height - 64) * SLIDE_W) / SLIDE_H)))
    })
    ro.observe(node)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(t)
  }, [notice])

  useEffect(() => {
    document.getElementById(`thumb-${slide.id}`)?.scrollIntoView({ block: 'nearest' })
  }, [slide.id])

  const addSlide = (id: LayoutId) => {
    const s = makeSlide(id)
    setSlides((slides) => [...slides.slice(0, index + 1), s, ...slides.slice(index + 1)])
    setCurrent(index + 1)
    setPicker(null)
  }

  const changeLayout = (id: LayoutId) => {
    updateSlide(slide.id, (s) => ({ ...s, layout: id, tone: LAYOUT_MAP[id].tones.includes(s.tone) ? s.tone : LAYOUT_MAP[id].defaultTone }))
    setPicker(null)
  }

  const duplicate = (i: number) => {
    setSlides((slides) => [...slides.slice(0, i + 1), { ...slides[i], id: uid(), content: { ...slides[i].content } }, ...slides.slice(i + 1)])
    setCurrent(i + 1)
  }

  const remove = (i: number) => {
    if (deck.slides.length === 1) return
    const before = deckRef.current.slides
    setSlides((slides) => slides.filter((_, j) => j !== i))
    setCurrent(Math.max(0, i - 1))
    setNotice({
      text: `${i + 1}번 슬라이드를 삭제했어요`,
      undo: () => {
        onChange({ ...deckRef.current, slides: before })
        setCurrent(i)
      },
    })
  }

  const move = (from: number, to: number) => {
    if (from === to) return
    setSlides((slides) => {
      const copy = slides.slice()
      const [s] = copy.splice(from, 1)
      copy.splice(to, 0, s)
      return copy
    })
    setCurrent(to)
  }

  const pickImage = (key: string) => {
    imageField.current = key
    fileInput.current?.click()
  }

  const runExport = async () => {
    setCheckOpen(false)
    setExporting(true)
    try {
      const { exportDeckToPptx } = await import('../exportPptx')
      await exportDeckToPptx(deck)
    } catch (e) {
      console.error(e)
      setNotice({ text: 'PPTX 파일을 만들지 못했어요. 이미지가 너무 크면 줄인 뒤 다시 시도해 주세요.' })
    } finally {
      setExporting(false)
    }
  }

  const exportJson = () => {
    downloadBlob(new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' }), `${safeFileName(deck.title)}.deck.json`)
  }

  const tones = layout.tones

  return (
    <div className="flex h-screen flex-col">
      {/* 상단 바 */}
      <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-[#E0E5F0] bg-white px-3">
        <a href="#templates" className="deck-btn deck-btn-ghost px-2" aria-label="템플릿으로">
          <ArrowLeft size={18} />
        </a>
        <input
          value={deck.title}
          onChange={(e) => onChange({ ...deck, title: e.target.value })}
          className="min-w-0 flex-1 rounded-md px-2 py-1 text-[16px] font-bold text-[#000038] outline-none hover:bg-[#F5F7FC] focus:bg-[#F5F7FC] sm:max-w-[360px]"
          aria-label="문서 제목"
        />
        <span className={`hidden text-[12px] sm:inline ${saveState === 'error' ? 'font-semibold text-[#E84B55]' : 'text-[#7A8099]'}`}>
          {saveState === 'saved' ? '이 브라우저에 저장됨' : saveState === 'saving' ? '저장 중…' : '저장 공간 부족 — 이미지를 줄이거나 JSON으로 보관하세요'}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="deck-btn hidden md:inline-flex" onClick={exportJson} title="팀원에게 공유할 수 있는 편집용 파일">
            <FileJson size={16} /> 편집 파일
          </button>
          <button type="button" className="deck-btn" onClick={() => setPresenting(true)}>
            <Play size={16} /> 발표
          </button>
          <button
            type="button"
            className="deck-btn deck-btn-primary"
            disabled={exporting}
            onClick={() => (allIssues.length ? setCheckOpen(true) : runExport())}
          >
            {exporting ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />} PPTX 다운로드
          </button>
        </div>
      </header>

      {/* 슬라이드 도구: 레이아웃·톤만 바꿀 수 있습니다 */}
      <div className="flex h-12 flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-[#E0E5F0] bg-[#FBFCFE] px-3">
        <button type="button" className="deck-btn" onClick={() => setPicker('change')}>
          <LayoutTemplate size={16} /> 레이아웃: {layout.name}
        </button>
        {tones.length > 1 && (
          <div className="flex items-center gap-1 rounded-lg border border-[#E0E5F0] bg-white p-1">
            {tones.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateSlide(slide.id, (s) => ({ ...s, tone: t }))}
                className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold ${
                  slideTone(slide) === t ? 'bg-[#EEF0FB] text-[#0000A5]' : 'text-[#666] hover:bg-[#F5F7FC]'
                }`}
              >
                <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: TONES[t].bg }} />
                {TONES[t].label}
              </button>
            ))}
          </div>
        )}
        <div className="mx-1 h-6 w-px bg-[#E0E5F0]" />
        <button type="button" className="deck-btn deck-btn-ghost" onClick={() => duplicate(index)}>
          <Copy size={15} /> 복제
        </button>
        <button type="button" className="deck-btn deck-btn-ghost" disabled={deck.slides.length === 1} onClick={() => remove(index)}>
          <Trash2 size={15} /> 삭제
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 썸네일 */}
        <aside className="flex w-[200px] flex-shrink-0 flex-col border-r border-[#E0E5F0] bg-white">
          <div className="p-3">
            <button type="button" className="deck-btn w-full justify-center" onClick={() => setPicker('add')}>
              <Plus size={16} /> 새 슬라이드
            </button>
          </div>
          <ol className="flex-1 space-y-3 overflow-y-auto px-3 pb-6">
            {deck.slides.map((s, i) => {
              const n = checkSlide(s).length
              return (
                <li
                  key={s.id}
                  id={`thumb-${s.id}`}
                  draggable
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragFrom !== null) move(dragFrom, i)
                    setDragFrom(null)
                  }}
                  className="flex gap-1.5"
                >
                  <span className="w-4 pt-1 text-right text-[11px] tabular-nums text-[#7A8099]">{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setCurrent(i)}
                    className={`relative overflow-hidden rounded-md border-2 transition ${
                      i === index ? 'border-[#0000A5]' : 'border-transparent ring-1 ring-[#E0E5F0] hover:ring-[#4D6BFF]'
                    }`}
                  >
                    <SlideCanvas slide={s} index={i} footer={deck.footer} section={sectionFor(deck.slides, i)} width={152} />
                    {n > 0 && (
                      <span className="absolute right-1 top-1 rounded bg-[#F1A11D] px-1 text-[10px] font-bold text-white" title="가이드 체크 항목">
                        {n}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>

        {/* 편집 캔버스 */}
        <main ref={stage} className="flex min-w-0 flex-1 items-center justify-center overflow-auto bg-[#EEF1F7]">
          <div className="shadow-[0_8px_30px_rgba(0,0,56,0.12)]">
            <SlideCanvas
              slide={slide}
              index={index}
              footer={deck.footer}
              section={sectionFor(deck.slides, index)}
              width={canvasW}
              editable
              onFieldChange={setField}
              onImagePick={pickImage}
              onImageClear={(key) => setField(key, '')}
            />
          </div>
        </main>

        {/* 오른쪽 패널: 가이드 체크 + 발표자 노트 */}
        <aside className="hidden w-[280px] flex-shrink-0 flex-col overflow-y-auto border-l border-[#E0E5F0] bg-white lg:flex">
          <section className="border-b border-[#E0E5F0] p-4">
            <h3 className="deck-label mb-3">가이드 체크</h3>
            {issues.length === 0 ? (
              <p className="flex items-center gap-2 text-[13px] font-semibold text-[#16A34A]">
                <CircleCheck size={16} /> 이 슬라이드는 가이드에 맞아요
              </p>
            ) : (
              <ul className="space-y-1.5">
                {issues.map((it) => (
                  <li key={it.field} className="flex items-start gap-2 text-[13px] text-[#333A4D]">
                    <CircleAlert size={15} className="mt-0.5 flex-shrink-0 text-[#F1A11D]" />
                    <span>
                      <b>{it.label}</b> {it.kind === 'empty' ? '— 비어 있어요' : '— 권장 글자 수보다 길어요'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="border-b border-[#E0E5F0] p-4">
            <h3 className="deck-label mb-3">입력 항목</h3>
            <ul className="space-y-2">
              {layout.fields.map((f) => {
                const len = (slide.content[f.key] ?? '').trim().length
                const over = f.max !== undefined && len > f.max
                return (
                  <li key={f.key} className="flex items-center justify-between text-[12px]">
                    <span className="text-[#333A4D]">{f.label}</span>
                    {f.kind === 'image' ? (
                      <span className="text-[#7A8099]">{slide.content[f.key] ? '첨부됨' : '없음'}</span>
                    ) : (
                      <span className={`tabular-nums ${over ? 'font-bold text-[#E84B55]' : 'text-[#7A8099]'}`}>
                        {len}
                        {f.max ? ` / ${f.max}` : ''}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="flex flex-1 flex-col border-b border-[#E0E5F0] p-4">
            <h3 className="deck-label mb-2">발표자 노트</h3>
            <textarea
              value={slide.notes}
              onChange={(e) => updateSlide(slide.id, (s) => ({ ...s, notes: e.target.value }))}
              placeholder="발표할 때 말할 내용을 적어두세요. PPTX 노트로 함께 내보내져요."
              className="min-h-[140px] flex-1 resize-none rounded-lg border border-[#E0E5F0] p-3 text-[13px] leading-relaxed outline-none focus:border-[#4D6BFF]"
            />
          </section>

          <section className="p-4">
            <h3 className="deck-label mb-2">하단 문구 (전체 슬라이드)</h3>
            <input
              value={deck.footer}
              onChange={(e) => onChange({ ...deck, footer: e.target.value })}
              className="w-full rounded-lg border border-[#E0E5F0] px-3 py-2 text-[12px] outline-none focus:border-[#4D6BFF]"
            />
          </section>
        </aside>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file || !imageField.current) return
          setField(imageField.current, await readImage(file))
        }}
      />

      {picker && (
        <LayoutPicker
          title={picker === 'add' ? '새 슬라이드 추가' : '레이아웃 바꾸기'}
          current={picker === 'change' ? slide.layout : undefined}
          onPick={picker === 'add' ? addSlide : changeLayout}
          onClose={() => setPicker(null)}
        />
      )}

      {checkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000038]/40 p-6" onClick={() => setCheckOpen(false)}>
          <div className="w-full max-w-[440px] rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-bold text-[#000038]">다운로드 전에 확인해 주세요</h2>
            <p className="mt-1 text-[13px] text-[#7A8099]">빈 칸은 PPTX에서 빠지고, 긴 글은 영역을 넘칠 수 있어요.</p>
            <ul className="mt-4 max-h-[280px] space-y-2 overflow-y-auto">
              {allIssues.map(({ i, issues: list }) => (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-[#E0E5F0] px-3 py-2 text-left text-[13px] hover:border-[#4D6BFF]"
                    onClick={() => {
                      setCurrent(i)
                      setCheckOpen(false)
                    }}
                  >
                    <b className="text-[#000038]">
                      {i + 1}. {LAYOUT_MAP[deck.slides[i].layout].name}
                    </b>
                    <span className="ml-2 text-[#7A8099]">
                      {list.map((x) => `${x.label}${x.kind === 'empty' ? ' 비어 있음' : ' 글자 수 초과'}`).join(' · ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="deck-btn" onClick={() => setCheckOpen(false)}>
                돌아가서 고치기
              </button>
              <button type="button" className="deck-btn deck-btn-primary" onClick={runExport}>
                그대로 다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-[#000038] px-4 py-3 text-[13px] text-white shadow-xl">
          {notice.text}
          {notice.undo && (
            <button
              type="button"
              className="font-bold text-[#9CA8FF] hover:text-white"
              onClick={() => {
                notice.undo?.()
                setNotice(null)
              }}
            >
              되돌리기
            </button>
          )}
        </div>
      )}

      {presenting && (
        <PresentMode
          deck={deck}
          start={index}
          onExit={(i) => {
            setPresenting(false)
            setCurrent(i)
          }}
        />
      )}
    </div>
  )
}
