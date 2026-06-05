# 설계 — 아바타 스튜디오 v2: 2-기능 구조 · 일관성 편집 · UX 재편

> 작성: 2026-06-05 / 대상: AI-Avatar-Studio (React19 + Vite + Gemini)
> 관련: 감정 시트 소비처 = [[famillie-kim]] (`docs/HANDOFF_아바타_감정연동.md`)
> 상태: **설계만** (구현 전). 편집 전략 = **델타 편집** 확정.

---

## 1. 제품 구조 — 핵심 2기능

앱을 두 기능 중심으로 정의한다. 나머지(스타일, 빌더, 사용량)는 이 둘에 종속된다.

- **기능 A — 기본형 아바타 생성 & 편집**
  여러 스타일로 Google 이미지 API를 써서 아바타를 만들되, **한 번 생성된 뒤에는 동일 인물(identity)을 유지하며** 악세사리·이목구비를 수정할 수 있어야 한다. ← *현재 가장 보완이 필요한 부분.*
- **기능 B — 감정 시트 생성**
  기능 A에서 만든 **베이스 아바타를 입력으로** 9(또는 100) 표정 시트를 생성. 이미 배치 스크립트(`scripts/generate-emotion-sheet.ts`)로 구현됨 → 앱 UI로 흡수.

두 기능을 잇는 것은 **"내 아바타"라는 1급 객체**다(§3). A가 만들고 B가 소비한다.

---

## 2. 기능 A — 일관성 델타 편집 (핵심 보완)

### 2-1. 현재 문제 (코드 근거)
`handleGenerate`(App.tsx 243~)는 호출될 때마다 `builderState` **전체**로 스펙을 새로 조립해
텍스트로 생성한다(249~268). `generateAvatar`에 넘기는 `referenceImage`(285)는
**사용자 업로드 참조일 뿐, 직전에 생성한 아바타가 아니다.**
→ 안경 하나만 바꿔도 직전 얼굴을 참조하지 않고 텍스트 스펙만으로 새 얼굴을 다시 뽑는다.
속성은 맞지만 **매번 다른 사람**이 된다. 스타일 변경도 같은 이유로 인물이 바뀐다.

`gemini-2.5-flash-image`는 레퍼런스 이미지 기반 편집(identity 보존)에 강한데 이 지렛대를 안 쓰는 게 원인의 전부다.

### 2-2. 해결 — "생성"과 "편집"을 분리
- **생성(New)**: 베이스가 없을 때. 텍스트/스펙 + 스타일로 베이스 identity 확정.
- **편집(Edit, 델타)**: 베이스가 있을 때. **현재 아바타를 레퍼런스로** 넣고 **바뀐 속성만** 지시.
  나머지는 "그대로 유지" 가드레일로 고정.

### 2-3. geminiService — `editAvatar` 추가

> ⚠️ **art style을 PRESERVE에 넣지 말 것.** identity 보존 문구에 "art style 유지"를 넣으면,
> 스타일을 바꾸는 편집(§2-6)에서 "기존 스타일 유지" vs "새 스타일로 변경"이 **한 프롬프트 안에서 충돌**한다.
> → `PRESERVE`는 **identity·framing·pose만** 고정하고, art style은 뒤의 명시 문구로만 제어한다.

