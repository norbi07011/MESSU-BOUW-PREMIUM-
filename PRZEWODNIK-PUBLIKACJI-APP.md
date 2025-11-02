# 📱 Przewodnik Publikacji Aplikacji MESSU BOUW

## 🎯 PLAN DZIAŁANIA

### Część 1: Budowanie Aplikacji (TERAZ)
- ✅ Android platform dodany
- ✅ iOS platform dodany
- 🔄 Budowanie APK (Android)
- ⏳ Budowanie IPA (iOS) - wymaga Mac lub usługi online

### Część 2: Rejestracja Kont Developerskich
- Google Play Console ($25 jednorazowo)
- Apple Developer Program ($99/rok)

### Część 3: Publikacja
- Wgranie APK do Google Play
- Wgranie IPA do App Store

---

## 📦 CZĘŚĆ 1A: BUDOWANIE APK DLA ANDROID

### Krok 1: Zainstaluj Android Studio (jeśli jeszcze nie masz)

**Pobierz:**
https://developer.android.com/studio

**Zainstaluj:**
1. Uruchom instalator
2. Wybierz "Standard" setup
3. Poczekaj na pobranie Android SDK (~2-3 GB)
4. Android SDK będzie w: `C:\Users\MESSU BOUW\AppData\Local\Android\Sdk`

### Krok 2: Ustaw zmienne środowiskowe

Otwórz PowerShell i wykonaj:

```powershell
# Ustawienie ANDROID_HOME
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\MESSU BOUW\AppData\Local\Android\Sdk', 'User')

# Dodanie do PATH
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$newPath = "$currentPath;C:\Users\MESSU BOUW\AppData\Local\Android\Sdk\platform-tools;C:\Users\MESSU BOUW\AppData\Local\Android\Sdk\tools"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
```

**ZAMKNIJ i otwórz na nowo PowerShell!**

### Krok 3: Utwórz plik local.properties

Stwórz plik: `android/local.properties` z zawartością:

```
sdk.dir=C:\\Users\\MESSU BOUW\\AppData\\Local\\Android\\Sdk
```

### Krok 4: Zbuduj APK

```powershell
cd "c:\Users\MESSU BOUW\Downloads\mesu-bouw--main\mesu-bouw--main"
npm run build
npx cap sync android
cd android
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
.\gradlew.bat assembleRelease
```

**APK będzie w:**
`android/app/build/outputs/apk/release/app-release-unsigned.apk`

### Krok 5: Podpisz APK (wymagane dla Google Play)

**Utwórz keystore:**

```powershell
cd "c:\Users\MESSU BOUW\Downloads\mesu-bouw--main\mesu-bouw--main"
keytool -genkey -v -keystore messu-bouw-release-key.keystore -alias messu-bouw -keyalg RSA -keysize 2048 -validity 10000
```

Podaj dane:
- Password: (zapamiętaj!)
- Imię i nazwisko: MESSU BOUW
- Organizacja: MESSU BOUW
- Miasto, Kraj, itd.

**Zapisz hasło w bezpiecznym miejscu!**

**Skonfiguruj gradle do podpisywania:**

Utwórz plik: `android/key.properties`

```
storePassword=TWOJE_HASLO
keyPassword=TWOJE_HASLO
keyAlias=messu-bouw
storeFile=../messu-bouw-release-key.keystore
```

**Zbuduj podpisany APK:**

```powershell
cd android
.\gradlew.bat assembleRelease
```

**Gotowy APK:**
`android/app/build/outputs/apk/release/app-release.apk`

---

## 📦 CZĘŚĆ 1B: BUDOWANIE IPA DLA iOS

### ⚠️ PROBLEM: Potrzebujesz Mac!

Apple wymaga **Xcode** (działa tylko na Mac) do budowania aplikacji iOS.

### ROZWIĄZANIA:

#### Opcja 1: Masz Mac
1. Otwórz projekt w Xcode: `ios/App/App.xcworkspace`
2. Product → Archive
3. Distribute App
4. Wybierz "App Store Connect"

#### Opcja 2: NIE masz Mac - Użyj EAS Build (Expo)

**Darmowa usługa budowania w chmurze!**

```powershell
# Zainstaluj EAS CLI
npm install -g eas-cli

# Zaloguj się (utworzy konto jeśli nie masz)
eas login

# Skonfiguruj projekt
eas build:configure

# Zbuduj iOS
eas build --platform ios
```

**To zbuduje IPA w chmurze bez Mac!**

#### Opcja 3: Capacitor Cloud

```powershell
npx cap cloud init
npx cap cloud build ios
```

**Koszt:** ~$20/miesiąc (alternatywa dla Mac)

---

## 💰 CZĘŚĆ 2A: GOOGLE PLAY DEVELOPER

### Koszt: $25 (jednorazowo, na zawsze)

### Krok 1: Załóż konto

1. Wejdź na: https://play.google.com/console/signup
2. Zaloguj się kontem Google
3. Wypełnij dane:
   - Typ konta: **Organizacja** (lub Indywidualne)
   - Nazwa dewelopera: **MESSU BOUW**
   - Adres email kontaktowy
4. Zapłać $25 (karta kredytowa/debetowa)
5. Zaakceptuj umowę

### Krok 2: Utwórz aplikację

1. Kliknij "Utwórz aplikację"
2. Nazwa: **MESSU BOUW - Faktury**
3. Język domyślny: **Polski** (lub Holenderski)
4. Typ: **Aplikacja**
5. Bezpłatna/Płatna: **Bezpłatna**

