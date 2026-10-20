import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Copy,
  Download,
  FileJson,
  LayoutTemplate,
  LibraryBig,
  LoaderCircle,
  Eye,
  EyeOff,
  ImagePlus,
  Play,
  Plus,
  Redo2,
  Trash2,
  Type,
  Undo2,
  WandSparkles,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { LineMenu, ShapeMenu } from '../components/InsertMenus'
import LayoutPicker from '../components/LayoutPicker'
import LibraryPanel from '../components/LibraryPanel'
import ObjectPanel from '../components/ObjectPanel'
import PresentMode from '../components/PresentMode'
import SlideCanvas from '../components/SlideCanvas'
import { SLIDE_H, SLIDE_W } from '../guide'
import { LINE_KINDS, newImage, newLine, newShape, newText, snapToGuide } from '../freeObjects'
import { INSERT_MIME, type InsertPayload } from '../insert'
import { makeSlide, uid } from '../kits'
import { FREE_AREA, LAYOUT_MAP, checkSlide, sectionFor } from '../layouts'
import { BLOCKS, newIcon, placeObjects, resolveIcons, tintIcon } from '../library'
import { downloadBlob, safeFileName, type SaveState } from '../store'
import type { Deck, FreeObj, LayoutId, Slide } from '../types'

// 복사한 자유 배치 요소. 다른 슬라이드·다른 문서에도 붙여넣을 수 있도록 모듈에 둡니다.
const CLIP_MARK = 'alchera-deck-objects:'
let objClipboard: { key: string; objs: FreeObj[]; pasted: number } | null = null

// 되돌리기 기록: 같은 칸을 이어서 입력하거나 같은 요소를 끄는 동안의 변화는 한 단계로 묶습니다
const MERGE_MS = 1000
const HISTORY_MAX = 100

const GUIDES_KEY = 'alchera-deck-show-guides'
const readShowGuides = () => {
  try {
    return localStorage.getItem(GUIDES_KEY) !== 'off'
  } catch {
    return true
  }
}

interface StudioPageProps {
  deck: Deck
  saveState: SaveState
  onChange: (deck: Deck) => void
  initialNotice?: string
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

export default function StudioPage({ deck, saveState, onChange: saveDeck, initialNotice }: StudioPageProps) {
  const [current, setCurrent] = useState(0)
  const [picker, setPicker] = useState<'add' | 'change' | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ text: string; undo?: () => void } | null>(initialNotice ? { text: initialNotice } : null)
  const imageField = useRef<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const canvasBox = useRef<HTMLDivElement>(null)
  const [canvasW, setCanvasW] = useState(960)
  // 슬라이드 위 요소: 선택한 요소들 · 글을 고치는 중인 요소
  const [selectedObjs, setSelectedObjs] = useState<string[]>([])
  const [editingObj, setEditingObj] = useState<string | null>(null)
  const [showGuides, setShowGuides] = useState(readShowGuides)

  const index = Math.min(current, deck.slides.length - 1)
  const slide = deck.slides[index]
  const layout = LAYOUT_MAP[slide.layout]
  const issues = checkSlide(slide)
  const allIssues = deck.slides.map((s, i) => ({ i, issues: checkSlide(s) })).filter((x) => x.issues.length)

  // 최신 deck 을 ref 로 들고 있어야 빠르게 입력해도 이전 값으로 덮어쓰지 않습니다.
  const deckRef = useRef(deck)
  deckRef.current = deck

  // ── 되돌리기 · 다시 실행 ──────────────────────────────────────
  const history = useRef<{ undo: Deck[]; redo: Deck[]; key?: string; at: number }>({ undo: [], redo: [], at: 0 })
  const [, setHistoryTick] = useState(0)
  useEffect(() => {
    history.current = { undo: [], redo: [], at: 0 }
    setHistoryTick((n) => n + 1)
  }, [deck.id])

