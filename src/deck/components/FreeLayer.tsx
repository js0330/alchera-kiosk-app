import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { BRAND, ptToPx } from '../guide'
import { parseRich } from '../textStyle'
import { objTextEl } from '../freeObjects'
import type { FreeObj } from '../types'
import EditableText from './EditableText'

interface FreeLayerProps {
  objects: FreeObj[]
  scale: number
  editable?: boolean
  selectedId?: string | null
  editingId?: string | null
  onSelect?: (id: string | null) => void
  onEdit?: (id: string | null) => void
  onChange?: (obj: FreeObj) => void
}

type Handle = 'nw' | 'ne' | 'sw' | 'se'
const HANDLES: Handle[] = ['nw', 'ne', 'sw', 'se']
const MIN = 12

function boxStyle(o: FreeObj): CSSProperties {
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

function ObjView({ o }: { o: FreeObj }) {
  if (o.kind === 'image') {
    return o.src ? <img src={o.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} /> : null
  }
  if (o.kind === 'line') {
    const [x1, x2] = o.flipH ? [o.w, 0] : [0, o.w]
    const [y1, y2] = o.flipV ? [o.h, 0] : [0, o.h]
    const sw = ptToPx(o.lineWidth ?? 1)
    return (
      <svg width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={o.line ?? BRAND.colors.navy} strokeWidth={sw} />
      </svg>
    )
  }
  const [l, t, r, b] = o.pad ?? [0, 0, 0, 0]
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: o.fill,
        border: o.line ? `${ptToPx(o.lineWidth ?? 0.75)}px solid ${o.line}` : undefined,
        borderRadius: o.geom === 'ellipse' ? '50%' : o.geom === 'roundRect' ? (o.radius ?? 12) : 0,
        padding: `${t}px ${r}px ${b}px ${l}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: o.valign === 'middle' ? 'center' : o.valign === 'bottom' ? 'flex-end' : 'flex-start',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {o.text ? (
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
          {o.text.split('\n').map((line, i) => (
            <div key={i}>{line ? parseRich(line).map((run, j) => (run.bold ? <b key={j}>{run.text}</b> : run.text)) : ' '}</div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// 자유 배치 요소 레이어. 편집 모드에서는 클릭으로 선택, 끌어서 이동, 모서리로 크기 조절, 더블클릭으로 글 수정.
export default function FreeLayer({ objects, scale, editable, selectedId, editingId, onSelect, onEdit, onChange }: FreeLayerProps) {
  const drag = useRef<{ id: string; mode: 'move' | Handle; sx: number; sy: number; start: FreeObj } | null>(null)
  const objectsRef = useRef(objects)
  objectsRef.current = objects

  useEffect(() => {
    if (!editable) return
    const move = (e: PointerEvent) => {
      const d = drag.current
      if (!d) return
      const dx = (e.clientX - d.sx) / scale
      const dy = (e.clientY - d.sy) / scale
      const s = d.start
      let { x, y, w, h } = s
      if (d.mode === 'move') {
        x = s.x + dx
        y = s.y + dy
      } else {
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
        // 이미지는 Shift 없이도 비율을 유지합니다
        if (s.kind === 'image' && !e.shiftKey) {
          const ratio = s.w / s.h
          if (Math.abs(dx) > Math.abs(dy)) h = w / ratio
          else w = h * ratio
          if (d.mode.includes('w')) x = s.x + s.w - w
          if (d.mode.includes('n')) y = s.y + s.h - h
        }
      }
      const cur = objectsRef.current.find((o) => o.id === d.id)
      if (cur) onChange?.({ ...cur, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, w: Math.round(w * 10) / 10, h: Math.round(h * 10) / 10 })
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
    onSelect?.(o.id)
    drag.current = { id: o.id, mode, sx: e.clientX, sy: e.clientY, start: o }
  }

  return (
    <>
      {objects.map((o) => {
        const selected = editable && selectedId === o.id
        const editing = editable && editingId === o.id
        return (
          <div
            key={o.id}
            data-obj={o.id}
            style={{ ...boxStyle(o), cursor: editable && !editing ? 'move' : undefined }}
            className={editable ? `deck-obj${selected ? ' is-selected' : ''}` : undefined}
            onPointerDown={(e) => start(e, o, 'move')}
            onDoubleClick={() => editable && o.kind === 'shape' && onEdit?.(o.id)}
          >
            {editing ? (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.999 }}>
                  <ObjView o={{ ...o, text: '' }} />
                </div>
                <EditableText el={objTextEl(o)} value={o.text ?? ''} onChange={(v) => onChange?.({ ...o, text: v })} autoFocus onDone={() => onEdit?.(null)} />
              </div>
            ) : (
              <ObjView o={o} />
            )}
            {selected &&
              !editing &&
              HANDLES.map((hd) => <span key={hd} className={`deck-handle deck-handle-${hd}`} style={{ transform: `scale(${1 / scale})` }} onPointerDown={(e) => start(e, o, hd)} />)}
          </div>
        )
      })}
    </>
  )
}
