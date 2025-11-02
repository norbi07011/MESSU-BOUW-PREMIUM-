import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useExpenses, useClients } from '@/hooks/useElectronDB';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, PencilSimple, Trash, DownloadSimple, Receipt, CreditCard } from '@phosphor-icons/react';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/expenses';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { toast } from 'sonner';

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const { expenses, loading, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { clients } = useClients();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'it_software' as ExpenseCategory,
    supplier: '',
    description: '',
    amount_net: '',
    vat_rate: '21',
    payment_method: 'bank_transfer',
    is_vat_deductible: true,
    is_business_expense: true,
    invoice_number: '',
    notes: '',
  });

  // Calculate amounts
  const calculateAmounts = (net: number, vatRate: number) => {
    const vat = Math.round(net * (vatRate / 100) * 100) / 100;
    const gross = Math.round((net + vat) * 100) / 100;
    return { vat, gross };
  };

  // Filter expenses by selected month
  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(exp => {
      return exp.date.startsWith(selectedMonth);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth]);

  // Calculate totals
  const totals = useMemo(() => {
    const filtered = filteredExpenses;
    return {
      count: filtered.length,
      net: filtered.reduce((sum, exp) => sum + (exp.amount_net || 0), 0),
      vat: filtered.reduce((sum, exp) => sum + (exp.vat_amount || 0), 0),
      gross: filtered.reduce((sum, exp) => sum + (exp.amount_gross || 0), 0),
      deductibleVat: filtered.reduce((sum, exp) => 
        sum + (exp.is_vat_deductible ? (exp.vat_amount || 0) : 0), 0
      ),
    };
  }, [filteredExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier || !formData.amount_net) {
      toast.error('Wypełnij wymagane pola');
      return;
    }

    const amountNet = parseFloat(formData.amount_net);
    const vatRate = parseFloat(formData.vat_rate);
    const { vat, gross } = calculateAmounts(amountNet, vatRate);

    const expenseData = {
      date: formData.date,
      category: formData.category,
      supplier: formData.supplier,
      description: formData.description,
      amount_net: amountNet,
      vat_rate: vatRate,
      vat_amount: vat,
      amount_gross: gross,
      currency: 'EUR',
      payment_method: formData.payment_method,
      is_vat_deductible: formData.is_vat_deductible,
      is_business_expense: formData.is_business_expense,
      invoice_number: formData.invoice_number,
      notes: formData.notes,
    };

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, expenseData);
        toast.success('Wydatek zaktualizowany');
      } else {
        await createExpense(expenseData);
        toast.success('Wydatek dodany');
      }
      
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
      console.error(error);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      date: expense.date,
      category: expense.category,
      supplier: expense.supplier,
      description: expense.description || '',
      amount_net: expense.amount_net.toString(),
      vat_rate: expense.vat_rate.toString(),
      payment_method: expense.payment_method,
      is_vat_deductible: expense.is_vat_deductible,
      is_business_expense: expense.is_business_expense,
      invoice_number: expense.invoice_number || '',
      notes: expense.notes || '',
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wydatek?')) {
      return;
    }
    
    try {
      await deleteExpense(id);
      toast.success('Wydatek usunięty');
    } catch (error) {
      toast.error('Błąd podczas usuwania');
      console.error(error);
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: 'it_software',
      supplier: '',
      description: '',
      amount_net: '',
      vat_rate: '21',
      payment_method: 'bank_transfer',
      is_vat_deductible: true,
      is_business_expense: true,
      invoice_number: '',
      notes: '',
    });
  };

  const handleExportCSV = () => {
    const csv = [
      ['Data', 'Kategoria', 'Dostawca', 'Opis', 'Netto', 'VAT', 'Brutto', 'Nr faktury'].join(','),
      ...filteredExpenses.map(exp => [
        exp.date,
        EXPENSE_CATEGORIES[exp.category]?.name || exp.category,
        exp.supplier,
        exp.description || '',
        exp.amount_net,
        exp.vat_amount,
        exp.amount_gross,
        exp.invoice_number || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `wydatki_${selectedMonth}.csv`;
    link.click();
    
    toast.success('Eksport CSV gotowy');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                💳 Wydatki
              </h1>
              <p className="text-purple-100 text-lg">Zarządzaj kosztami biznesowymi i rozliczaj VAT</p>
            </div>
            <Dialog open={showDialog} onOpenChange={(open) => {
              setShowDialog(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <button className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl">
                  <Plus className="inline mr-2" size={24} />
                  Nowy wydatek
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? '✏️ Edytuj wydatek' : '➕ Nowy wydatek'}
                  </DialogTitle>
                  <DialogDescription>
                    Dodaj fakturę zakupu lub wydatek biznesowy
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Kategoria *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value as ExpenseCategory })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => (
                            <SelectItem key={key} value={key}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Dostawca / Vendor *</Label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="np. Adobe, Google, IKEA"
                      required
                    />
                  </div>

                  <div>
                    <Label>Opis</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Dodatkowy opis wydatku"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Kwota netto (€) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount_net}
                        onChange={(e) => setFormData({ ...formData, amount_net: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label>Stawka VAT (%)</Label>
                      <Select
                        value={formData.vat_rate}
                        onValueChange={(value) => setFormData({ ...formData, vat_rate: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="9">9%</SelectItem>
                          <SelectItem value="21">21%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Brutto (€)</Label>
                      <Input
                        type="text"
                        value={formData.amount_net && formData.vat_rate ? 
                          calculateAmounts(parseFloat(formData.amount_net), parseFloat(formData.vat_rate)).gross.toFixed(2) : 
                          '0.00'
                        }
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Metoda płatności</Label>
                      <Select
                        value={formData.payment_method}
                        onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Przelew bankowy</SelectItem>
                          <SelectItem value="card">Karta płatnicza</SelectItem>
                          <SelectItem value="cash">Gotówka</SelectItem>
                          <SelectItem value="direct_debit">Polecenie zapłaty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Numer faktury</Label>
                      <Input
                        value={formData.invoice_number}
                        onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                        placeholder="Opcjonalnie"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notatki</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Dodatkowe informacje..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => {
                      setShowDialog(false);
                      resetForm();
                    }}>
                      Anuluj
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingExpense ? 'Zaktualizuj' : 'Dodaj wydatek'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Suma Netto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totals.net, i18n.language)}
              </div>
              <div className="text-xs text-gray-500 mt-1">{totals.count} wydatków</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">VAT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">
                {formatCurrency(totals.vat, i18n.language)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Suma VAT</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Do odliczenia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totals.deductibleVat, i18n.language)}
              </div>
              <div className="text-xs text-gray-500 mt-1">VAT do odliczenia</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-600">Suma Brutto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totals.gross, i18n.language)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Całkowity koszt</div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card className="bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lista wydatków</CardTitle>
                <CardDescription>Wszystkie wydatki biznesowe</CardDescription>
              </div>
              <div className="flex gap-3 items-center">
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-48"
                />
                <Button variant="outline" onClick={handleExportCSV}>
                  <DownloadSimple className="mr-2" size={16} />
                  Eksport CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Ładowanie...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl inline-block mb-6">
                  <Receipt size={64} className="text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Brak wydatków</h3>
                <p className="text-gray-600 mb-6 text-lg">Dodaj pierwszy wydatek, aby zacząć</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Kategoria</TableHead>
                      <TableHead>Dostawca</TableHead>
                      <TableHead>Opis</TableHead>
                      <TableHead className="text-right">Netto</TableHead>
                      <TableHead className="text-right">VAT</TableHead>
                      <TableHead className="text-right">Brutto</TableHead>
                      <TableHead className="text-right">Akcje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(expense.date, i18n.language)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {EXPENSE_CATEGORIES[expense.category]?.icon} {' '}
                            {EXPENSE_CATEGORIES[expense.category]?.name.replace(/^[^\s]+ /, '')}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{expense.supplier}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {expense.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(expense.amount_net, i18n.language)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(expense.vat_amount, i18n.language)}
                          {' '}
                          <span className="text-gray-400">({expense.vat_rate}%)</span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {formatCurrency(expense.amount_gross, i18n.language)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors duration-200"
                              title="Edytuj"
                            >
                              <PencilSimple size={18} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors duration-200"
                              title="Usuń"
                            >
                              <Trash size={18} className="text-red-600" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