  // mergeKey 가 같고 1초 안에 이어진 변화(같은 칸 입력, 같은 요소 끌기)는 되돌리기 한 번에 함께 돌아갑니다
  const onChange = useCallback(
    (next: Deck, mergeKey?: string) => {
      const h = history.current
      const now = Date.now()
      if (!(mergeKey && mergeKey === h.key && now - h.at < MERGE_MS)) {
        h.undo.push(deckRef.current)
        if (h.undo.length > HISTORY_MAX) h.undo.shift()
        setHistoryTick((n) => n + 1)
      }
      h.key = mergeKey
      h.at = now
      h.redo = []
      deckRef.current = next
      saveDeck(next)
    },
    [saveDeck],
  )

  const step = useCallback(
    (dir: 'undo' | 'redo') => {
      const h = history.current
      const target = dir === 'undo' ? h.undo.pop() : h.redo.pop()
      if (!target) return
      ;(dir === 'undo' ? h.redo : h.undo).push(deckRef.current)
      h.key = undefined
      deckRef.current = target
      saveDeck(target)
      setEditingObj(null)
      setSelectedObjs((ids) => ids.filter((id) => target.slides.some((s) => s.objects?.some((o) => o.id === id))))
      setHistoryTick((n) => n + 1)
    },
    [saveDeck],
  )
  const undo = useCallback(() => step('undo'), [step])
  const redo = useCallback(() => step('redo'), [step])
  const canUndo = history.current.undo.length > 0
  const canRedo = history.current.redo.length > 0

  const setSlides = useCallback(
    (fn: (slides: Slide[]) => Slide[], mergeKey?: string) => onChange({ ...deckRef.current, slides: fn(deckRef.current.slides) }, mergeKey),
    [onChange],
  )

  const updateSlide = useCallback(
    (id: string, fn: (s: Slide) => Slide, mergeKey?: string) => setSlides((slides) => slides.map((s) => (s.id === id ? fn(s) : s)), mergeKey),
    [setSlides],
  )

  const setField = useCallback(
    (key: string, value: string) => updateSlide(slide.id, (s) => ({ ...s, content: { ...s.content, [key]: value } }), `field:${slide.id}:${key}`),
    [slide.id, updateSlide],
  )

  const objects = useMemo(() => slide.objects ?? [], [slide.objects])
  const selected = useMemo(() => objects.filter((o) => selectedObjs.includes(o.id)), [objects, selectedObjs])

  const setObjects = useCallback(
    (fn: (objs: FreeObj[]) => FreeObj[], mergeKey?: string) => updateSlide(slide.id, (s) => ({ ...s, objects: fn(s.objects ?? []) }), mergeKey),
    [slide.id, updateSlide],
  )
  // 끌기·크기 조절·글 수정: 같은 요소들의 연속 변화는 한 단계로
  const updateObjs = useCallback(
    (changed: FreeObj[]) => {
      const map = new Map(changed.map((o) => [o.id, o]))
      setObjects((objs) => objs.map((x) => map.get(x.id) ?? x), `objs:${slide.id}:${changed.map((o) => o.id).join(',')}`)
    },
    [setObjects, slide.id],
  )

  // 새 요소 넣기: 아이콘은 칠하고, 위치를 정한 뒤(끌어다 놓은 곳 또는 원래 자리) 모두 선택합니다
  const insert = useCallback(
    async (objs: FreeObj[], center?: { x: number; y: number }) => {
      const placed = placeObjects(await resolveIcons(objs), center)
      setObjects((list) => [...list, ...placed])
      setSelectedObjs(placed.map((o) => o.id))
      setEditingObj(null)
    },
    [setObjects],
  )
  const addObj = (o: FreeObj) => insert([o])

