import { useEffect, useId, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { BRAND, ptToPx } from '../guide'
import { parseRich } from '../textStyle'
import { objTextEl } from '../freeObjects'
import { pointsAttr, shapePoints, textInsets } from '../shapes'
import type { FreeObj } from '../types'
import EditableText from './EditableText'

interface FreeLayerProps {
  objects: FreeObj[]
  scale: number
  editable?: boolean
  selectedIds?: string[]
  editingId?: string | null
  // additive: Shift·Ctrl 을 누른 채 클릭 → 선택에 더하거나 빼기
  onSelect?: (id: string | null, additive?: boolean) => void
  onEdit?: (id: string | null) => void
  onChange?: (objs: FreeObj[]) => void
}

type Handle = 'nw' | 'ne' | 'sw' | 'se' | 'p1' | 'p2'
const HANDLES: Handle[] = ['nw', 'ne', 'sw', 'se']
const MIN = 12
// 선은 얇아서 잡기 어려우므로 주변 여백까지 잡히게 합니다
const LINE_PAD = 8

const r1 = (n: number) => Math.round(n * 10) / 10

// 선의 시작점(p1)·끝점(p2). 상자 + 뒤집기로 저장되어 있습니다.
function lineEnds(o: FreeObj) {
  const p1 = { x: o.flipH ? o.x + o.w : o.x, y: o.flipV ? o.y + o.h : o.y }
  const p2 = { x: o.flipH ? o.x : o.x + o.w, y: o.flipV ? o.y : o.y + o.h }
  return { p1, p2 }
}

function fromEnds(o: FreeObj, p1: { x: number; y: number }, p2: { x: number; y: number }): FreeObj {
  return {
    ...o,
    x: r1(Math.min(p1.x, p2.x)),
    y: r1(Math.min(p1.y, p2.y)),
    w: r1(Math.abs(p2.x - p1.x)),
    h: r1(Math.abs(p2.y - p1.y)),
    flipH: p1.x > p2.x || undefined,
    flipV: p1.y > p2.y || undefined,
  }
}

function boxStyle(o: FreeObj): CSSProperties {
  if (o.kind === 'line') {
    return { position: 'absolute', left: o.x - LINE_PAD, top: o.y - LINE_PAD, width: o.w + LINE_PAD * 2, height: o.h + LINE_PAD * 2, opacity: o.opacity }
  }
  return {
    position: 'absolute',
    left: o.x,
    top: o.y,
    width: o.w,
    height: o.h,
    transform: o.rot ? `rotate(${o.rot}deg)` : undefined,
    opacity: o.opacity,
  }
}

const dashArray = (o: FreeObj, sw: number) => (o.dash === 'dash' ? `${sw * 4} ${sw * 3}` : o.dash === 'dot' ? `${sw} ${sw}` : undefined)

function LineView({ o }: { o: FreeObj }) {
  const id = useId().replace(/:/g, '')
  const sw = ptToPx(o.lineWidth ?? 1)
  const color = o.line ?? BRAND.colors.navy
  const { p1, p2 } = lineEnds(o)
  const a = { x: p1.x - o.x + LINE_PAD, y: p1.y - o.y + LINE_PAD }
  const b = { x: p2.x - o.x + LINE_PAD, y: p2.y - o.y + LINE_PAD }
  // 화살촉이 있으면 선을 조금 줄여서 촉 끝이 정확히 끝점에 오게 합니다
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  const ux = (b.x - a.x) / len
  const uy = (b.y - a.y) / len
  const head = Math.max(3, sw) * 3
  const cut = (end?: string) => (end === 'triangle' ? head * 0.8 : 0)
  const s = { x: a.x + ux * cut(o.arrowStart), y: a.y + uy * cut(o.arrowStart) }
  const e = { x: b.x - ux * cut(o.arrowEnd), y: b.y - uy * cut(o.arrowEnd) }
  const marker = (end: string | undefined, which: 's' | 'e') => {
    if (!end || end === 'none') return null
    const mid = `${id}-${which}`
    return (
      <marker id={mid} viewBox="0 0 10 10" refX={end === 'oval' ? 5 : 10} refY={5} markerUnits="userSpaceOnUse" markerWidth={head} markerHeight={head} orient="auto-start-reverse">
        {end === 'oval' ? <circle cx={5} cy={5} r={4} fill={color} /> : <path d="M0,0 L10,5 L0,10 z" fill={color} />}
      </marker>
    )
  }
  const hasS = o.arrowStart && o.arrowStart !== 'none'
  const hasE = o.arrowEnd && o.arrowEnd !== 'none'
  return (
    <svg width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        {marker(o.arrowStart, 's')}
        {marker(o.arrowEnd, 'e')}
      </defs>
      {/* 잡기 쉬운 투명한 굵은 선 */}
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={Math.max(14, sw + 10)} style={{ pointerEvents: 'stroke' }} />
      <line
        x1={hasS ? s.x : a.x}
        y1={hasS ? s.y : a.y}
        x2={hasE ? e.x : b.x}
        y2={hasE ? e.y : b.y}
        stroke={color}
        strokeWidth={sw}
        style={{ pointerEvents: 'none' }}
        strokeDasharray={dashArray(o, sw)}
        markerStart={hasS ? `url(#${id}-s)` : undefined}
        markerEnd={hasE ? `url(#${id}-e)` : undefined}
      />
    </svg>
  )
}

function TextView({ o }: { o: FreeObj }) {
  return (
    <div
      style={{
        fontSize: ptToPx(o.size ?? 10),
        fontWeight: o.bold ? 700 : 400,
        color: o.color ?? BRAND.colors.navy,
        textAlign: o.align ?? 'left',
        lineHeight: o.lineHeight ?? 1.3,
        whiteSpace: 'pre-wrap',
        wordBreak: 'keep-all',
        overflowWrap: 'anywhere',
      }}
    >
      {o.text!.split('\n').map((line, i) => (
        <div key={i}>{line ? parseRich(line).map((run, j) => (run.bold ? <b key={j}>{run.text}</b> : run.text)) : ' '}</div>
      ))}
    </div>
  )
}

function ObjView({ o }: { o: FreeObj }) {
  if (o.kind === 'image') {
    return o.src ? <img src={o.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} /> : null
  }
  if (o.kind === 'line') return <LineView o={o} />
  const [l, t, r, b] = o.pad ?? [0, 0, 0, 0]
  const [il, it, ir, ib] = textInsets(o.geom, o.w, o.h)
  const pts = shapePoints(o.geom, o.w, o.h)
  const bw = o.line ? ptToPx(o.lineWidth ?? 0.75) : 0
  const textBox: CSSProperties = {
    position: 'absolute',
    inset: 0,
    padding: `${t + it}px ${r + ir}px ${b + ib}px ${l + il}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: o.valign === 'middle' ? 'center' : o.valign === 'bottom' ? 'flex-end' : 'flex-start',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }
  if (pts) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <polygon points={pointsAttr(pts)} fill={o.fill ?? 'none'} stroke={o.line ?? 'none'} strokeWidth={bw} strokeLinejoin="round" />
        </svg>
        {o.text ? (
          <div style={textBox}>
            <TextView o={o} />
          </div>
        ) : null}
      </div>
    )
  }
  const tr = Math.min(o.w, o.h) * 0.16667
  return (
    <div
      style={{
        ...textBox,
        position: 'relative',
        width: '100%',
        height: '100%',
        background: o.fill,
        border: o.line ? `${bw}px solid ${o.line}` : undefined,
        borderRadius: o.geom === 'ellipse' ? '50%' : o.geom === 'roundRect' ? (o.radius ?? 12) : o.geom === 'round2SameRect' ? `${tr}px ${tr}px 0 0` : 0,
      }}
    >
      {o.text ? <TextView o={o} /> : null}
    </div>
  )
}

// 자유 배치 요소 레이어. 편집 모드에서는 클릭으로 선택(Shift·Ctrl+클릭으로 여러 개), 끌어서 이동,
// 모서리로 크기 조절, 선은 양 끝점을 끌어서 방향·길이 조절, 더블클릭으로 글 수정.
export default function FreeLayer({ objects, scale, editable, selectedIds = [], editingId, onSelect, onEdit, onChange }: FreeLayerProps) {
  const drag = useRef<{ ids: string[]; mode: 'move' | Handle; sx: number; sy: number; starts: FreeObj[] } | null>(null)

  useEffect(() => {
    if (!editable) return
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dx = (e.clientX - d.sx) / scale
      const dy = (e.clientY - d.sy) / scale
      if (d.mode === 'move') {
        onChange?.(d.starts.map((s) => ({ ...s, x: r1(s.x + dx), y: r1(s.y + dy) })))
        return
      }
      const s = d.starts[0]
      if (d.mode === 'p1' || d.mode === 'p2') {
        const ends = lineEnds(s)
        const fixed = d.mode === 'p1' ? ends.p2 : ends.p1
        const moving = d.mode === 'p1' ? ends.p1 : ends.p2
        let nx = moving.x + dx
        let ny = moving.y + dy
        // Shift: 가로·세로·45° 로 맞춤
        if (e.shiftKey) {
          const ang = Math.round(Math.atan2(ny - fixed.y, nx - fixed.x) / (Math.PI / 4)) * (Math.PI / 4)
          const len = Math.hypot(nx - fixed.x, ny - fixed.y)
          nx = fixed.x + Math.cos(ang) * len
          ny = fixed.y + Math.sin(ang) * len
        }
        const p = { x: nx, y: ny }
        onChange?.([d.mode === 'p1' ? fromEnds(s, p, fixed) : fromEnds(s, fixed, p)])
        return
      }
      let { x, y, w, h } = s
      if (d.mode.includes('e')) w = Math.max(MIN, s.w + dx)
      if (d.mode.includes('s')) h = Math.max(MIN, s.h + dy)
      if (d.mode.includes('w')) {
        w = Math.max(MIN, s.w - dx)
        x = s.x + s.w - w
      }
      if (d.mode.includes('n')) {
        h = Math.max(MIN, s.h - dy)
        y = s.y + s.h - h
      }
      // 이미지는 비율을 유지하고, 도형은 Shift 를 누르면 비율 유지
      if ((s.kind === 'image') !== e.shiftKey) {
        const ratio = s.w / s.h
        if (Math.abs(dx) > Math.abs(dy)) h = w / ratio
        else w = h * ratio
        if (d.mode.includes('w')) x = s.x + s.w - w
        if (d.mode.includes('n')) y = s.y + s.h - h
      }
      onChange?.([{ ...s, x: r1(x), y: r1(y), w: r1(w), h: r1(h) }])
    }
    const up = () => (drag.current = null)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [editable, scale, onChange])

  const start = (e: ReactPointerEvent, o: FreeObj, mode: 'move' | Handle) => {
    if (!editable || editingId === o.id) return
    e.stopPropagation()
    e.preventDefault()
    if (mode === 'move' && (e.shiftKey || e.metaKey || e.ctrlKey)) {
      onSelect?.(o.id, true)
      return
    }
    const ids = mode === 'move' && selectedIds.includes(o.id) ? selectedIds : [o.id]
    if (!selectedIds.includes(o.id) || mode !== 'move') onSelect?.(o.id)
    drag.current = { ids, mode, sx: e.clientX, sy: e.clientY, starts: objects.filter((x) => ids.includes(x.id)) }
  }

  const single = selectedIds.length === 1

  return (
    <>
      {objects.map((o) => {
        const selected = editable && selectedIds.includes(o.id)
        const editing = editable && editingId === o.id
        const isLine = o.kind === 'line'
        const ends = isLine ? lineEnds(o) : null
        return (
          <div
            key={o.id}
            data-obj={o.id}
            style={{ ...boxStyle(o), cursor: editable && !editing ? 'move' : undefined, pointerEvents: isLine ? 'none' : undefined }}
            className={editable ? `deck-obj${isLine ? ' is-line' : ''}${selected ? ' is-selected' : ''}` : undefined}
            onPointerDown={(e) => start(e, o, 'move')}
            onDoubleClick={() => editable && o.kind === 'shape' && onEdit?.(o.id)}
          >
            {editing ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.999 }}>
                  <ObjView o={{ ...o, text: '' }} />
                </div>
                <EditableText el={objTextEl(o)} value={o.text ?? ''} onChange={(v) => onChange?.([{ ...o, text: v }])} autoFocus onDone={() => onEdit?.(null)} />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', pointerEvents: isLine ? 'none' : undefined }}>
                <ObjView o={o} />
              </div>
            )}
            {selected &&
              single &&
              !editing &&
              !isLine &&
              HANDLES.map((hd) => <span key={hd} className={`deck-handle deck-handle-${hd}`} style={{ transform: `scale(${1 / scale})` }} onPointerDown={(e) => start(e, o, hd)} />)}
            {selected &&
              single &&
              ends &&
              (['p1', 'p2'] as const).map((hd) => {
                const p = ends[hd]
                return (
                  <span
                    key={hd}
                    className="deck-handle deck-handle-end"
                    style={{ left: p.x - o.x + LINE_PAD - 7, top: p.y - o.y + LINE_PAD - 7, transform: `scale(${1 / scale})`, pointerEvents: 'auto' }}
                    onPointerDown={(e) => start(e, o, hd)}
                  />
                )
              })}
          </div>
        )
      })}
    </>
  )
}
