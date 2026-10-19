# ALCHERA Kiosk App

## Deck Studio (`/deck`)

알체라 가이드에 맞는 발표 자료를 만드는 사내용 슬라이드 편집기입니다.
글꼴·색·여백을 고르는 대신 레이아웃을 고르고 칸에 글만 채우면, 가이드에 맞는 슬라이드와 PowerPoint에서 바로 고칠 수 있는 PPTX가 만들어집니다.

- `/deck#templates` — 시작 키트(세일즈 덱·회사 소개서·프로젝트 보고)와 레이아웃 라이브러리
- `/deck#studio/<id>` — 편집기: 썸네일 · 캔버스 · 가이드 체크/발표자 노트, 발표 모드, PPTX 다운로드
- `/deck#guide` — 컬러·톤·글자 크기·규칙

가이드 값(색·글꼴·여백·로고)은 `src/deck/guide.ts`, 레이아웃은 `src/deck/layouts.ts` 한 곳에서 관리합니다.
화면과 PPTX 내보내기가 같은 레이아웃 정의를 쓰므로 둘의 결과가 일치합니다.
문서는 각자의 브라우저(localStorage)에 저장되고, 팀원과는 ‘편집 파일(.deck.json)’로 주고받습니다.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