  const removeSelected = useCallback(() => {
    const ids = latestSel.current
    if (!ids.length) return
    setObjects((objs) => objs.filter((o) => !ids.includes(o.id)))
    setSelectedObjs([])
    setEditingObj(null)
  }, [setObjects])
  const duplicateSelected = useCallback(() => {
    const ids = latestSel.current
    const copies = (deckRef.current.slides.find((s) => s.id === slide.id)?.objects ?? [])
      .filter((o) => ids.includes(o.id))
      .map((o) => ({ ...o, id: uid(), x: o.x + 16, y: o.y + 16 }))
    if (!copies.length) return
    setObjects((objs) => [...objs, ...copies])
    setSelectedObjs(copies.map((o) => o.id))
  }, [setObjects, slide.id])
  const orderSelected = (dir: 'front' | 'back') =>
    setObjects((objs) => {
      const sel = objs.filter((x) => selectedObjs.includes(x.id))
      const rest = objs.filter((x) => !selectedObjs.includes(x.id))
      return dir === 'front' ? [...rest, ...sel] : [...sel, ...rest]
    })
  // 오른쪽 패널에서 바꾼 값을 선택한 모든 요소에 적용. 아이콘 색은 다시 칠합니다.
  const patchSelected = (patch: Partial<FreeObj>) => {
    const ids = selectedObjs
    setObjects((objs) => objs.map((o) => (ids.includes(o.id) ? { ...o, ...patch } : o)))
    if (patch.color) {
      const color = patch.color
      for (const o of objects.filter((x) => ids.includes(x.id) && x.icon)) {
        tintIcon(o.icon!, color).then((src) => {
          const cur = deckRef.current.slides.find((s) => s.id === slide.id)?.objects?.find((x) => x.id === o.id)
          if (cur && cur.color === color) updateObjs([{ ...cur, src }])
        })
      }
    }
  }

  const latestSel = useRef(selectedObjs)
  latestSel.current = selectedObjs

  useEffect(() => {
    setSelectedObjs([])
    setEditingObj(null)
  }, [slide.id])

  useEffect(() => {
    try {
      localStorage.setItem(GUIDES_KEY, showGuides ? 'on' : 'off')
    } catch {
      // 무시
    }
  }, [showGuides])

  // 복사 · 잘라내기 · 붙여넣기: 선택한 요소들, 캡처한 이미지, 다른 곳에서 복사한 글
  const latest = useRef({ selected, slideId: slide.id })
  latest.current = { selected, slideId: slide.id }
  useEffect(() => {
    const typing = (t: EventTarget | null) => {
      const el = t as HTMLElement | null
      return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
    }
    const onCopy = (e: ClipboardEvent, cut: boolean) => {
      const { selected: sel } = latest.current
      if (typing(e.target) || !sel.length) return
      const key = uid()
      objClipboard = { key, objs: sel, pasted: 0 }
      e.clipboardData?.setData('text/plain', `${CLIP_MARK}${key}`)
      e.preventDefault()
      if (cut) removeSelected()
      const what = sel.length > 1 ? `${sel.length}개 요소를` : ''
      setNotice({ text: `${what} ${cut ? "잘라냈어요" : "복사했어요"}. 원하는 슬라이드에서 Ctrl+V로 붙여넣으세요.`.trim() })
    }
    const onPaste = (e: ClipboardEvent) => {
      if (typing(e.target)) return
      const data = e.clipboardData
      if (!data) return
      const text = data.getData('text/plain')
      const image = Array.from(data.files).find((f) => f.type.startsWith('image/'))
      const internal = text.startsWith(CLIP_MARK) && objClipboard && text === `${CLIP_MARK}${objClipboard.key}` ? objClipboard : null
      if (!internal && !image && !text.trim()) return
      e.preventDefault()
      if (internal) {
        internal.pasted += 1
        const shift = 16 * internal.pasted
        const copies = internal.objs.map((o) => ({ ...o, id: uid(), x: o.x + shift, y: o.y + shift }))
        setObjects((objs) => [...objs, ...copies])
        setSelectedObjs(copies.map((o) => o.id))
      } else if (image) {
        readImage(image).then((src) => {
          const img = new Image()
          img.onload = () => addObj(newImage(src, img.naturalWidth, img.naturalHeight))
          img.src = src
        })
      } else {
        const lines = text.replace(/\r\n?/g, '\n').trim()
        addObj(newText({ text: lines, h: Math.min(400, 24 + lines.split('\n').length * 24) }))
      }
    }
    const copy = (e: ClipboardEvent) => onCopy(e, false)
    const cut = (e: ClipboardEvent) => onCopy(e, true)
    window.addEventListener('copy', copy)
    window.addEventListener('cut', cut)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('copy', copy)
      window.removeEventListener('cut', cut)
      window.removeEventListener('paste', onPaste)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removeSelected, setObjects])

