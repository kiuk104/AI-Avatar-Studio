# CLAUDE.md

AI Avatar Studio — Gemini 이미지 API로 아바타를 생성/편집하고, 그 아바타로 감정 표정 시트를 만드는 로컬 웹앱. (React 19 + TypeScript + Vite)

## 제품 구조 — 핵심 2기능

1. **기본형 아바타 생성 & 편집** — 여러 스타일로 생성하되, 한 번 만든 뒤엔 **동일 인물(identity)을 유지하며** 악세사리/이목구비/스타일을 수정. ← *현재 보완 대상.*
2. **감정 시트 생성** — 1번 아바타를 베이스로 9(또는 100) 표정 시트를 생성. 소비처는 별도 RN 앱 `famillie-kim`의 감정차트.

## 실행

- 개발: `npm run dev` → http://localhost:3000  (또는 루트 `실행.bat` 더블클릭)
- 감정 시트 배치: `npm run gen:emotion -- --member dad --base "설명"`  (또는 `감정세트-생성.bat`)
- 타입 체크: `npm run lint` (tsc --noEmit)
- **API 키 필요**: `.env.local` 에 `GEMINI_API_KEY="..."` ([발급](https://aistudio.google.com/apikey))

## 기술 스택

React 19, TypeScript ~5.8, Vite 6, Tailwind CSS 4, Motion(애니메이션), `@google/genai`(모델 `gemini-2.5-flash-image`), IndexedDB(로컬 저장), tsx + sharp(배치 스크립트).

## 핵심 파일

- `src/App.tsx` — 메인 UI. 상태/빌더/생성 흐름 전부. `handleGenerate`(생성), `builderState`/`BuilderSettings`(빌더 속성), `referenceImage`(업로드 참조), `savedAvatars`(IndexedDB 갤러리).
- `src/services/geminiService.ts` — `generateAvatar(prompt, style, referenceImage)`. Gemini 호출/이미지 추출.
- `src/utils/avatarDB.ts` — IndexedDB CRUD. `src/utils/apiTracker.ts` — 토큰/비용 로깅.
- `scripts/generate-*.ts` — Node(tsx) 배치 이미지 생성(썸네일). `scripts/generate-emotion-sheet.ts` — 감정 시트 생성기.
- `src/components/ColorSwatch.tsx`, `public/thumbnails/` — 빌더 셀렉터 자원.

## 진행 상태 / 다음 단계

- ✅ **설계 v2 1~6 전부 구현 완료** (일관성 델타 편집, 2탭 IA, 감정 시트 UI, 셀 크기 옵션, 액세서리 환각 방지 + 칸별 재생성, IndexedDB 영속화 v4). 설계: [docs/DESIGN_아바타스튜디오_v2.md](docs/DESIGN_아바타스튜디오_v2.md), 인수인계 이력: [docs/HANDOFF_클로드코드.md](docs/HANDOFF_클로드코드.md).
- ▶ **다음(소비처 연동)**: 스튜디오에서 내보낸 시트를 `famillie-kim`에 실제 연결 — `src/assets/avatars/{member}.png` 복사 + `avatarSheets.js` SHEETS 등록, 데모용 `POC_FORCE_SHEET` 해제. 규약: `E:\Coding\famillie-kim\docs\HANDOFF_아바타_감정연동.md`.

## 제약 / 주의

- **API 키가 클라이언트 번들에 박힘**: `vite.config.ts`의 `define`이 `GEMINI_API_KEY`를 빌드 시 번들에 주입. 개인 로컬용은 OK, **배포 시 키 노출** → deps에 있는 `express`로 백엔드 프록시 전환 필요.
- **감정 시트 표정 순서 고정**: `scripts/generate-emotion-sheet.ts`의 `EXPRESSIONS` 순서는 `famillie-kim/src/screens/parent/emotion/emotionExpressions.js`의 `EXPRESSIONS`와 **반드시 동일**해야 슬라이싱이 맞음.
- 원래 Google AI Studio 애플릿 스캐폴드라 `express`/`better-sqlite3`/`dotenv`가 deps에 있으나 현재 런타임 경로엔 미사용(클라이언트가 Gemini 직접 호출).
- 큰 변경(3파일+)은 **플랜 모드** 먼저.
