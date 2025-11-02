# 📱 POBIERZ APLIKACJĘ NA TELEFON - INSTRUKCJA

## ✅ CO ZROBIŁEM:

Przekształciłem aplikację webową w **prawdziwą aplikację Android (.apk)** którą możesz zainstalować na telefonie jednym kliknięciem!

---

## 🚀 JAK POBRAĆ NA TELEFON:

### **Krok 1: Poczekaj na zbudowanie .apk (jednorazowo)**

Gradle buduje aplikację w tle. **Poczekaj ~5-10 minut** za pierwszym razem.

Sprawdź status:
```bash
dir android\app\build\outputs\apk\debug\*.apk
```

Gdy zobaczysz `app-debug.apk` - plik jest gotowy! ✅

---

### **Krok 2: Skopiuj .apk do folderu public**

Uruchom skrypt:
```bash
copy-apk-to-public.bat
```

Lub ręcznie:
```bash
copy android\app\build\outputs\apk\debug\app-debug.apk public\NORBS-Faktur.apk
```

---

### **Krok 3: Uruchom serwer**

```bash
npm run dev
```

Serwer wystartuje na: `http://192.168.178.75:5000`

---

### **Krok 4: Pobierz na telefon**

#### **SPOSÓB A: Przez przycisk (NAJŁATWIEJSZY)** 👍

1. Otwórz aplikację na komputerze: `http://localhost:5000`
2. Kliknij **"Pobierz aplikację Android"** (zielony przycisk)
3. Plik `.apk` zostanie pobrany
4. Na telefonie: otwórz pobrany plik → **Zainstaluj**
5. Gotowe! 🎉

#### **SPOSÓB B: Bezpośrednie pobranie z telefonu**

1. Na telefonie wpisz w przeglądarce:
   ```
   http://192.168.178.75:5000/NORBS-Faktur.apk
   ```
2. Plik się pobierze automatycznie
3. Otwórz → **Zainstaluj**
4. Gotowe! 🎉

---

## ⚠️ WAŻNE:

### **Włącz "Nieznane źródła" na telefonie:**

**Android 8+:**
1. Ustawienia → Bezpieczeństwo i prywatność
2. "Instalowanie nieznanych aplikacji"
3. Wybierz przeglądarkę (np. Chrome)
4. Włącz "Zezwalaj z tego źródła"

**Android 7 i starsze:**
1. Ustawienia → Bezpieczeństwo
2. Włącz "Nieznane źródła"

### **Telefon i komputer muszą być w tej samej sieci Wi-Fi!** 📡

---

## 🔄 BUDOWANIE NOWEJ WERSJI .apk:

Gdy zmienisz kod i chcesz nową wersję na telefonie:

```bash
# 1. Zbuduj nową aplikację
npm run build

# 2. Synchronizuj z Android
npm run android:sync

# 3. Zbuduj nowy .apk
cd android
gradlew.bat assembleDebug
cd ..

# 4. Skopiuj do public
copy-apk-to-public.bat
```

Lub jedną komendą:
```bash
npm run android:build
```

---

## 📝 CO SIĘ ZMIENIŁO:

### ❌ STARE (QR kody, skanowanie):
- Musisz skanować QR kod
- Otwierać linki w przeglądarce
- Instalować jako PWA przez menu

### ✅ NOWE (prawdziwa aplikacja):
- **Klik → Pobierz → Zainstaluj**
- Prawdziwa aplikacja Android (.apk)
- Instaluje się jak normalna aplikacja
- Działa offline
- Dane zapisane lokalnie

---

## 🎯 PODSUMOWANIE:

1. ✅ Capacitor zainstalowany
2. ✅ Projekt Android gotowy
3. 🔄 Gradle buduje .apk (poczekaj 5-10 min)
4. ⏳ Po zbudowaniu uruchom: `copy-apk-to-public.bat`
5. 🚀 Kliknij "Pobierz aplikację Android" i gotowe!

---

**Masz pytania? Sprawdź `BUILD-ANDROID-INSTRUKCJE.md`**

