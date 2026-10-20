import { BRAND } from '../guide'

export type DeckRoute = 'templates' | 'sales' | 'studio' | 'guide'

const TABS: { id: DeckRoute; label: string }[] = [
  { id: 'templates', label: '템플릿' },
  { id: 'sales', label: '세일즈덱' },
  { id: 'studio', label: '스튜디오' },
  { id: 'guide', label: '가이드' },
]

export default function DeckHeader({ route }: { route: DeckRoute }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E0E5F0] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-6 px-4 sm:px-6">
        <a href="#templates" className="flex items-center gap-2.5">
          <img src={BRAND.logo.navy} alt="ALCHERA" className="h-[14px]" />
          <span className="rounded bg-[#EEF0FB] px-1.5 py-0.5 text-[11px] font-bold text-[#0000A5]">Deck Studio</span>
        </a>
        <nav className="flex gap-1">
          {TABS.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={`rounded-md px-3 py-1.5 text-[13px] font-semibold ${
                route === t.id ? 'bg-[#F2F4FB] text-[#0000A5]' : 'text-[#666] hover:text-[#000038]'
              }`}
            >
              {t.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
