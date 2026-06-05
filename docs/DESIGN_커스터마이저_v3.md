# 설계 — 커스터마이저 v3 (삼성 AR 이모지 수준 확장)

> 작성: 2026-06-05 / 대상: AI-Avatar-Studio `src/App.tsx` 빌더 + 썸네일 스크립트
> 참고: 사용자 제공 Galaxy AR 이모지 스크린샷 24장. 결정: **풀 재현 + 옵션별 썸네일 생성**.
> 전제: 기능 A 생성/편집 로직(v2 1~3)은 유지, **빌더의 속성·UX만 대폭 확장**.

---

## 1. 목표
현재 빌더 16속성을 삼성 AR 이모지 수준으로 확장 — 세부 형태(이마·턱·콧대·눈 크기·쌍꺼풀 등)와
색상/메이크업(눈동자색·입술색·블러셔·아이섀도·주근깨)을 추가하고, **외모/스타일 2탭 + 카테고리
아이콘바 + 카테고리별 스와치·서브섹션·없음(⊘)·정렬** UX로 재편한다.

## 2. IA — 빌더 구조
"Avatar Builder" 모드 내부를 참고 UI처럼 재편:

```
[ 외모 (Appearance) | 스타일 (Style) ]      ← 빌더 상단 2-세그먼트
 ─ 가로 스크롤 카테고리 아이콘바 ─
   외모: 피부 · 얼굴형 · 눈썹 · 눈 · 코 · 입 · 귀 · 헤어 · 수염 · 화장
   스타일: 안경 · 귀걸이 · 목걸이 · 모자 · 상의 · (성별)
 ─ 선택된 카테고리 패널 ─
   [색상 스와치 줄(해당 시)]
   [서브섹션 헤더] + [원형 썸네일 그리드]  (옵션마다 선택 링, 첫 칸 ⊘=없음)
   [정렬 버튼(해당 시)]
```
> 성별(gender)은 스타일 탭 끝 또는 별도 토글로 유지(생성 스펙에 필요).

## 3. 외모(Appearance) — 카테고리·서브섹션·옵션

> 옵션 라벨은 영문(프롬프트/파일명에 그대로 사용). `*`=신규 속성.

### 3-1. 피부 Skin
- **skin** (피부톤, 스와치): Porcelain, Fair, Light, Medium, Tan, Honey, Brown, Espresso, Deep (9)
- **freckles*** (주근깨): None, Light, Medium, Heavy
- **skinFinish*** (피부 질감): Natural, Matte, Dewy

### 3-2. 얼굴형 Face
- **face** (얼굴형): Oval, Round, Square, Heart, Diamond, Long, Triangle
- **forehead*** (이마): Low, Average, High
- **chin*** (턱끝): Round, Pointed, Square, Cleft
- **cheekbones*** (광대): Low, Average, High
- **wrinkles*** (주름): None, Light, Defined

### 3-3. 눈썹 Eyebrows
- **eyebrows**: Natural, Thin, Thick, Arched, Straight, Bushy, Rounded
- **browColor*** (스와치): Match Hair, Black, Brown, Blonde, Gray (기본 Match Hair)

### 3-4. 눈 Eyes
- **eyes** (모양): Round, Almond, Hooded, Monolid, Upturned, Downturned, Wide
- **eyeSize*** (크기): Small, Medium, Large
- **eyelid*** (쌍꺼풀): Monolid, Single, Double
- **eyeColor*** (눈동자색, 스와치): Dark Brown, Brown, Hazel, Amber, Green, Blue, Gray
- **eyelashes*** (속눈썹): Natural, Long, Dramatic

### 3-5. 코 Nose
- **nose** (모양): Small, Pointy, Wide, Button, Hooked, Flat
- **noseBridge*** (콧대): Low, Average, High

### 3-6. 입 Mouth
- **lips** (모양): Natural, Thin, Full, Wide, Small, Pouty, Heart
- **lipColor*** (입술색, 스와치): Natural, Nude, Pink, Coral, Red, Berry, Brown

### 3-7. 귀 Ears
- **earShape*** (형태): Small, Average, Large, Pointed, Round
- **earPosition*** (위치): High, Average, Low

### 3-8. 헤어 Hair
- **hair** (스타일): 기존 HAIR_STYLES(~20, 그룹 유지) 그대로 + 확장 여지
- **hairColor** (스와치): 기존 HAIR_COLORS(natural+special)

