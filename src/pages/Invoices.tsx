import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoices, useClients, useCompany } from '@/hooks/useElectronDB';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Plus, FileText, DownloadSimple, CheckCircle, FilePdf, FileCsv, FileCode, FileXls, Trash, PencilSimple, Eye, EnvelopeSimple } from '@phosphor-icons/react';
import { Invoice, Client, Company } from '@/types';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { toast } from 'sonner';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { exportToCSV, exportToJSON, exportToExcel, exportToXML } from '@/lib/export-utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface InvoicesProps {
  onNavigate: (page: string) => void;
}

export default function Invoices({ onNavigate }: InvoicesProps) {
  const { t, i18n } = useTranslation();
  const { invoices, loading: invoicesLoading, updateInvoice, deleteInvoice } = useInvoices();
  const { clients, loading: clientsLoading } = useClients();
  const { company, loading: companyLoading } = useCompany();
  const [selectedTemplateId] = useState('classic');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const sortedInvoices = useMemo(() => {
    return (invoices || []).sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [invoices]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      unpaid: 'destructive',
      partial: 'secondary',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{t(`invoices.${status}`)}</Badge>;
  };

  const handleGeneratePDF = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }

    try {
      await generateInvoicePDF(invoice, company, client, invoice.lines, i18n.language, selectedTemplateId || 'classic');
      toast.success('PDF generated');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    }
  };

  const handleExportCSV = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToCSV(invoice, company, client);
      toast.success('CSV exported');
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error(error);
    }
  };

  const handleExportJSON = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToJSON(invoice, company, client);
      toast.success('JSON exported');
    } catch (error) {
      toast.error('Failed to export JSON');
      console.error(error);
    }
  };

  const handleExportExcel = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToExcel(invoice, company, client);
      toast.success('Excel exported');
    } catch (error) {
      toast.error('Failed to export Excel');
      console.error(error);
    }
  };

  const handleExportXML = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Missing data');
      return;
    }
    try {
      await exportToXML(invoice, company, client);
      toast.success('XML exported');
    } catch (error) {
      toast.error('Failed to export XML');
      console.error(error);
    }
  };

  const handleMarkPaid = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (invoice) {
        await updateInvoice(invoiceId, { 
          ...invoice, 
          status: 'paid' as const, 
          updated_at: new Date().toISOString() 
        });
        toast.success('Invoice marked as paid');
      }
    } catch (error) {
      toast.error('Błąd podczas oznaczania jako opłacone');
      console.error('Mark paid error:', error);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    // Potwierdzenie przed usunięciem
    const confirmed = window.confirm('Czy na pewno chcesz usunąć tę fakturę? Ta operacja jest nieodwracalna.');
    
    if (!confirmed) {
      return;
    }

    try {
      console.log('Attempting to delete invoice:', invoiceId);
      if (!deleteInvoice) {
        console.error('deleteInvoice function is not available');
        toast.error('Funkcja usuwania nie jest dostępna');
        return;
      }
      await deleteInvoice(invoiceId);
      console.log('Invoice deleted successfully');
      toast.success(t('invoices.deleteSuccess') || 'Faktura została usunięta');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('invoices.deleteError') || 'Błąd podczas usuwania faktury: ' + (error as Error).message);
    }
  };

  const handleEditInvoice = (invoiceId: string) => {
    onNavigate(`invoices-edit-${invoiceId}`);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewInvoice(invoice);
  };

  const handleSendEmail = async (invoice: Invoice) => {
    const client = clients?.find(c => c.id === invoice.client_id);
    if (!client || !company) {
      toast.error('Brak danych klienta lub firmy');
      return;
    }

    if (!client.email) {
      toast.error('Klient nie ma adresu email');
      return;
    }

    try {
      // Generuj PDF faktury
      await generateInvoicePDF(invoice, company, client, invoice.lines, i18n.language, selectedTemplateId || 'classic');
      
      // Przygotuj dane emaila
      const subject = `Faktura ${invoice.invoice_number} - ${company.name}`;
      const body = `Szanowni Państwo,

W załączeniu przesyłam fakturę nr ${invoice.invoice_number} z dnia ${formatDate(invoice.issue_date, i18n.language)}.

Kwota do zapłaty: ${formatCurrency(invoice.total_gross, i18n.language)}
Termin płatności: ${formatDate(invoice.due_date, i18n.language)}

Dane do przelewu:
IBAN: ${company.iban || ''}
BIC: ${company.bic || ''}

Pozdrawiam,
${company.name}`;

      // Otwórz klienta email
      const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
      
      toast.success('Otwarto klienta email');
    } catch (error) {
      toast.error('Błąd podczas przygotowywania emaila');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-600 via-blue-600 to-purple-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                📄 {t('invoices.title')}
              </h1>
              <p className="text-blue-100 text-lg">Zarządzaj wszystkimi fakturami w jednym miejscu</p>
            </div>
            <button 
              onClick={() => onNavigate('invoices-new')}
              className="px-8 py-4 bg-linear-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
            >
              <Plus className="inline mr-2" size={24} />
              {t('invoices.newInvoice')}
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Modern Invoices Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-slate-500/5 to-gray-500/5"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('invoices.title')}</h2>
                <p className="text-gray-600">Wszystkie faktury w systemie</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <FileText className="text-indigo-600" size={24} />
              </div>
            </div>
            
            {sortedInvoices.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-linear-to-br from-indigo-100 to-purple-100 rounded-3xl inline-block mb-6">
                  <FileText className="text-indigo-600" size={64} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('invoices.noInvoices')}</h3>
                <p className="text-gray-600 mb-6 text-lg">{t('invoices.createFirst')}</p>
                <button 
                  onClick={() => onNavigate('invoices-new')}
                  className="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
                >
                  <Plus className="inline mr-2" size={20} />
                  {t('invoices.newInvoice')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Modern Table Header */}
                  <div className="grid grid-cols-7 gap-4 p-4 bg-linear-to-r from-slate-100 to-gray-100 rounded-t-xl border-b border-gray-200">
                    <div className="font-bold text-gray-700">{t('invoices.invoiceNumber')}</div>
                    <div className="font-bold text-gray-700">{t('invoices.client')}</div>
                    <div className="font-bold text-gray-700">{t('invoices.issueDate')}</div>
                    <div className="font-bold text-gray-700">{t('invoices.dueDate')}</div>
                    <div className="font-bold text-gray-700 text-right">{t('invoices.total')}</div>
                    <div className="font-bold text-gray-700">{t('invoices.status')}</div>
                    <div className="font-bold text-gray-700 text-right">{t('invoices.actions')}</div>
                  </div>
                  
                  {/* Modern Table Body */}
                  <div className="space-y-2 p-2">
                    {sortedInvoices.map((invoice, index) => {
                      const client = clients?.find(c => c.id === invoice.client_id);
                      return (
                        <div
                          key={invoice.id}
                          className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 p-4 hover:bg-white/80 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                        >
                          <div className="absolute inset-0 bg-linear-to-r from-indigo-500/5 to-purple-500/5 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                          <div className="relative grid grid-cols-7 gap-4 items-center">
                            <div className="font-mono font-bold text-gray-900">{invoice.invoice_number}</div>
                            <div className="font-medium text-gray-800">{client?.name || 'Unknown'}</div>
                            <div className="font-mono text-sm text-gray-600">{formatDate(invoice.issue_date, i18n.language)}</div>
                            <div className="font-mono text-sm text-gray-600">{formatDate(invoice.due_date, i18n.language)}</div>
                            <div className="text-right font-mono font-bold text-gray-900">{formatCurrency(invoice.total_gross, i18n.language)}</div>
                            <div>{getStatusBadge(invoice.status)}</div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* View Invoice */}
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <button 
                                      onClick={() => handleViewInvoice(invoice)}
                                      className="p-2 bg-blue-100 hover:bg-blue-200 rounded-xl transition-colors duration-200"
                                      title="Podgląd faktury"
                                    >
                                      <Eye className="text-blue-600 pointer-events-none" size={18} />
                                    </button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Podgląd faktury {invoice.invoice_number}</DialogTitle>
                                      <DialogDescription>
                                        Szczegóły faktury dla {client?.name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">Data wystawienia</p>
                                          <p className="text-lg">{formatDate(invoice.issue_date, i18n.language)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-gray-600">Termin płatności</p>
                                          <p className="text-lg">{formatDate(invoice.due_date, i18n.language)}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-600">Klient</p>
                                        <p className="text-lg">{client?.name}</p>
                                        <p className="text-sm text-gray-500">{client?.email}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-gray-600 mb-2">Pozycje</p>
                                        <div className="border rounded-lg overflow-hidden">
                                          <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                              <tr>
                                                <th className="px-4 py-2 text-left">Opis</th>
                                                <th className="px-4 py-2 text-right">Ilość</th>
                                                <th className="px-4 py-2 text-right">Cena</th>
                                                <th className="px-4 py-2 text-right">Suma</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {invoice.lines.map((line, idx) => (
                                                <tr key={idx} className="border-t">
                                                  <td className="px-4 py-2">{line.description}</td>
                                                  <td className="px-4 py-2 text-right">{line.quantity}</td>
                                                  <td className="px-4 py-2 text-right">{formatCurrency(line.unit_price, i18n.language)}</td>
                                                  <td className="px-4 py-2 text-right">{formatCurrency(line.total, i18n.language)}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                      <div className="flex justify-between items-center pt-4 border-t">
                                        <p className="text-lg font-semibold">Suma brutto</p>
                                        <p className="text-2xl font-bold text-indigo-600">{formatCurrency(invoice.total_gross, i18n.language)}</p>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {/* Send Email */}
                                <button 
                                  onClick={() => handleSendEmail(invoice)}
                                  className="p-2 bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors duration-200"
                                  title="Wyślij email"
                                >
                                  <EnvelopeSimple className="text-purple-600 pointer-events-none" size={18} />
                                </button>

                                {/* Edit Invoice */}
                                <button 
                                  onClick={() => handleEditInvoice(invoice.id)}
                                  className="p-2 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors duration-200"
                                  title="Edytuj fakturę"
                                >
                                  <PencilSimple className="text-amber-600 pointer-events-none" size={18} />
                                </button>

                                {/* Download Dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button 
                                      className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-xl transition-colors duration-200"
                                      title="Download invoice"
                                    >
                                      <DownloadSimple className="text-indigo-600 pointer-events-none" size={18} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border border-white/30">
                                    <DropdownMenuItem onClick={() => handleGeneratePDF(invoice)}>
                                      <FilePdf className="mr-2" size={16} />
                                      Download PDF/HTML
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportExcel(invoice)}>
                                      <FileXls className="mr-2" size={16} />
                                      Download Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleExportCSV(invoice)}>
                                      <FileCsv className="mr-2" size={16} />
                                      Export as CSV
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportJSON(invoice)}>
                                      <FileCode className="mr-2" size={16} />
                                      Export as JSON
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleExportXML(invoice)}>
                                      <FileCode className="mr-2" size={16} />
                                      Export as XML
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Mark as Paid */}
                                {invoice.status !== 'paid' && (
                                  <button
                                    onClick={() => handleMarkPaid(invoice.id)}
                                    className="p-2 bg-green-100 hover:bg-green-200 rounded-xl transition-colors duration-200"
                                    title={t('invoices.markPaid')}
                                  >
                                    <CheckCircle className="text-green-600 pointer-events-none" size={18} />
                                  </button>
                                )}

                                {/* Delete Invoice */}
                                <button 
                                  type="button"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    
                                    const confirmed = confirm(`Czy na pewno chcesz usunąć fakturę ${invoice.invoice_number}?`);
                                    if (!confirmed) return;
                                    
                                    try {
                                      console.log('Deleting invoice:', invoice.id);
                                      
                                      // Usunięcie z localStorage
                                      const stored = localStorage.getItem('invoices');
                                      if (stored) {
                                        const invoices = JSON.parse(stored);
                                        const updated = invoices.filter((inv: any) => inv.id !== invoice.id);
                                        localStorage.setItem('invoices', JSON.stringify(updated));
                                        console.log('Invoice deleted from localStorage');
                                        
                                        // Odświeżenie strony
                                        window.location.reload();
                                      }
                                    } catch (error) {
                                      console.error('Delete error:', error);
                                      alert('Błąd podczas usuwania faktury');
                                    }
                                  }}
                                  className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors duration-200 cursor-pointer"
                                  title="Usuń fakturę"
                                  style={{ pointerEvents: 'auto', zIndex: 9999 }}
                                >
                                  <Trash className="text-red-600 pointer-events-none" size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-indigo-200/20 rounded-full blur-xl group-hover:bg-purple-200/30 transition-all duration-300"></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
