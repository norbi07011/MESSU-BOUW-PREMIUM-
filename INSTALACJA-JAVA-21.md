# ☕ Instalacja Java 21 - Instrukcja

## 📥 POBIERZ JAVA 21

Otwarta strona w przeglądarce pokazuje Java 21 do pobrania.

### Krok 1: Wybierz odpowiednią wersję
Na stronie:
1. **Operating System:** Windows
2. **Architecture:** x64
3. **Package Type:** JDK
4. **Version:** 21 - LTS

### Krok 2: Pobierz
Kliknij **".msi"** przy "Windows x64" (installer)
Rozmiar: ~180 MB

## 🔧 ZAINSTALUJ JAVA 21

### Krok 3: Uruchom instalator
1. Otwórz pobrany plik `.msi`
2. Kliknij **"Next"**
3. **WAŻNE:** Zapamiętaj lokalizację instalacji (standardowo):
   ```
   C:\Program Files\Eclipse Adoptium\jdk-21.x.x.x-hotspot\
   ```
4. Kliknij **"Next"** → **"Install"**
5. Poczekaj ~2 minuty
6. Kliknij **"Finish"**

## ✅ SPRAWDŹ INSTALACJĘ

Otwórz **NOWY** PowerShell i wpisz:

```powershell
java -version
```

Powinno pokazać: `openjdk version "21.x.x"`

## 🗑️ USUŃ STARĄ JAVA 17 (OPCJONALNE)

### Opcja A: Przez Panel Sterowania
1. Otwórz **Panel Sterowania**
2. **Programy i funkcje**
3. Znajdź **"Eclipse Temurin JDK with Hotspot 17"**
4. Kliknij **Odinstaluj**

### Opcja B: Zostaw obie
Możesz mieć obie wersje i wybierać którą używać przez JAVA_HOME

## 🎯 PO INSTALACJI

Napisz tutaj: **"JAVA 21 ZAINSTALOWANA"**

Wtedy:
1. Sprawdzę wersję
2. Zbuduję APK z Java 21
3. APK będzie gotowy!

## 📍 LOKALIZACJA JAVA 21

Standardowa ścieżka (potrzebna później):
```
C:\Program Files\Eclipse Adoptium\jdk-21.x.x.x-hotspot\
```

Gdzie `x.x.x` to numer konkretnej wersji (np. 21.0.5.11)
