export interface Company {
  id: string;
  name: string;
  address: string;
  kvk: string;
  vat_number: string;
  eori: string;
  iban: string;
  bic: string;
  phone: string;
  phone_mobile: string;
  phone_whatsapp: string;
  website: string;
  email: string;
  email_alt: string;
  bank_name: string;
  account_number: string;
  default_payment_term_days: number;
  default_vat_rate: number;
  currency: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  country: string; // Kraj klienta
  client_type: 'individual' | 'company'; // Osoba prywatna czy firma
  vat_number: string; // BTW/VAT number
  kvk_number?: string; // KVK numer (tylko dla Holandii)
  nip_number?: string; // NIP (tylko dla Polski)
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  unit_price: number;
  vat_rate: number;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface Invoice {
  id: string;
  invoice_number: string;
  company_id: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  status: InvoiceStatus;
  total_net: number;
  total_vat: number;
  total_gross: number;
  vat_note: string;
  payment_qr_payload: string;
  payment_reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  id: string;
  invoice_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_net: number;
  line_vat: number;
  line_gross: number;
}

export interface InvoiceCounter {
  year: number;
  month: number;
  last_seq: number;
}

export interface YearReport {
  total_net: number;
  total_vat: number;
  total_gross: number;
  invoice_count: number;
  top_clients: Array<{
    client_name: string;
    total_gross: number;
    invoice_count: number;
  }>;
  monthly_revenue: Array<{
    month: number;
    total_gross: number;
    invoice_count: number;
  }>;
}

export type Language = 'pl' | 'nl' | 'en';

export type InvoiceTemplateStyle = 'classic' | 'modern' | 'minimal' | 'professional' | 'creative';

export interface InvoiceTemplate {
  id: string;
  name: string;
  style: InvoiceTemplateStyle;
  description: string;
  thumbnail?: string;
  config: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    headerStyle: 'compact' | 'spacious' | 'centered';
    tableStyle: 'lined' | 'striped' | 'bordered' | 'minimal';
    footerStyle: 'standard' | 'detailed' | 'compact';
    showLogo: boolean;
    showQRCode: boolean;
    showBankDetails: boolean;
    showWeekNumber: boolean;
  };
}

export interface InvoiceSettings {
  selectedTemplateId: string;
  customTemplates: InvoiceTemplate[];
}
