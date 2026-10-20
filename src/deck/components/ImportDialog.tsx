import { FileText, LoaderCircle, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ImportError, importFile, importText, type PptxMode } from '../importers'
import type { Deck } from '../types'

const TEXT_EXAMPLE = `# 보이지 않는 위험을 먼저 예측하는 AI
기존 CCTV와 환경센서를 활용한 밀폐공간 안전 예측 AI

# 문제 제기

## 개별 정보로 놓치게 되는 복합 위험
> 단일 수치만으로는 복합적인 위험 상황을 구분하지 못합니다
### 왜 놓치는가
- 개별 수치 중심 판단
- 영상·센서 정보 분리
### 해결 방향
- **영상 + 센서** 통합 분석`

interface ImportDialogProps {
  onImported: (deck: Deck, source: string) => void
  onClose: () => void
}

// PPTX · 텍스트 · 편집 파일을 받아 가이드 레이아웃으로 바꿉니다. 모든 처리는 브라우저 안에서 이뤄집니다.
export default function ImportDialog({ onImported, onClose }: ImportDialogProps) {
  const [tab, setTab] = useState<'file' | 'text'>('file')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [text, setText] = useState('')
  const [mode, setMode] = useState<PptxMode>('keep')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const run = async (job: () => Promise<Deck> | Deck, source: string) => {
    setBusy(true)
    setError('')
    try {
      onImported(await job(), source)
    } catch (e) {
      console.error(e)
      setError(e instanceof ImportError ? e.message : '파일을 읽는 중 문제가 생겼어요. 다른 파일로 다시 시도해 주세요.')
    } finally {
      setBusy(false)
    }
  }

  const onFile = (file: File | undefined) => {
    if (file) run(() => importFile(file, mode), file.name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000038]/40 p-4" onClick={() => !busy && onClose()}>
      <div className="flex max-h-full w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#E0E5F0] px-6 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-[#000038]">불러와서 가이드에 맞추기</h2>
            <p className="mt-0.5 text-[13px] text-[#7A8099]">가지고 있는 PPT나 글을 넣으면 내용을 읽어 알체라 가이드 레이아웃으로 다시 짜드려요.</p>
          </div>
          <button type="button" className="deck-btn deck-btn-ghost" onClick={onClose} aria-label="닫기" disabled={busy}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-[#E0E5F0] px-6 pt-3">
          {(
            [
              ['file', '파일 불러오기'],
              ['text', '텍스트 붙여넣기'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 pb-2.5 text-[13px] font-semibold ${tab === id ? 'border-[#0000A5] text-[#0000A5]' : 'border-transparent text-[#666] hover:text-[#000038]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {tab === 'file' ? (
            <>
              <fieldset className="mb-4 grid gap-2 sm:grid-cols-2">
                <legend className="mb-2 text-[12px] font-bold text-[#000038]">PPTX 본문 슬라이드를 어떻게 가져올까요?</legend>
                {(
                  [
                    ['keep', '원본 배치 유지', '도형 · 텍스트 · 이미지 · 표를 위치 그대로 가져와요. 가이드 상단(타이틀 · 서브 · 로고)만 입히고, 에디터에서 끌어서 고칠 수 있어요.'],
                    ['rebuild', '가이드 레이아웃으로 재구성', '글과 대표 이미지만 읽어서 라인형 레이아웃 칸에 채워요. 원본 도형은 버려요.'],
                  ] as const
                ).map(([id, label, desc]) => (
                  <label
                    key={id}
                    className={`cursor-pointer rounded-xl border p-3 text-left transition ${mode === id ? 'border-[#0000A5] bg-[#F2F4FB] ring-1 ring-[#0000A5]' : 'border-[#E0E5F0] hover:border-[#4D6BFF]'}`}
                  >
                    <input type="radio" name="import-mode" value={id} checked={mode === id} onChange={() => setMode(id)} className="sr-only" />
                    <span className="block text-[13px] font-bold text-[#000038]">{label}</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-[#666]">{desc}</span>
                  </label>
                ))}
              </fieldset>
              <button
                type="button"
                disabled={busy}
                onClick={() => input.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  onFile(e.dataTransfer.files[0])
                }}
                className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                  dragging ? 'border-[#0000A5] bg-[#F2F4FB]' : 'border-[#CFD6EA] hover:border-[#4D6BFF] hover:bg-[#FBFCFE]'
                }`}
              >
                {busy ? <LoaderCircle size={28} className="animate-spin text-[#0000A5]" /> : <Upload size={28} className="text-[#0000A5]" />}
                <p className="mt-3 text-[14px] font-bold text-[#000038]">{busy ? '읽는 중…' : '파일을 끌어다 놓거나 눌러서 선택'}</p>
                <p className="mt-1 text-[12px] text-[#7A8099]">.pptx · .txt · .md · .deck.json</p>
              </button>
              <input
                ref={input}
                type="file"
                hidden
                accept=".pptx,.txt,.md,.markdown,.json,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/markdown,application/json"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  e.target.value = ''
                  onFile(f)
                }}
              />
              <ul className="mt-4 space-y-1.5 text-[12px] leading-relaxed text-[#666]">
                <li>
                  <b className="text-[#000038]">PPTX</b> — 첫 장은 표지, 목차·간지·마무리는 가이드 레이아웃으로 바꾸고, 본문 슬라이드는 위에서 고른 방식으로 가져와요.
                </li>
                <li>
                  <b className="text-[#000038]">Google Slides · Keynote</b> — 파일 › 다운로드 › Microsoft PowerPoint(.pptx)로 받은 뒤 올려주세요.
                </li>
                <li>
                  <b className="text-[#000038]">텍스트 · 마크다운</b> — 아래 ‘텍스트 붙여넣기’ 규칙대로 읽어요.
                </li>
                <li>차트 · SmartArt는 자리만 표시돼요. 원본에서 이미지로 붙여 넣어 주세요. 가져온 뒤 ‘가이드 서식 맞추기’로 글자 크기 · 색을 가이드 값에 맞출 수 있어요.</li>
              </ul>
            </>
          ) : (
            <>
              <textarea
                id="import-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={TEXT_EXAMPLE}
                className="h-[240px] w-full resize-none rounded-xl border border-[#E0E5F0] p-4 font-mono text-[12px] leading-relaxed outline-none focus:border-[#4D6BFF]"
              />
              <div className="mt-3 grid gap-x-6 gap-y-1 text-[12px] text-[#666] sm:grid-cols-2">
                <p>
                  <code className="text-[#0000A5]"># 제목</code> 첫 줄은 표지, 그다음부터는 간지
                </p>
                <p>
                  <code className="text-[#0000A5]">## 제목</code> 본문 슬라이드
                </p>
                <p>
                  <code className="text-[#0000A5]">&gt; 문장</code> 슬라이드 서브 (한 줄)
                </p>
                <p>
                  <code className="text-[#0000A5]">### 제목</code> 칸 나누기 (1~4칸)
                </p>
                <p>
                  <code className="text-[#0000A5]">- 내용</code> 본문 줄 · <code className="text-[#0000A5]">**굵게**</code> 강조
                </p>
                <p>
                  <code className="text-[#0000A5]">---</code> 슬라이드 나누기
                </p>
              </div>
              <p className="mt-2 text-[12px] text-[#7A8099]">표시 없이 붙여넣어도 돼요. 빈 줄로 나뉜 문단마다 한 장(첫 줄이 제목)으로 만들어요.</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <button type="button" className="deck-btn deck-btn-ghost" onClick={() => setText(TEXT_EXAMPLE)}>
                  <FileText size={15} /> 예시 넣어보기
                </button>
                <button type="button" className="deck-btn deck-btn-primary" disabled={!text.trim() || busy} onClick={() => run(() => importText(text), '붙여넣은 텍스트')}>
                  {busy && <LoaderCircle size={15} className="animate-spin" />} 가이드에 맞춰 만들기
                </button>
              </div>
            </>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-[#FDECEE] px-3 py-2 text-[13px] font-semibold text-[#C2333D]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
