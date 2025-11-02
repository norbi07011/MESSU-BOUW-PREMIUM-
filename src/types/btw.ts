/**
 * BTW Aangifte (VAT Declaration) Types
 * For Dutch ZZP quarterly VAT declarations
 */

export type BTWPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type BTWStatus = 'draft' | 'submitted' | 'paid';

/**
 * BTW Aangifte Declaration
 * Based on Dutch tax office form structure
 */
export interface BTWDeclaration {
  id: string;
  year: number;
  period: BTWPeriod;
  status: BTWStatus;
  
  // Revenue lines (Prestaties/Levering)
  revenue_nl_high: number;        // 1a: Leveringen/diensten belast met hoog tarief (21%)
  revenue_nl_low: number;         // 1b: Leveringen/diensten belast met laag tarief (9%)
  revenue_nl_zero: number;        // 1c: Leveringen/diensten belast met 0% of niet bij u belast
  revenue_nl_other: number;       // 1d: Leveringen/diensten waarbij de heffing van omzetbelasting naar u is verlegd
  
  // Calculated VAT to pay (Te betalen BTW)
  vat_high: number;               // 1a × 21%
  vat_low: number;                // 1b × 9%
  
  // Private use (Privégebruik)
  private_use_amount: number;     // 1e: Privégebruik
  private_use_vat: number;        // 1e × appropriate VAT rate
  
  // EU transactions (if applicable)
  eu_services: number;            // 3a: Leveringen naar landen binnen de EU
  eu_acquisitions: number;        // 4a: Verwervingen uit landen binnen de EU
  eu_acquisitions_vat: number;    // 4a × appropriate VAT rate
  
  // Deductible input VAT (Voorbelasting)
  input_vat_general: number;      // 5b: Voorbelasting (deductible VAT from expenses)
  
  // Subtotals
  total_vat_to_pay: number;       // Sum of all VAT to pay (1a+1b+1e+4a)
  total_vat_deductible: number;   // Total deductible VAT (5b)
  
  // Final calculation
  balance: number;                // Positive = to pay, Negative = to receive
  
  // Metadata
  notes?: string;
  submission_date?: string;       // When submitted to tax office
  payment_date?: string;          // When paid
  payment_reference?: string;     // Bank reference
  created_at: string;
  updated_at: string;
}

/**
 * Helper interface for BTW calculation from invoices and expenses
 */
export interface BTWCalculationData {
  period: {
    start: string;
    end: string;
    quarter: BTWPeriod;
    year: number;
  };
  
  // From invoices
  invoices: {
    total: number;
    vat21: number;
    vat9: number;
    vat0: number;
    reverseCharge: number;
  };
  
  // From expenses
  expenses: {
    total: number;
    deductibleVat: number;
  };
  
  // Calculated balance
  balance: number;
}

/**
 * BTW rates in Netherlands
 */
export const BTW_RATES = {
  HIGH: 21,
  LOW: 9,
  ZERO: 0,
} as const;

/**
 * Quarter date ranges
 */
export const QUARTER_DATES = {
  Q1: { start: '01-01', end: '03-31' },
  Q2: { start: '04-01', end: '06-30' },
  Q3: { start: '07-01', end: '09-30' },
  Q4: { start: '10-01', end: '12-31' },
} as const;

