import { useState } from 'react';
import { Toaster } from 'sonner';
import './i18n';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { House, FileText, Users, Package, ChartBar, Gear, Download, DeviceMobile, Car } from '@phosphor-icons/react';
import { toast } from 'sonner';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Kilometers from './pages/Kilometers';

type Page = 'dashboard' | 'invoices' | 'invoices-new' | 'clients' | 'products' | 'kilometers' | 'reports' | 'settings';

function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Download handlers
  const handleDownloadDesktop = async () => {
    console.log('Desktop download clicked');
    
    try {
      // Sprawdź czy jesteśmy w Electron app
      if (window.electronAPI?.build?.createInstaller) {
        console.log('Creating installer via Electron...');
        toast.success('🔧 Tworzenie installer Windows...', {
          description: 'Proszę czekać, to może potrwać kilka minut...'
        });
        
        try {
          const success = await window.electronAPI.build.createInstaller();
          if (success) {
            toast.success('✅ Installer utworzony!', {
              description: 'Sprawdź folder release/ - tam jest plik .exe do instalacji'
            });
            
            // Automatycznie otwórz folder z instalatorem
            if (window.electronAPI.build.openInstallerFolder) {
              await window.electronAPI.build.openInstallerFolder();
            }
          } else {
            throw new Error('Installer creation failed');
          }
        } catch (error) {
          console.error('Installer creation error:', error);
          toast.error('❌ Błąd tworzenia installer', {
            description: 'Spróbuj ponownie lub skontaktuj się z pomocą techniczną'
          });
        }
        return;
      }
      
      // Jeśli nie ma Electron API, przekieruj do gotowej aplikacji
      console.log('No Electron API, offering direct download...');
      
      // Sprawdź czy jest dostępny gotowy installer w folderze release
      const downloadUrl = window.location.origin + '/release/MESSU-BOUW-Setup.exe';
      
      try {
        const response = await fetch(downloadUrl, { method: 'HEAD' });
        if (response.ok) {
          // Jest gotowy installer - pobierz go
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = 'MESSU-BOUW-Setup.exe';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast.success('📦 Pobieranie installer...', {
            description: 'Plik MESSU-BOUW-Setup.exe zostanie pobrany'
          });
          return;
        }
      } catch (e) {
        console.log('No installer available, creating instructions');
      }
      
      // Fallback - stwórz instrukcje instalacji
      const instructionsText = `🚀 MESSU BOUW - Gotowa Aplikacja Desktop

SPOSÓB 1 - SZYBKA INSTALACJA (Zalecany):
================================
1. Pobierz Node.js: https://nodejs.org/ (wybierz LTS)
2. Rozpakuj folder aplikacji MESSU BOUW 
3. Kliknij prawym na folder → "Otwórz w terminalu"
4. Wpisz: npm install (poczekaj na instalację)
5. Wpisz: npm run dist
6. W folderze release/ znajdziesz MESSU-BOUW-Setup.exe
7. Uruchom installer i gotowe!

SPOSÓB 2 - BEZPOŚREDNIE URUCHOMIENIE:
===================================
1. Po instalacji Node.js i npm install
2. Wpisz: npm run electron:dev
3. Aplikacja uruchomi się od razu

📋 WYMAGANIA:
- Windows 10/11
- Node.js 18+ (https://nodejs.org/)
- 4GB RAM, 2GB wolnego miejsca

🔄 SYNCHRONIZACJA DANYCH:
- Wszystkie dane zapisywane lokalnie w SQLite
- Automatyczny backup co tydzień
- Export/Import do przenoszenia między komputerami
- Folder danych: Documents/MESSU BOUW/

💡 WAŻNE:
Po instalacji aplikacja działa całkowicie OFFLINE!
Nie potrzebuje internetu do działania.

Adres lokalny: http://localhost:5002/
Adres sieciowy: http://192.168.178.75:5002/

🆘 POMOC: norbs.support@email.com`;

      // Pobierz instrukcje
      const blob = new Blob([instructionsText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'NORBS-Faktur-Instalacja-Desktop.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('📁 Instrukcje pobrane!', {
        description: 'Sprawdź plik w Downloads - dokładne kroki instalacji'
      });
      
    } catch (error) {
      console.error('Desktop download error:', error);
      toast.error('❌ Błąd pobierania', {
        description: 'Spróbuj ponownie lub skontaktuj się z pomocą'
      });
    }
  };

  const handleDownloadMobile = async () => {
    console.log('Mobile download clicked');
    
    try {
      // Automatycznie wykryj adres sieciowy
      let networkUrl = 'http://192.168.178.75:5002/';
      
      // Spróbuj pobrać aktualny IP z Electron
      if (window.electronAPI?.getNetworkAddress) {
        try {
          const ipAddress = await window.electronAPI.getNetworkAddress();
          networkUrl = `http://${ipAddress}:5002/`;
          console.log('Got network IP from Electron:', ipAddress);
        } catch (e) {
          console.log('Failed to get IP from Electron, using fallback');
        }
      }
      
      // Skopiuj adres do schowka
      try {
        if (window.electronAPI?.copyToClipboard) {
          await window.electronAPI.copyToClipboard(networkUrl);
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(networkUrl);
        } else {
          // Fallback dla starszych przeglądarek
          const textArea = document.createElement('textarea');
          textArea.value = networkUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
        }
        
        // Stwórz szczegółowe instrukcje dla telefonu
        const mobileInstructions = `📱 MESSU BOUW - Aplikacja na Telefon

🎯 SZYBKA INSTALACJA (3 kroki):
==============================

1️⃣ OTWÓRZ W PRZEGLĄDARCE TELEFONU:
   ${networkUrl}
   (Telefon musi być w tej samej sieci Wi-Fi!)

2️⃣ ZAINSTALUJ JAKO APLIKACJĘ:
   
   📱 ANDROID:
   - Kliknij ⋮ (3 kropki) w prawym górnym rogu
   - Wybierz "Dodaj do ekranu głównego" lub "Zainstaluj aplikację"
   - Potwierdź instalację
   
   🍎 iPhone/iPad:
   - Kliknij przycisk "Udostępnij" 📤 
   - Wybierz "Dodaj do ekranu głównego"
   - Kliknij "Dodaj"

3️⃣ GOTOWE! 
   Aplikacja będzie na ekranie głównym jak normalna app!

🔄 SYNCHRONIZACJA DANYCH:
- Dane zapisywane lokalnie w przeglądarce telefonu
- Możliwość eksportu/importu między urządzeniami
- Backup do chmury (opcjonalnie)

💡 WSKAZÓWKI:
- Aplikacja działa OFFLINE po pierwszym załadowaniu
- Wygląda i działa jak natywna aplikacja
- Powiadomienia i skróty klawiszowe
- Pełna funkcjonalność fakturowania

🌐 DOSTĘP Z PRACY:
Żeby używać z pracy, możesz:
1. Hostować na serwerze firmowym
2. Używać VPN do domu  
3. Eksportować/importować dane przez email

⚠️ BEZPIECZEŃSTWO:
- Wszystkie dane lokalnie na telefonie
- Bez wysyłania do internetu
- Szyfrowanie bazy danych

🆘 POMOC: support@messubouw.com`;

        // Pobierz instrukcje mobilne
        const blob = new Blob([mobileInstructions], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'MESSU-BOUW-Telefon-Instrukcje.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('📱 Adres skopiowany + instrukcje pobrane!', {
          description: `${networkUrl} - Otwórz w przeglądarce telefonu i zainstaluj jako app`
        });
        
        // Dodatkowo otwórz QR kod w nowym oknie
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(networkUrl)}&format=png&margin=20`;
        const qrWindow = window.open(qrUrl, '_blank', 'width=500,height=600,scrollbars=yes');
        
        // Dodaj instrukcje do okna QR
        if (qrWindow) {
          qrWindow.document.title = 'MESSU BOUW - QR Code';
          setTimeout(() => {
            if (qrWindow && !qrWindow.closed) {
              qrWindow.document.body.innerHTML = `
                <div style="text-align: center; font-family: Arial; padding: 20px;">
                  <h2>📱 MESSU BOUW - Zainstaluj na telefonie</h2>
                  <img src="${qrUrl}" alt="QR Code" style="max-width: 400px; border: 2px solid #ccc; border-radius: 10px;"/>
                  <h3>Instrukcje:</h3>
                  <ol style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <li>Zeskanuj QR kod telefonem</li>
                    <li>Otwórz link w przeglądarce</li>
                    <li>Kliknij "Dodaj do ekranu głównego"</li>
                    <li>Gotowe - masz aplikację!</li>
                  </ol>
                  <p><strong>Adres:</strong> <code>${networkUrl}</code></p>
                  <p><em>Telefon musi być w tej samej sieci Wi-Fi</em></p>
                </div>`;
            }
          }, 1000);
        }
        
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        // Jeśli kopiowanie się nie uda, pokaż adres w alertcie
        alert(`📱 Skopiuj ten adres i wklej w przeglądarce telefonu:\n\n${networkUrl}\n\n✅ INSTRUKCJE:\n1. Otwórz link w przeglądarce telefonu\n2. Kliknij "Dodaj do ekranu głównego"\n3. Potwierdź instalację\n4. Gotowe - masz aplikację!\n\n(Telefon musi być w tej samej sieci Wi-Fi)`);
      }
      
    } catch (error) {
      console.error('Mobile download error:', error);
      toast.error('❌ Błąd', {
        description: 'Nie udało się przygotować instalacji mobilnej'
      });
    }
  };

  const navItems = [
    { id: 'dashboard' as Page, icon: House, label: t('nav.dashboard') },
    { id: 'invoices' as Page, icon: FileText, label: t('nav.invoices') },
    { id: 'clients' as Page, icon: Users, label: t('nav.clients') },
    { id: 'products' as Page, icon: Package, label: t('nav.products') },
    { id: 'kilometers' as Page, icon: Car, label: t('nav.kilometers') },
    { id: 'reports' as Page, icon: ChartBar, label: t('nav.reports') },
    { id: 'settings' as Page, icon: Gear, label: t('nav.settings') },
  ];

  const renderPage = () => {
    const handleNavigate = (page: string) => setCurrentPage(page as Page);
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'invoices':
        return <Invoices onNavigate={handleNavigate} />;
      case 'invoices-new':
        return <InvoiceForm onNavigate={handleNavigate} />;
      case 'clients':
        return <Clients />;
      case 'products':
        return <Products />;
      case 'kilometers':
        return <Kilometers />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header with Download Buttons */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-white/30 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="relative flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg">
              <img 
                src="/messu-bouw-logo.jpg" 
                alt="MESSU BOUW" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                MESSU BOUW
              </h1>
              <span className="text-sm text-gray-600">Invoice Management System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadDesktop}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm font-medium"
            >
              <Download size={16} />
              <span>Pobierz na komputer</span>
            </button>
            
            <button
              onClick={handleDownloadMobile}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg text-sm font-medium"
            >
              <DeviceMobile size={16} />
              <span>Pobierz na telefon</span>
            </button>

            {/* Mobile buttons */}
            <button
              onClick={handleDownloadDesktop}
              className="sm:hidden p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              💻
            </button>
            
            <button
              onClick={handleDownloadMobile}
              className="sm:hidden p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              📱
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-72 min-h-screen bg-white/70 backdrop-blur-sm border-r border-white/30 shadow-xl">
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="/messu-bouw-logo.jpg" 
                  alt="MESSU BOUW" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">MESSU BOUW</h2>
                <p className="text-sm text-gray-600">Invoice Management</p>
              </div>
            </div>
          </div>
          <nav className="px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id || 
                (item.id === 'invoices' && currentPage === 'invoices-new');
              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-white/80 hover:shadow-md'
                  }`}
                  onClick={() => setCurrentPage(item.id)}
                >
                  <Icon size={20} />
                  {item.label}
                </button>
              );
            })}
            
            {/* Quick Download Section */}
            <div className="pt-6 mt-6 border-t border-white/30">
              <p className="text-xs text-gray-500 px-4 pb-3 font-medium uppercase tracking-wide">Szybkie pobieranie</p>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-blue-600 hover:bg-blue-50/80 hover:shadow-md"
                onClick={handleDownloadDesktop}
              >
                <Download size={20} />
                💻 Na komputer
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left font-medium text-green-600 hover:bg-green-50/80 hover:shadow-md mt-2"
                onClick={handleDownloadMobile}
              >
                <DeviceMobile size={20} />
                📱 Na telefon
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;