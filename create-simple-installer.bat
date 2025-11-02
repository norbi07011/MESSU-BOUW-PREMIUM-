@echo off
echo Creating simple installer for NORBS Fakturowanie...

REM Sprawdz czy istnieje folder z aplikacja
if not exist "release\win-unpacked\NORBS Fakturowanie.exe" (
    echo BŁĄD: Nie znaleziono aplikacji w release\win-unpacked\
    echo Najpierw uruchom: npm run build:electron
    pause
    exit /b 1
)

REM Tworz folder instalatora jeśli nie istnieje
if not exist "release\simple-installer" mkdir "release\simple-installer"

REM Kopiuj pliki aplikacji
echo Kopiowanie plików aplikacji...
xcopy "release\win-unpacked\*" "release\simple-installer\NORBS-Fakturowanie\" /s /e /i /y

REM Tworz skrypt instalatora
echo Tworzenie skryptu instalatora...
(
echo @echo off
echo echo === NORBS Fakturowanie - Installer ===
echo echo.
echo echo Instaluję aplikację do katalogu C:\NORBS-Fakturowanie\
echo.
echo if not exist "C:\NORBS-Fakturowanie" mkdir "C:\NORBS-Fakturowanie"
echo.
echo echo Kopiowanie plików...
echo xcopy "%%~dp0NORBS-Fakturowanie\*" "C:\NORBS-Fakturowanie\" /s /e /i /y
echo.
echo echo Tworzenie skrótu na pulpicie...
echo echo Set oWS = WScript.CreateObject("WScript.Shell"^) > "%%temp%%\shortcut.vbs"
echo echo sLinkFile = "%%USERPROFILE%%\Desktop\NORBS Fakturowanie.lnk" >> "%%temp%%\shortcut.vbs"
echo echo Set oLink = oWS.CreateShortcut(sLinkFile^) >> "%%temp%%\shortcut.vbs"
echo echo oLink.TargetPath = "C:\NORBS-Fakturowanie\NORBS Fakturowanie.exe" >> "%%temp%%\shortcut.vbs"
echo echo oLink.WorkingDirectory = "C:\NORBS-Fakturowanie\" >> "%%temp%%\shortcut.vbs"
echo echo oLink.Description = "NORBS System Fakturowania" >> "%%temp%%\shortcut.vbs"
echo echo oLink.Save >> "%%temp%%\shortcut.vbs"
echo cscript "%%temp%%\shortcut.vbs"
echo del "%%temp%%\shortcut.vbs"
echo.
echo echo.
echo echo === INSTALACJA ZAKOŃCZONA ===
echo echo.
echo echo Aplikacja została zainstalowana w: C:\NORBS-Fakturowanie\
echo echo Skrót na pulpicie: NORBS Fakturowanie
echo echo.
echo echo Naciśnij ENTER aby uruchomić aplikację...
echo pause >nul
echo start "" "C:\NORBS-Fakturowanie\NORBS Fakturowanie.exe"
) > "release\simple-installer\INSTALL.bat"

REM Tworz README
(
echo === NORBS Fakturowanie - Instrukcje Instalacji ===
echo.
echo 1. Uruchom INSTALL.bat jako administrator
echo 2. Postępuj zgodnie z instrukcjami na ekranie
echo 3. Aplikacja zostanie zainstalowana w C:\NORBS-Fakturowanie\
echo 4. Skrót zostanie utworzony na pulpicie
echo.
echo === Deinstalacja ===
echo Aby odinstalować, usuń folder C:\NORBS-Fakturowanie\ i skrót z pulpitu
echo.
echo === Kontakt ===
echo NORBS Solutions
echo Pomoc techniczna: system@norbs.pl
) > "release\simple-installer\README.txt"

REM Pak do ZIP
echo Pakowanie do ZIP...
cd release\simple-installer
powershell -command "Compress-Archive -Path '*' -DestinationPath '..\NORBS-Fakturowanie-Simple-Installer.zip' -Force"
cd ..\..

echo.
echo === GOTOWE! ===
echo.
echo Plik instalatora utworzony: release\NORBS-Fakturowanie-Simple-Installer.zip
echo.
echo Rozpakuj ZIP i uruchom INSTALL.bat aby zainstalować aplikację.
echo.
pause