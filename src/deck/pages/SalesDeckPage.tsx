import SampleCard from '../components/SampleCard'
import { SAMPLES } from '../samples'

// 세일즈덱 모아보기: 알체라 세일즈덱을 한곳에 모아 표지와 이름으로 보여 주고, 누르면 구글 슬라이드 원본을 엽니다.
// (덱 목록은 samples.ts 의 SAMPLES)
export default function SalesDeckPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-10 sm:px-6">
      <h1 className="text-[26px] font-bold text-[#000038]">알체라 세일즈덱</h1>
      <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-[#7A8099]">
        회사 세일즈덱을 한곳에 모았어요. 누르면 구글 슬라이드 원본이 새 탭으로 열려요. 고쳐 쓰려면 구글 슬라이드에서 ‘파일 → 사본 만들기’로 내 사본을 만들어 주세요.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SAMPLES.map((s, i) => (
          <SampleCard key={s.id} sample={s} index={i} />
        ))}
      </div>
    </div>
  )
}