### Krok 3: Wypełnij dane aplikacji

**Dashboard → Zawartość aplikacji:**
- Deklaracja treści
- Klasyfikacja treści (kwestionariusz)
- Grupa docelowa
- Dane kontaktowe

**Dashboard → Ustawienia:**
- Ikona aplikacji (512x512 px)
- Zrzuty ekranu (minimum 2)
- Opis krótki (80 znaków)
- Opis pełny (4000 znaków)

### Krok 4: Wgraj APK

1. **Produkcja** → **Utwórz nową wersję**
2. Przeciągnij `app-release.apk`
3. Numer wersji: 1.0.0
4. Opis zmian: "Pierwsza wersja aplikacji"
5. **Zapisz** → **Przejrzyj wersję** → **Rozpocznij wdrożenie**

### Krok 5: Weryfikacja

- Google sprawdza aplikację: **1-3 dni**
- Dostaniesz email z wynikiem
- Jeśli zaakceptowana: dostępna w Google Play!

---

## 🍎 CZĘŚĆ 2B: APPLE DEVELOPER PROGRAM

### Koszt: $99/rok (subskrypcja)

### Krok 1: Załóż konto

1. Wejdź na: https://developer.apple.com/programs/enroll/
2. Zaloguj się Apple ID
3. Wybierz typ konta:
   - **Organization** (jeśli masz firmę)
   - **Individual** (jeśli sam)
4. Wypełnij dane osobowe/firmowe
5. Zapłać $99 (karta kredytowa)

### Krok 2: Weryfikacja

- Apple sprawdza dane: **1-2 dni**
- Dostaniesz email z potwierdzeniem

### Krok 3: App Store Connect

1. Wejdź na: https://appstoreconnect.apple.com/
2. Kliknij **"My Apps"** → **"+"** → **"New App"**
3. Wypełnij:
   - Platform: **iOS**
   - Name: **MESSU BOUW - Faktury**
   - Primary Language: **Polish** (lub Dutch)
   - Bundle ID: `com.messubouw.faktury`
   - SKU: `messubouw-faktury-001`

### Krok 4: Przygotuj materiały

**Wymagane:**
- Ikona 1024x1024 px (bez alfa, bez zaokrągleń)
- Zrzuty ekranu iPhone (różne rozmiary)
- Opis aplikacji
- Słowa kluczowe
- URL wsparcia
- URL polityki prywatności

### Krok 5: Wgraj IPA

**Używając Xcode (na Mac):**
1. Otwórz projekt w Xcode
2. Product → Archive
3. Distribute App → App Store Connect
4. Upload

**LUB używając Transporter (Mac/Windows):**
1. Pobierz Apple Transporter z App Store (Mac) lub strony Apple
2. Zaloguj się Apple ID
3. Przeciągnij plik `.ipa`
4. Deliver

### Krok 6: Wypełnij App Store Connect

1. Wróć do App Store Connect
2. Wybierz wgrane buildy
3. Wypełnij wszystkie wymagane pola
4. **Submit for Review**

### Krok 7: Przegląd Apple

- Apple sprawdza aplikację: **1-7 dni** (czasem dłużej)
- Mogą poprosić o dodatkowe informacje
- Dostaniesz email z wynikiem
- Jeśli zaakceptowana: dostępna w App Store!

---

## 📋 CHECKLIST PRZED PUBLIKACJĄ

### Android (Google Play)
- [ ] APK zbudowany i podpisany
- [ ] Konto Google Play Developer ($25)
- [ ] Ikona 512x512 px
- [ ] Minimum 2 zrzuty ekranu
- [ ] Opis aplikacji (krótki i pełny)
- [ ] Polityka prywatności (URL)
- [ ] Kwestionariusz klasyfikacji treści wypełniony

### iOS (App Store)
- [ ] IPA zbudowany i podpisany
- [ ] Konto Apple Developer ($99/rok)
- [ ] Ikona 1024x1024 px (bez alfa)
- [ ] Zrzuty ekranu dla wszystkich wymaganych rozmiarów
- [ ] Opis aplikacji
- [ ] Słowa kluczowe
- [ ] URL wsparcia
- [ ] Polityka prywatności (URL)

---

## 🆘 POMOC I WSPARCIE

### Gdzie szukać pomocy?

1. **Google Play Console Help:**
   https://support.google.com/googleplay/android-developer

2. **App Store Connect Help:**
   https://developer.apple.com/support/app-store-connect/

3. **Capacitor Documentation:**
   https://capacitorjs.com/docs

4. **EAS Build Documentation:**
   https://docs.expo.dev/build/introduction/

### Typowe problemy:

**Problem:** Gradle build fails
- **Rozwiązanie:** Sprawdź ANDROID_HOME i local.properties

**Problem:** iOS build wymaga Mac
- **Rozwiązanie:** Użyj EAS Build lub Capacitor Cloud

**Problem:** APK nie działa
- **Rozwiązanie:** Zbuduj release version z podpisem

**Problem:** Apple odrzucił aplikację
- **Rozwiązanie:** Przeczytaj feedback, popraw i wyślij ponownie

---

## ✅ NASTĘPNE KROKI

1. **TERAZ:** Zainstaluj Android Studio
2. **Potem:** Zbuduj APK
3. **Później:** Załóż konta developerskie
4. **Na koniec:** Opublikuj aplikacje!

Powodzenia! 🚀
