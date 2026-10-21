import { FileText, Info, LoaderCircle, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { GoogleError, SCOPE_READ, downloadSlidesAsPptx, getGoogleToken, loadGoogle } from '../google'
import { ImportError, importFile, importGoogleSlides, importPptx, importText, parseGoogleSlidesId, type PptxMode } from '../importers'
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

// ⓘ: 올렸을 때만 설명 (가장 가까운 relative 상자 너비로 뜸)
function Tip({ text, below = false }: { text: string; below?: boolean }) {
  return (
    <span className="group/tip inline-flex p-0.5" aria-label={text} tabIndex={0}>
      <Info size={13} className="text-[#B4BAC9] transition group-hover/tip:text-[#0000A5] group-focus/tip:text-[#0000A5]" />
      <span
        className={`pointer-events-none absolute left-0 right-0 z-20 whitespace-pre-line rounded-md bg-[#000038] px-3 py-2 text-[12px] font-normal leading-relaxed text-white opacity-0 shadow-lg transition group-hover/tip:opacity-100 group-focus/tip:opacity-100 ${below ? 'top-full mt-1' : 'bottom-full mb-1'}`}
      >
        {text}
      </span>
    </span>
  )
}

interface ImportDialogProps {
  onImported: (deck: Deck, source: string) => void
  onClose: () => void
}

// PPTX · 텍스트 · 편집 파일을 받아 가이드 레이아웃으로 바꿉니다. 모든 처리는 브라우저 안에서 이뤄집니다.
export default function ImportDialog({ onImported, onClose }: ImportDialogProps) {
  const [tab, setTab] = useState<'file' | 'link' | 'text'>('file')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // 로그인해야 열리는 구글 슬라이드면 '회사 계정으로 가져오기'를 보여 줍니다
  const [needLogin, setNeedLogin] = useState(false)
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
    setNeedLogin(false)
    try {
      onImported(await job(), source)
    } catch (e) {
      console.error(e)
      setError(e instanceof ImportError || e instanceof GoogleError ? e.message : '파일을 읽는 중 문제가 생겼어요. 다른 파일로 다시 시도해 주세요.')
      if (e instanceof ImportError && e.code === 'not-shared') {
        setNeedLogin(true)
        loadGoogle().catch(() => undefined)
      }
    } finally {
      setBusy(false)
    }
  }

  const onFile = (file: File | undefined) => {
    if (file) run(() => importFile(file, mode), file.name)
  }

  const importLink = () => run(() => importGoogleSlides(url, mode), 'Google Slides')
  // 회사 계정으로 로그인해서 받기 (누른 그 자리에서 로그인 창을 엽니다)
  const importWithLogin = () => {
    const id = parseGoogleSlidesId(url)
    if (!id) return
    const token = getGoogleToken(SCOPE_READ)
    run(async () => {
      const { data, name } = await downloadSlidesAsPptx(id, await token)
      return importPptx(data, name, mode)
    }, 'Google Slides')
  }

  // PPTX · 구글 슬라이드 본문을 가져오는 방식 (두 탭이 함께 씁니다)
  const modeChooser = (
    <div className="relative mb-4 flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-[12px] font-semibold text-[#000038]">
        가져오는 방식
        <Tip below text={'원본 그대로: 키 네임·타이틀·서브는 가이드 자리로, 나머지는 가이드 박스 자리 안에 원래 배치 그대로 (박스 선 없이) 가져와요.\n가이드로 다시 짜기: 키 네임·타이틀·서브는 가이드 자리에, 나머지 내용은 그대로 라인형 1단 가이드 박스 안에 맞춰 넣어요.'} />
      </span>
      <div className="ml-auto flex rounded-lg bg-[#F2F4FB] p-0.5">
        {(
          [
            ['keep', '원본 그대로'],
            ['rebuild', '가이드로 다시 짜기'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded-md px-3 py-1.5 text-[12px] font-semibold ${mode === id ? 'bg-white text-[#0000A5] shadow-sm' : 'text-[#7A8099] hover:text-[#000038]'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000038]/40 p-4" onClick={() => !busy && onClose()}>
      <div className="flex max-h-full w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-[#E0E5F0] px-6 py-4">
          <div>
            <h2 className="text-[17px] font-bold text-[#000038]">불러오기</h2>
            <p className="mt-0.5 text-[13px] text-[#7A8099]">PPT · 구글 슬라이드 · 글을 가이드에 맞춰 가져와요.</p>
          </div>
          <button type="button" className="deck-btn deck-btn-ghost" onClick={onClose} aria-label="닫기" disabled={busy}>
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-[#E0E5F0] px-6 pt-3">
          {(
            [
              ['file', '파일'],
              ['link', '구글 슬라이드'],
              ['text', '텍스트'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id)
                setError('')
                setNeedLogin(false)
              }}
              className={`-mb-px border-b-2 px-3 pb-2.5 text-[13px] font-semibold ${tab === id ? 'border-[#0000A5] text-[#0000A5]' : 'border-transparent text-[#666] hover:text-[#000038]'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {tab === 'link' ? (
            <>
              {modeChooser}
              <div className="flex gap-2">
                <input
                  id="import-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && url.trim() && !busy && importLink()}
                  placeholder="구글 슬라이드 주소 붙여넣기"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-[#E0E5F0] px-3 text-[13px] outline-none focus:border-[#4D6BFF]"
                />
                <button type="button" className="deck-btn deck-btn-primary h-10" disabled={!url.trim() || busy} onClick={importLink}>
                  {busy && <LoaderCircle size={15} className="animate-spin" />} {busy ? '가져오는 중…' : '가져오기'}
                </button>
              </div>
              <p className="relative mt-3 flex items-center gap-1 text-[12px] text-[#7A8099]">
                ‘링크가 있는 모든 사용자’는 바로, ‘알체라’ 공유는 회사 계정으로 가져와요
                <Tip
                  below
                  text={'구글 슬라이드 [공유] → 일반 액세스를 ‘링크가 있는 모든 사용자’로 바꿔 주세요. 가져온 뒤 다시 돌려도 돼요.\n‘알체라’(회사 사람만)로 공유된 파일은 가져오기를 누른 뒤 ‘회사 계정으로 가져오기’로 받을 수 있어요.'}
                />
              </p>
            </>
          ) : tab === 'file' ? (
            <>
              {modeChooser}
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
                <p className="mt-1 text-[12px] text-[#7A8099]">.pptx · .txt · .md · 편집 파일(.deck.json)</p>
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
              <p className="relative mt-3 flex items-center gap-1 text-[12px] text-[#7A8099]">
                구글 슬라이드 · Keynote는 .pptx로 저장해서 올려 주세요
                <Tip
                  below
                  text={'첫 장은 표지, 목차·간지·마무리는 가이드 레이아웃으로 바뀌어요.\n차트·SmartArt는 자리만 표시돼요. 원본에서 그림으로 복사해 붙여 넣어 주세요.'}
                />
              </p>
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
              <details className="mt-3 rounded-lg bg-[#F5F7FC] px-3 py-2 text-[12px] text-[#5A6178]">
                <summary className="cursor-pointer font-semibold text-[#333A4D]">쓰는 규칙 보기 (그냥 붙여넣어도 돼요)</summary>
                <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  <p>
                    <code className="text-[#0000A5]"># 제목</code> 표지 · 간지
                  </p>
                  <p>
                    <code className="text-[#0000A5]">## 제목</code> 본문 한 장
                  </p>
                  <p>
                    <code className="text-[#0000A5]">&gt; 문장</code> 슬라이드 서브
                  </p>
                  <p>
                    <code className="text-[#0000A5]">### 제목</code> 칸 나누기
                  </p>
                  <p>
                    <code className="text-[#0000A5]">- 내용</code> 본문 줄
                  </p>
                  <p>
                    <code className="text-[#0000A5]">---</code> 장 나누기
                  </p>
                </div>
                <p className="mt-2 text-[#7A8099]">표시가 없으면 빈 줄로 나뉜 문단마다 한 장(첫 줄이 제목)으로 만들어요.</p>
              </details>
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
            <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-[#FDECEE] px-3 py-2 text-[13px] font-semibold text-[#C2333D]">
              <span className="min-w-0 flex-1">{error}</span>
              {needLogin && tab === 'link' && (
                <button type="button" className="deck-btn deck-btn-primary h-8" disabled={busy} onClick={importWithLogin}>
                  회사 계정으로 가져오기
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
