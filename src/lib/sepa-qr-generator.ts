/**
 * Generator SEPA QR kodów zgodny ze standardem EPC069-12 Version 2.0
 * https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation
 * 
 * WAŻNE: QR kod SEPA MUSI zaczynać się od "BCD" - to nie jest błąd!
 * Wszystkie prawdziwe płatności SEPA używają tego formatu.
 */

export interface SEPAQRData {
  bic: string;           // BIC banku (opcjonalny dla SEPA w strefie euro)
  name: string;          // Nazwa odbiorcy (max 70 znaków)
  iban: string;          // IBAN (bez spacji)
  amount: number;        // Kwota w EUR
  reference: string;     // Referencja płatności (np. numer faktury)
  purpose: string;       // Cel płatności (opis)
}

/**
 * Generuje payload dla SEPA QR kodu zgodnie ze standardem EPC069-12
 */
export function generateSEPAQRCode(data: SEPAQRData): string {
  // Walidacja i czyszczenie danych
  const cleanIBAN = data.iban.replace(/\s+/g, '').toUpperCase().trim();
  const cleanBIC = data.bic ? data.bic.replace(/\s+/g, '').toUpperCase().trim().substring(0, 11) : '';
  const beneficiaryName = data.name.trim().substring(0, 70);
  const remittanceInfo = (data.purpose || data.reference).trim().substring(0, 140);
  
  // Walidacja IBAN dla Holandii
  if (!cleanIBAN.match(/^NL\d{2}[A-Z]{4}\d{10}$/)) {
    console.warn('⚠️ IBAN format może być nieprawidłowy:', cleanIBAN);
    console.warn('   Oczekiwany format: NL + 2 cyfry + 4 litery + 10 cyfr (np. NL25INGB0109126122)');
  }
  
  // Format kwoty: EUR + kwota z dokładnie 2 miejscami po przecinku
  // WAŻNE: BEZ spacji między EUR a kwotą!
  const amountStr = `EUR${data.amount.toFixed(2)}`;
  
  // Standard EPC069-12 wymaga DOKŁADNIE 12 linii oddzielonych \n
  // Puste linie MUSZĄ być zachowane!
  const lines = [
    'BCD',                    // 1. Service Tag (OBOWIĄZKOWE: "BCD")
    '002',                    // 2. Version (zawsze "002")
    '1',                      // 3. Character Set (1 = UTF-8)
    'SCT',                    // 4. Identification (SCT = SEPA Credit Transfer)
    cleanBIC,                 // 5. BIC (może być puste dla transakcji w strefie euro)
    beneficiaryName,          // 6. Beneficiary Name (max 70 znaków)
    cleanIBAN,                // 7. Beneficiary Account (IBAN bez spacji)
    amountStr,                // 8. Amount (format: EUR123.45)
    '',                       // 9. Purpose (pusty - opcjonalny kod celu)
    '',                       // 10. Structured Reference (pusty - używamy unstructured)
    remittanceInfo,           // 11. Unstructured Remittance (max 140 znaków)
    '',                       // 12. Beneficiary to Originator Info (pusty - opcjonalny)
  ];
  
  const payload = lines.join('\n');
  
  // Debug output
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           SEPA QR CODE PAYLOAD (EPC069-12)                ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Linia 1 - Service Tag:        ', lines[0].padEnd(27), '║');
  console.log('║ Linia 2 - Version:            ', lines[1].padEnd(27), '║');
  console.log('║ Linia 3 - Character Set:      ', lines[2].padEnd(27), '║');
  console.log('║ Linia 4 - Identification:     ', lines[3].padEnd(27), '║');
  console.log('║ Linia 5 - BIC:                ', (lines[4] || '(empty)').padEnd(27), '║');
  console.log('║ Linia 6 - Beneficiary Name:   ', lines[5].substring(0, 27).padEnd(27), '║');
  console.log('║ Linia 7 - IBAN:               ', lines[6].padEnd(27), '║');
  console.log('║ Linia 8 - Amount:             ', lines[7].padEnd(27), '║');
  console.log('║ Linia 9 - Purpose:            ', (lines[8] || '(empty)').padEnd(27), '║');
  console.log('║ Linia 10 - Struct Reference:  ', (lines[9] || '(empty)').padEnd(27), '║');
  console.log('║ Linia 11 - Remittance Info:   ', lines[10].substring(0, 27).padEnd(27), '║');
  console.log('║ Linia 12 - Beneficiary Info:  ', (lines[11] || '(empty)').padEnd(27), '║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Total Length:', payload.length, 'bytes                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nFull Payload:\n' + payload);
  console.log('\n');
  
  return payload;
}

