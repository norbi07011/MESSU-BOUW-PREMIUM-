import { useTranslation } from 'react-i18next';
import { useInvoices, useClients } from '@/hooks/useElectronDB';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Users, Package, ChartBar, Download, DeviceMobile } from '@phosphor-icons/react';
import { Invoice, Client } from '@/types';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { t, i18n } = useTranslation();
  const { invoices, loading: invoicesLoading } = useInvoices();
  const { clients, loading: clientsLoading } = useClients();
  const isMobile = useIsMobile();

  // Download handlers (same as in App.tsx)
  const handleDownloadDesktop = async () => {
    try {
      // Próbuj pobrać gotowy installer
      const installerUrl = '/MESSU-BOUW-Simple-Installer.zip';
      
      const link = document.createElement('a');
      link.href = installerUrl;
      link.download = 'MESSU-BOUW-Simple-Installer.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('🎯 Pobieranie instalatora Windows...', {
        description: 'Rozpakuj ZIP i uruchom INSTALL.bat jako administrator'
      });
      
    } catch (error) {
      console.error('Download error:', error);
      
      // Fallback - instrukcje tekstowe
      const instructionsText = `MESSU BOUW - Instrukcje Instalacji
      
🚀 GOTOWY INSTALLER:
1. Pobierz: MESSU-BOUW-Simple-Installer.zip
2. Rozpakuj ZIP 
3. Uruchom INSTALL.bat jako administrator
4. Postępuj zgodnie z instrukcjami
5. Aplikacja zostanie zainstalowana w C:\\MESSU-BOUW\\

📋 WYMAGANIA:
- Windows 10/11
- Uprawnienia administratora
- 500MB wolnego miejsca

💾 RĘCZNA INSTALACJA (jeśli installer nie działa):
1. Pobierz i zainstaluj Node.js: https://nodejs.org/
2. Rozpakuj folder aplikacji 
3. Otwórz folder w Terminal/PowerShell jako administrator
4. Wpisz: npm install
5. Wpisz: npm run electron
6. Aplikacja się uruchomi!

📞 POMOC TECHNICZNA:
Email: support@messubouw.com

Wersja: 1.0.0 (Build: ${new Date().toISOString().split('T')[0]})`;

      const blob = new Blob([instructionsText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'MESSU-BOUW-Instrukcje.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('📁 Instrukcje pobrane!', {
        description: 'Sprawdź plik w Downloads'
      });
    }
  };

  const handleDownloadMobile = async () => {
    try {
      let networkUrl = 'http://192.168.178.75:5002/';
      
      if (window.electronAPI?.getNetworkAddress) {
        try {
          const ipAddress = await window.electronAPI.getNetworkAddress();
          networkUrl = `http://${ipAddress}:5002/`;
        } catch (e) {
          // Use fallback
        }
      }
      
      // Copy to clipboard
      try {
        if (window.electronAPI?.copyToClipboard) {
          await window.electronAPI.copyToClipboard(networkUrl);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(networkUrl);
        } else {
          const textArea = document.createElement('textarea');
          textArea.value = networkUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        toast.success('📱 Adres skopiowany!', {
          description: `${networkUrl} - Wklej w przeglądarce telefonu`
        });
        
        // Open QR code
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(networkUrl)}&format=png`;
        window.open(qrUrl, '_blank', 'width=400,height=400');
        
      } catch (clipboardError) {
        alert(`📱 Skopiuj ten adres i wklej w przeglądarce telefonu:\n\n${networkUrl}`);
      }
      
    } catch (error) {
      toast.error('❌ Błąd');
    }
  };

  const stats = useMemo(() => {
    if (invoicesLoading || !invoices) return {
      unpaid: 0,
      thisMonth: 0,
      thisYear: 0,
      totalInvoices: 0,
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const unpaidTotal = invoices
      ?.filter(inv => inv.status === 'unpaid')
      .reduce((sum, inv) => sum + inv.total_gross, 0) || 0;

    const thisMonthTotal = invoices
      ?.filter(inv => {
        const date = new Date(inv.issue_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.total_gross, 0) || 0;

    const thisYearTotal = invoices
      ?.filter(inv => {
        const date = new Date(inv.issue_date);
        return date.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.total_gross, 0) || 0;

    return {
      unpaid: unpaidTotal,
      thisMonth: thisMonthTotal,
      thisYear: thisYearTotal,
      totalInvoices: invoices?.length || 0,
    };
  }, [invoices, invoicesLoading]);

  const recentInvoices = useMemo(() => {
    return (invoices || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
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

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <img 
          src="/messu-bouw-logo.jpg" 
          alt="MESSU BOUW" 
          className="max-w-2xl max-h-2xl object-contain"
        />
      </div>
      
      <div className={`max-w-7xl mx-auto ${isMobile ? 'p-3 space-y-4' : 'p-6 space-y-8'} relative z-10`}>
        {/* Modern Header - Responsive */}
        <div className={`relative overflow-hidden ${isMobile ? 'rounded-2xl p-4' : 'rounded-3xl p-8'} bg-linear-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-2xl`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className={`relative ${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold tracking-tight mb-2`}>
                🎯 {t('dashboard.title')}
              </h1>
              <p className={`text-blue-100 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                {isMobile ? 'System fakturowania' : 'Witaj w nowoczesnym systemie fakturowania'}
              </p>
            </div>
            <button 
              onClick={() => onNavigate('invoices-new')}
              className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'px-8 py-4 text-lg'} bg-linear-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-xl`}
            >
              <Plus className="inline mr-2" size={isMobile ? 20 : 24} />
              {t('dashboard.newInvoice')}
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Modern Download Cards */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 lg:grid-cols-2 gap-6'}`}>
          <div className={`relative group overflow-hidden ${isMobile ? 'rounded-xl p-4' : 'rounded-2xl p-6'} bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent"></div>
            <div className="relative">
              <div className={`flex items-center gap-${isMobile ? '3' : '4'} mb-${isMobile ? '3' : '4'}`}>
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-white/20 backdrop-blur-sm rounded-xl`}>
                  <Download size={isMobile ? 24 : 32} className="text-white" />
                </div>
                <div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>💻 Pobierz na komputer</h3>
                  <p className={`text-blue-100 ${isMobile ? 'text-xs' : 'text-base'}`}>
                    {isMobile ? 'Desktop Windows' : 'Aplikacja desktop Windows z instalatorem'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadDesktop}
                className={`w-full ${isMobile ? 'py-2 text-sm' : 'py-3'} bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold`}
              >
                Pobierz teraz
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </div>

          <div className={`relative group overflow-hidden ${isMobile ? 'rounded-xl p-4' : 'rounded-2xl p-6'} bg-linear-to-br from-green-500 to-green-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent"></div>
            <div className="relative">
              <div className={`flex items-center gap-${isMobile ? '3' : '4'} mb-${isMobile ? '3' : '4'}`}>
                <div className={`${isMobile ? 'p-2' : 'p-3'} bg-white/20 backdrop-blur-sm rounded-xl`}>
                  <DeviceMobile size={isMobile ? 24 : 32} className="text-white" />
                </div>
                <div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>📱 Pobierz na telefon</h3>
                  <p className={`text-green-100 ${isMobile ? 'text-xs' : 'text-base'}`}>
                    {isMobile ? 'Skopiuj adres' : 'Skopiuj adres i otwórz w przeglądarce telefonu'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadMobile}
                className={`w-full ${isMobile ? 'py-2 text-sm' : 'py-3'} bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold`}
              >
                Skopiuj adres
              </button>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          <div className={`group relative overflow-hidden ${isMobile ? 'rounded-xl p-4' : 'rounded-2xl p-6'} bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="absolute inset-0 bg-linear-to-br from-red-500/10 to-red-600/10"></div>
            <div className={`relative flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>{t('dashboard.unpaid')}</h3>
              <div className={`${isMobile ? 'p-1' : 'p-2'} bg-red-100 rounded-xl`}>
                <FileText className="text-red-600" size={isMobile ? 16 : 20} />
              </div>
            </div>
            <div className={`relative ${isMobile ? 'text-lg' : 'text-3xl'} font-bold text-gray-900 font-mono`}>
              {formatCurrency(stats.unpaid, i18n.language)}
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-red-200/30 rounded-full blur-lg"></div>
          </div>

          <div className={`group relative overflow-hidden ${isMobile ? 'rounded-xl p-4' : 'rounded-2xl p-6'} bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="absolute inset-0 bg-linear-to-br from-blue-500/10 to-blue-600/10"></div>
            <div className={`relative flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>{t('dashboard.thisMonth')}</h3>
              <div className={`${isMobile ? 'p-1' : 'p-2'} bg-blue-100 rounded-xl`}>
                <ChartBar className="text-blue-600" size={isMobile ? 16 : 20} />
              </div>
            </div>
            <div className={`relative ${isMobile ? 'text-lg' : 'text-3xl'} font-bold text-gray-900 font-mono`}>
              {formatCurrency(stats.thisMonth, i18n.language)}
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-blue-200/30 rounded-full blur-lg"></div>
          </div>

          <div className={`group relative overflow-hidden ${isMobile ? 'rounded-xl p-4' : 'rounded-2xl p-6'} bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="absolute inset-0 bg-linear-to-br from-green-500/10 to-green-600/10"></div>
            <div className={`relative flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>{t('dashboard.thisYear')}</h3>
              <div className={`${isMobile ? 'p-1' : 'p-2'} bg-green-100 rounded-xl`}>
                <ChartBar className="text-green-600" size={isMobile ? 16 : 20} />
              </div>
            </div>
            <div className={`relative ${isMobile ? 'text-lg' : 'text-3xl'} font-bold text-gray-900 font-mono`}>
              {formatCurrency(stats.thisYear, i18n.language)}
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-green-200/30 rounded-full blur-lg"></div>
          </div>

          <div className={`group relative overflow-hidden ${isMobile ? 'rounded-xl p-4' : 'rounded-2xl p-6'} bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-purple-600/10"></div>
            <div className={`relative flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-4'}`}>
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>{t('dashboard.totalInvoices')}</h3>
              <div className={`${isMobile ? 'p-1' : 'p-2'} bg-purple-100 rounded-xl`}>
                <FileText className="text-purple-600" size={isMobile ? 16 : 20} />
              </div>
            </div>
            <div className={`relative ${isMobile ? 'text-lg' : 'text-3xl'} font-bold text-gray-900 font-mono`}>
              {stats.totalInvoices}
            </div>
            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-purple-200/30 rounded-full blur-lg"></div>
          </div>
        </div>

        {/* Modern Recent Invoices */}
        <div className={`relative overflow-hidden ${isMobile ? 'rounded-xl' : 'rounded-2xl'} bg-white/80 backdrop-blur-sm border border-white/30 shadow-xl`}>
          <div className="absolute inset-0 bg-linear-to-br from-slate-500/5 to-gray-500/5"></div>
          <div className={`relative ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <div>
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{t('dashboard.recentInvoices')}</h2>
                {!isMobile && <p className="text-gray-600">Ostatnie 5 faktur w systemie</p>}
              </div>
              <div className={`${isMobile ? 'p-2' : 'p-3'} bg-slate-100 rounded-xl`}>
                <FileText className="text-slate-600" size={isMobile ? 20 : 24} />
              </div>
            </div>
            
            {recentInvoices.length === 0 ? (
              <div className="text-center py-16">
                <div className={`${isMobile ? 'p-4' : 'p-6'} bg-linear-to-br from-blue-100 to-indigo-100 rounded-3xl inline-block mb-6`}>
                  <FileText className="text-blue-600" size={isMobile ? 48 : 64} />
                </div>
                <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-3`}>{t('dashboard.noInvoices')}</h3>
                <p className={`text-gray-600 mb-6 ${isMobile ? 'text-base' : 'text-lg'}`}>{t('dashboard.createFirst')}</p>
                <button 
                  onClick={() => onNavigate('invoices-new')}
                  className={`${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'} bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-xl`}
                >
                  <Plus className="inline mr-2" size={20} />
                  {t('dashboard.newInvoice')}
                </button>
              </div>
            ) : (
              <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                {recentInvoices.map((invoice) => {
                  const client = clients?.find(c => c.id === invoice.client_id);
                  return (
                    <div
                      key={invoice.id}
                      className={`group relative overflow-hidden ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} bg-white/60 backdrop-blur-sm border border-white/50 hover:bg-white/80 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02]`}
                      onClick={() => onNavigate(`invoices-${invoice.id}`)}
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300"></div>
                      <div className={`relative ${isMobile ? 'space-y-2' : 'flex items-center justify-between'}`}>
                        <div className="flex-1">
                          <div className={`font-mono font-bold ${isMobile ? 'text-base' : 'text-lg'} text-gray-900 mb-1`}>
                            {invoice.invoice_number}
                          </div>
                          <div className={`text-gray-600 ${isMobile ? 'text-sm' : 'font-medium'}`}>
                            {client?.name || 'Unknown'}
                          </div>
                        </div>
                        <div className={`${isMobile ? 'flex items-center justify-between' : 'text-right mr-6'}`}>
                          <div className={`font-mono font-bold ${isMobile ? 'text-lg' : 'text-xl'} text-gray-900`}>
                            {formatCurrency(invoice.total_gross, i18n.language)}
                          </div>
                          <div className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                            {formatDate(invoice.issue_date, i18n.language)}
                          </div>
                        </div>
                        <div className={isMobile ? 'mt-2' : 'shrink-0'}>
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-blue-200/20 rounded-full blur-xl group-hover:bg-purple-200/30 transition-all duration-300"></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
