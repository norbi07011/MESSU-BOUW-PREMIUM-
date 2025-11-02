// Import nowego generatora SEPA QR
import { generateSEPAQRCode } from './sepa-qr-generator';

export function generateInvoiceNumber(year: number, month: number, seq: number): string {
  const yearStr = year.toString();
  const monthStr = month.toString().padStart(2, '0');
  const seqStr = seq.toString().padStart(3, '0');
  return `FV-${yearStr}-${monthStr}-${seqStr}`;
}

export function calculateLineTotals(quantity: number, unitPrice: number, vatRate: number) {
  const lineNet = Math.round(quantity * unitPrice * 100) / 100;
  const lineVat = Math.round(lineNet * (vatRate / 100) * 100) / 100;
  const lineGross = Math.round((lineNet + lineVat) * 100) / 100;
  
  return { lineNet, lineVat, lineGross };
}

export function calculateInvoiceTotals(lines: Array<{ line_net: number; line_vat: number; line_gross: number }>) {
  const totalNet = Math.round(lines.reduce((sum, line) => sum + line.line_net, 0) * 100) / 100;
  const totalVat = Math.round(lines.reduce((sum, line) => sum + line.line_vat, 0) * 100) / 100;
  const totalGross = Math.round(lines.reduce((sum, line) => sum + line.line_gross, 0) * 100) / 100;
  
  return { totalNet, totalVat, totalGross };
}

export function formatCurrency(amount: number, locale: string = 'nl-NL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string, locale: string = 'nl-NL'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

export function getISOWeekNumber(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function getInvoiceNumberBreakdown(issueDate: string) {
  const date = new Date(issueDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const week = getISOWeekNumber(date);
  
  return { year, month, week };
}

export function addDays(date: string, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

/**
 * @deprecated Użyj generateSEPAQRCode() z sepa-qr-generator.ts
 * Funkcja wrapper dla kompatybilności wstecznej
 */
export function generateSEPAQRPayload(
  bic: string,
  name: string,
  iban: string,
  amount: number,
  reference: string,
  information: string
): string {
  return generateSEPAQRCode({
    bic,
    name,
    iban,
    amount,
    reference,
    purpose: information
  });
}

export function getNextInvoiceNumber(
  counters: Map<string, number>,
  issueDate: string
): { number: string; year: number; month: number; seq: number } {
  const date = new Date(issueDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  const key = `${year}-${month}`;
  const currentSeq = counters.get(key) || 0;
  const nextSeq = currentSeq + 1;
  
  counters.set(key, nextSeq);
  
  return {
    number: generateInvoiceNumber(year, month, nextSeq),
    year,
    month,
    seq: nextSeq,
  };
}
