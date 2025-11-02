// Rozliczenie kilometrów w Holandii - Types
export interface KilometerEntry {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  purpose: string;
  kilometers: number;
  rate: number; // stawka za km
  amount: number; // łączna kwota
  clientId?: string;
  projectId?: string;
  vehicleType: 'car' | 'bike' | 'motorcycle';
  isPrivateVehicle: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KilometerRates {
  year: number;
  carBusinessRate: number; // Zakelijke kilometers auto
  carCommutingRate: number; // Woon-werk verkeer
  bikeRate: number; // Fiets
  motorcycleRate: number; // Motor
  maxTaxFreeAmount: number; // Max bedrag per jaar belastingvrij
}

export interface KilometerReport {
  period: {
    startDate: string;
    endDate: string;
  };
  totalKilometers: number;
  totalAmount: number;
  byVehicleType: {
    car: { kilometers: number; amount: number };
    bike: { kilometers: number; amount: number };
    motorcycle: { kilometers: number; amount: number };
  };
  byClient: Array<{
    clientName: string;
    kilometers: number;
    amount: number;
  }>;
  taxInfo: {
    taxableAmount: number;
    taxFreeAmount: number;
    exceedsLimit: boolean;
  };
}