import { FileText, TextSelect, X } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { SMART_EXAMPLES, suggest, type Area } from '../smartFill'
import type { FreeObj } from '../types'
import ObjectsPreview from './ObjectsPreview'

interface SmartPanelProps {
  area: Area
  // 선택한 글 상자의 글 (있으면 가져와서 그 상자를 바꿀 수 있음)
  selectedText?: string
  onInsert: (objs: FreeObj[], replaceSelected: boolean) => void
  onClose: () => void
}

const PREVIEW_W = 244

// 내용으로 요소 찾기: 글을 붙여넣으면 생김새에 맞는 구성을 후보로 보여 주고, 고르면 글 그대로 채워 넣습니다.
export default function SmartPanel({ area, selectedText, onInsert, onClose }: SmartPanelProps) {
  const [value, setValue] = useState('')
  const [replace, setReplace] = useState(false)
  const [example, setExample] = useState(0)
  const deferred = useDeferredValue(value)
  const list = useMemo(() => suggest(deferred, area), [deferred, area])

  return (
    <div className="flex w-[288px] flex-shrink-0 flex-col border-r border-[#E0E5F0] bg-white">
      <div className="flex items-center justify-between px-4 pb-2 pt-3">
        <div>
          <h3 className="text-[14px] font-bold text-[#000038]">내용으로 요소 찾기</h3>
          <p className="text-[11px] text-[#7A8099]">글을 넣으면 맞는 구성을 골라 드려요</p>
        </div>
        <button type="button" className="deck-btn deck-btn-ghost px-1.5" onClick={onClose} aria-label="닫기">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={7}
          placeholder={'한 줄에 한 항목씩 넣어 주세요.\n\n예)\n2020년 KOSDAQ 상장 - 기술력 인정\n5.1억+ 전 세계 AI 사용자\n380+명 AI 전문 인력'}
          className="w-full resize-y rounded-lg border border-[#E0E5F0] px-3 py-2 text-[12px] leading-relaxed text-[#000038] outline-none placeholder:text-[#9CA3AF] focus:border-[#4D6BFF]"
        />
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
          {selectedText && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0000A5] hover:underline"
              onClick={() => {
                setValue(selectedText)
                setReplace(true)
              }}
            >
              <TextSelect size={12} /> 선택한 글 상자 가져오기
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A8099] hover:text-[#000038]"
            onClick={() => {
              setValue(SMART_EXAMPLES[example % SMART_EXAMPLES.length])
              setExample((i) => i + 1)
              setReplace(false)
            }}
          >
            <FileText size={12} /> 예시 넣어보기
          </button>
        </div>
        {selectedText && (
          <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg bg-[#F5F7FC] px-3 py-2 text-[12px] text-[#333A4D]">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} className="accent-[#0000A5]" />
            넣으면서 선택한 글 상자 지우기
          </label>
        )}

        <details className="mt-3 rounded-lg bg-[#F5F7FC] px-3 py-2 text-[11px] leading-relaxed text-[#5A6178]">
          <summary className="cursor-pointer font-semibold text-[#333A4D]">이렇게 넣으면 잘 찾아요</summary>
          <ul className="mt-1.5 space-y-0.5">
            <li>• 한 줄에 한 항목, ‘제목 - 설명’ 또는 ‘제목: 설명’</li>
            <li>• 빈 줄로 나누면 문단마다 첫 줄이 제목</li>
            <li>• 숫자로 시작 (380+명, 70%) → 숫자 카드</li>
            <li>• 연도·시점 (2024년, 3분기) → 타임라인</li>
            <li>• 1. 2. 3. 이나 ‘A → B → C’ → 단계·흐름</li>
            <li>• 물음표로 끝남 → 번호 카드</li>
            <li>• ‘도입 전’ / ‘도입 후’ 줄로 나눔 → 전후 비교</li>
          </ul>
        </details>

        {value.trim() && (
          <>
            <p className="deck-label mb-2 mt-4">추천 구성 {list.length ? `${list.length}개` : ''}</p>
            {!list.length && <p className="text-[12px] text-[#7A8099]">맞는 구성을 찾지 못했어요. 한 줄에 한 항목씩 나눠 보세요.</p>}
            <ul className="space-y-3">
              {list.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-[#E0E5F0] text-left transition hover:border-[#4D6BFF] hover:shadow-[0_4px_14px_rgba(0,0,165,0.08)]"
                    onClick={() => onInsert(s.objs, replace)}
                  >
                    <ObjectsPreview objects={s.objs} width={PREVIEW_W} maxHeight={120} />
                    <div className="border-t border-[#EEF1F7] px-3 py-2">
                      <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#000038]">
                        {s.label}
                        {i === 0 && <span className="rounded bg-[#EEF0FB] px-1.5 py-px text-[10px] text-[#0000A5]">가장 잘 맞음</span>}
                      </p>
                      <p className="text-[11px] leading-snug text-[#7A8099]">{s.reason}</p>
                      {s.warn && <p className="mt-0.5 text-[11px] leading-snug text-[#E8833A]">{s.warn}</p>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-[#9CA3AF]">글은 바꾸지 않고 그대로 넣어요. 줄 앞의 ‘-’·‘1.’ 같은 기호와 ‘제목 - 설명’ 사이 구분 기호만 칸을 나누는 데 쓰여요.</p>
          </>
        )}
      </div>
    </div>
  )
}
