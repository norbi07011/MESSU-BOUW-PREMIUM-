# 🤖 Instalacja Android Studio - Szybki Start

## ⬇️ POBIERZ I ZAINSTALUJ

### Krok 1: Pobierz Android Studio
Link: https://developer.android.com/studio

Kliknij **"Download Android Studio Ladybug"** (najnowsza wersja)
Rozmiar: ~1.1 GB

### Krok 2: Uruchom instalator
1. Otwórz pobrany plik `.exe`
2. Kliknij **"Next"**
3. **Zaznacz wszystko** (domyślnie OK):
   - ✅ Android Studio
   - ✅ Android Virtual Device
4. Kliknij **"Next"**
5. Wybierz lokalizację (domyślna OK)
6. Kliknij **"Install"**
7. Poczekaj ~5-10 minut

### Krok 3: Setup Wizard (pierwsze uruchomienie)
1. Po instalacji kliknij **"Finish"**
2. Android Studio się uruchomi
3. Pojawi się **Setup Wizard**:
   - Kliknij **"Next"**
   - Wybierz **"Standard"** → **"Next"**
   - Wybierz motyw (dowolny) → **"Next"**
   - Kliknij **"Finish"**
4. **CZEKAJ** - pobierze Android SDK (~2-3 GB, 10-30 minut)

### Krok 4: Zakończenie instalacji SDK
Po pobraniu SDK:
1. Kliknij **"Finish"**
2. **ZAMKNIJ Android Studio** (nie potrzebujemy go otwartego)

## ✅ SPRAWDZENIE INSTALACJI

Otwórz PowerShell i wpisz:

```powershell
Test-Path "C:\Users\MESSU BOUW\AppData\Local\Android\Sdk"
```

Jeśli wyświetli **True** = Gotowe! ✅

## 🎯 PO INSTALACJI

Wróć do VS Code i napisz: **"ANDROID STUDIO ZAINSTALOWANE"**

Wtedy automatycznie:
1. Zbuduję APK
2. Pokażę jak przenieść na telefon
3. Zainstalujesz aplikację!

## ⚠️ PROBLEMY?

**Pobieranie SDK trwa bardzo długo:**
- To normalne, SDK to ~2-3 GB
- Sprawdź połączenie internetowe

**Brak miejsca na dysku:**
- Potrzebujesz minimum 5 GB wolnego miejsca

**Instalacja się zawiesiła:**
- Zamknij Android Studio
- Uruchom ponownie instalator

## 📍 GDZIE BĘDZIE SDK?

Standardowa lokalizacja:
```
C:\Users\MESSU BOUW\AppData\Local\Android\Sdk
```

Tam będą narzędzia do budowania APK!
