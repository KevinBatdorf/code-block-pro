@echo off
setlocal enabledelayedexpansion

set "TARGET=%~1"
if "%TARGET%"=="" set "TARGET=.\build"

if not exist "%TARGET%" mkdir "%TARGET%"

for %%f in (*.txt) do (
	echo packing %%~nf
	copy /y "%%f" "%TARGET%\%%~nf.bak" >nul
)

echo done
endlocal