### 3-9. 수염 Facial hair
- **facialHair**: None, Stubble, Mustache, Goatee, Full Beard, Van Dyke, Soul Patch, Sideburns
- **facialHairColor*** (스와치): Match Hair, Black, Brown, Gray (기본 Match Hair)

### 3-10. 화장 Makeup
- **blush*** (블러셔, 스와치): None, Rosy, Peach, Coral, Mauve
- **eyeshadow*** (아이섀도): None, Neutral, Smoky, Warm, Cool
- **facePaint*** (얼굴 페인팅): None, Cheek Hearts, Star, Sport Stripes, Festival

## 4. 스타일(Style)
- **glasses**: None, Round, Square, Cat-eye, Aviator, Rimless
- **earrings**: None, Stud, Hoop, Drop
- **necklace**: None, Chain, Pendant, Choker
- **headwear**: None, Beanie, Baseball Cap, Beret, Fedora, Headband, Turban
- **outfit** + **outfitColor**: 기존
- **gender**: Male, Female, Non-binary

## 5. UX 패턴 (참고 재현)
- **카테고리 아이콘바**: 가로 스크롤, 선택 강조. lucide 아이콘 매핑(피부=Sparkles 등 적절히).
- **색상 스와치 줄**: 스와치형 카테고리(피부·눈썹색·눈동자색·입술색·블러셔·헤어색·수염색) 상단에 원형 색칩 줄, 선택 링. `ColorSwatch.tsx` 재사용/확장.
- **서브섹션 헤더**: 한 카테고리에 여러 속성이면 헤더로 구분(예: 얼굴형 → "얼굴형 / 이마 / 턱끝 / 광대 / 주름").
- **없음(⊘) 옵션**: 선택형(주근깨·수염·안경·메이크업 등) 그리드 첫 칸에 ⊘ = None.
- **선택 링**: 선택 옵션 emerald 링(현 패턴 유지).
- **정렬**: 그리드 정렬 토글(가나다/기본) — 선택 구현(없어도 무방).
- 전부 **변경 시 자동 재생성 없음** — v2대로 "수정 적용"으로만 반영(델타 편집 경로).

## 6. 데이터 모델 — `BuilderSettings` 확장 (하위호환)
신규 필드는 **전부 옵셔널 + `defaultBuilderState`에 기본값**으로 추가 → 기존 저장본 로드 안전.

```ts
export type BuilderSettings = {
  // 기존 16
  gender; skin; hair; hairColor; eyebrows; eyes; face; nose; lips;
  facialHair; glasses; earrings; necklace; headwear; outfit; outfitColor;
  // 신규 (v3) — 기본값은 '없음/보통' 계열로
  freckles; skinFinish; forehead; chin; cheekbones; wrinkles;
  browColor; eyeSize; eyelid; eyeColor; eyelashes; noseBridge;
  lipColor; earShape; earPosition; facialHairColor;
  blush; eyeshadow; facePaint;
};
```
- `defaultBuilderState`에 신규 기본값(예: forehead 'Average', freckles 'None', eyeColor 'Dark Brown', lipColor 'Natural', blush 'None', browColor 'Match Hair' …).
- **describeDelta `LABEL`(Record<keyof BuilderSettings>) 에 신규 키 라벨 모두 추가** — 안 그러면 tsc 에러(이게 누락 방지 장치). 예: forehead→'forehead', eyelid→'double eyelid', eyeColor→'eye color', noseBridge→'nose bridge', lipColor→'lip color', blush→'blush'…
- 영속화는 기존 `SavedAvatar.settings`가 통째로 저장되므로 **DB 변경 불필요**(옵셔널 필드라 구 레코드도 로드 OK).

## 7. 프롬프트 통합
- **CHARACTER SPEC 빌더**(handleGenerate 생성 경로): 신규 속성 줄 추가. 단, **기본/보통 값은 굳이 명시 안 해도 됨**(프롬프트 비대화 방지). 권장: "None/Average/Match Hair가 아닌 값"만 스펙에 출력하는 헬퍼.
  - 예) `eyeColor!=='Dark Brown'` 일 때만 `Eye color: ${eyeColor}`. blush 'None'이면 생략.
- **describeDelta**: 신규 속성도 자동 포함(LABEL만 채우면 됨). 색상/메이크업 변경도 델타 편집으로 동일 인물 유지.
- **편집 일관성**: 색/메이크업 변경은 `editAvatar` 델타로 자연스럽게 처리(작은 변화라 일관성 잘 유지).

