# AI Avatar Studio - 퀵스타트 가이드

## 프로젝트 소개

AI Avatar Studio는 Google Gemini AI를 활용한 아바타 생성 웹 애플리케이션입니다.
텍스트 설명 또는 시각적 빌더를 통해 다양한 스타일의 아바타를 생성할 수 있습니다.

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite 6 |
| 스타일링 | Tailwind CSS 4 |
| 애니메이션 | Motion (Framer Motion) |
| AI 엔진 | Google Gemini 2.5 Flash Image |
| 로컬 저장소 | IndexedDB |

## 시작하기

### 1. 사전 요구사항

- **Node.js** v18 이상
- **Google Gemini API 키** ([Google AI Studio](https://aistudio.google.com/apikey)에서 발급)

### 2. 설치

```bash
git clone <repository-url>
cd AI-Avatar-Studio
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일에 Gemini API 키를 설정합니다.

```bash
# .env.local
GEMINI_API_KEY="여기에_API_키_입력"
APP_URL="http://localhost:5173"
```

> `.env.example` 파일을 참고하여 작성할 수 있습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

## 주요 기능

### 텍스트-투-아바타 모드

자연어로 원하는 아바타를 설명하면 AI가 이미지를 생성합니다.

**기본 제공 스타일 프리셋:**
- 3D Render
- Memoji
- Minimalist
- Pixel Art
- Cyberpunk
- Hand Drawn
- Anime

### 아바타 빌더 모드

시각적 폼을 통해 세부 옵션을 직접 선택합니다.

| 카테고리 | 옵션 |
|----------|------|
| 성별 | 남성, 여성, 논바이너리 |
| 피부톤 | 7가지 색상 |
| 얼굴형 | 타원형, 원형, 사각형, 하트형, 다이아몬드, 긴형 |
| 헤어스타일 | 20가지 이상 |
| 머리 색상 | 자연색 + 특수 색상 |
| 눈 | 6가지 모양 + 6가지 색상 |
| 눈썹 | 6가지 스타일 |
| 코 | 6가지 형태 |
| 입술 | 6가지 타입 |
| 수염 | 6가지 옵션 |
| 안경 | 다양한 스타일 |
| 액세서리 | 귀걸이, 목걸이, 모자 |
| 의상 색상 | 10가지 기본 색상 |

### 추가 기능

- **레퍼런스 이미지 업로드** - 참고 이미지를 첨부하여 유사한 아바타 생성
- **아바타 갤러리** - IndexedDB에 최대 50개 아바타 저장
- **이미지 다운로드** - 생성된 아바타를 PNG로 저장
- **API 사용량 추적** - 일별/월별 토큰 사용량 및 비용 모니터링

## 프로젝트 구조

```
AI-Avatar-Studio/
├── src/
│   ├── main.tsx                  # 앱 진입점
│   ├── App.tsx                   # 메인 애플리케이션 컴포넌트
│   ├── index.css                 # 글로벌 스타일 (Tailwind)
│   ├── components/
│   │   ├── ColorSwatch.tsx       # 색상 선택 컴포넌트
│   │   └── thumbnails/
│   │       ├── HairThumbnail.tsx # 헤어스타일 썸네일 (SVG)
│   │       └── index.ts          # 썸네일 내보내기
│   ├── services/
│   │   └── geminiService.ts      # Gemini API 연동
│   └── utils/
│       ├── avatarDB.ts           # IndexedDB 아바타 저장소
│       └── apiTracker.ts         # API 사용량/비용 추적
├── public/
│   └── thumbnails/               # 아바타 옵션 미리보기 이미지
├── scripts/                      # 썸네일 생성 스크립트
├── .env.local                    # 환경 변수 (API 키)
├── vite.config.ts                # Vite 설정
├── tsconfig.json                 # TypeScript 설정
└── package.json                  # 의존성 관리
```

## 사용 가능한 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (포트 3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | TypeScript 타입 체크 |
| `npm run clean` | 빌드 출력 삭제 |

## API 비용 참고

| 항목 | 단가 |
|------|------|
| 입력 토큰 | $0.069 / 1M 토큰 |
| 출력 토큰 | $0.276 / 1M 토큰 |
| 이미지 생성 | $0.0276 / 건 |

> 앱 내 사용량 추적 기능으로 일별 €1.00, 월별 €10.00 초과 시 경고가 표시됩니다.

## 배포

Google AI Studio를 통해 배포할 수 있습니다.

```bash
npm run build
```

빌드 결과물은 `dist/` 디렉토리에 생성됩니다.
