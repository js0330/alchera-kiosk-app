import type { Sample } from '../samples'
import DeckCard from './DeckCard'

// 세일즈덱 카드: 표지 + 이름. 누르면 구글 슬라이드 원본이 새 탭으로 열립니다.
export default function SampleCard({ sample, index }: { sample: Sample; index: number }) {
  return (
    <DeckCard
      href={sample.source}
      index={`SALES DECK / ${String(index + 1).padStart(2, '0')}`}
      kicker="Google Slides"
      tag={`${sample.count}장`}
      title={sample.name}
      desc={sample.description}
      footer="구글 슬라이드에서 보기"
      preview={<img src={sample.cover} alt={`${sample.name} 표지`} loading="lazy" className="mt-5 w-[64%] rounded-md shadow-[0_6px_20px_rgba(0,0,56,0.14)] transition group-hover:-translate-y-0.5" />}
    />
  )
}
