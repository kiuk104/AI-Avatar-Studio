# 인수인계 — Claude Code 구현 시작점

> 대상: VS Code의 Claude Code
> 작성: 2026-06-05 (설계는 Cowork에서, 구현은 여기서)

## 진행 상태

- ✅ **설계 v2 1~7 전부 완료** (일관성 편집, 2탭 IA, 감정 시트 UI+셀 크기+칸별 재생성, 영속화 v4, PSD 내보내기). 아래 Phase 2는 이력.
- ▶ **현재: 커스터마이저 v3 (삼성 AR 이모지 수준 빌더 확장) — 아래 "Phase 3" 참고.**

## Phase 3 — 커스터마이저 v3 (설계: [docs/DESIGN_커스터마이저_v3.md](DESIGN_커스터마이저_v3.md))

빌더를 외모/스타일 2탭 + 카테고리 아이콘바 + 스와치/서브섹션/없음(⊘)으로 재편하고, 세부 형태·색상·메이크업 신규 속성(~19개)을 추가한다. **풀 재현 + 형태형 옵션은 썸네일 생성, 색상형은 스와치.** 기능 A/B 생성·편집 로직은 유지.

**단계별(플랜 모드 → 구현 → `npm run lint` → 리뷰):**
1. **데이터 모델** — `BuilderSettings`/`defaultBuilderState`/`describeDelta LABEL`에 신규 필드(설계 §6). UI 전, tsc 통과.
2. **빌더 UX 재편** — 외모/스타일 2-세그먼트 + 카테고리 아이콘바 + 서브섹션/스와치/⊘/선택링(설계 §2·§5). 기존 카테고리부터 이식.
3. **신규 카테고리 패널** — 설계 §3 신규 속성 컨트롤(형태=그리드, 색=스와치). SVG 썸네일 미구현 옵션은 텍스트 칩 폴백.
4. **프롬프트 통합** — CHARACTER SPEC에 신규 속성(기본값 생략 헬퍼) + describeDelta 라벨(설계 §7).
5. **SVG 썸네일 확장** — `HairThumbnail.tsx` 패턴으로 파라메트릭 `FaceThumbnail`(부위 prop 변형) 등 SVG 컴포넌트 추가(설계 §8). **Gemini 생성 안 함.** 색상형은 `ColorSwatch` 스와치 유지.

> 1번부터 시작: "docs/DESIGN_커스터마이저_v3.md를 읽고 Phase 3 **1번(데이터 모델)** 만 플랜 모드로 계획. UI는 다음 단계." 각 단계 결과를 Cowork로 가져와 리뷰.

---

## (이력) Phase 2 — 4~6번

## 한 줄

[docs/DESIGN_아바타스튜디오_v2.md](DESIGN_아바타스튜디오_v2.md)의 **4~6번**을 **4 → 5 → 6 순서로, 각 단계를 별도 플랜 모드 패스**로 구현한다(단계마다 사용자 리뷰).

## 시작 방법 (권장)

1. `CLAUDE.md`와 `docs/DESIGN_아바타스튜디오_v2.md`를 읽는다.
2. **플랜 모드**로 들어가 설계 문서 + `src/App.tsx` + `src/services/geminiService.ts`를 읽고 1~3번 구현 계획을 세운다.
3. 계획 승인 후 구현 → `npm run lint`(tsc) 통과 확인 → `npm run dev`로 실제 생성/편집 일관성 눈으로 검증.

## 1~3번 핵심 (설계 문서 §2~§2.7)

- `geminiService`에 `editAvatar(currentImage, instruction, style)` 추가 — 현재 아바타를 `inlineData` 레퍼런스로 넣고 "바뀐 부분만 + 나머지 유지" 가드레일.
- `App.tsx`: 상태에 `baseSnapshot`·`originalBaseUrl` 추가. `handleGenerate`를 **생성 vs 편집(델타)** 으로 분기. `describeDelta(prev, next)`로 변경 속성만 지시문 생성.
- UI: **"새 아바타" / "수정 적용"** 버튼 분리, 편집 시 자동생성 기본 OFF, "원본으로 되돌리기".
- 스타일 변경도 편집 경로(레퍼런스 기반 = 인물 유지)로.

## 1~3번 검증 기대치 (완료 기준)

- `npm run lint` 무오류. 안경만 변경→동일 인물, 스타일만 변경→동일 인물, 변경 없이 "수정 적용"→호출 안 됨, 되돌리기→이미지+스타일 셀렉터 원복.

---

## Phase 2 — 4~6번 (설계 §3·§4·§5)

**4·5·6을 한 번에 말고, 단계별 플랜 모드 → 구현 → lint → 사용자 리뷰**로 진행. 각 단계 끝에 `npm run lint` 통과 + `npm run dev` 육안 확인.

### 4. 상단 2탭 IA (설계 §4-2 ~ §4-3, §4-5)
- 최상위 2탭 **[🧑 아바타 만들기 | 😀 감정 시트]** 도입. Text/Builder 토글은 "아바타 만들기" 탭 **안의 입력 수단**으로 격하.
- "감정 시트" 탭은 베이스(라이브러리 항목) 없으면 "먼저 아바타를 만들어 주세요" 안내 → A 탭으로 유도.
- 공유 라이브러리 "내 아바타": 카드마다 [편집(A)]·[감정 시트(B)] 진입. A·B가 같은 목록 공유.
- 기능 A의 생성/편집 로직은 **변경 금지**(1~3 그대로). UI 재배치만.

