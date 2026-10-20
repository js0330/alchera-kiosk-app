import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { memo, type CSSProperties } from 'react'
import { BRAND, SLIDE_H, SLIDE_W, TONES, ptToPx } from '../guide'
import { buildSlide, slideTone } from '../layouts'
import type { FreeObj, ImageEl, ShapeEl, Slide, SlideEl, TextEl } from '../types'
import { listClass, parseRich, textStyle } from '../textStyle'
import EditableText from './EditableText'
import FreeLayer from './FreeLayer'

interface SlideCanvasProps {
  slide: Slide
  index: number
  section?: string
  width: number
  editable?: boolean
  showPlaceholders?: boolean
  onFieldChange?: (key: string, value: string) => void
  onImagePick?: (key: string) => void
  onImageClear?: (key: string) => void
  // 자유 배치 슬라이드 편집
  selectedObj?: string | null
  editingObj?: string | null
  onSelectObj?: (id: string | null) => void
  onEditObj?: (id: string | null) => void
  onObjChange?: (obj: FreeObj) => void
  // false 면 편집 점선·빈 칸 안내를 숨깁니다
  showGuides?: boolean
}

const box = (el: SlideEl): CSSProperties => ({ position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h })

function StaticText({ el, value, placeholder }: { el: TextEl; value: string; placeholder: boolean }) {
  const showPh = !value.trim() && placeholder && el.placeholder
  if (!value.trim() && !showPh) return null
  const style: CSSProperties = { ...box(el), ...textStyle(el), ['--para-space' as string]: `${el.paraSpace ? ptToPx(el.paraSpace) : 0}px` }
  if (showPh) return <div style={{ ...style, opacity: 0.35 }}>{el.placeholder}</div>
  const lines = value.split('\n')
  return (
    <div className={listClass(el)} style={style}>
      {(el.list === 'number' ? lines.filter((l) => l.trim()) : lines).map((line, i) => (
        <div key={i}>{el.rich ? parseRich(line).map((r, j) => (r.bold ? <b key={j}>{r.text}</b> : r.text)) : line || '\u00a0'}</div>
      ))}
    </div>
  )
}

function shapeStyle(el: ShapeEl): CSSProperties {
  const r = el.type === 'ellipse' ? '50%' : el.topOnly ? `${el.radius}px ${el.radius}px 0 0` : el.radius
  return {
    ...box(el),
    background: el.fill,
    border: el.line ? `${ptToPx(el.lineWidth ?? 1)}px solid ${el.line}` : undefined,
    borderRadius: r,
    opacity: el.opacity,
    // 가이드: 라인형 패널은 위쪽으로 2.25pt 파란 그림자, 타이틀형 본문은 아래로 옅은 그림자
    boxShadow: el.shadow === 'accent' ? `0 ${-ptToPx(2.25)}px 0 ${BRAND.colors.blue}` : el.shadow === 'soft' ? '0 3px 6px rgba(0,0,0,0.05)' : undefined,
  }
}

function ImageBox({
  el,
  src,
  editable,
  onPick,
  onClear,
}: {
  el: ImageEl
  src?: string
  editable?: boolean
  onPick?: () => void
  onClear?: () => void
}) {
  if (el.logo) {
    return <img src={BRAND.logo[el.logo]} alt="ALCHERA" style={box(el)} draggable={false} />
  }
  if (src) {
    return (
      <div style={{ ...box(el), borderRadius: el.radius }} className="deck-image group">
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
        {editable && (
          <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
            <button type="button" className="deck-image-btn" onClick={onPick}>
              <RefreshCw size={22} /> 교체
            </button>
            <button type="button" className="deck-image-btn" onClick={onClear}>
              <Trash2 size={22} /> 삭제
            </button>
          </div>
        )}
      </div>
    )
  }
  const inner = (
    <>
      <ImagePlus size={40} strokeWidth={1.5} />
      <span style={{ fontSize: 18, marginTop: 10 }}>{editable ? '클릭해서 이미지 넣기' : '이미지'}</span>
    </>
  )
  const style: CSSProperties = {
    ...box(el),
    background: el.fill,
    borderRadius: el.radius,
    color: el.muted,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }
  return editable ? (
    <button type="button" style={style} className="deck-image-empty" onClick={onPick}>
      {inner}
    </button>
  ) : (
    <div style={style}>{inner}</div>
  )
}

// 슬라이드 한 장을 1280×720 좌표로 그린 뒤 원하는 너비로 축소해 보여줍니다.
// 썸네일·편집 캔버스·발표 모드가 모두 이 컴포넌트를 씁니다.
function SlideCanvas({
  slide,
  index,
  section = '',
  width,
  editable,
  showPlaceholders = true,
  onFieldChange,
  onImagePick,
  onImageClear,
  selectedObj,
  editingObj,
  onSelectObj,
  onEditObj,
  onObjChange,
  showGuides = true,
}: SlideCanvasProps) {
  const els = buildSlide(slide, index, section)
  const scale = width / SLIDE_W
  const palette = TONES[slideTone(slide)]

  return (
    <div style={{ width, height: SLIDE_H * scale, position: 'relative', overflow: 'hidden' }}>
      <div
        className={`deck-slide${showGuides ? '' : ' deck-guides-off'}`}
        onPointerDown={(e) => {
          // 빈 곳을 누르면 자유 배치 요소 선택 해제
          if (editable && !(e.target as HTMLElement).closest('[data-obj]')) onSelectObj?.(null)
        }}
        style={{
          position: 'absolute',
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          background: palette.bgImage ? `${palette.bg} url(${palette.bgImage}) center / cover no-repeat` : palette.bg,
          fontFamily: BRAND.font.web,
        }}
      >
        {els.map((el, i) => {
          const key = `${el.type}-${'field' in el && el.field ? el.field : i}`
          switch (el.type) {
            case 'rect':
            case 'ellipse':
              return <div key={key} style={shapeStyle(el)} />
            case 'line':
              return (
                <div
                  key={key}
                  style={{
                    ...box(el),
                    height: el.h || undefined,
                    width: el.w || undefined,
                    borderTop: el.h === 0 ? `${ptToPx(el.width)}px solid ${el.color}` : undefined,
                    borderLeft: el.w === 0 ? `${ptToPx(el.width)}px solid ${el.color}` : undefined,
                  }}
                />
              )
            case 'image':
              return (
                <ImageBox
                  key={key}
                  el={el}
                  src={el.field ? slide.content[el.field] : undefined}
                  editable={editable}
                  onPick={() => el.field && onImagePick?.(el.field)}
                  onClear={() => el.field && onImageClear?.(el.field)}
                />
              )
            case 'text': {
              const raw = el.field ? (slide.content[el.field] ?? '') : (el.text ?? '')
              const value = raw.trim() ? raw : (el.fallback ?? raw)
              if (editable && el.field && onFieldChange) {
                const field = el.field
                return <EditableText key={`${slide.id}-${key}`} el={el} value={value} onChange={(v) => onFieldChange(field, v)} />
              }
              return <StaticText key={key} el={el} value={value} placeholder={showPlaceholders && !!el.field} />
            }
          }
        })}
        {slide.layout === 'free' && (
          <FreeLayer
            objects={slide.objects ?? []}
            scale={scale}
            editable={editable}
            selectedId={selectedObj}
            editingId={editingObj}
            onSelect={onSelectObj}
            onEdit={onEditObj}
            onChange={onObjChange}
          />
        )}
      </div>
    </div>
  )
}

export default memo(SlideCanvas)