  // 단축키: Ctrl+Z 되돌리기 · Ctrl+Shift+Z / Ctrl+Y 다시 실행 · Ctrl+A 요소 전체 선택
  // 선택한 요소: Delete 삭제 · 방향키 이동 · Ctrl+D 복제 · Esc 선택 해제 · Enter 글 수정
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      // 글을 입력하는 중에는 브라우저 기본 동작(글자 단위 되돌리기·전체 선택)을 그대로 씁니다
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()
      if (mod && k === 'z') {
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && k === 'y') redo()
      else if (mod && k === 'a') {
        setSelectedObjs(objects.map((o) => o.id))
        setEditingObj(null)
      } else if (!selected.length || editingObj) return
      else {
        const stepPx = e.shiftKey ? 10 : 1
        const moves: Record<string, [number, number]> = { ArrowLeft: [-stepPx, 0], ArrowRight: [stepPx, 0], ArrowUp: [0, -stepPx], ArrowDown: [0, stepPx] }
        if (e.key === 'Delete' || e.key === 'Backspace') removeSelected()
        else if (moves[e.key]) updateObjs(selected.map((o) => ({ ...o, x: o.x + moves[e.key][0], y: o.y + moves[e.key][1] })))
        else if (mod && k === 'd') duplicateSelected()
        else if (e.key === 'Escape') setSelectedObjs([])
        else if (e.key === 'Enter' && selected.length === 1 && selected[0].kind === 'shape') setEditingObj(selected[0].id)
        else return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [objects, selected, editingObj, undo, redo, removeSelected, updateObjs, duplicateSelected])

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

  // 메뉴·라이브러리에서 끌어다 놓기
  const payloadObjs = (p: InsertPayload): FreeObj[] => {
    if (p.type === 'shape') return [newShape(p.geom)]
    if (p.type === 'line') return [newLine(LINE_KINDS.find((k) => k.id === p.id) ?? LINE_KINDS[0])]
    if (p.type === 'icon') return [newIcon(p.id)]
    return BLOCKS.find((b) => b.id === p.id)?.build() ?? []
  }
  const onDrop = (e: DragEvent) => {
    const raw = e.dataTransfer.getData(INSERT_MIME)
    const box = canvasBox.current?.getBoundingClientRect()
    if (!raw || !box) return
    e.preventDefault()
    const scale = box.width / SLIDE_W
    insert(payloadObjs(JSON.parse(raw) as InsertPayload), { x: (e.clientX - box.left) / scale, y: (e.clientY - box.top) / scale })
  }
  const freeCenter = { x: FREE_AREA.x + FREE_AREA.w / 2, y: FREE_AREA.y + FREE_AREA.h / 2 }

  const addSlide = (id: LayoutId) => {
    const s = makeSlide(id)
    setSlides((slides) => [...slides.slice(0, index + 1), s, ...slides.slice(index + 1)])
    setCurrent(index + 1)
    setPicker(null)
  }

  const changeLayout = (id: LayoutId) => {
    updateSlide(slide.id, (s) => ({ ...s, layout: id, tone: LAYOUT_MAP[id].tone }))
    setPicker(null)
  }

