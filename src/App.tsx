import { useCallback, useEffect, useRef, useState } from 'react'
import KioskFrame from './components/layout/KioskFrame'
import IdleScreen from './components/IdleScreen'
import FacilitiesScreen from './components/FacilitiesScreen'

const IDLE_TIMEOUT_MS = 15000

type View = 'idle' | 'facilities'

function App() {
  const [view, setView] = useState<View>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetIdleTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setView('idle'), IDLE_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    resetIdleTimer()
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [resetIdleTimer, view])

  return (
    <KioskFrame onInteraction={resetIdleTimer}>
      {view === 'idle' ? (
        <IdleScreen onEnter={() => setView('facilities')} />
      ) : (
        <FacilitiesScreen onBack={() => setView('idle')} />
      )}
    </KioskFrame>
  )
}

export default App
