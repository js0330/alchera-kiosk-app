import { ArrowRight, ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'

interface DeckCardProps {
  // 미리보기 칸 왼쪽 위의 작은 표시 (예: KIT / 01)
  index: string
  kicker: string
  tag?: string
  title: string
  desc: string
  footer: string
  preview: ReactNode
  onClick?: () => void
  // 있으면 새 탭 링크
  href?: string
}

// 메인 화면 카드: 연한 미리보기 칸 + 작은 분류 · 태그 + 제목 · 한 줄 설명 + 아래 줄
export default function DeckCard({ index, kicker, tag, title, desc, footer, preview, onClick, href }: DeckCardProps) {
  const body = (
    <>
      <div className="relative flex h-[200px] w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F5FA]">
        <span className="absolute left-4 top-3 text-[10px] font-semibold tracking-[0.14em] text-[#8A90A6]">{index}</span>
        {preview}
      </div>
      <div className="flex w-full flex-1 flex-col px-3 pb-1 pt-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8A90A6]">{kicker}</span>
          {tag && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#F2F4FB] px-2 py-0.5 text-[11px] text-[#4A5170]">
              <span className="h-1 w-1 rounded-full bg-[#4A5170]" />
              {tag}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-[17px] font-bold tracking-[-0.01em] text-[#000038]">{title}</h3>
        <p className="mb-4 mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#7A8099]">{desc}</p>
        <div className="mt-auto flex items-center justify-between border-t border-[#EEF1F7] pt-3 text-[12px] text-[#7A8099]">
          <span>{footer}</span>
          {href ? <ExternalLink size={14} className="transition group-hover:text-[#0000A5]" /> : <ArrowRight size={14} className="transition group-hover:translate-x-0.5 group-hover:text-[#0000A5]" />}
        </div>
      </div>
    </>
  )
  const cls = 'group flex flex-col rounded-2xl border border-[#E6EAF3] bg-white p-3 text-left transition hover:border-[#C9D1F5] hover:shadow-[0_8px_24px_rgba(0,0,56,0.06)]'
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={`${cls} w-full`}>
      {body}
    </button>
  )
}
