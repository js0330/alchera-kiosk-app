import { useCallback, useEffect, useRef, useState } from 'react'
import { LAYOUT_MAP } from './layouts'
import type { Deck } from './types'

const STORAGE_KEY = 'alchera-deck-studio:v1'

function load(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isDeck) : []
  } catch {
    return []
  }
}

export function isDeck(v: unknown): v is Deck {
  const d = v as Deck
  return (
    !!d &&
    typeof d.id === 'string' &&
    typeof d.title === 'string' &&
    Array.isArray(d.slides) &&
    d.slides.every((s) => s && typeof s.id === 'string' && s.layout in LAYOUT_MAP && typeof s.content === 'object')
  )
}

export type SaveState = 'saved' | 'saving' | 'error'

// 문서 목록을 브라우저(localStorage)에 자동 저장합니다.
// 이미지가 많아 저장 공간이 부족하면 saveState 가 'error' 가 되어 화면에 안내합니다.
export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(load)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setSaveState('saving')
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decks))
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }, 400)
    return () => clearTimeout(t)
  }, [decks])

  const upsert = useCallback((deck: Deck) => {
    setDecks((prev) => {
      const next = { ...deck, updatedAt: Date.now() }
      const i = prev.findIndex((d) => d.id === deck.id)
      if (i === -1) return [next, ...prev]
      const copy = prev.slice()
      copy[i] = next
      return copy
    })
  }, [])

  const remove = useCallback((id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { decks, upsert, remove, saveState }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeFileName(title: string) {
  return title.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'presentation'
}
