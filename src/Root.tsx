import { Suspense, lazy } from 'react'
import App from './App.tsx'

// /deck 은 사내 프레젠테이션 스튜디오. 키오스크 번들과 분리해서 필요할 때만 불러옵니다.
const DeckApp = lazy(() => import('./deck/DeckApp.tsx'))

export default function Root() {
  if (!window.location.pathname.startsWith('/deck')) return <App />
  return (
    <Suspense fallback={null}>
      <DeckApp />
    </Suspense>
  )
}
