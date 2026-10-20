// 알체라 세일즈덱. 표지 그림과 이름만 보여 주고, 누르면 구글 슬라이드 원본을 엽니다.
// 표지 그림은 public/deck/samples/covers/<file>.jpg (구글 슬라이드 첫 장 미리보기 800×450)
// (예전에 원본을 편집 요소로 옮긴 데이터 public/deck/samples/originals 와 이미지는
//  이미 복사해 둔 문서가 쓰고 있어 파일은 남겨 둡니다)

export interface Sample {
  id: string
  name: string
  description: string
  source: string
  cover: string
  count: number
}

const cover = (file: string) => `${import.meta.env.BASE_URL}deck/samples/covers/${file}.jpg`

export const SAMPLES: Sample[] = [
  {
    id: 'sample-face-trust',
    name: 'Face Trust 출입통제 솔루션 소개서',
    description: '1:N 얼굴인식 · Liveness · 키오스크 · 중앙관리',
    source: 'https://docs.google.com/presentation/d/1GddF9irxkgYRJvocBiY6Jknwa46hStNAH85eZTCEYck/edit',
    cover: cover('ft'),
    count: 15,
  },
  {
    id: 'sample-air-quality',
    name: '공기질 AI 시스템 소개서',
    description: '회사소개 → 문제 제기 → 제품 소개 → 작동 원리',
    source: 'https://docs.google.com/presentation/d/1pZENzU3y129yD7PzsZb4SGInKYLQgbwhX8ZzrrLD6AM/edit',
    cover: cover('air'),
    count: 22,
  },
  {
    id: 'sample-physical-ai',
    name: 'Physical AI 데이터 솔루션 소개서',
    description: 'THE PROBLEM → 솔루션 → Supply Chain → DATA FACTORY → REFERENCE',
    source: 'https://docs.google.com/presentation/d/1J6JjllbT_tmIlN0ErP282Yt_-D9ZSzLsxc63c_oKlrw/edit',
    cover: cover('pa'),
    count: 15,
  },
]
