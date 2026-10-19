import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ptToPx } from '../guide'
import { BULLET, listClass, textStyle } from '../textStyle'
import type { TextEl } from '../types'

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const richHtml = (s: string) => escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')

function toHtml(value: string, multiline: boolean, rich: boolean) {
  const line = rich ? richHtml : escapeHtml
  if (!multiline) return line(value)
  return value
    .split('\n')
    .map((l) => `<div>${line(l) || '<br>'}</div>`)
    .join('')
}

const isBold = (el: HTMLElement) => el.nodeName === 'B' || el.nodeName === 'STRONG' || Number(el.style.fontWeight) >= 600 || el.style.fontWeight === 'bold'

// contentEditable 의 DOM 을 저장 형식(줄바꿈 + **굵게**)으로 바꿉니다.
function serialize(node: Node, rich: boolean): string {
  let out = ''
  node.childNodes.forEach((c) => {
    if (c.nodeType === Node.TEXT_NODE) out += c.textContent ?? ''
    else if (c.nodeName === 'BR') out += '\n'
    else if (c instanceof HTMLElement) {
      const inner = serialize(c, rich)
      if (c.nodeName === 'DIV' || c.nodeName === 'P') {
        if (out && !out.endsWith('\n')) out += '\n'
        out += inner.replace(/\n$/, '') + '\n'
      } else if (rich && isBold(c)) {
        out += inner
          .split('\n')
          .map((l) => (l.trim() ? `**${l}**` : l))
          .join('\n')
      } else out += inner
    }
  })
  return out
}

function readValue(node: HTMLElement, multiline: boolean, rich: boolean) {
  const text = serialize(node, rich).replace(/ /g, ' ').replace(/\*\*\*\*/g, '')
  return multiline ? text.replace(/\n$/, '') : text.replace(/\n/g, ' ')
}

interface EditableTextProps {
  el: TextEl
  value: string
  onChange: (value: string) => void
  onFocus?: () => void
  autoFocus?: boolean
  onDone?: () => void
}

// 레이아웃 칸 안에서 바로 입력하는 편집기. 글꼴·크기·색은 레이아웃이 정하고 사용자는 글만 씁니다.
// 커서가 튀지 않도록 입력 중에는 DOM 을 다시 그리지 않고(uncontrolled), 포커스가 없을 때만 값을 반영합니다.
// 본문 칸: Enter 를 누르면 다음 줄에 "• " 가 텍스트로 들어가고(가이드: 글머리는 텍스트), Ctrl+B 로 강조합니다.
export default function EditableText({ el, value, onChange, onFocus, autoFocus, onDone }: EditableTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const multiline = !!el.multiline
  const rich = !!el.rich
  const bullets = el.list === 'bullet'
  const [empty, setEmpty] = useState(!value)
  const [overflow, setOverflow] = useState(false)

  const measure = useCallback(() => {
    const node = ref.current
    if (node) setOverflow(node.offsetHeight > el.h + 2)
  }, [el.h])

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || document.activeElement === node) return
    node.innerHTML = toHtml(value, multiline, rich)
    setEmpty(!value)
    measure()
  }, [value, multiline, rich, measure])

  useLayoutEffect(() => {
    const node = ref.current
    if (!autoFocus || !node) return
    node.focus()
    const range = document.createRange()
    range.selectNodeContents(node)
    range.collapse(false)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  }, [autoFocus])

  const handleInput = () => {
    const node = ref.current
    if (!node) return
    const next = readValue(node, multiline, rich)
    setEmpty(!next.trim())
    measure()
    onChange(next)
  }

  const paraSpace = el.paraSpace ? ptToPx(el.paraSpace) : 0

  return (
    <div
      className={`deck-field${overflow ? ' is-overflow' : ''}`}
      style={{ position: 'absolute', left: el.x, top: el.y, width: el.w, minHeight: el.h }}
    >
      {empty && (
        <div className="deck-placeholder" style={{ ...textStyle(el), color: el.color }} aria-hidden>
          {el.placeholder}
        </div>
      )}
      <div
        ref={ref}
        role="textbox"
        aria-label={el.placeholder}
        aria-multiline={multiline}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        className={`deck-editable ${listClass(el)}`}
        style={{ ...textStyle(el), minHeight: el.h, ['--para-space' as string]: `${paraSpace}px` }}
        onInput={handleInput}
        onFocus={() => {
          if (bullets && !ref.current?.textContent?.trim()) {
            document.execCommand('insertText', false, BULLET)
            handleInput()
          }
          onFocus?.()
        }}
        onBlur={() => {
          const node = ref.current
          if (!node) return
          let v = readValue(node, multiline, rich)
          if (bullets && v.replace(/[•\s]/g, '') === '') {
            v = ''
            onChange('')
            setEmpty(true)
          }
          node.innerHTML = toHtml(v, multiline, rich)
          measure()
          onDone?.()
        }}
        onKeyDown={(e) => {
          const mod = e.metaKey || e.ctrlKey
          if (mod && (e.key === 'i' || e.key === 'u')) e.preventDefault()
          if (mod && e.key === 'b' && !rich) e.preventDefault()
          if (e.key === 'Escape') (e.target as HTMLElement).blur()
          if (e.key !== 'Enter') return
          if (!multiline) return e.preventDefault()
          if (bullets && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            document.execCommand('insertParagraph')
            document.execCommand('insertText', false, BULLET)
          }
        }}
        onPaste={(e) => {
          e.preventDefault()
          let text = e.clipboardData.getData('text/plain')
          if (!multiline) text = text.replace(/\s*\n\s*/g, ' ')
          document.execCommand('insertText', false, text)
        }}
      />
      {overflow && <span className="deck-overflow-badge">영역 초과 · 줄여주세요</span>}
    </div>
  )
}
