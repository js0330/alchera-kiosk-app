import { ExternalLink } from 'lucide-react'
import type { Sample } from '../samples'

// 세일즈덱 카드: 표지 + 이름. 누르면 구글 슬라이드 원본이 새 탭으로 열립니다.
export default function SampleCard({ sample }: { sample: Sample }) {
  return (
    <a
      href={sample.source}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-2xl border border-[#E0E5F0] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#4D6BFF] hover:shadow-lg"
    >
      <img src={sample.cover} alt={`${sample.name} 표지`} loading="lazy" className="aspect-video w-full rounded-md object-cover shadow-sm ring-1 ring-black/5" />
      <div className="mt-4 flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-bold text-[#000038]">{sample.name}</h3>
        <span className="flex-shrink-0 rounded-full bg-[#F2F4FB] px-2 py-0.5 text-[11px] font-semibold text-[#0000A5]">{sample.count}장</span>
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-[#7A8099]">{sample.description}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[12px] font-semibold text-[#0000A5] group-hover:underline">
        구글 슬라이드에서 보기 <ExternalLink size={12} />
      </span>
    </a>
  )
}
