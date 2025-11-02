import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBTW } from '../hooks/useElectronDB';
import { useInvoices } from '../hooks/useElectronDB';
import { useExpenses } from '../hooks/useElectronDB';
import { useCompany } from '../hooks/useElectronDB';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import {
  FileText,
  PlusCircle,
  Check,
  X,
  Download,
  Receipt,
  TrendUp,
  Calculator,
  Warning
} from '@phosphor-icons/react';
import type { BTWDeclaration, BTWPeriod, BTWCalculationData } from '../types';

const QUARTERS: BTWPeriod[] = ['Q1', 'Q2', 'Q3', 'Q4'];

const QUARTER_DATES = {
  Q1: { start: '-01-01', end: '-03-31' },
  Q2: { start: '-04-01', end: '-06-30' },
  Q3: { start: '-07-01', end: '-09-30' },
  Q4: { start: '-10-01', end: '-12-31' },
} as const;

export function BTWAangifte() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3) as 1 | 2 | 3 | 4;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedPeriod, setSelectedPeriod] = useState<BTWPeriod>(`Q${currentQuarter}` as BTWPeriod);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { declarations, loading: btwLoading, createBTW, updateBTW, deleteBTW, getBTWByPeriod, refetch } = useBTW();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { company } = useCompany();

  // Form state
  const [formData, setFormData] = useState<Partial<BTWDeclaration>>({
    year: selectedYear,
    period: selectedPeriod,
    status: 'draft',
    revenue_nl_high: 0,
    revenue_nl_low: 0,
    revenue_nl_zero: 0,
    revenue_nl_other: 0,
    vat_high: 0,
    vat_low: 0,
    private_use_amount: 0,
    private_use_vat: 0,
    eu_services: 0,
    eu_acquisitions: 0,
    eu_acquisitions_vat: 0,
    input_vat_general: 0,
    total_vat_to_pay: 0,
    total_vat_deductible: 0,
    balance: 0,
    notes: '',
  });

  // Calculate BTW data from invoices and expenses for the selected period
  const calculatedData: BTWCalculationData = useMemo(() => {
    const dates = QUARTER_DATES[selectedPeriod];
    const startDate = `${selectedYear}${dates.start}`;
    const endDate = `${selectedYear}${dates.end}`;

    // Filter invoices for the selected period
    const periodInvoices = invoices.filter((inv: any) => {
      return inv.issue_date >= startDate && inv.issue_date <= endDate;
    });

    // Calculate revenue by VAT rate
    let vat21 = 0;
    let vat9 = 0;
    let vat0 = 0;
    let reverseCharge = 0;

    periodInvoices.forEach((inv: any) => {
      if (inv.vat_note?.includes('reverse charge') || inv.vat_note?.includes('odwrotne obciążenie')) {
        reverseCharge += inv.total_net;
      } else {
        // Determine VAT rate from invoice lines or total_vat/total_net ratio
        const vatRate = inv.total_net > 0 ? (inv.total_vat / inv.total_net) * 100 : 0;
        
        if (vatRate > 20) {
          vat21 += inv.total_net;
        } else if (vatRate > 8 && vatRate < 20) {
          vat9 += inv.total_net;
        } else if (vatRate < 1) {
          vat0 += inv.total_net;
        } else {
          // Default to 21% if unclear
          vat21 += inv.total_net;
        }
      }
    });

    // Filter expenses for the selected period
    const periodExpenses = expenses.filter((exp: any) => {
      return exp.date >= startDate && exp.date <= endDate;
    });

    // Calculate deductible VAT from expenses
    const deductibleVat = periodExpenses.reduce((sum: number, exp: any) => {
      if (exp.is_vat_deductible && exp.is_business_expense) {
        const deductibleAmount = exp.private_percentage 
          ? exp.vat_amount * (1 - exp.private_percentage / 100)
          : exp.vat_amount;
        return sum + deductibleAmount;
      }
      return sum;
    }, 0);

    const totalExpenses = periodExpenses.reduce((sum: number, exp: any) => sum + exp.amount_gross, 0);

    const vatToPay = vat21 * 0.21 + vat9 * 0.09;
    const balance = vatToPay - deductibleVat;

    return {
      period: {
        start: startDate,
        end: endDate,
        quarter: selectedPeriod,
        year: selectedYear,
      },
      invoices: {
        total: vat21 + vat9 + vat0 + reverseCharge,
        vat21,
        vat9,
        vat0,
        reverseCharge,
      },
      expenses: {
        total: totalExpenses,
        deductibleVat,
      },
      balance,
    };
  }, [selectedYear, selectedPeriod, invoices, expenses]);

  // Auto-fill form with calculated data
  const handleAutoFill = () => {
    setFormData({
      ...formData,
      year: selectedYear,
      period: selectedPeriod,
      revenue_nl_high: Math.round(calculatedData.invoices.vat21 * 100) / 100,
      revenue_nl_low: Math.round(calculatedData.invoices.vat9 * 100) / 100,
      revenue_nl_zero: Math.round(calculatedData.invoices.vat0 * 100) / 100,
      revenue_nl_other: Math.round(calculatedData.invoices.reverseCharge * 100) / 100,
      vat_high: Math.round(calculatedData.invoices.vat21 * 0.21 * 100) / 100,
      vat_low: Math.round(calculatedData.invoices.vat9 * 0.09 * 100) / 100,
      input_vat_general: Math.round(calculatedData.expenses.deductibleVat * 100) / 100,
      total_vat_to_pay: Math.round((calculatedData.invoices.vat21 * 0.21 + calculatedData.invoices.vat9 * 0.09) * 100) / 100,
      total_vat_deductible: Math.round(calculatedData.expenses.deductibleVat * 100) / 100,
      balance: Math.round(calculatedData.balance * 100) / 100,
    });
  };

  // Recalculate totals when form data changes
  useEffect(() => {
    const totalVatToPay = 
      (formData.vat_high || 0) + 
      (formData.vat_low || 0) + 
      (formData.private_use_vat || 0) + 
      (formData.eu_acquisitions_vat || 0);
    
    const totalVatDeductible = formData.input_vat_general || 0;
    const balance = totalVatToPay - totalVatDeductible;

    setFormData(prev => ({
      ...prev,
      total_vat_to_pay: Math.round(totalVatToPay * 100) / 100,
      total_vat_deductible: Math.round(totalVatDeductible * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    }));
  }, [
    formData.vat_high,
    formData.vat_low,
    formData.private_use_vat,
    formData.eu_acquisitions_vat,
    formData.input_vat_general,
  ]);

  const handleSaveDeclaration = async () => {
    try {
      if (editingId) {
        await updateBTW(editingId, formData);
      } else {
        await createBTW(formData);
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving BTW declaration:', error);
      alert(t('btw.errorSaving'));
    }
  };

  const handleEditDeclaration = async (id: string) => {
    const declaration = declarations.find((d: any) => d.id === id);
    if (declaration) {
      setFormData(declaration);
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDeleteDeclaration = async (id: string) => {
    if (window.confirm(t('btw.confirmDelete'))) {
      try {
        await deleteBTW(id);
        refetch();
      } catch (error) {
        console.error('Error deleting BTW declaration:', error);
        alert(t('btw.errorDeleting'));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      year: selectedYear,
      period: selectedPeriod,
      status: 'draft',
      revenue_nl_high: 0,
      revenue_nl_low: 0,
      revenue_nl_zero: 0,
      revenue_nl_other: 0,
      vat_high: 0,
      vat_low: 0,
      private_use_amount: 0,
      private_use_vat: 0,
      eu_services: 0,
      eu_acquisitions: 0,
      eu_acquisitions_vat: 0,
      input_vat_general: 0,
      total_vat_to_pay: 0,
      total_vat_deductible: 0,
      balance: 0,
      notes: '',
    });
  };

  const handleNewDeclaration = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
    handleAutoFill();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-200 text-gray-800',
      submitted: 'bg-blue-200 text-blue-800',
      paid: 'bg-green-200 text-green-800',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  if (btwLoading || invoicesLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('btw.title')}</h1>
          <p className="text-gray-600 mt-1">{t('btw.subtitle')}</p>
        </div>
        <Button onClick={handleNewDeclaration} className="flex items-center gap-2">
          <PlusCircle size={20} />
          {t('btw.newDeclaration')}
        </Button>
      </div>

      {/* Period Selector & Calculator */}
      {!showForm && (
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-4 mb-6">
            <Calculator size={32} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">{t('btw.calculator')}</h2>
              <p className="text-gray-600 text-sm">{t('btw.calculatorDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('btw.year')}
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('btw.quarter')}
              </label>
              <Select
                value={selectedPeriod}
                onValueChange={(value) => setSelectedPeriod(value as BTWPeriod)}
              >
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleAutoFill} className="w-full" variant="outline">
                <TrendUp size={20} className="mr-2" />
                {t('btw.calculate')}
              </Button>
            </div>
          </div>

          {/* Period Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('btw.revenue21')}</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(calculatedData.invoices.vat21)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    BTW: {formatCurrency(calculatedData.invoices.vat21 * 0.21)}
                  </p>
                </div>
                <Receipt size={32} className="text-blue-600" />
              </div>
            </Card>

            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('btw.revenue9')}</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(calculatedData.invoices.vat9)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    BTW: {formatCurrency(calculatedData.invoices.vat9 * 0.09)}
                  </p>
                </div>
                <Receipt size={32} className="text-green-600" />
              </div>
            </Card>

            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('btw.deductibleVat')}</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(calculatedData.expenses.deductibleVat)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('btw.fromExpenses')}
                  </p>
                </div>
                <TrendUp size={32} className="text-purple-600" />
              </div>
            </Card>
          </div>

          {/* Balance Summary */}
          <Card className={`mt-4 p-6 ${calculatedData.balance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('btw.balance')}</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(Math.abs(calculatedData.balance))}
                </p>
                <p className="text-sm mt-1">
                  {calculatedData.balance > 0 ? t('btw.toPay') : t('btw.toReceive')}
                </p>
              </div>
              <div className={`p-4 rounded-full ${calculatedData.balance > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {calculatedData.balance > 0 ? (
                  <Warning size={48} className="text-red-600" />
                ) : (
                  <Check size={48} className="text-green-600" />
                )}
              </div>
            </div>
          </Card>
        </Card>
      )}

      {/* Declaration Form */}
      {showForm && (
        <Card className="mb-6 p-6">
          <h2 className="text-2xl font-semibold mb-6">
            {editingId ? t('btw.editDeclaration') : t('btw.newDeclaration')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('btw.revenueSection')}</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('btw.revenue21Field')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.revenue_nl_high}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, revenue_nl_high: value, vat_high: value * 0.21 });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('btw.revenue9Field')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.revenue_nl_low}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, revenue_nl_low: value, vat_low: value * 0.09 });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('btw.revenue0Field')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.revenue_nl_zero}
                  onChange={(e) => setFormData({ ...formData, revenue_nl_zero: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('btw.reverseChargeField')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.revenue_nl_other}
                  onChange={(e) => setFormData({ ...formData, revenue_nl_other: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* VAT Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('btw.vatSection')}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('btw.deductibleVatField')}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.input_vat_general}
                  onChange={(e) => setFormData({ ...formData, input_vat_general: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <Card className="p-4 bg-gray-50">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">{t('btw.totalVatToPay')}:</span>
                    <span className="font-semibold">{formatCurrency(formData.total_vat_to_pay || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">{t('btw.totalVatDeductible')}:</span>
                    <span className="font-semibold">{formatCurrency(formData.total_vat_deductible || 0)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">{t('btw.balance')}:</span>
                    <span className={`font-bold text-lg ${(formData.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(formData.balance || 0)}
                    </span>
                  </div>
                </div>
              </Card>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('btw.status')}
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <option value="draft">{t('btw.statusDraft')}</option>
                  <option value="submitted">{t('btw.statusSubmitted')}</option>
                  <option value="paid">{t('btw.statusPaid')}</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('btw.notes')}
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder={t('btw.notesPlaceholder')}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveDeclaration} className="flex items-center gap-2">
              <Check size={20} />
              {t('btw.save')}
            </Button>
            <Button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                resetForm();
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X size={20} />
              {t('btw.cancel')}
            </Button>
          </div>
        </Card>
      )}

      {/* Declarations History */}
      {!showForm && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{t('btw.history')}</h2>
          </div>

          {declarations.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">{t('btw.noDeclarations')}</p>
              <Button onClick={handleNewDeclaration} className="mt-4">
                {t('btw.createFirst')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('btw.period')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('btw.revenue')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('btw.vatToPay')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('btw.vatDeductible')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('btw.balance')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('btw.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('btw.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {declarations.map((decl: any) => (
                    <tr key={decl.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {decl.year} - {decl.period}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency((decl.revenue_nl_high || 0) + (decl.revenue_nl_low || 0))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(decl.total_vat_to_pay || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(decl.total_vat_deductible || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${decl.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(decl.balance || 0))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(decl.status)}`}>
                          {t(`btw.status${decl.status.charAt(0).toUpperCase() + decl.status.slice(1)}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDeclaration(decl.id)}
                          >
                            {t('btw.edit')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDeclaration(decl.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            {t('btw.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

