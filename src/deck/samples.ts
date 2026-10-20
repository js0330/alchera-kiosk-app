import { uid } from './kits'
import type { Deck, FreeObj, Slide } from './types'

// 알체라 세일즈덱 원본. 구글 슬라이드 원본을 그대로 옮겨서(배경·도형·글·이미지 모두 편집 가능한 요소)
// public/deck/samples/originals/<file>.json 과 이미지 폴더에 넣어 두었습니다. 필요할 때 불러옵니다.
// (예전 가이드 레이아웃 버전의 이미지 public/deck/samples/*.jpg 와 목록에서 뺀 Face Trust(ft) 데이터는
//  이미 복사해 둔 문서가 쓰고 있어 파일은 남겨 둡니다)

export interface Sample {
  id: string
  name: string
  description: string
  source: string
  file: string
  count: number
}

export const SAMPLES: Sample[] = [
  {
    id: 'sample-air-quality',
    name: '공기질 AI 시스템 소개서',
    description: '회사소개 → 문제 제기 → 제품 소개 → 작동 원리',
    source: 'https://docs.google.com/presentation/d/1pZENzU3y129yD7PzsZb4SGInKYLQgbwhX8ZzrrLD6AM/edit',
    file: 'air',
    count: 22,
  },
  {
    id: 'sample-physical-ai',
    name: 'Physical AI 데이터 솔루션 소개서',
    description: 'THE PROBLEM → 솔루션 → Supply Chain → DATA FACTORY → REFERENCE',
    source: 'https://docs.google.com/presentation/d/1J6JjllbT_tmIlN0ErP282Yt_-D9ZSzLsxc63c_oKlrw/edit',
    file: 'pa',
    count: 15,
  },
]

interface RawSlide {
  sourceId?: string
  background?: { color?: string; image?: string }
  objects: FreeObj[]
}

const BASE = import.meta.env.BASE_URL
const asUrl = (p?: string) => (p ? `${BASE}${p}` : p)
const cache = new Map<string, Promise<RawSlide[]>>()

function loadRaw(s: Sample): Promise<RawSlide[]> {
  let p = cache.get(s.file)
  if (!p) {
    p = fetch(`${BASE}deck/samples/originals/${s.file}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`샘플을 불러오지 못했어요 (${r.status})`)
        return r.json()
      })
      .then((d: { slides: RawSlide[] }) => d.slides)
    cache.set(s.file, p)
    p.catch(() => cache.delete(s.file))
  }
  return p
}

// 원본 슬라이드 → 편집용 슬라이드 (새 id, 이미지 경로는 사이트 주소 기준)
export async function loadSampleSlides(s: Sample): Promise<Slide[]> {
  const raw = await loadRaw(s)
  return raw.map((r) => ({
    id: uid(),
    layout: 'original',
    tone: 'light',
    content: {},
    notes: '',
    background: r.background ? { ...r.background, image: asUrl(r.background.image) } : undefined,
    objects: r.objects.map((o) => ({ ...o, id: uid(), src: o.kind === 'image' ? asUrl(o.src) : o.src })),
  }))
}

// 원본 구글 슬라이드에서 n번째 장을 바로 여는 주소
export async function sampleSlideUrl(s: Sample, index: number): Promise<string> {
  const raw = await loadRaw(s)
  const id = raw[index]?.sourceId
  return id ? `${s.source}#slide=id.${id}` : s.source
}

export async function createDeckFromSample(s: Sample): Promise<Deck> {
  const now = Date.now()
  return { id: uid(), title: s.name, slides: await loadSampleSlides(s), createdAt: now, updatedAt: now }
}
