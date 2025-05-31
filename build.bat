@echo off
setlocal enabledelayedexpansion

REM Paths and filenames
set ICON_PATH=resources/icon.ico
set RC_FILE=icon.rc
set RES_FILE=icon.res
set EXE_FILE=dist/tcotd/tcotd-win_x64.exe
set MODIFIED_EXE_FILE=dist/tcotd/tcotd-win_x64.exe
set CONFIG_FILE=neutralino.config.json
set RC_PATH="C:\Program Files (x86)\Windows Kits\10\bin\10.0.22000.0\x64\rc.exe"
set RH_PATH="C:\Program Files (x86)\Resource Hacker\ResourceHacker.exe"
set TITLE=TCOTD
set DESCRIPTION=The Call Of The Dungeon.
set VERSION=0,0,1,0
set AUTHOR=renn

REM Create resource file
echo Creating resource file...
(
    echo 1 ICON "%ICON_PATH%"
    echo 1 VERSIONINFO
    echo FILEVERSION %VERSION%
    echo PRODUCTVERSION %VERSION%
    echo BEGIN
    echo   BLOCK "StringFileInfo"
    echo   BEGIN
    echo     BLOCK "040904B0"
    echo     BEGIN
    echo       VALUE "FileDescription", "%DESCRIPTION%"
    echo       VALUE "FileVersion", "%VERSION%"
    echo       VALUE "ProductName", "%TITLE%"
    echo       VALUE "ProductVersion", "%VERSION%"
    echo       VALUE "CompanyName", "%AUTHOR%"
    echo     END
    echo   END
    echo   BLOCK "VarFileInfo"
    echo   BEGIN
    echo     VALUE "Translation", 0x409, 1200
    echo   END
    echo END
) > %RC_FILE%

REM Compile resource file
echo Compiling resource file...
%RC_PATH% /v %RC_FILE%

REM Add resource to executable
echo Adding resource to executable...
%RH_PATH% -open %EXE_FILE% -save %MODIFIED_EXE_FILE% -action addoverwrite -res %RES_FILE%

REM Clean up
echo Cleaning up...
del %RC_FILE%
del %RES_FILE%

echo Done!
pause
endlocal