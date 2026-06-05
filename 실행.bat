@echo off
chcp 65001 >nul
title AI Avatar Studio
cd /d "%~dp0"

REM === Node.js 설치 확인 ===
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [오류] Node.js가 설치되어 있지 않습니다.
  echo        https://nodejs.org 에서 LTS 버전을 설치한 뒤 다시 실행하세요.
  echo.
  pause
  exit /b 1
)

REM === 최초 실행 시 패키지 자동 설치 ===
if not exist node_modules (
  echo.
  echo 최초 실행입니다. 필요한 패키지를 설치합니다... ^(몇 분 걸릴 수 있어요^)
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [오류] 설치에 실패했습니다.
    pause
    exit /b 1
  )
)

REM === API 키 안내 ===
if not exist .env.local (
  echo.
  echo [안내] .env.local 파일이 없습니다. Gemini API 키가 필요합니다.
  echo        파일을 만들고 아래 한 줄을 넣어주세요:
  echo            GEMINI_API_KEY="여기에_키"
  echo        키 발급: https://aistudio.google.com/apikey
  echo.
)

echo.
echo  ┌─────────────────────────────────────────────┐
echo  │  AI Avatar Studio 를 시작합니다.             │
echo  │  잠시 후 브라우저가 자동으로 열립니다.       │
echo  │  주소: http://localhost:3000                 │
echo  │                                             │
echo  │  ※ 이 창을 닫으면 앱이 종료됩니다.           │
echo  └─────────────────────────────────────────────┘
echo.

REM === 서버가 뜰 시간을 준 뒤 브라우저 자동 오픈 (별도 프로세스) ===
start "" cmd /c "ping 127.0.0.1 -n 5 >nul & start http://localhost:3000"

REM === 개발 서버 실행 (포그라운드) ===
npm run dev