## 8. 썸네일 — SVG 컴포넌트 확장 (Gemini 생성 안 함)
**결정: 셀렉터 썸네일은 SVG로 그린다.** 앱에 이미 `src/components/thumbnails/HairThumbnail.tsx`(SVG 일러스트 썸네일)가
있으므로, 신규 형태 옵션도 **같은 SVG 방식**으로 확장한다. Gemini로 옵션 PNG를 생성하지 않는다.

**왜 SVG인가**: 비용 0·즉시 렌더, 다크/라이트 자동 대응, 옵션 형태를 코드로 정확히 통제(이마 낮음/높음·턱
뾰족/갈라짐 등 미세 차이), 옵션 추가가 파일이 아니라 함수 한 줄. 셀렉터는 "어떤 옵션인지 구분"이 목적이라
일러스트로 충분 — 사실감은 최종 산출물(아바타/감정 시트)을 만드는 Gemini가 담당.

- **형태형(그리드)**: 파라메트릭 페이스 SVG 컴포넌트로 렌더. 한 카테고리의 옵션은 **해당 부위만 변형**하고
  나머지는 중립 베이스로 그려 옵션 차이가 또렷하게 보이게. 부위: 얼굴형·이마·턱·광대·주름·눈(모양/크기/쌍꺼풀)·
  눈썹·코(모양/콧대)·입·귀(형태/위치)·수염·헤어. 물리색(피부 등)은 하드코딩 hex(테마 반전 금지).
  - 구현: `HairThumbnail.tsx` 패턴 따라 `FaceThumbnail.tsx`(부위 prop으로 변형) 또는 부위별 소형 컴포넌트.
    `BUILDER_OPTIONS`의 각 옵션이 썸네일 이미지 URL 대신 **컴포넌트+옵션키**를 가리키게.
- **색상형(스와치)**: 눈동자색·입술색·블러셔·아이섀도·눈썹색·헤어색·수염색은 썸네일 없이 **색칩 스와치**
  (`ColorSwatch.tsx`) — 생성/그리기 불필요.
- **Gemini 썸네일 스크립트(`scripts/generate-*thumbnails*`)는 더 이상 신규 옵션에 안 씀.** 기존 PNG 썸네일을
  쓰던 카테고리(헤어 등)는 그대로 두거나 점진적으로 SVG로 이관(선택).
- 폴백: 특정 옵션 SVG 미구현 시 **텍스트 칩**으로 폴백(단계적 롤아웃 가능).

## 9. 구현 순서 (단계)
v3는 한 번에 말고 단계별 플랜 모드 → 구현 → lint → 리뷰:

1. **데이터 모델**: `BuilderSettings`/`defaultBuilderState`/`LABEL` 신규 필드. (UI 전, tsc 통과 기준)
2. **빌더 UX 재편**: 외모/스타일 2-세그먼트 + 카테고리 아이콘바 + 서브섹션/스와치/⊘/선택링. 기존 카테고리부터 새 레이아웃에 이식.
3. **신규 카테고리 패널**: 3절의 신규 속성 컨트롤(형태=그리드, 색=스와치). SVG 썸네일 미구현 옵션은 텍스트 칩 폴백.
4. **CHARACTER SPEC + describeDelta 통합**: 신규 속성 스펙 출력(비대화 방지 헬퍼) + 델타 라벨.
5. **SVG 썸네일 확장**(§8): 파라메트릭 `FaceThumbnail`(부위 변형) 등 SVG 컴포넌트로 형태형 옵션 렌더. Gemini 생성 안 함. 색상형은 스와치.
6. (선택) 정렬 토글.

## 10. 주의
- **프롬프트 비대화**: 속성이 35+개로 늘어 CHARACTER SPEC가 길어진다 → 기본값 생략 헬퍼 필수.
- **gemini 표현력 한계**: 콧대/광대/이마 같은 미세 형태는 모델이 또렷이 반영 못 할 수 있음 → 라벨을 분명한 형용사로(예 "high prominent cheekbones").
- **하위호환**: 신규 필드 전부 기본값 보유 → 구 저장본/감정 시트 베이스 그대로 동작.
- 큰 변경(다파일)은 **플랜 모드** 먼저. 단계마다 `npm run lint`.
