import { useEffect, useState } from 'react'
import DeckHeader, { type DeckRoute } from './components/DeckHeader'
import GuidePage from './pages/GuidePage'
import StudioPage from './pages/StudioPage'
import TemplatesPage from './pages/TemplatesPage'
import { useDecks } from './store'
import type { Deck } from './types'

// 해시 라우팅: #templates · #studio/<문서 id> · #guide
function parseHash(): { route: DeckRoute; deckId?: string } {
  const [route, deckId] = window.location.hash.replace(/^#\/?/, '').split('/')
  if (route === 'studio' || route === 'guide') return { route, deckId }
  return { route: 'templates' }
}

export default function DeckApp() {
  const [loc, setLoc] = useState(parseHash)
  const { decks, upsert, remove, saveState } = useDecks()

  useEffect(() => {
    document.title = 'ALCHERA · Deck Studio'
    const onHash = () => {
      setLoc(parseHash())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const open = (deck: Deck) => {
    upsert(deck)
    window.location.hash = `studio/${deck.id}`
  }

  if (loc.route === 'studio') {
    const recent = [...decks].sort((a, b) => b.updatedAt - a.updatedAt)
    const deck = decks.find((d) => d.id === loc.deckId) ?? (loc.deckId ? undefined : recent[0])
    if (deck) {
      return (
        <div className="deck-root">
          <StudioPage key={deck.id} deck={deck} saveState={saveState} onChange={upsert} />
        </div>
      )
    }
  }

  return (
    <div className="deck-root min-h-screen">
      <DeckHeader route={loc.route} />
      {loc.route === 'guide' ? (
        <GuidePage />
      ) : loc.route === 'studio' ? (
        <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
          <h1 className="text-[20px] font-bold text-[#000038]">열 문서가 없어요</h1>
          <p className="mt-2 text-[13px] text-[#7A8099]">템플릿에서 새 문서를 시작하거나, 편집 파일을 불러오세요.</p>
          <a href="#templates" className="deck-btn deck-btn-primary mt-6">
            템플릿 보기
          </a>
        </div>
      ) : (
        <TemplatesPage decks={decks} onOpen={open} onRemove={remove} />
      )}
    </div>
  )
}