```ts
// services/geminiService.ts
// identity + framing 만 고정 (art style은 의도적으로 제외)
const PRESERVE =
  "Preserve the EXACT same character identity from the provided image: " +
  "same face, head shape, skin tone, hairstyle & color, eyes, expression, pose " +
  "and framing/composition. It must look like the SAME person.";

export async function editAvatar(
  currentImage: string,        // data:image/...;base64,...  (직전 결과)
  instruction: string,         // 바뀐 부분만, 예: 'Change the glasses to round wire-frame.'
  style?: string,
  restyle = false,             // true면 style 로 "재렌더"(스타일 변경), false면 style "유지"
): Promise<GenerateResult> {
  const styleClause = style
    ? (restyle ? ` Re-render the SAME person in the "${style}" art style.`
               : ` Keep the "${style}" art style.`)
    : "";
  const text =
    `Edit the provided avatar image. ${instruction} ${PRESERVE} ` +
    `Change ONLY what is explicitly requested; do not redraw anything else.` +
    styleClause;
  const parts: any[] = [{ text }];
  const m = currentImage.match(/^data:(image\/\w+);base64,(.+)$/);
  if (m) parts.push({ inlineData: { mimeType: m[1], data: m[2] } });
  // 이하 generateContent 호출/추출은 generateAvatar 와 동일 (model: gemini-2.5-flash-image, 1:1)
}
```
> 기존 `generateAvatar`는 "생성" 전용으로 유지. 공통 호출부는 내부 헬퍼(`callGemini`)로 묶어도 됨.
> 악세사리/이목구비 편집은 `restyle=false`(스타일 유지), 스타일 변경 편집은 `restyle=true`로 호출.

### 2-4. 델타 계산 — 직전 스냅샷 ↔ 현재 builderState
편집 지시문은 **바뀐 속성만** 담아야 한다(전체를 다시 나열하면 모델이 재-롤링한다).
```ts
// Record<keyof BuilderSettings> 로 두면 빌더 속성이 추가/삭제될 때 tsc가 누락을 잡아준다.
// (현재 defaultBuilderState 의 16개 키와 정확히 일치 — 확인됨)
const LABEL: Record<keyof BuilderSettings, string> = {
  glasses:'glasses', earrings:'earrings', necklace:'necklace', headwear:'headwear',
  hair:'hairstyle', hairColor:'hair color', eyebrows:'eyebrow style', eyes:'eye shape',
  face:'face shape', nose:'nose shape', lips:'lip style', facialHair:'facial hair',
  outfit:'outfit', outfitColor:'outfit color', skin:'skin tone', gender:'gender',
};
function describeDelta(prev: BuilderSettings, next: BuilderSettings): string {
  const changes = (Object.keys(next) as (keyof BuilderSettings)[])
    .filter(k => prev[k] !== next[k])
    .map(k => `${LABEL[k] ?? k} to "${next[k]}"`);
  return changes.length ? `Change the ${changes.join(", ")}.` : "";
}
```

### 2-5. `handleGenerate` 분기 (의사코드)
편집 여부 판정은 **속성 델타 OR 스타일 델타**로 본다(둘 중 하나만 바뀌어도 편집). 스타일만 바뀐
경우도 편집으로 잡혀야 하므로, "변경 없음" 판정에 스타일 델타를 반드시 포함한다.
```ts
const isEdit = mode === 'builder' && !!currentAvatar && !!baseSnapshot && !forceNew;
if (isEdit) {
  const attrDelta  = describeDelta(baseSnapshot, builderState);   // 속성 변경 (없으면 '')
  const styleDelta = selectedStyle.id !== baseStyleId;            // 스타일 변경 여부
  if (!attrDelta && !styleDelta) return;                          // 둘 다 없으면 호출 안 함(쿼터 절약)
  const result = await editAvatar(
    currentAvatar, attrDelta, selectedStyle.name, /*restyle=*/ styleDelta,
  );
  setCurrentAvatar(result.imageUrl);
  setBaseSnapshot({ ...builderState });
  setBaseStyleId(selectedStyle.id);
  // originalBaseUrl / originalBaseSnapshot 은 유지(리셋용), DB는 currentAvatarId 제자리 갱신
} else {
  const result = await generateAvatar(finalPrompt, stylePrompt, referenceImage || undefined);
  setCurrentAvatar(result.imageUrl);
  if (mode === 'builder') setBaseSnapshot({ ...builderState });
  setOriginalBaseUrl(result.imageUrl);
  setOriginalBaseSnapshot({ ...builderState });
  setBaseStyleId(selectedStyle.id);
  // 새 SavedAvatar 레코드 생성 → setCurrentAvatarId(newId)
}
```
> **"수정 적용" 버튼 활성화/비활성도 동일 판정**(`attrDelta || styleDelta`)을 재사용해야 한다.
> describeDelta(속성)만으로 판정하면 **스타일-단독 변경 시 버튼이 잠긴다.**

