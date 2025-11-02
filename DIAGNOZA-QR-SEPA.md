# 🔍 DIAGNOZA QR SEPA - INSTRUKCJA

## ❗ WAŻNE: Telefon pokazuje "Tekst" zamiast płatności?

### 📱 Problem ze skanerem:

**ROZWIĄZANIE:**
Musisz użyć **aplikacji bankowej ING/ABN AMRO/Rabobank**, NIE ogólnego skanera QR!

### 🧪 JAK SPRAWDZIĆ CZY QR KOD JEST PRAWIDŁOWY:

1. **Otwórz aplikację w przeglądarce** (`http://localhost:5000`)
2. **Naciśnij `F12`** (otwórz konsolę)
3. **Przejdź do zakładki "Faktury"**
4. **Kliknij "Download PDF/HTML"** na jakiejkolwiek fakturze
5. **SPRAWDŹ KONSOLĘ** - zobaczysz tabelę:

```
╔════════════════════════════════════════════════════════════╗
║           SEPA QR CODE PAYLOAD (EPC069-12)                ║
╠════════════════════════════════════════════════════════════╣
║ Linia 1 - Service Tag:         BCD                        ║
║ Linia 2 - Version:              002                        ║
║ Linia 3 - Character Set:        1                          ║
║ Linia 4 - Identification:       SCT                        ║
║ Linia 5 - BIC:                  INGBNL2A                   ║
║ Linia 6 - Beneficiary Name:     [TWOJA NAZWA]             ║
║ Linia 7 - IBAN:                 [TWÓJ IBAN]               ║
║ Linia 8 - Amount:               EUR500.00                  ║
║ Linia 9 - Purpose:              (empty)                    ║
║ Linia 10 - Struct Reference:    (empty)                    ║
║ Linia 11 - Remittance Info:     [INFO]                    ║
║ Linia 12 - Beneficiary Info:    (empty)                    ║
╚════════════════════════════════════════════════════════════╝
```

### ✅ CO SPRAWDZIĆ W TABELI:

- **Linia 7 (IBAN)**: Musi zaczynać się od "NL" i mieć 18 znaków
- **Linia 5 (BIC)**: Jeśli pusty - to OK dla NL banków
- **Linia 8 (Amount)**: Format **EUR123.45** (BEZ spacji!)

### 🏦 KTÓRE APLIKACJE OBSŁUGUJĄ SEPA QR:

✅ **Działają:**
- ING Banking (NL)
- ABN AMRO (NL) 
- Rabobank (NL)
- Bunq (NL)

❌ **NIE działają:**
- Ogólne skanery QR (Google Lens, itp.)
- Aplikacje "QR Code Scanner" z Google Play

### 📸 INSTRUKCJA:

1. Otwórz **aplikację ING** (nie skaner QR!)
2. Wybierz **"Betalen"** → **"Scannen"**
3. Zeskanuj QR kod z faktury
4. Powinno otworzyć formularz płatności z wypełnionymi danymi

### 🆘 JEŚLI NADAL NIE DZIAŁA:

Zrób screenshot **konsoli F12** podczas generowania PDF i prześlij mi. 
Zobaczę dokładnie, jakie dane są w QR kodzie!

---

## 🔧 Dane w bazie (domyślne):

- IBAN: NL25INGB0109126122
- BIC: INGBNL2A
- Bank: ING Bank

**Sprawdź w Settings, czy masz SWOJE PRAWDZIWE dane!**