### 5. 기능 B 화면 — 감정 시트 생성 UI (설계 §4-4, §4-4-1)
- 흐름: 베이스 선택 → 세트(9/100) → **셀 크기** → 생성(표정 루프, `editAvatar`처럼 현재 이미지를 `referenceImage`로) → 시트 합성 → 내보내기(PNG+manifest 다운로드 + famillie-kim 복사 안내).
- 표정 순서·프롬프트·합성 로직은 `scripts/generate-emotion-sheet.ts`를 **그대로 포팅**(브라우저에선 sharp 대신 canvas로 합성). 표정 id 순서는 famillie-kim `emotionExpressions.js` `EXPRESSIONS`와 **동일 유지**.
- **셀 크기 옵션 (확정값)**: 프리셋 128 / 160 / 256. **기본 9칸=160, 100칸=128.** UI에 결과 시트 해상도 표시, 100칸×256은 "RN 번들에 무거움" 경고. 정한 셀 값을 manifest `cell` 에 기록.
- 배치 스크립트(`scripts/generate-emotion-sheet.ts`)는 그대로 유지(중복 OK).

### 6. 영속화 (설계 §3) — `avatarDB.ts` 현황 반영
현재 `avatarDB.ts`: DB v3, `avatars` 스토어(keyPath `id`, index `createdAt`), `api-usage` 스토어, `saveAvatar`는 `put` 기반 + `MAX_AVATARS=50`. `SavedAvatar`엔 아직 원본/시트 필드 없음(런타임 상태로만 존재).

**6-1. SavedAvatar에 옵셔널 필드 추가 (마이그레이션 불필요)**
```ts
export type SavedAvatar = {
  id; createdAt; imageUrl; settings; styleId; mode; prompt?;   // 기존
  originalBaseUrl?: string;            // 최초 베이스(리셋용)
  originalBaseSnapshot?: BuilderSettings;
  originalBaseStyleId?: string;
};
```
- **옵셔널이라 DB 버전 올릴 필요 없음**(IndexedDB는 레코드 스키마 강제 안 함, 기존 v3 레코드도 그대로 로드). 인덱스/스토어 추가가 아니므로 `onupgradeneeded` 손댈 필요 없음.
- **생성 경로**에서 원본 3종을 레코드에 저장. **in-place 편집 갱신 시에는 덮어쓰지 말 것**(원본은 불변이어야 reload 후에도 "원본 되돌리기"가 최초 베이스로 복구). `imageUrl`/`settings`/`styleId`만 갱신.
- **`loadAvatar`**: 레코드에 `originalBase*`가 있으면 그걸로 런타임 원본 상태 복원, 없으면(구 레코드) 지금처럼 현재값으로 폴백(하위호환).

**6-2. 감정 시트 영속화 — 별도 스토어 권장 (DB v4)**
시트 PNG dataURL은 크다(100×128 = 1280² ≈ 수 MB). `avatars` 스토어에 인라인하면 `loadAvatars()`의 `getAll`이 매번 전체 시트를 메모리로 끌어와 무겁다. → **별도 스토어 `emotionSheets`(keyPath `avatarId`)** 에 저장하고 필요할 때만 단건 로드.
- `DB_VERSION` 3→4, `onupgradeneeded`에 guarded `createObjectStore('emotionSheets', { keyPath: 'avatarId' })` 추가(기존 가드 패턴 그대로).
- 저장 레코드: `{ avatarId, dataUrl, cols, rows, cell, set, order, generatedAt }`. CRUD 헬퍼 `saveEmotionSheet/getEmotionSheet/deleteEmotionSheet`. `deleteAvatar` 시 해당 시트도 삭제.
- (간단히 가려면 `SavedAvatar.emotionSheet?` 인라인 필드도 가능하나 위 사유로 비권장.)

**6-3. EmotionSheetTab 연결**
- "라이브러리에 저장" 액션 추가: `onSaveSheet(avatarId, sheet)` prop → App이 `saveEmotionSheet` 호출. (현재는 다운로드만)
- 베이스 선택 시 기존 시트가 있으면 `getEmotionSheet`로 불러와 미리보기/재내보내기. `deleteAvatar` 시 시트도 정리.

### Phase 2 검증 기대치
- 각 단계 `npm run lint` 무오류.
- 4: 탭 전환·라이브러리 공유 동작, 기능 A 일관성 회귀 없음.
- 5: 9칸 시트 생성→다운로드, 셀 크기 변경이 manifest/시트 해상도에 반영, 표정 순서가 famillie-kim과 일치.
- 6: 새로고침 후에도 원본 베이스·감정 시트가 복원.

## 참고

- 감정 시트 소비처(famillie-kim) 연동 규약: `E:\Coding\famillie-kim\docs\HANDOFF_아바타_감정연동.md`.
- 표정 순서는 famillie-kim의 `emotionExpressions.js` `EXPRESSIONS`와 동일하게 유지(슬라이싱 정합).