### 2-6. 스타일 변경도 레퍼런스 기반
스타일을 바꾸면 같은 인물을 유지한 채 스타일만 바꾼다 — `editAvatar(currentAvatar, attrDelta, style, restyle=true)`.
이때 `restyle=true`가 PRESERVE의 art-style 충돌 없이 "Re-render the SAME person in {style}" 문구를 붙인다(§2-3).
(지금처럼 텍스트로 전체 재생성하면 인물이 바뀜.)

### 2-7. 드리프트 완화 (델타 편집의 유일한 약점)
연속 편집을 직전 결과에서 이어가면 회를 거듭할수록 미세하게 누적 변형될 수 있다. 완화책:
- **원본 리셋**: 최초 베이스(`originalBaseUrl` + `originalBaseSnapshot` + `originalBaseStyleId`)를 보관 → "원본으로 되돌리기" 버튼. revert 시 이미지·`builderState`·`baseSnapshot`뿐 아니라 **스타일(`selectedStyle`/`baseStyleId`)도 원본으로 복구**해야 그림과 스타일 셀렉터가 어긋나지 않고, 직후 "수정 적용"에 불필요한 styleChanged가 안 생긴다.
- **자동생성 완전 제거**: 변경마다 자동 재생성하던 Auto-Sync는 없앤다. 사용자가 **"수정 적용"**을 눌렀을 때만 1회 호출(불필요한 누적·쿼터 방지).
- 필요 시 "원본 베이스에서 누적 스펙으로 다시" 옵션을 보조로 둘 수 있음(향후).

> ⚠️ **text 출신 베이스 가드.** `loadAvatar`가 `baseSnapshot = avatar.settings`로 세팅하는데,
> **text 모드로 만든 저장본은 settings가 기본 builder 스냅샷**이라 그 위에서 builder "수정 적용"을 하면
> 엉뚱한 델타가 생긴다. 1단계에선 **"수정 적용"을 builder 출신 베이스에만 노출**한다
> (편집은 builder 전용이므로 자연스러움). 저장 레코드에 `mode`가 이미 있으니 `mode === 'builder'`로 게이팅.

---

## 3. 데이터/상태 모델 — "내 아바타" 1급 객체

기존 `SavedAvatar`를 확장해 A↔B를 잇는 중심 객체로 만든다.
```ts
type MyAvatar = {
  id: string;
  createdAt: number;
  // identity
  imageUrl: string;            // 현재(편집 반영) 이미지
  originalBaseUrl: string;     // 최초 베이스(리셋·드리프트 복구용)
  baseSnapshot: BuilderSettings; // 현재 이미지가 반영하는 속성 스냅샷
  styleId: string;
  mode: 'text' | 'builder';
  prompt?: string;
  // 기능 B 연결
  emotionSheet?: { dataUrl: string; cols: number; rows: number; cell: number; set: 'bucket9'|'full100'; order: string[] } | null;
};
```
- 라이브러리(현재 `savedAvatars`)가 **두 기능의 공유 저장소**가 된다(IndexedDB 그대로).
- 기능 B는 이 목록에서 베이스를 고르고, 생성한 시트를 `emotionSheet`에 붙인다.

---

## 4. UX 재편 — 2기능 중심

### 4-1. 현재 IA (입력 방식 중심)
단일 화면 / 좌(에디터)·우(결과 400px) 2열. 좌측 상단에 **[Text Prompt | Avatar Builder]** 토글.
→ "생성"과 "편집"이 구분되지 않고, 감정 시트 기능은 앱에 없음(배치 스크립트만).

