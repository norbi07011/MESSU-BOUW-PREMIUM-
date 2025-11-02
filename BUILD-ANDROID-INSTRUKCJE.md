# 📱 Budowanie Aplikacji Android (.apk)

## ✅ Co zostało zrobione:

1. **Capacitor zainstalowany** - narzędzie do tworzenia natywnych aplikacji mobilnych
2. **Platforma Android dodana** - projekt Android gotowy
3. **Build rozpoczęty** - Gradle buduje .apk w tle

## 📁 Gdzie znajdziesz .apk:

Po zakończeniu buildu (3-5 minut), plik będzie tutaj:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 📲 Jak zainstalować .apk na telefonie:

### **Sposób 1: Bezpośrednio przez USB**
1. Podłącz telefon do komputera (USB)
2. Skopiuj `app-debug.apk` na telefon
3. Na telefonie: otwórz plik → "Zainstaluj"
4. Możesz potrzebować włączyć "Nieznane źródła" w ustawieniach

### **Sposób 2: Przez sieć (łatwiejsze)**
1. Skopiuj `app-debug.apk` do folderu `public/`
2. Uruchom `npm run dev`
3. Na telefonie wejdź: `http://192.168.178.75:5000/app-debug.apk`
4. Plik się pobierze → Zainstaluj

### **Sposób 3: Jeden klik z aplikacji (NAJLEPSZY)**
Zmienię przycisk "Pobierz na telefon" żeby automatycznie pobierał .apk!

## 🔧 Komendy do budowania:

```bash
# Zbuduj nową wersję .apk
npm run android:build

# Otwórz projekt w Android Studio (jeśli chcesz edytować)
npm run android:open

# Tylko synchronizuj zmiany
npm run android:sync
```

## ⚠️ Ważne:

- **app-debug.apk** to wersja testowa (nie zoptymalizowana)
- Aby stworzyć wersję produkcyjną (release), potrzebujesz:
  - Podpisać aplikację certyfikatem
  - Użyć `assembleRelease` zamiast `assembleDebug`
  - Opublikować w Google Play Store (opcjonalnie)

## 📝 Status:

✅ Capacitor - zainstalowany
✅ Android - dodany
🔄 Gradle - buduje .apk (w tle)
⏳ Poczekaj ~5 minut...

Gdy build się skończy, zobaczysz plik .apk gotowy do instalacji!