  const duplicate = (i: number) => {
    setSlides((slides) => [
      ...slides.slice(0, i + 1),
      { ...slides[i], id: uid(), content: { ...slides[i].content }, objects: slides[i].objects?.map((o) => ({ ...o, id: uid() })) },
      ...slides.slice(i + 1),
    ])
    setCurrent(i + 1)
  }

  const remove = (i: number) => {
    if (deck.slides.length === 1) return
    setSlides((slides) => slides.filter((_, j) => j !== i))
    setCurrent(Math.max(0, i - 1))
    setNotice({
      text: `${i + 1}번 슬라이드를 삭제했어요`,
      undo: () => {
        undo()
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

  return (
    <div className="flex h-screen flex-col">
      {/* 상단 바 */}
      <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-[#E0E5F0] bg-white px-3">
        <a href="#templates" className="deck-btn deck-btn-ghost px-2" aria-label="템플릿으로">
          <ArrowLeft size={18} />
        </a>
        <input
          value={deck.title}
          onChange={(e) => onChange({ ...deck, title: e.target.value }, 'title')}
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

      {/* 슬라이드 도구: 되돌리기 · 레이아웃 · 요소 넣기 */}
      <div className="flex h-12 flex-shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#E0E5F0] bg-[#FBFCFE] px-3">
        <button type="button" className="deck-btn deck-btn-ghost px-2" disabled={!canUndo} onClick={undo} title="되돌리기 (Ctrl+Z)" aria-label="되돌리기">
          <Undo2 size={16} />
        </button>
        <button type="button" className="deck-btn deck-btn-ghost px-2" disabled={!canRedo} onClick={redo} title="다시 실행 (Ctrl+Shift+Z)" aria-label="다시 실행">
          <Redo2 size={16} />
        </button>
        <div className="mx-1 h-6 w-px flex-shrink-0 bg-[#E0E5F0]" />
        <button type="button" className="deck-btn" onClick={() => setPicker('change')}>
          <LayoutTemplate size={16} /> 레이아웃: {layout.name}
        </button>
        <button
          type="button"
          className={`deck-btn ${showGuides ? 'deck-btn-ghost' : 'border-[#0000A5] text-[#0000A5]'}`}
          onClick={() => setShowGuides((v) => !v)}
          title="편집용 점선과 빈 칸 안내 문구를 숨기고 실제 결과처럼 봅니다"
        >
          {showGuides ? <EyeOff size={15} /> : <Eye size={15} />} {showGuides ? '편집선 숨기기' : '편집선 보기'}
        </button>
        <button type="button" className="deck-btn deck-btn-ghost" onClick={() => duplicate(index)} title="이 슬라이드 복제">
          <Copy size={15} /> 복제
        </button>
        <button type="button" className="deck-btn deck-btn-ghost" disabled={deck.slides.length === 1} onClick={() => remove(index)} title="이 슬라이드 삭제">
          <Trash2 size={15} /> 삭제
        </button>
        <div className="mx-1 h-6 w-px flex-shrink-0 bg-[#E0E5F0]" />
        <button type="button" className="deck-btn deck-btn-ghost" onClick={() => addObj(newText())}>
          <Type size={15} /> 텍스트
        </button>
        <ShapeMenu onPick={(g) => addObj(newShape(g))} />
        <LineMenu onPick={(k) => addObj(newLine(k))} />
        <button type="button" className="deck-btn deck-btn-ghost" onClick={() => pickImage('__free__')}>
          <ImagePlus size={15} /> 이미지
        </button>
        <button
          type="button"
          className={`deck-btn ${libraryOpen ? 'border-[#0000A5] bg-[#EEF1FB] text-[#0000A5]' : ''}`}
          onClick={() => setLibraryOpen((v) => !v)}
          title="샘플덱의 아이콘 · 구성 블록 · 도형을 골라 넣습니다"
        >
          <LibraryBig size={15} /> 요소 라이브러리
        </button>
        {objects.length > 0 && (
          <button
            type="button"
            className="deck-btn deck-btn-ghost"
            title="이 슬라이드에 올린 요소의 글자 크기·색·배경을 가이드 값으로 맞춥니다"
            onClick={() => {
              setObjects((objs) => objs.map(snapToGuide))
              setNotice({ text: '이 슬라이드를 가이드 서식(글자 크기·색·배경)에 맞췄어요', undo })
            }}
          >
            <WandSparkles size={15} /> 가이드 서식 맞추기
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* 썸네일 (요소 라이브러리를 열면 그 자리에 라이브러리) */}
        <aside className={`w-[200px] flex-shrink-0 flex-col border-r border-[#E0E5F0] bg-white ${libraryOpen ? 'hidden' : 'flex'}`}>
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
                    <SlideCanvas slide={s} index={i} section={sectionFor(deck.slides, i)} width={152} />
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

        {libraryOpen && (
          <LibraryPanel
            onClose={() => setLibraryOpen(false)}
            onShape={(g) => addObj(newShape(g))}
            onLine={(k) => addObj(newLine(k))}
            onIcon={(id) => insert([newIcon(id)], freeCenter)}
            onBlock={(b) => insert(b.build())}
          />
        )}

        {/* 편집 캔버스 — 라이브러리·도형 메뉴에서 끌어다 놓을 수 있습니다 */}
        <main
          ref={stage}
          className="flex min-w-0 flex-1 items-center justify-center overflow-auto bg-[#EEF1F7]"
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(INSERT_MIME)) {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }
          }}
          onDrop={onDrop}
        >
          <div ref={canvasBox} className="shadow-[0_8px_30px_rgba(0,0,56,0.12)]">
            <SlideCanvas
              slide={slide}
              index={index}
              section={sectionFor(deck.slides, index)}
              width={canvasW}
              editable
              onFieldChange={setField}
              onImagePick={pickImage}
              onImageClear={(key) => setField(key, '')}
              selectedObjs={selectedObjs}
              editingObj={editingObj}
              onSelectObj={(id, additive) => {
                if (id !== editingObj) setEditingObj(null)
                if (!id) setSelectedObjs([])
                else if (additive) setSelectedObjs((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))
                else setSelectedObjs([id])
              }}
              onSelectObjs={setSelectedObjs}
              onEditObj={setEditingObj}
              onObjChange={updateObjs}
              showGuides={showGuides}
            />
          </div>
        </main>

        {/* 오른쪽 패널: 가이드 체크 + 발표자 노트 */}
        <aside className="hidden w-[280px] flex-shrink-0 flex-col overflow-y-auto border-l border-[#E0E5F0] bg-white lg:flex">
          {selected.length > 0 && (
            <ObjectPanel
              objs={selected}
              onPatch={patchSelected}
              onRemove={removeSelected}
              onDuplicate={duplicateSelected}
              onOrder={orderSelected}
              onSnap={() => setObjects((objs) => objs.map((o) => (selectedObjs.includes(o.id) ? snapToGuide(o) : o)))}
            />
          )}
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
              onChange={(e) => updateSlide(slide.id, (s) => ({ ...s, notes: e.target.value }), `notes:${slide.id}`)}
              placeholder="발표할 때 말할 내용을 적어두세요. PPTX 노트로 함께 내보내져요."
              className="min-h-[140px] flex-1 resize-none rounded-lg border border-[#E0E5F0] p-3 text-[13px] leading-relaxed outline-none focus:border-[#4D6BFF]"
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
          const src = await readImage(file)
          if (imageField.current === '__free__') {
            const img = new Image()
            img.onload = () => addObj(newImage(src, img.naturalWidth, img.naturalHeight))
            img.src = src
          } else setField(imageField.current, src)
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