### 4-2. 새 IA (기능 중심) — 상단 2탭
```
Avatar Studio
┌────────────────────────────────────────────┐
│  [ 🧑 아바타 만들기 ]   [ 😀 감정 시트 ]      │   ← 최상위 2탭 (기능 A / B)
└────────────────────────────────────────────┘
```
- **아바타 만들기(A)**: 생성 + 일관성 편집.
- **감정 시트(B)**: A에서 만든 베이스로 표정 시트 생성·내보내기. (베이스 없으면 "먼저 아바타를 만들어 주세요" 안내 → A로 유도.)
- Text/Builder는 탭이 아니라 **A 안의 입력 수단**으로 격하(생성 단계의 한 옵션).

### 4-3. 기능 A 화면 흐름
```
[1] 생성        Text 또는 Builder 로 첫 아바타 → "생성"  (베이스 확정)
      │
[2] 편집(델타)  같은 화면에서 속성/스타일 바꾸고 "수정 적용"
      │           → 현재 이미지를 레퍼런스로 바뀐 부분만 반영 (동일 인물 유지)
      │           🔒 identity 잠금 표시 · ↺ 원본으로 되돌리기
      └─ "내 아바타로 저장" → 라이브러리
```
- 핵심 버튼 분리: **「새 아바타」**(`handleGenerate(true)`, identity 새로) vs **「수정 적용」**(`handleGenerate(false)`, 델타 편집).
- **「수정 적용」 노출/활성 조건**: `mode==='builder' && currentAvatar && baseSnapshot && (attrDelta || styleDelta)`. 변경 없으면 비활성(§2-5와 동일 판정). text 출신 베이스에는 미노출(§2-7 가드).
- 빌더 변경 시 자동 재생성 없음 — 변경분을 모아 "수정 적용" 1회 호출(드리프트·쿼터 방지).
- **↺ 원본으로 되돌리기**: `setCurrentAvatar(originalBaseUrl)` + `setBuilderState(originalBaseSnapshot)` + `setBaseSnapshot(originalBaseSnapshot)` + 스타일 복구(`setSelectedStyle(원본 스타일)` + `setBaseStyleId(originalBaseStyleId)`). 그래서 생성/로드 시 `originalBaseUrl`·`originalBaseSnapshot`·`originalBaseStyleId` 3종을 함께 보관(편집 중 불변).

### 4-4. 기능 B 화면 흐름
```
[1] 베이스 선택   라이브러리에서 "내 아바타" 1개 선택
[2] 세트 선택     9표정(빠름) / 100표정(정밀)
[3] 사이즈 선택   감정차트에 맞춘 "셀 크기" 옵션 (아래 §4-4-1)
[4] 생성          표정 루프(현재 이미지를 referenceImage 로) → 3×3(or 10×10) 시트 합성
[5] 내보내기      PNG + manifest 다운로드  ·  famillie-kim 에셋 복사 안내
```
> 이는 `scripts/generate-emotion-sheet.ts`의 로직을 브라우저 UI로 옮긴 것. (배치 스크립트는 그대로 유지)

#### 4-4-1. 셀 크기 옵션 (감정차트 최적 사이즈)
"셀"은 시트 한 칸의 원본 픽셀 크기. 시트 전체 = 셀 × 칸수. famillie-kim 차트의 최대 표시 크기는
구성원 카드 아바타 **54px**(모달 34, 통계 칩 20)이라, 고DPI(2~3배)로 또렷하려면 **셀 128~160px면 충분**하다.
`SheetFace`가 원본 셀을 표시 크기로 축소하므로 셀이 표시값보다 크기만 하면 된다.

프리셋(차트 기준):

| 셀 | 9칸(3×3) 시트 | 100칸(10×10) 시트 | 용도 |
|---|---|---|---|
| 128px | 384² | 1280² | 가벼움 (100칸 권장) |
| **160px** | **480²** | 1600² | 표준 — 카드 54px@3배 충분 |
| 256px | 768² | 2560²(RN 번들엔 무거움) | 고화질/여유 |

