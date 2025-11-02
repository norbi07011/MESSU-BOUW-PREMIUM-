@echo off
echo.
echo ========================================
echo   Kopiowanie APK do folderu public
echo ========================================
echo.

REM Sprawdź czy .apk istnieje
if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo [BŁĄD] Plik .apk nie istnieje jeszcze!
    echo.
    echo Najpierw zbuduj aplikację Android:
    echo   npm run android:build
    echo.
    echo Lub poczekaj aż Gradle skończy budowanie w tle...
    echo.
    pause
    exit /b 1
)

REM Kopiuj .apk do public
echo Kopiuję app-debug.apk do public\NORBS-Faktur.apk...
copy "android\app\build\outputs\apk\debug\app-debug.apk" "public\NORBS-Faktur.apk" >nul

if errorlevel 1 (
    echo [BŁĄD] Kopiowanie nie powiodło się!
    pause
    exit /b 1
)

echo.
echo [SUKCES] APK skopiowany do public\NORBS-Faktur.apk
echo.
echo Teraz możesz:
echo 1. Uruchomić: npm run dev
echo 2. Na telefonie wejść: http://192.168.178.75:5000/NORBS-Faktur.apk
echo 3. Lub kliknąć "Pobierz aplikację Android" w aplikacji
echo.
echo Plik zostanie pobrany i możesz go zainstalować na telefonie!
echo.
pause

