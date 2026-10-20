import { useEffect, useState } from 'react'
import DeckHeader, { type DeckRoute } from './components/DeckHeader'
import GuidePage from './pages/GuidePage'
import SalesDeckPage from './pages/SalesDeckPage'
import StudioPage from './pages/StudioPage'
import TemplatesPage from './pages/TemplatesPage'
import { useDecks } from './store'
import type { Deck } from './types'

// 해시 라우팅: #templates · #sales/<덱 id> · #studio/<문서 id> · #guide
function parseHash(): { route: DeckRoute; deckId?: string } {
  const [route, deckId] = window.location.hash.replace(/^#\/?/, '').split('/')
  if (route === 'studio' || route === 'guide' || route === 'sales') return { route, deckId }
  return { route: 'templates' }
}

export default function DeckApp() {
  const [loc, setLoc] = useState(parseHash)
  const { decks, loaded, upsert, remove, saveState } = useDecks()
  // 가져오기 직후 스튜디오에 한 번 보여줄 안내
  const [importNotice, setImportNotice] = useState<{ deckId: string; text: string } | null>(null)

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

  const openImported = (deck: Deck, source: string) => {
    setImportNotice({ deckId: deck.id, text: `${source}에서 ${deck.slides.length}장을 가이드 레이아웃으로 가져왔어요. 레이아웃이 맞는지 확인해 주세요.` })
    open(deck)
  }

  // 저장된 문서를 다 읽기 전에는 '문서 없음' 화면을 보여주지 않습니다
  if (!loaded && loc.route === 'studio') return <div className="deck-root min-h-screen" />

  if (loc.route === 'studio') {
    const recent = [...decks].sort((a, b) => b.updatedAt - a.updatedAt)
    const deck = decks.find((d) => d.id === loc.deckId) ?? (loc.deckId ? undefined : recent[0])
    if (deck) {
      return (
        <div className="deck-root">
          <StudioPage
            key={deck.id}
            deck={deck}
            saveState={saveState}
            onChange={upsert}
            initialNotice={importNotice?.deckId === deck.id ? importNotice.text : undefined}
          />
        </div>
      )
    }
  }

  return (
    <div className="deck-root min-h-screen">
      <DeckHeader route={loc.route} />
      {loc.route === 'guide' ? (
        <GuidePage />
      ) : loc.route === 'sales' ? (
        <SalesDeckPage focus={loc.deckId} onOpen={open} />
      ) : loc.route === 'studio' ? (
        <div className="mx-auto max-w-[560px] px-6 py-24 text-center">
          <h1 className="text-[20px] font-bold text-[#000038]">열 문서가 없어요</h1>
          <p className="mt-2 text-[13px] text-[#7A8099]">템플릿에서 새 문서를 시작하거나, 편집 파일을 불러오세요.</p>
          <a href="#templates" className="deck-btn deck-btn-primary mt-6">
            템플릿 보기
          </a>
        </div>
      ) : (
        <TemplatesPage decks={decks} onOpen={open} onImported={openImported} onRemove={remove} />
      )}
    </div>
  )
}
