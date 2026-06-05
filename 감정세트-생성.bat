@echo off
chcp 65001 >nul
title 감정 세트 생성기
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [오류] Node.js가 필요합니다. https://nodejs.org 에서 설치하세요.
  pause & exit /b 1
)
if not exist node_modules (
  echo 패키지 설치 중...
  call npm install
)
if not exist .env.local (
  echo [오류] .env.local 에 GEMINI_API_KEY 가 필요합니다.
  echo        키 발급: https://aistudio.google.com/apikey
  pause & exit /b 1
)

echo.
echo == 감정 세트(표정 시트) 생성 ==
echo.
set /p MEMBER=구성원 ID 입력 (예: dad, mom, kid1):
if "%MEMBER%"=="" set MEMBER=member
echo.
echo 베이스 아바타 방식을 고르세요:
echo   1) 텍스트 설명으로 새로 생성
echo   2) 기존 이미지 파일 사용
set /p MODE=번호 선택 [1/2]:

if "%MODE%"=="2" goto useimg

:usetext
echo.
set /p DESC=베이스 설명 (예: 한국인 40대 남성, 짧은 검은 머리, 안경):
echo.
echo 생성을 시작합니다... (표정 9장, 1~2분 소요)
npx tsx scripts/generate-emotion-sheet.ts --member "%MEMBER%" --base "%DESC%"
goto done

:useimg
echo.
set /p IMG=베이스 이미지 경로 (예: out\dad-base.png):
echo.
echo 생성을 시작합니다... (표정 9장, 1~2분 소요)
npx tsx scripts/generate-emotion-sheet.ts --member "%MEMBER%" --base-image "%IMG%"

:done
echo.
echo 결과 폴더: out\emotion-sheets\%MEMBER%
pause
