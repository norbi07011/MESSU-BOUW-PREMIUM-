# 🖼️ JAK DODAĆ WŁASNE LOGO DO FOLDERU PUBLIC

## ✅ CO ZMIENIŁEM:

### **1. Nazwa aplikacji:**
- ❌ PRZED: **NORBS FAKTUR**
- ✅ TERAZ: **ZZP Werkplaats**

### **2. Logo w nagłówku aplikacji:**
- Logo firmy z Ustawień (Settings) wyświetla się automatycznie
- Jeśli nie ma logo → pokazuje się ikona faktury (FileText)

### **3. Subtitle:**
- ❌ PRZED: "Nowoczesna Aplikacja Fakturowania"
- ✅ TERAZ: "Beheer uw facturen professioneel" (po holendersku)

---

## 📁 JAK DODAĆ WŁASNE LOGO DO PUBLIC (OPCJONALNIE):

### **Sposób 1: Logo w Ustawieniach (ZALECANE)** ✅

1. **Przejdź do Ustawień** w aplikacji
2. **Kliknij "Upload Logo"** w sekcji "Company Logo"
3. **Wybierz swoje logo** (PNG, JPG, max 2MB)
4. **Kliknij "Save"**

**To logo pojawi się automatycznie:**
- ✅ W nagłówku aplikacji (zamiast ikony domku)
- ✅ Na wszystkich fakturach PDF
- ✅ Zapisane w bazie danych

---

### **Sposób 2: Logo w folderze Public (dla PWA)** 

Jeśli chcesz mieć logo w ikonie aplikacji PWA na telefonie:

1. **Przygotuj logo:**
   - Format: PNG lub SVG
   - Rozmiar: 512x512 pikseli (najlepszy dla PWA)
   - Nazwa: `company-logo.png` lub `company-logo.svg`

2. **Skopiuj do folderu public:**
   ```
   E:\yy\norbs-service-faktur\public\company-logo.png
   ```

3. **Zaktualizuj manifest.json** (opcjonalnie):
   ```json
   {
     "icons": [
       {
         "src": "/company-logo.png",
         "sizes": "512x512",
         "type": "image/png",
         "purpose": "any maskable"
       }
     ]
   }
   ```

---

## 🎨 AKTUALNA IKONA PWA:

Domyślna ikona to **SVG z literami "ZW"** (ZZP Werkplaats):
- Plik: `public/icon.svg`
- Gradient: niebieski do ciemnoniebieskiego
- Tekst: "ZW" białymi literami

---

## 🔍 GDZIE LOGO SIĘ WYŚWIETLA:

### **1. Nagłówek aplikacji** (górny lewy róg):
- Pokazuje logo z Ustawień (`company.logo_url`)
- Jeśli brak → ikona faktury (FileText icon)

### **2. Faktury PDF:**
- Zawsze pokazuje logo z Ustawień
- Jeśli brak → brak logo na fakturze

### **3. PWA (aplikacja na telefonie):**
- Ikona z `public/icon.svg` (lub z `manifest.json`)
- Nie zmienia się automatycznie z Ustawień

---

## 📝 PRZYKŁADOWY PRZEPŁYW:

### **Chcę mieć logo na fakturach i w aplikacji:**

1. ✅ Wejdź do **Ustawień**
2. ✅ Kliknij **"Upload Logo"**
3. ✅ Wybierz swoje logo (np. `my-logo.png`)
4. ✅ Kliknij **"Save"**
5. ✅ **GOTOWE!** Logo pojawi się:
   - W nagłówku aplikacji
   - Na wszystkich fakturach PDF

---

### **Chcę też zmienić ikonę PWA na telefonie:**

1. ✅ Skopiuj logo do `public/company-logo.png`
2. ✅ Edytuj `public/manifest.json`:
   ```json
   "icons": [
     {
       "src": "/company-logo.png",
       "sizes": "512x512",
       "type": "image/png"
     }
   ]
   ```
3. ✅ Przebuduj aplikację: `npm run build`
4. ✅ Zainstaluj ponownie PWA na telefonie

---

## 🚀 CO DZIAŁA JUŻ TERAZ:

✅ Nazwa zmieniona na **"ZZP Werkplaats"**
✅ Subtitle po holendersku
✅ Logo firmy w nagłówku (jeśli dodane w Ustawieniach)
✅ Ikona PWA z literami "ZW"
✅ Logo na fakturach (jeśli dodane w Ustawieniach)

---

## 💡 POLECAM:

Użyj **Sposób 1** (Upload w Ustawieniach) - to najszybszy i najprostszy sposób!

Logo automatycznie:
- Zapisze się w bazie danych
- Pojawi się wszędzie gdzie potrzebne
- Będzie działać offline

**Nie musisz nic robić z folderem public!** 🎉

