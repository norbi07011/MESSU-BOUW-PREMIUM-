import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompany } from '@/hooks/useElectronDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Image as ImageIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Company, Language, Invoice, Client } from '@/types';
import { InvoiceTemplateSelector } from '@/components/InvoiceTemplateSelector';
import { InvoiceTemplatePreview } from '@/components/InvoiceTemplatePreview';
import { getTemplateById } from '@/lib/invoice-templates';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { company, updateCompany, loading } = useCompany();
  
  // Default company data jeśli brak w bazie
  const defaultCompany = {
    id: '1',
    name: '',
    address: '',
    kvk: '',
    vat_number: '',
    eori: '',
    iban: '',
    bic: '',
    phone: '',
    phone_mobile: '',
    phone_whatsapp: '',
    website: '',
    email: '',
    email_alt: '',
    bank_name: '',
    account_number: '',
    default_payment_term_days: 14,
    default_vat_rate: 21,
    currency: 'EUR',
    logo_url: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const [formData, setFormData] = useState(company || defaultCompany);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('classic');
  const [networkUrl, setNetworkUrl] = useState('http://192.168.178.75:5002/');

  // Get network URL automatically
  useEffect(() => {
    // Get current host and port
    const currentUrl = window.location.origin;
    const port = window.location.port || '5000';
    
    // Try to get actual network IP from electron if available
    if (window.electronAPI?.getNetworkAddress) {
      window.electronAPI.getNetworkAddress().then((ipAddress) => {
        setNetworkUrl(`http://${ipAddress}:${port}/`);
      });
    } else {
      // Fallback to current URL or localhost replacement
      if (currentUrl.includes('localhost')) {
        setNetworkUrl(`http://192.168.178.75:${port}/`);
      } else {
        setNetworkUrl(currentUrl);
      }
    }
  }, []);

  const sampleInvoice: Partial<Invoice> = {
    invoice_number: 'FV-2025-05-001',
    issue_date: '2025-05-15',
    due_date: '2025-05-29',
    currency: 'EUR',
    total_net: 500,
    total_vat: 105,
    total_gross: 605,
    payment_qr_payload: 'BCD\n001\n1\nSCT\nINGBNL2A\nYour Company\nNL00BANK0000000000\nEUR605.00\nFV-2025-05-001\nInvoice FV-2025-05-001',
    payment_reference: 'FV-2025-05-001',
    notes: 'Thank you for your business!',
    lines: [
      {
        id: '1',
        invoice_id: 'sample',
        description: 'Web Development Service',
        quantity: 10,
        unit_price: 50,
        vat_rate: 21,
        line_net: 500,
        line_vat: 105,
        line_gross: 605,
      },
    ],
  };

  const sampleClient: Client = {
    id: '1',
    name: 'Example Client B.V.',
    address: 'Rotterdam, Netherlands',
    country: 'NL',
    client_type: 'company',
    vat_number: 'NL123456789B01',
    kvk_number: '12345678',
    nip_number: '',
    email: 'client@example.com',
    phone: '+31 10 123 4567',
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Proszę wybrać plik obrazu');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Obraz musi być mniejszy niż 2MB');
      return;
    }

    try {
      console.log('Logo upload started:', file.name, file.size);
      
      // Try to save via Electron API if available
      if (window.electronAPI?.fileSystem?.saveCompanyLogo) {
        console.log('Using Electron API for logo save');
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const filename = `company-logo-${Date.now()}.${file.name.split('.').pop()}`;
        
        const savedPath = await window.electronAPI.fileSystem.saveCompanyLogo(filename, uint8Array);
        console.log('Logo saved to:', savedPath);
        setFormData({ ...formData, logo_url: savedPath });
        toast.success('Logo zapisane lokalnie');
      } else {
        console.log('Using fallback base64 for logo');
        // Fallback to base64 for web
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setFormData({ ...formData, logo_url: dataUrl });
          toast.success('Logo uploaded');
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      // Fallback to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData({ ...formData, logo_url: dataUrl });
        toast.success('Logo uploaded (base64)');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData) return;
    
    try {
      console.log('Saving company data:', formData);
      
      const result = await updateCompany({
        ...formData,
        updated_at: new Date().toISOString(),
      });
      
      console.log('Save result:', result);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error('Błąd podczas zapisywania');
      console.error('Save error:', error);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    toast.success(t('common.success'));
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-semibold mb-6">{t('settings.title')}</h1>

      <Tabs defaultValue="company" className="w-full">
        <TabsList>
          <TabsTrigger value="company">{t('settings.company')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('settings.preferences')}</TabsTrigger>
          <TabsTrigger value="templates">Invoice Templates</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
          <TabsTrigger value="desktop">Desktop App</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.company')}</CardTitle>
              <CardDescription>Company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-6">
                  <div className="space-y-2">
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-24 h-24">
                        {formData.logo_url ? (
                          <AvatarImage src={formData.logo_url} alt="Company logo" />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                            <ImageIcon size={32} />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-2" size={16} />
                          Upload Logo
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          aria-label="Upload company logo"
                          title="Select company logo file"
                        />
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 2MB. Will appear on invoices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('settings.name')} *</Label>
                  <Input
                    id="name"
                    placeholder="Company Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kvk">KvK-nummer (Kamer van Koophandel)</Label>
                  <Input
                    id="kvk"
                    placeholder="00000000"
                    value={formData.kvk}
                    onChange={(e) => setFormData({ ...formData, kvk: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('settings.address')} *</Label>
                  <Input
                    id="address"
                    placeholder="Zuiderparklaaan 65, 2574HS 's-Gravenhage, Nederland"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">BTW-nummer (BTW-identificatienummer)</Label>
                  <Input
                    id="vatNumber"
                    placeholder="NL005061645B57"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eori">EORI-nummer (voor export/import)</Label>
                  <Input
                    id="eori"
                    placeholder="NL005061645B57000000"
                    value={formData.eori}
                    onChange={(e) => setFormData({ ...formData, eori: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iban">{t('settings.iban')} *</Label>
                  <Input
                    id="iban"
                    placeholder="NL25INGB0109126122"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bic">{t('settings.bic')} (SWIFT)</Label>
                  <Input
                    id="bic"
                    placeholder="INGBNL2A"
                    value={formData.bic}
                    onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">{t('settings.bankName')}</Label>
                  <Input
                    id="bankName"
                    placeholder="ING Bank"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('settings.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="servicedesk@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailAlt">{t('settings.emailAlt')}</Label>
                  <Input
                    id="emailAlt"
                    type="email"
                    placeholder="info@company.com"
                    value={formData.email_alt}
                    onChange={(e) => setFormData({ ...formData, email_alt: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')} (Tel.)</Label>
                  <Input
                    id="phone"
                    placeholder="+31 70 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneMobile">{t('settings.phoneMobile')} (Mobiel)</Label>
                  <Input
                    id="phoneMobile"
                    placeholder="+31 6 12345678"
                    value={formData.phone_mobile}
                    onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneWhatsapp">{t('settings.phoneWhatsapp')} (WhatsApp)</Label>
                  <Input
                    id="phoneWhatsapp"
                    placeholder="+31 6 87654321"
                    value={formData.phone_whatsapp}
                    onChange={(e) => setFormData({ ...formData, phone_whatsapp: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{t('settings.website')}</Label>
                  <Input
                    id="website"
                    placeholder="www.company.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultPaymentTerm">{t('settings.defaultPaymentTerm')} (dagen)</Label>
                  <Input
                    id="defaultPaymentTerm"
                    type="number"
                    placeholder="14"
                    value={formData.default_payment_term_days}
                    onChange={(e) => setFormData({ ...formData, default_payment_term_days: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultVatRate">{t('settings.defaultVatRate')} (%)</Label>
                  <Input
                    id="defaultVatRate"
                    type="number"
                    step="0.01"
                    placeholder="21"
                    value={formData.default_vat_rate}
                    onChange={(e) => setFormData({ ...formData, default_vat_rate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full md:w-auto">
                {t('settings.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.preferences')}</CardTitle>
              <CardDescription>Application preferences and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">{t('settings.language')}</Label>
                <Select value={i18n.language} onValueChange={(value) => handleLanguageChange(value as Language)}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pl">Polski (PL)</SelectItem>
                    <SelectItem value="nl">Nederlands (NL)</SelectItem>
                    <SelectItem value="en">English (EN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Templates</CardTitle>
                <CardDescription>
                  Choose a template style for your invoices. The selected template will be used for all PDF exports.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvoiceTemplateSelector
                  selectedTemplateId={selectedTemplateId || 'classic'}
                  onSelect={(templateId) => {
                    setSelectedTemplateId(templateId);
                    toast.success('Template selected');
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  Preview of how your invoices will look with the selected template
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center bg-muted/30 p-8 rounded-lg overflow-auto">
                <InvoiceTemplatePreview
                  invoice={sampleInvoice}
                  client={sampleClient}
                  company={company}
                  template={getTemplateById(selectedTemplateId || 'classic')}
                  scale={0.4}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="downloads">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Pobierz MESSU BOUW</CardTitle>
                <CardDescription>
                  Wybierz platformę i pobierz aplikację na swoje urządzenie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Desktop Download */}
                <div className="border rounded-lg p-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex items-start space-x-4">
                    <div className="shrink-0">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        💻 Windows Desktop App
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Pełna aplikacja z SQLite database, offline work, auto-backup
                      </p>
                      <div className="mt-4 flex space-x-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            // Download current source code as ZIP
                            const link = document.createElement('a');
                            link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
                              'MESSU BOUW - Source Code\\n\\n' +
                              'Instrukcje instalacji:\\n' +
                              '1. Rozpakuj ZIP\\n' +
                              '2. Zainstaluj Node.js (18.x+)\\n' +
                              '3. W folderze: npm install\\n' +
                              '4. Uruchom: npm run electron:dev\\n\\n' +
                              'Wymagania: Node.js, Windows 10+'
                            )}`;
                            link.download = 'MESSU-BOUW-Installation-Guide.txt';
                            link.click();
                            toast.success('Instrukcje pobrane! Zobacz plik tekstowy.');
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          📁 Download Source Code
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (window.electronAPI?.build) {
                              window.electronAPI.build.createInstaller();
                              toast.success('Tworzenie installer Windows...');
                            } else {
                              toast.error('Funkcja dostępna tylko w desktop app');
                            }
                          }}
                        >
                          🔧 Build .exe Installer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Web App */}
                <div className="border rounded-lg p-6 bg-linear-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                  <div className="flex items-start space-x-4">
                    <div className="shrink-0">
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 19H7V5h10m0-2H7c-1.11 0-2 .89-2 2v14c0 1.11.89 2 2 2h10c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        📱 Telefon / Tablet
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Dostęp przez przeglądarkę, responsive design, localStorage
                      </p>
                      
                      <div className="mt-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded border-l-4 border-green-500">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          📡 Aktualny adres sieciowy:
                        </p>
                        <div className="mt-2 space-y-1">
                          <code className="block text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
                            {networkUrl}
                          </code>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Skopiuj ten adres i wklej w przeglądarce telefonu (ta sama sieć Wi-Fi)
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-3">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (window.electronAPI?.copyToClipboard) {
                              await window.electronAPI.copyToClipboard(networkUrl);
                              toast.success('Adres skopiowany! Wklej w przeglądarce telefonu.');
                            } else {
                              navigator.clipboard.writeText(networkUrl);
                              toast.success('Adres skopiowany! Wklej w przeglądarce telefonu.');
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          📋 Skopiuj adres
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Generate QR code URL
                            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(networkUrl)}`;
                            window.open(qrUrl, '_blank');
                            toast.success('QR kod otwarty - skanuj telefonem!');
                          }}
                        >
                          📱 Pokaż QR kod
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PWA */}
                <div className="border rounded-lg p-6 bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="flex items-start space-x-4">
                    <div className="shrink-0">
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ⚡ Progressive Web App (PWA)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Zainstaluj jako app na telefonie - działa jak natywna aplikacja
                      </p>
                      
                      <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">1</span>
                          <span>Otwórz adres w przeglądarce telefonu</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">2</span>
                          <span>Kliknij "Dodaj do ekranu głównego" w menu przeglądarki</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">3</span>
                          <span>Aplikacja zostanie zainstalowana jak natywna app</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            toast.success('Otwórz link w telefonie i dodaj do ekranu głównego!');
                          }}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          ℹ️ Instrukcje PWA
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        💡 Porady instalacji
                      </h4>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        <p><strong>Desktop:</strong> Pełna funkcjonalność, SQLite database, offline work</p>
                        <p><strong>Telefon:</strong> Responsive UI, localStorage, idealny do dodawania danych w ruchu</p>
                        <p><strong>Sync:</strong> Używaj desktop jako głównej bazy, telefon do szybkich wpisów</p>
                      </div>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="desktop">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Desktop Application</CardTitle>
                <CardDescription>
                  Download and install MESSU BOUW as a desktop application for your computer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Desktop App Features
                    </h3>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      • Offline work - wszystkie dane przechowywane lokalnie<br/>
                      • SQLite database - szybka i niezawodna baza danych<br/>
                      • Auto backup - automatyczne kopie zapasowe<br/>
                      • PDF generation - generowanie faktur w PDF<br/>
                      • No cloud dependencies - brak zależności od internetu
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Build Desktop Installer</h4>
                  <p className="text-sm text-muted-foreground">
                    Zbuduj installer dla Windows (.exe) który możesz zainstalować na dowolnym komputerze.
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        // Trigger electron build
                        if (window.electronAPI) {
                          window.electronAPI.build.createInstaller();
                          toast.success('Rozpoczęto budowanie instalatora...');
                        } else {
                          toast.error('Funkcja dostępna tylko w aplikacji desktop');
                        }
                      }}
                      className="flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Build Windows Installer</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (window.electronAPI) {
                          window.electronAPI.build.openInstallerFolder();
                        } else {
                          toast.error('Funkcja dostępna tylko w aplikacji desktop');
                        }
                      }}
                    >
                      Open Installer Folder
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="text-sm font-medium">Instrukcje instalacji na innym komputerze</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Opcja 1: Installer (.exe)</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Zbuduj installer używając przycisku powyżej</li>
                      <li>Skopiuj plik .exe na pendrive lub prześlij przez email</li>
                      <li>Uruchom installer na docelowym komputerze</li>
                      <li>Aplikacja zostanie zainstalowana automatycznie</li>
                    </ol>
                    
                    <p className="mt-4"><strong>Opcja 2: Źródło aplikacji (dla programistów)</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Skopiuj cały folder projektu na pendrive</li>
                      <li>Na nowym komputerze zainstaluj Node.js (18.x lub nowszy)</li>
                      <li>Otwórz terminal w folderze projektu</li>
                      <li>Uruchom: <code className="bg-muted px-1 rounded">npm install</code></li>
                      <li>Uruchom: <code className="bg-muted px-1 rounded">npm run electron:dev</code></li>
                    </ol>
                    
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <p className="text-green-800 dark:text-green-200 text-sm">
                        ✅ <strong>Zalecana opcja:</strong> Użyj installer (.exe) - automatycznie zainstaluje wszystkie potrzebne komponenty
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
