// Wydatki (Expenses) - Types dla holenderskiego ZZP

export type ExpenseCategory = 
  | 'it_software'           // IT Software & Hardware
  | 'marketing'             // Marketing & Reklama
  | 'office_equipment'      // Wyposażenie biura
  | 'telecom'               // Telefon & Internet
  | 'training'              // Szkolenia & Kursy
  | 'insurance'             // Ubezpieczenia
  | 'accountant'            // Księgowy & Doradca
  | 'travel'                // Podróże (nie-kilometrowe)
  | 'rent'                  // Wynajem przestrzeni
  | 'bank_fees'             // Koszty bankowe
  | 'subscriptions'         // Subskrypcje
  | 'professional_services' // Usługi profesjonalne
  | 'other';                // Inne

export interface Expense {
  id: string;
  date: string;                    // Data wydatku (YYYY-MM-DD)
  category: ExpenseCategory;
  supplier: string;                // Dostawca/Vendor
  description: string;             // Opis
  amount_net: number;              // Kwota netto
  vat_rate: number;                // Stawka VAT (0, 9, 21)
  vat_amount: number;              // Kwota VAT
  amount_gross: number;            // Kwota brutto (netto + VAT)
  currency: string;                // Waluta (EUR)
  payment_method: PaymentMethod;   // Metoda płatności
  is_vat_deductible: boolean;      // Czy VAT można odliczyć
  is_business_expense: boolean;    // Czy wydatek biznesowy (100%)
  private_percentage?: number;     // % prywatny (jeśli mieszany)
  project_id?: string;             // Powiązanie z projektem
  client_id?: string;              // Powiązanie z klientem (jeśli applicable)
  invoice_number?: string;         // Numer faktury zakupu
  receipt_url?: string;            // Ścieżka do załącznika (JPG/PDF)
  notes?: string;                  // Notatki
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 
  | 'bank_transfer'    // Przelew bankowy
  | 'card'             // Karta płatnicza
  | 'cash'             // Gotówka
  | 'direct_debit'     // Polecenie zapłaty
  | 'other';

export interface ExpenseCategory {
  id: ExpenseCategory;
  name: string;
  icon: string;
  description: string;
  tax_deductible: boolean;  // Czy domyślnie odliczalne od podatku
  vat_deductible: boolean;  // Czy domyślnie VAT można odliczyć
}

// Raport wydatków
export interface ExpenseReport {
  period: {
    startDate: string;
    endDate: string;
  };
  totalExpenses: number;           // Suma brutto
  totalNet: number;                // Suma netto
  totalVat: number;                // Suma VAT
  deductibleVat: number;           // VAT do odliczenia
  byCategory: Record<ExpenseCategory, {
    count: number;
    total: number;
    vat: number;
  }>;
  byMonth: Array<{
    month: string;
    total: number;
    vat: number;
  }>;
  bySupplier: Array<{
    supplier: string;
    count: number;
    total: number;
  }>;
}

// Kategorie wydatków z opisami (dla UI)
export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategory> = {
  it_software: {
    id: 'it_software',
    name: '💻 IT Software & Hardware',
    icon: '💻',
    description: 'Computers, software, licenses, cloud services',
    tax_deductible: true,
    vat_deductible: true,
  },
  marketing: {
    id: 'marketing',
    name: '📢 Marketing & Reklama',
    icon: '📢',
    description: 'Advertising, Google Ads, social media marketing',
    tax_deductible: true,
    vat_deductible: true,
  },
  office_equipment: {
    id: 'office_equipment',
    name: '🏢 Wyposażenie biura',
    icon: '🏢',
    description: 'Furniture, office supplies, equipment',
    tax_deductible: true,
    vat_deductible: true,
  },
  telecom: {
    id: 'telecom',
    name: '📱 Telefon & Internet',
    icon: '📱',
    description: 'Phone, internet, mobile subscriptions',
    tax_deductible: true,
    vat_deductible: true,
  },
  training: {
    id: 'training',
    name: '🎓 Szkolenia & Kursy',
    icon: '🎓',
    description: 'Courses, conferences, professional development',
    tax_deductible: true,
    vat_deductible: true,
  },
  insurance: {
    id: 'insurance',
    name: '🛡️ Ubezpieczenia',
    icon: '🛡️',
    description: 'Business insurance, liability, health',
    tax_deductible: true,
    vat_deductible: false, // Insurance VAT often not deductible
  },
  accountant: {
    id: 'accountant',
    name: '📊 Księgowy & Doradca',
    icon: '📊',
    description: 'Accountant fees, tax advisor, legal services',
    tax_deductible: true,
    vat_deductible: true,
  },
  travel: {
    id: 'travel',
    name: '🚗 Podróże',
    icon: '🚗',
    description: 'Business travel, hotels, parking (not kilometers)',
    tax_deductible: true,
    vat_deductible: true,
  },
  rent: {
    id: 'rent',
    name: '🏠 Wynajem przestrzeni',
    icon: '🏠',
    description: 'Office rent, coworking space, storage',
    tax_deductible: true,
    vat_deductible: true,
  },
  bank_fees: {
    id: 'bank_fees',
    name: '🏦 Koszty bankowe',
    icon: '🏦',
    description: 'Bank fees, transaction costs, payment processing',
    tax_deductible: true,
    vat_deductible: false, // Bank fees often VAT-exempt
  },
  subscriptions: {
    id: 'subscriptions',
    name: '🔄 Subskrypcje',
    icon: '🔄',
    description: 'Monthly subscriptions, SaaS, memberships',
    tax_deductible: true,
    vat_deductible: true,
  },
  professional_services: {
    id: 'professional_services',
    name: '🤝 Usługi profesjonalne',
    icon: '🤝',
    description: 'Consultants, freelancers, outsourcing',
    tax_deductible: true,
    vat_deductible: true,
  },
  other: {
    id: 'other',
    name: '⚡ Inne',
    icon: '⚡',
    description: 'Other business expenses',
    tax_deductible: true,
    vat_deductible: true,
  },
};