- **기본값**: 9칸 = **160px**, 100칸 = **128px** (품질·용량 균형). UI에 결과 시트 해상도를 함께 표시.
- 생성 시 정한 셀 값을 **manifest.json `cell`** 과 **famillie-kim `avatarSheets.js`의 `cell`** 에 동일하게 기록해야 슬라이싱이 맞는다(이미 `--cell` 인자로 배치 스크립트는 지원).
- 100칸을 256px로 만들면 2560² PNG라 RN 정적 번들·메모리에 부담 → UI에서 경고 표시 권장.

#### 4-4-2. 셀 일관성 — 액세서리 환각 방지
표정을 크게 바꾸는 칸(예: 소리치는 입)에서 모델이 **베이스에 없는 안경/모자 등을 추가**하는 환각이 가끔 난다.
`EXPRESSION_PRESERVE`가 "keep glasses the same"처럼 일반적으로만 말하면, 없는 액세서리엔 잠금이 약하다. 보강:

1. **항상(두 모드 공통) 부정 지시**: `"Do NOT add or remove any accessories — no glasses, hats, or earrings unless they appear in the reference image. Match the reference exactly."`
2. **builder 출신 베이스(`base.mode==='builder'`)면** `base.settings`로 **명시 잠금** 주입 — 안경 None→`"no glasses"`, headwear→`"wearing a {x}"`/`"no hat"`, 수염·귀걸이·헤어도 동일. "이대로 정확히, 추가·제거 금지." (**text 출신 베이스는 settings가 기본값이라 속성 주입은 건너뛰고 1번만**.)
   - `generateExpressionCell` 시그니처를 `(baseImage, expressionDesc, style?, lock?)` 등으로 확장, `EmotionSheetTab`이 `base.settings`/`mode`로 lock을 만들어 전달.
3. **칸별 재생성**: 미리보기 셀 클릭 → 그 칸만 다시 생성(`runGeneration`의 단일-인덱스 버전). "이어서"(빈 칸만 채움)와 별개로, **잘못 나온 칸을 한 칸만 고치는** 용도. 레퍼런스 생성은 비결정적이라 1·2로도 100% 막진 못하므로 안전판으로 필요.

### 4-5. 공유 라이브러리 "내 아바타"
우측/별도 패널의 갤러리. 카드마다 [편집(A로)] · [감정 시트(B로)] 진입. A·B 어디서든 같은 목록을 본다.

---

## 5. 로드맵 (구현 시 순서)

1. `geminiService.editAvatar` + 공통 호출 헬퍼 분리.
2. 상태에 `baseSnapshot`·`originalBaseUrl` 추가, `handleGenerate`에 생성/편집 분기 + `describeDelta`.
3. UI: "새 아바타 / 수정 적용" 분리, 자동생성 기본 OFF(편집 시), 원본 리셋 버튼.
4. 상단 2탭 IA 도입, Text/Builder를 A 내부로 이동.
5. 기능 B 화면(베이스 선택→세트→생성→내보내기) — 배치 스크립트 로직 포팅.
6. `MyAvatar` 확장 + 라이브러리 공유.

> 1~3이 "일관성 편집" 본질. 4~6이 "UX 재편". 1~3 먼저 끝내 효과를 확인하고 4~6 진행 권장.

---

## 6. 결정 대기 항목

- 편집 입자: 빌더 속성 변경마다 즉시 vs **여러 변경 모아 "수정 적용" 1회**(권장).
- "새 아바타"와 "수정 적용"을 한 화면 두 버튼으로 vs 명시적 편집 모드 진입.
- 기능 B의 표정 세트 기본값(9 / 100)과 셀 크기(예 256).
- 스타일 변경을 편집(레퍼런스 기반, 인물 유지)으로 볼지, 새 생성으로 볼지 — 기본은 **편집(유지)** 권장.
