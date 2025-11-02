import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, MapPin, Car, Bicycle, Motorcycle, Calculator, FileText, Plus, PencilSimple, Trash, Download } from '@phosphor-icons/react';
import { KilometerEntry, KilometerRates, KilometerReport } from '@/types/kilometers';
import { useClients, useCompany } from '@/hooks/useElectronDB';

// Aktualne stawki na 2025 rok (przykładowe - należy aktualizować co roku)
const CURRENT_RATES: KilometerRates = {
  year: 2025,
  carBusinessRate: 0.23, // €0.23 per km dla biznesowych podróży
  carCommutingRate: 0.19, // €0.19 per km dla dojazdów do pracy  
  bikeRate: 0.27, // €0.27 per km dla roweru
  motorcycleRate: 0.21, // €0.21 per km dla motoru
  maxTaxFreeAmount: 3000 // Max €3000 per rok belastingvrij
};

export default function KilometersPage() {
  const { clients } = useClients();
  const { company } = useCompany();
  
  // Używamy localStorage dla kilometrów (tymczasowo)
  const [entries, setEntries] = useState<KilometerEntry[]>(() => {
    const saved = localStorage.getItem('kilometer-entries');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KilometerEntry | null>(null);
  
  // Zapisz do localStorage przy każdej zmianie entries
  useEffect(() => {
    localStorage.setItem('kilometer-entries', JSON.stringify(entries));
  }, [entries]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startLocation: '',
    endLocation: '',
    purpose: '',
    kilometers: '',
    vehicleType: 'car' as 'car' | 'bike' | 'motorcycle',
    isPrivateVehicle: true,
    clientId: 'none',
    notes: ''
  });

  const calculateAmount = (km: number, vehicleType: string, isPrivate: boolean) => {
    let rate = CURRENT_RATES.carBusinessRate;
    
    switch (vehicleType) {
      case 'bike':
        rate = CURRENT_RATES.bikeRate;
        break;
      case 'motorcycle':
        rate = CURRENT_RATES.motorcycleRate;
        break;
      case 'car':
      default:
        rate = isPrivate ? CURRENT_RATES.carBusinessRate : CURRENT_RATES.carCommutingRate;
        break;
    }
    
    return km * rate;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const kilometers = parseFloat(formData.kilometers);
    const amount = calculateAmount(kilometers, formData.vehicleType, formData.isPrivateVehicle);
    const rate = amount / kilometers;
    
    const entry: KilometerEntry = {
      id: editingEntry ? editingEntry.id : Date.now().toString(),
      date: formData.date,
      startLocation: formData.startLocation,
      endLocation: formData.endLocation,
      purpose: formData.purpose,
      kilometers,
      rate,
      amount,
      vehicleType: formData.vehicleType,
      isPrivateVehicle: formData.isPrivateVehicle,
      clientId: formData.clientId !== 'none' ? formData.clientId : undefined,
      notes: formData.notes || undefined,
      createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingEntry) {
      setEntries(entries.map(e => e.id === editingEntry.id ? entry : e));
    } else {
      setEntries([...entries, entry]);
    }

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      startLocation: '',
      endLocation: '',
      purpose: '',
      kilometers: '',
      vehicleType: 'car',
      isPrivateVehicle: true,
      clientId: 'none',
      notes: ''
    });
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry: KilometerEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      startLocation: entry.startLocation,
      endLocation: entry.endLocation,
      purpose: entry.purpose,
      kilometers: entry.kilometers.toString(),
      vehicleType: entry.vehicleType,
      isPrivateVehicle: entry.isPrivateVehicle,
      clientId: entry.clientId || 'none',
      notes: entry.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć ten wpis kilometrów?')) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const generateYearlyReport = () => {
    const currentYear = new Date().getFullYear();
    const yearEntries = entries.filter(entry => 
      new Date(entry.date).getFullYear() === currentYear
    );

    const totalKilometers = yearEntries.reduce((sum, entry) => sum + entry.kilometers, 0);
    const totalAmount = yearEntries.reduce((sum, entry) => sum + entry.amount, 0);

    const byVehicleType = {
      car: { kilometers: 0, amount: 0 },
      bike: { kilometers: 0, amount: 0 },
      motorcycle: { kilometers: 0, amount: 0 }
    };

    yearEntries.forEach(entry => {
      byVehicleType[entry.vehicleType].kilometers += entry.kilometers;
      byVehicleType[entry.vehicleType].amount += entry.amount;
    });

    const taxFreeAmount = Math.min(totalAmount, CURRENT_RATES.maxTaxFreeAmount);
    const taxableAmount = Math.max(0, totalAmount - CURRENT_RATES.maxTaxFreeAmount);

    return {
      period: {
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-12-31`
      },
      totalKilometers,
      totalAmount,
      byVehicleType,
      byClient: [], // TODO: implement client grouping
      taxInfo: {
        taxableAmount,
        taxFreeAmount,
        exceedsLimit: totalAmount > CURRENT_RATES.maxTaxFreeAmount
      }
    };
  };

  const yearlyReport = generateYearlyReport();

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bike': return <Bicycle size={16} />;
      case 'motorcycle': return <Motorcycle size={16} />;
      default: return <Car size={16} />;
    }
  };

  const generateKilometersPDF = () => {
    const currentYear = new Date().getFullYear();
    const companyName = company?.name || "Your Company";
    
    const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Historia Kilometrów ${currentYear}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      background: white;
    }
    
    .container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    
    .header h1 {
      color: #3b82f6;
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .header .company {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .header .period {
      color: #666;
      font-size: 14px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    .summary-item {
      text-align: center;
    }
    
    .summary-item .value {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    
    .summary-item .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    
    .rates-info {
      margin-bottom: 30px;
      padding: 15px;
      background: #f1f5f9;
      border-radius: 6px;
    }
    
    .rates-info h3 {
      margin-bottom: 12px;
      color: #475569;
    }
    
    .rates-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      font-size: 12px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th, td {
      padding: 8px 6px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .vehicle-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .vehicle-car { background: #dbeafe; color: #1e40af; }
    .vehicle-bike { background: #dcfce7; color: #166534; }
    .vehicle-motorcycle { background: #fed7aa; color: #9a3412; }
    
    .amount {
      font-weight: 600;
      color: #059669;
    }
    
    .tax-info {
      margin-top: 20px;
      padding: 15px;
      background: #fef7cd;
      border: 1px solid #f59e0b;
      border-radius: 6px;
    }
    
    .footer {
      margin-top: 30px;
      text-align: center;
      font-size: 10px;
      color: #666;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    @media print {
      body { print-color-adjust: exact; }
      .container { padding: 10mm; }
      .header h1 { color: #3b82f6 !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Historia Przejazdów Kilometrowych</h1>
      <div class="company">${companyName}</div>
      <div class="period">Rok ${currentYear}</div>
    </div>
    
    <div class="summary">
      <div class="summary-item">
        <div class="value" style="color: #3b82f6;">${yearlyReport.totalKilometers.toLocaleString()}</div>
        <div class="label">Łączne kilometry</div>
      </div>
      <div class="summary-item">
        <div class="value" style="color: #059669;">€${yearlyReport.totalAmount.toFixed(2)}</div>
        <div class="label">Łączna kwota</div>
      </div>
      <div class="summary-item">
        <div class="value" style="color: #ea580c;">€${yearlyReport.taxInfo.taxFreeAmount.toFixed(2)}</div>
        <div class="label">Belastingvrij</div>
      </div>
      <div class="summary-item">
        <div class="value" style="color: #dc2626;">€${yearlyReport.taxInfo.taxableAmount.toFixed(2)}</div>
        <div class="label">Do opodatkowania</div>
      </div>
    </div>
    
    <div class="rates-info">
      <h3>Stawki kilometrowe ${CURRENT_RATES.year}</h3>
      <div class="rates-grid">
        <div><strong>Auto służbowe:</strong> €${CURRENT_RATES.carBusinessRate}/km</div>
        <div><strong>Auto prywatne:</strong> €${CURRENT_RATES.carCommutingRate}/km</div>
        <div><strong>Rower:</strong> €${CURRENT_RATES.bikeRate}/km</div>
        <div><strong>Motor:</strong> €${CURRENT_RATES.motorcycleRate}/km</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Trasa</th>
          <th>Cel podróży</th>
          <th>Pojazd</th>
          <th>km</th>
          <th>Stawka</th>
          <th>Kwota</th>
          <th>Klient</th>
        </tr>
      </thead>
      <tbody>
        ${entries.length > 0 ? entries
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(entry => {
            const client = clients.find(c => c.id === entry.clientId);
            const vehicleClass = entry.vehicleType === 'car' ? 'vehicle-car' : 
                               entry.vehicleType === 'bike' ? 'vehicle-bike' : 'vehicle-motorcycle';
            const vehicleLabel = entry.vehicleType === 'car' ? 'Auto' :
                               entry.vehicleType === 'bike' ? 'Rower' : 'Motor';
            
            return `
              <tr>
                <td>${new Date(entry.date).toLocaleDateString('pl-PL')}</td>
                <td>${entry.startLocation} → ${entry.endLocation}</td>
                <td>${entry.purpose}</td>
                <td><span class="vehicle-badge ${vehicleClass}">${vehicleLabel}</span></td>
                <td>${entry.kilometers.toFixed(1)}</td>
                <td>€${entry.rate.toFixed(3)}</td>
                <td class="amount">€${entry.amount.toFixed(2)}</td>
                <td>${client ? client.name : '-'}</td>
              </tr>
            `;
          }).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; padding: 20px; color: #666;">
                  Brak wpisów w tym okresie
                </td>
              </tr>
          `}
      </tbody>
    </table>
    
    ${yearlyReport.taxInfo.exceedsLimit ? `
      <div class="tax-info">
        <strong>⚠️ Uwaga:</strong> Przekroczono limit belastingvrij (€${CURRENT_RATES.maxTaxFreeAmount})! 
        Kwota €${yearlyReport.taxInfo.taxableAmount.toFixed(2)} musi być zgłoszona w rozliczeniu podatkowym.
      </div>
    ` : ''}
    
    <div class="footer">
      <div>Raport wygenerowany: ${new Date().toLocaleDateString('pl-PL')} ${new Date().toLocaleTimeString('pl-PL')}</div>
      <div>Łączna liczba wpisów: ${entries.length} | Dane zgodne z przepisami Belastingdienst Holandia</div>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Historia-Kilometrow-${currentYear}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    }, 100);
    
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Modern Header with Gradient */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                🚗 Rozliczenie Kilometrów (v2.0 - {new Date().toLocaleTimeString()})
              </h1>
              <p className="text-blue-100 text-lg">
                Zarządzanie kosztami podróży służbowych dla rozliczenia z Belastingdienst
              </p>
            </div>
            <div className="flex gap-3">
              {entries.length > 0 && (
                <button 
                  onClick={generateKilometersPDF}
                  className="group relative px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 group-hover:animate-bounce" />
                    <span className="font-medium">Pobierz PDF</span>
                  </div>
                </button>
              )}
              <button 
                onClick={() => setShowForm(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-medium">Dodaj przejazd</span>
                </div>
              </button>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Modern Rates Section */}
        <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Aktualne stawki {CURRENT_RATES.year}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative text-center">
                <Car className="mx-auto mb-3 text-white" size={32} />
                <div className="font-semibold text-blue-100">Auto służbowe</div>
                <div className="text-2xl font-bold">€{CURRENT_RATES.carBusinessRate}/km</div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative text-center">
                <Car className="mx-auto mb-3 text-white" size={32} />
                <div className="font-semibold text-gray-100">Auto prywatne</div>
                <div className="text-2xl font-bold">€{CURRENT_RATES.carCommutingRate}/km</div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative text-center">
                <Bicycle className="mx-auto mb-3 text-white" size={32} />
                <div className="font-semibold text-green-100">Rower</div>
                <div className="text-2xl font-bold">€{CURRENT_RATES.bikeRate}/km</div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="relative text-center">
                <Motorcycle className="mx-auto mb-3 text-white" size={32} />
                <div className="font-semibold text-orange-100">Motor</div>
                <div className="text-2xl font-bold">€{CURRENT_RATES.motorcycleRate}/km</div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800">
              <div className="p-1 bg-amber-200 rounded-full">
                <span className="text-sm">💡</span>
              </div>
              <span className="font-medium">
                Limit belastingvrij: €{CURRENT_RATES.maxTaxFreeAmount} rocznie.
              </span>
            </div>
            <p className="text-amber-700 text-sm mt-1 ml-7">
              Powyżej tej kwoty konieczne jest zgłoszenie w rozliczeniu podatkowym.
            </p>
          </div>
        </div>

        {/* Modern Yearly Report */}
        <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Podsumowanie {new Date().getFullYear()}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl font-bold text-blue-700 mb-2">
                {yearlyReport.totalKilometers.toLocaleString()}
              </div>
              <div className="text-blue-600 font-medium">Łączne kilometry</div>
              <div className="w-8 h-1 bg-blue-500 mx-auto mt-2 rounded-full"></div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl border border-green-300 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl font-bold text-green-700 mb-2">
                €{yearlyReport.totalAmount.toFixed(2)}
              </div>
              <div className="text-green-600 font-medium">Łączna kwota</div>
              <div className="w-8 h-1 bg-green-500 mx-auto mt-2 rounded-full"></div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-orange-100 to-amber-200 rounded-xl border border-orange-300 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl font-bold text-orange-700 mb-2">
                €{yearlyReport.taxInfo.taxFreeAmount.toFixed(2)}
              </div>
              <div className="text-orange-600 font-medium">Belastingvrij</div>
              <div className="w-8 h-1 bg-orange-500 mx-auto mt-2 rounded-full"></div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-red-100 to-rose-200 rounded-xl border border-red-300 hover:shadow-lg transition-all duration-300">
              <div className="text-3xl font-bold text-red-700 mb-2">
                €{yearlyReport.taxInfo.taxableAmount.toFixed(2)}
              </div>
              <div className="text-red-600 font-medium">Do opodatkowania</div>
              <div className="w-8 h-1 bg-red-500 mx-auto mt-2 rounded-full"></div>
            </div>
          </div>
          
          {yearlyReport.taxInfo.exceedsLimit && (
            <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 text-red-800">
                <div className="p-1 bg-red-200 rounded-full">
                  <span className="text-sm">⚠️</span>
                </div>
                <span className="font-medium">
                  Przekroczono limit belastingvrij!
                </span>
              </div>
              <p className="text-red-700 text-sm mt-1 ml-7">
                Kwota €{yearlyReport.taxInfo.taxableAmount.toFixed(2)} musi być zgłoszona w rozliczeniu podatkowym.
              </p>
            </div>
          )}
        </div>

        {/* Modern Form */}
        {showForm && (
          <div className="relative rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingEntry ? 'Edytuj przejazd' : 'Dodaj nowy przejazd'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="kilometers">Kilometry</Label>
                  <Input
                    id="kilometers"
                    type="number"
                    step="0.1"
                    value={formData.kilometers}
                    onChange={(e) => setFormData({...formData, kilometers: e.target.value})}
                    placeholder="np. 25.5"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startLocation">Miejsce początkowe</Label>
                  <Input
                    id="startLocation"
                    value={formData.startLocation}
                    onChange={(e) => setFormData({...formData, startLocation: e.target.value})}
                    placeholder="np. Amsterdam"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="endLocation">Miejsce docelowe</Label>
                  <Input
                    id="endLocation"
                    value={formData.endLocation}
                    onChange={(e) => setFormData({...formData, endLocation: e.target.value})}
                    placeholder="np. Rotterdam"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="purpose">Cel podróży</Label>
                <Input
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  placeholder="np. Spotkanie z klientem, konferencja biznesowa"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Typ pojazdu</Label>
                  <Select 
                    value={formData.vehicleType} 
                    onValueChange={(value: 'car' | 'bike' | 'motorcycle') => 
                      setFormData({...formData, vehicleType: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">🚗 Samochód</SelectItem>
                      <SelectItem value="bike">🚴 Rower</SelectItem>
                      <SelectItem value="motorcycle">🏍️ Motor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.vehicleType === 'car' && (
                  <div>
                    <Label htmlFor="isPrivateVehicle">Rodzaj samochodu</Label>
                    <Select 
                      value={formData.isPrivateVehicle.toString()} 
                      onValueChange={(value) => 
                        setFormData({...formData, isPrivateVehicle: value === 'true'})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Prywatny (€{CURRENT_RATES.carBusinessRate}/km)</SelectItem>
                        <SelectItem value="false">Służbowy (€{CURRENT_RATES.carCommutingRate}/km)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="clientId">Klient (opcjonalnie)</Label>
                <Select 
                  value={formData.clientId} 
                  onValueChange={(value) => setFormData({...formData, clientId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz klienta..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Brak</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Notatki (opcjonalnie)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Dodatkowe informacje..."
                />
              </div>

              {formData.kilometers && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-semibold">Obliczona kwota:</div>
                  <div className="text-2xl font-bold text-blue-600">
                    €{calculateAmount(
                      parseFloat(formData.kilometers), 
                      formData.vehicleType, 
                      formData.isPrivateVehicle
                    ).toFixed(2)}
                  </div>
                </div>
              )}

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg"
                  >
                    {editingEntry ? 'Zapisz zmiany' : 'Dodaj przejazd'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntry(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-medium"
                  >
                    Anuluj
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modern Entries Table */}
        <div className="relative rounded-2xl bg-white/70 backdrop-blur-sm border border-white/20 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Historia przejazdów</h2>
          </div>
          
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Car className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Brak przejazdów</h3>
              <p className="text-gray-500">Dodaj pierwszy przejazd służbowy, aby rozpocząć śledzenie kosztów.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="grid grid-cols-7 gap-4 text-sm font-semibold text-gray-700">
                    <div>Data</div>
                    <div>Trasa</div>
                    <div>Cel</div>
                    <div>Pojazd</div>
                    <div>Kilometry</div>
                    <div>Kwota</div>
                    <div>Akcje</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {entries
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((entry, index) => (
                    <div key={entry.id} className={`px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <div className="grid grid-cols-7 gap-4 items-center">
                        <div className="font-medium text-gray-900">
                          {new Date(entry.date).toLocaleDateString('pl-PL')}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="truncate max-w-[120px]">
                            {entry.startLocation} → {entry.endLocation}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 truncate max-w-[150px]">
                          {entry.purpose}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
                            {getVehicleIcon(entry.vehicleType)}
                          </div>
                          <span className="text-sm text-gray-700">
                            {entry.vehicleType === 'car' && 
                              (entry.isPrivateVehicle ? 'Prywatny' : 'Służbowy')
                            }
                            {entry.vehicleType === 'bike' && 'Rower'}
                            {entry.vehicleType === 'motorcycle' && 'Motor'}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {entry.kilometers.toFixed(1)} km
                        </div>
                        <div>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                            €{entry.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                            title="Edytuj przejazd"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                            title="Usuń przejazd"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}