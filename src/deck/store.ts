import { useCallback, useEffect, useRef, useState } from 'react'
import { LAYOUT_MAP } from './layouts'
import type { Deck } from './types'

const LEGACY_KEY = 'alchera-deck-studio:v2'
const DB_NAME = 'alchera-deck-studio'
const DB_STORE = 'kv'
const DB_KEY = 'decks'

// 문서는 IndexedDB 에 저장합니다. 이미지가 들어간 문서도 수백 MB 까지 담을 수 있습니다.
// (예전 버전이 쓰던 localStorage 데이터는 처음 열 때 옮겨옵니다)
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idb<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(DB_STORE, mode).objectStore(DB_STORE))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

async function loadDecks(): Promise<Deck[]> {
  try {
    const stored = await idb<unknown>('readonly', (st) => st.get(DB_KEY))
    if (Array.isArray(stored)) return stored.filter(isDeck)
  } catch {
    // IndexedDB 를 쓸 수 없는 환경이면 localStorage 로
  }
  try {
    const raw = localStorage.getItem(LEGACY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(isDeck) : []
  } catch {
    return []
  }
}

async function saveDecks(decks: Deck[]) {
  try {
    await idb('readwrite', (st) => st.put(decks, DB_KEY))
    try {
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      // 무시
    }
  } catch {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(decks))
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

// 문서 목록을 브라우저에 자동 저장합니다. 저장에 실패하면 saveState 가 'error' 가 되어 화면에 안내합니다.
export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const dirty = useRef(false)

  useEffect(() => {
    let alive = true
    loadDecks().then((d) => {
      if (!alive) return
      setDecks((prev) => (prev.length ? [...prev, ...d.filter((x) => !prev.some((p) => p.id === x.id))] : d))
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!loaded || !dirty.current) return
    setSaveState('saving')
    const t = setTimeout(() => {
      saveDecks(decks)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
    }, 400)
    return () => clearTimeout(t)
  }, [decks, loaded])

  const upsert = useCallback((deck: Deck) => {
    dirty.current = true
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
    dirty.current = true
    setDecks((prev) => prev.filter((d) => d.id !== id))
  }, [])

  return { decks, loaded, upsert, remove, saveState }
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
