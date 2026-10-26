import { useState } from 'react'

// Deck Studio 는 새 주소로 옮겼습니다. 예전 주소(/deck)는 문서를 옮길 수 있게 그대로 두고 안내만 띄웁니다.
// 문서는 주소별로 각자 브라우저에 저장되므로, 편집 파일(.deck.json)로 받아 새 주소에서 불러옵니다.
export const DECK_STUDIO_URL = 'https://alchera-deck-studio.vercel.app'

export default function DeckMovedNotice() {
  const [open, setOpen] = useState(() => {
    try {
      return sessionStorage.getItem('deck-moved-hidden') !== '1'
    } catch {
      return true
    }
  })
  if (!open) return null
  const hide = () => {
    try {
      sessionStorage.setItem('deck-moved-hidden', '1')
    } catch {
      // 저장을 못 해도 이번 화면에서는 닫힘
    }
    setOpen(false)
  }
  return (
    <div
      role="note"
      style={{ position: 'fixed', right: 16, bottom: 44, zIndex: 60, width: 340, fontFamily: "'Noto Sans KR', sans-serif" }}
      className="rounded-xl bg-[#000038] p-4 text-[13px] leading-relaxed text-white shadow-2xl"
    >
      <p className="font-bold">Deck Studio가 새 주소로 옮겼어요</p>
      <a href={DECK_STUDIO_URL} className="mt-1 block font-semibold text-[#9DB0FF] underline">
        {DECK_STUDIO_URL.replace('https://', '')}
      </a>
      <p className="mt-2 text-white/80">
        여기서 만든 문서는 새 주소에 자동으로 보이지 않아요. 문서를 열고 <b>파일 → 편집 파일로 저장</b>으로 받은 뒤, 새 주소의 <b>불러오기</b>로 여세요.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="rounded-md px-3 py-1.5 text-white/70 hover:text-white" onClick={hide}>
          닫기
        </button>
        <a href={DECK_STUDIO_URL} className="rounded-md bg-white px-3 py-1.5 font-semibold text-[#000038]">
          새 주소로 가기
        </a>
      </div>
    </div>
  )
}
