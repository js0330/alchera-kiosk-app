// 구글 드라이브 연결: 회사 구글 계정으로 로그인해서
//  - 만든 문서를 내 드라이브에 구글 슬라이드로 보내고 (drive.file: 이 앱이 만든 파일만)
//  - '알체라'로만 공유된 구글 슬라이드를 PPTX 로 받아 옵니다 (drive.readonly)
// 우리 서버를 거치지 않고, 사용자 브라우저에서 구글로 바로 주고받습니다.
// 로그인은 Google Identity Services(토큰 방식). 클라이언트 ID 는 공개 값입니다 (Google Cloud 프로젝트 'Deck Studio', 내부 앱).

export const GOOGLE_CLIENT_ID = '64395199238-fet9c3q65es4lpqm3q91fde29gc31qns.apps.googleusercontent.com'
export const SCOPE_FILE = 'https://www.googleapis.com/auth/drive.file'
export const SCOPE_READ = 'https://www.googleapis.com/auth/drive.readonly'
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

export class GoogleError extends Error {}

interface TokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
}
interface TokenClient {
  requestAccessToken: (o?: { prompt?: string }) => void
}
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (o: {
            client_id: string
            scope: string
            hd?: string
            callback: (r: TokenResponse) => void
            error_callback?: (e: { type: string }) => void
          }) => TokenClient
        }
      }
    }
  }
}

let gis: Promise<void> | null = null

// 로그인 도구를 미리 불러 둡니다 (버튼을 누르는 순간 바로 로그인 창을 열어야 팝업이 막히지 않음)
export function loadGoogle(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (!gis) {
    gis = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => {
        gis = null
        reject(new GoogleError('구글 로그인 도구를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'))
      }
      document.head.appendChild(s)
    })
  }
  return gis
}

const tokens = new Map<string, { token: string; until: number }>()

// 버튼을 누른 그 자리에서 불러야 합니다. 이미 받은 토큰이 있으면 로그인 창 없이 씁니다.
export function getGoogleToken(scope: string): Promise<string> {
  const t = tokens.get(scope)
  if (t && t.until > Date.now() + 60_000) return Promise.resolve(t.token)
  return new Promise((resolve, reject) => {
    const run = () => {
      const client = window.google!.accounts!.oauth2!.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope,
        hd: 'alcherainc.com',
        callback: (r) => {
          if (r.error || !r.access_token) return reject(new GoogleError('구글 로그인을 마치지 못했어요. 다시 눌러 주세요.'))
          tokens.set(scope, { token: r.access_token, until: Date.now() + (r.expires_in ?? 3600) * 1000 })
          resolve(r.access_token)
        },
        error_callback: (e) =>
          reject(
            new GoogleError(
              e.type === 'popup_failed_to_open'
                ? '로그인 창이 막혔어요. 주소창 오른쪽의 팝업 차단 표시를 눌러 허용한 뒤 다시 눌러 주세요.'
                : e.type === 'popup_closed'
                  ? '로그인 창을 닫았어요. 다시 누르면 이어서 할 수 있어요.'
                  : '구글 로그인을 마치지 못했어요. 다시 눌러 주세요.',
            ),
          ),
      })
      client.requestAccessToken()
    }
    if (window.google?.accounts?.oauth2) run()
    else loadGoogle().then(run, reject)
  })
}

// PPTX 를 내 드라이브에 구글 슬라이드로 올립니다 (구글이 변환). 새 파일의 주소를 돌려줍니다.
export async function uploadAsGoogleSlides(pptx: Blob, name: string, token: string): Promise<string> {
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name, mimeType: 'application/vnd.google-apps.presentation' })], { type: 'application/json' }))
  form.append('file', new Blob([pptx], { type: PPTX_MIME }))
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  }).catch(() => null)
  if (!res) throw new GoogleError('구글 드라이브에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.')
  if (res.status === 401) {
    tokens.clear()
    throw new GoogleError('구글 로그인이 만료됐어요. 다시 눌러 주세요.')
  }
  if (!res.ok) throw new GoogleError('구글 드라이브에 올리지 못했어요. 잠시 후 다시 시도해 주세요.')
  const data = (await res.json()) as { id: string; webViewLink?: string }
  return data.webViewLink ?? `https://docs.google.com/presentation/d/${data.id}/edit`
}

// 회사 계정으로 열리는 구글 슬라이드를 PPTX 로 받습니다 (구글 API 내보내기는 10MB 까지)
export async function downloadSlidesAsPptx(id: string, token: string): Promise<{ data: ArrayBuffer; name: string }> {
  const auth = { headers: { Authorization: `Bearer ${token}` } }
  const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=name,mimeType&supportsAllDrives=true`, auth).catch(() => null)
  if (!meta) throw new GoogleError('구글 드라이브에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.')
  if (meta.status === 404 || meta.status === 403) throw new GoogleError('이 계정으로는 열 수 없는 파일이에요. 파일 주인에게 보기 권한을 받아 주세요.')
  if (meta.status === 401) {
    tokens.clear()
    throw new GoogleError('구글 로그인이 만료됐어요. 다시 눌러 주세요.')
  }
  if (!meta.ok) throw new GoogleError('파일 정보를 읽지 못했어요. 잠시 후 다시 시도해 주세요.')
  const { name, mimeType } = (await meta.json()) as { name: string; mimeType: string }
  const url =
    mimeType === PPTX_MIME
      ? `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`
      : `https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=${encodeURIComponent(PPTX_MIME)}`
  const res = await fetch(url, auth).catch(() => null)
  if (!res) throw new GoogleError('구글 드라이브에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.')
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (body.includes('exportSizeLimitExceeded'))
      throw new GoogleError('파일이 커서(10MB 넘음) 바로 받을 수 없어요. 구글 슬라이드에서 파일 › 다운로드 › PowerPoint(.pptx)로 받아 ‘파일’ 탭에 올려 주세요.')
    throw new GoogleError('파일을 받지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
  return { data: await res.arrayBuffer(), name: name.replace(/\.pptx$/i, '') }
}
