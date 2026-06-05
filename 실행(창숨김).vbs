' AI Avatar Studio — 검은 콘솔 창 없이 실행하는 런처
' (최초 설치가 끝난 뒤 사용하세요. 종료하려면 작업 관리자에서 node 를 끝내면 됩니다.)
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = scriptDir
' 0 = 창 숨김, False = 종료를 기다리지 않음
sh.Run "cmd /c """ & scriptDir & "\실행.bat""", 0, False
