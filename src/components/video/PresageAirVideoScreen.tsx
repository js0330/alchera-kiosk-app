import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Fan } from 'lucide-react'
import DemoControls, { type DemoSelection } from './DemoControls'
import { presageAirDemoEvent } from '../../data/presageAirEvent'

type DemoScreen = 'normal' | 'caution'
type ScreenState = DemoScreen | 'stabilizing'

const FADE_MS = 350
const STABILIZING_HOLD_MS = 900

export default function PresageAirVideoScreen() {
  const [screen, setScreen] = useState<ScreenState>('caution')
  const [overlayVisible, setOverlayVisible] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  useEffect(() => {
    const previousLang = document.documentElement.lang
    document.documentElement.lang = 'en'
    return () => {
      document.documentElement.lang = previousLang
    }
  }, [])

  const goTo = useCallback((next: DemoSelection) => {
    clearTimers()

    if (next === 'resolved') {
      setScreen('stabilizing')
      setOverlayVisible(false)
      timers.current.push(setTimeout(() => setOverlayVisible(true), 20))
      timers.current.push(
        setTimeout(() => setOverlayVisible(false), 20 + FADE_MS + STABILIZING_HOLD_MS),
      )
      timers.current.push(
        setTimeout(() => setScreen('normal'), 20 + FADE_MS * 2 + STABILIZING_HOLD_MS),
      )
      return
    }

    setOverlayVisible(false)
    setScreen(next)
  }, [])

  const activeStatus: DemoScreen = screen === 'stabilizing' ? 'caution' : screen
  const isCaution = activeStatus === 'caution'
  const event = presageAirDemoEvent
  const headerTime = isCaution ? event.caution.time : event.normal.time

  return (
    <div
      data-event-id={event.eventId}
      className="relative flex h-screen w-screen flex-col overflow-hidden bg-bg-white font-sans"
    >
      <div className="flex flex-shrink-0 items-center justify-between bg-primary-navy px-20 py-10">
        <p className="text-[2.5rem] font-extrabold tracking-[0.2em] text-white">PRESAGE AIR</p>
        <p className="text-[1.75rem] font-semibold tracking-wide text-white/75">
          {event.location} · {headerTime}
        </p>
      </div>
      <div
        className={`h-1.5 flex-shrink-0 transition-colors duration-700 ${
          isCaution ? 'bg-status-caution' : 'bg-status-normal'
        }`}
      />

      <div className="flex flex-1 flex-col items-center justify-center gap-12 px-24 text-center">
        {isCaution ? (
          <>
            <div className="flex h-56 w-56 items-center justify-center rounded-full bg-status-caution/15">
              <Fan size={140} strokeWidth={1.5} className="animate-spin-slow text-status-caution" />
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-[6rem] font-extrabold leading-none tracking-tight text-status-caution">
                AIR-QUALITY CAUTION
              </p>
              <p className="text-[2.25rem] font-bold tracking-wide text-primary-navy">
                PREDICTIVE VENTILATION IN PROGRESS
              </p>
            </div>
            <div className="flex flex-col gap-2 text-[2.25rem] leading-snug text-text-gray">
              <p>Air conditions are being stabilized.</p>
              <p>Please follow on-site guidance.</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-56 w-56 items-center justify-center rounded-full bg-status-normal/15">
              <CheckCircle2 size={140} strokeWidth={1.5} className="text-status-normal" />
            </div>
            <p className="text-[6rem] font-extrabold leading-none tracking-tight text-status-normal">
              AIR QUALITY NORMAL
            </p>
            <p className="text-[2.25rem] text-text-gray">All monitored areas are operating normally.</p>
          </>
        )}
      </div>

      <div className="flex flex-shrink-0 flex-col items-center gap-1 border-t border-border-gray bg-bg-panel px-20 py-8">
        {isCaution ? (
          <>
            <p className="text-[1.5rem] text-text-light">Individual sensor readings remain within limits.</p>
            <p className="text-[1.25rem] text-text-light/70">Updated at {event.caution.updatedAt}</p>
          </>
        ) : (
          <p className="text-[1.5rem] text-text-light">
            {event.location} · Updated at {event.normal.updatedAt}
          </p>
        )}
      </div>

      <div
        aria-hidden={!overlayVisible}
        className={`pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-bg-white transition-opacity duration-[350ms] ${
          overlayVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <CheckCircle2 size={100} strokeWidth={1.5} className="text-primary-blue" />
        <p className="text-[4.5rem] font-extrabold tracking-wide text-primary-blue">AIR CONDITIONS STABILIZED</p>
      </div>

      <DemoControls onSelect={goTo} />
    </div>
  )
}
