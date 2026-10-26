import { Suspense, lazy } from 'react'
import App from './App.tsx'
import DeckMovedNotice from './DeckMovedNotice.tsx'

// /deck 은 사내 프레젠테이션 스튜디오. 키오스크 번들과 분리해서 필요할 때만 불러옵니다.
const DeckApp = lazy(() => import('./deck/DeckApp.tsx'))

export default function Root() {
  // VITE_DECK_ONLY: 스튜디오만 단독으로 배포하는 빌드(미리보기 페이지 등)
  const deckOnly = import.meta.env.VITE_DECK_ONLY === '1'
  if (!deckOnly && !window.location.pathname.startsWith('/deck')) return <App />
  return (
    <Suspense fallback={null}>
      <DeckApp />
      {/* 예전 주소: 새 주소(alchera-deck-studio) 안내 */}
      {!deckOnly && <DeckMovedNotice />}
    </Suspense>
  )
}
