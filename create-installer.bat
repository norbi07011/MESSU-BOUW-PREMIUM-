@echo off
echo Tworzenie instalatora NORBS Fakturowanie...

REM Sprawdź czy istnieje folder release/win-unpacked
if not exist "release\win-unpacked" (
    echo Błąd: Nie znaleziono folderu release\win-unpacked
    echo Najpierw uruchom: npm run build:electron
    pause
    exit /b 1
)

REM Utwórz folder docelowy
if not exist "release\installer" mkdir "release\installer"

REM Skopiuj wszystkie pliki
echo Kopiowanie plików aplikacji...
robocopy "release\win-unpacked" "release\installer\NORBS-Fakturowanie" /E /XF *.log

REM Utwórz skrypt uruchamiający
echo Creating launch script...
echo @echo off > "release\installer\NORBS-Fakturowanie.bat"
echo cd /d "%%~dp0NORBS-Fakturowanie" >> "release\installer\NORBS-Fakturowanie.bat"
echo start "" "NORBS Fakturowanie.exe" >> "release\installer\NORBS-Fakturowanie.bat"

REM Utwórz instrukcje instalacji
echo Tworzenie instrukcji instalacji...
echo NORBS Fakturowanie - Instrukcja instalacji > "release\installer\INSTRUKCJA.txt"
echo ================================================ >> "release\installer\INSTRUKCJA.txt"
echo. >> "release\installer\INSTRUKCJA.txt"
echo 1. Skopiuj folder "NORBS-Fakturowanie" na dysk C:\ >> "release\installer\INSTRUKCJA.txt"
echo    (lub dowolne miejsce na komputerze) >> "release\installer\INSTRUKCJA.txt"
echo. >> "release\installer\INSTRUKCJA.txt"
echo 2. Uruchom aplikację przez: >> "release\installer\INSTRUKCJA.txt"
echo    - Dwuklik na "NORBS-Fakturowanie.bat" >> "release\installer\INSTRUKCJA.txt"
echo    - LUB wejście do folderu i uruchomienie "NORBS Fakturowanie.exe" >> "release\installer\INSTRUKCJA.txt"
echo. >> "release\installer\INSTRUKCJA.txt"
echo 3. Możesz utworzyć skrót na pulpicie: >> "release\installer\INSTRUKCJA.txt"
echo    - Kliknij prawym na "NORBS Fakturowanie.exe" >> "release\installer\INSTRUKCJA.txt"
echo    - Wybierz "Utwórz skrót" >> "release\installer\INSTRUKCJA.txt"
echo    - Przeciągnij skrót na pulpit >> "release\installer\INSTRUKCJA.txt"
echo. >> "release\installer\INSTRUKCJA.txt"
echo Aplikacja jest w pełni lokalna - nie wymaga internetu. >> "release\installer\INSTRUKCJA.txt"
echo Dane są zapisywane w: Documents\NORBS Faktury >> "release\installer\INSTRUKCJA.txt"

REM Stwórz zip installer
if exist "C:\Program Files\7-Zip\7z.exe" (
    echo Tworzenie archiwum ZIP...
    "C:\Program Files\7-Zip\7z.exe" a -tzip "release\NORBS-Fakturowanie-Installer.zip" "release\installer\*"
    echo.
    echo ✅ Gotowy instalator: release\NORBS-Fakturowanie-Installer.zip
) else (
    echo ⚠️  7-Zip nie znaleziony - skopiuj ręcznie folder release\installer
)

echo.
echo 📁 Pliki gotowe w: release\installer\
echo 📦 Archiwum ZIP (jeśli dostępne): release\NORBS-Fakturowanie-Installer.zip
echo.
echo ✅ Instalator gotowy!
pause