import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useClients } from '@/hooks/useElectronDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, PencilSimple, Trash, Users, User, Buildings, DotsThreeVertical } from '@phosphor-icons/react';
import { Client } from '@/types';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Słownik krajów
const COUNTRIES = {
  'PL': 'Polska',
  'NL': 'Holandia',
  'DE': 'Niemcy',
  'BE': 'Belgia',
  'FR': 'Francja',
  'ES': 'Hiszpania',
  'IT': 'Włochy',
  'GB': 'Wielka Brytania',
  'US': 'Stany Zjednoczone',
  'CA': 'Kanada',
  'AU': 'Australia',
  'Other': 'Inne'
};
export default function Clients() {
  const { t } = useTranslation();
  const { clients, createClient, updateClient, deleteClient, loading, refetch } = useClients();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();

  // Debug logs
  console.log('Clients component rendering with:', { 
    clientsCount: clients?.length,
    loading,
    isElectron: window.electronAPI?.isElectron,
    searchTerm
  });

  // Migracja starych klientów do nowego formatu
  const migratedClients = useMemo(() => {
    if (!clients) return [];
    return clients.map(client => ({
      ...client,
      country: client.country || 'PL',
      client_type: client.client_type || 'company',
      kvk_number: client.kvk_number || '',
      nip_number: client.nip_number || ''
    }));
  }, [clients]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    country: 'PL',
    client_type: 'company' as 'individual' | 'company',
    vat_number: '',
    kvk_number: '',
    nip_number: '',
    email: '',
    phone: '',
    notes: '',
  });

  const [kvkLoading, setKvkLoading] = useState(false);
  const [kvkResults, setKvkResults] = useState<any[]>([]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return migratedClients || [];
    const term = searchTerm.toLowerCase();
    return (migratedClients || []).filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.vat_number.toLowerCase().includes(term) ||
        (c.nip_number && c.nip_number.toLowerCase().includes(term))
    );
  }, [migratedClients, searchTerm]);

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        address: client.address,
        country: client.country || 'PL',
        client_type: client.client_type || 'company',
        vat_number: client.vat_number,
        kvk_number: client.kvk_number || '',
        nip_number: client.nip_number || '',
        email: client.email,
        phone: client.phone,
        notes: client.notes,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        address: '',
        country: 'PL',
        client_type: 'company',
        vat_number: '',
        kvk_number: '',
        nip_number: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    console.log('Saving client data:', formData); // Debug

    if (!formData.name) {
      toast.error('Nazwa jest wymagana');
      return;
    }

    try {
      if (editingClient) {
        console.log('Updating client:', editingClient.id, formData); // Debug
        await updateClient(editingClient.id, formData);
        toast.success('Klient zaktualizowany');
      } else {
        console.log('Creating new client:', formData); // Debug
        await createClient(formData);
        toast.success('Klient utworzony');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Save error:', error); // Debug
      toast.error('Błąd zapisu klienta: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('clients.confirmDelete'))) {
      try {
        await deleteClient(id);
        toast.success('Client deleted');
      } catch (error) {
        toast.error('Error deleting client');
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className={`max-w-7xl mx-auto ${isMobile ? 'p-3 space-y-4' : 'p-6 space-y-8'}`}>
        {/* Modern Header - Responsive */}
        <div className={`relative overflow-hidden ${isMobile ? 'rounded-2xl p-4' : 'rounded-3xl p-8'} bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-2xl`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className={`relative ${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold tracking-tight mb-2`}>
                👥 {t('clients.title')}
              </h1>
              {!isMobile && <p className="text-teal-100 text-lg">Zarządzaj bazą danych klientów</p>}
            </div>
            <button
              onClick={() => handleOpenDialog()}
              className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'px-8 py-4 text-lg'} bg-linear-to-r from-orange-500 to-red-600 text-white rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-xl`}
            >
              <Plus className="inline mr-2" size={isMobile ? 20 : 24} />
              {t('clients.newClient')}
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Modern Clients Card */}
        <div className={`relative overflow-hidden ${isMobile ? 'rounded-xl' : 'rounded-2xl'} bg-white/80 backdrop-blur-sm border border-white/30 shadow-2xl`}>
          <div className="absolute inset-0 bg-linear-to-br from-slate-500/5 to-gray-500/5"></div>
          <div className={`relative ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-4' : 'mb-6'}`}>
              <div>
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{t('clients.title')}</h2>
                {!isMobile && <p className="text-gray-600">Wszyscy klienci w systemie</p>}
              </div>
              <div className={`${isMobile ? 'p-2' : 'p-3'} bg-teal-100 rounded-xl`}>
                <Users className="text-teal-600" size={isMobile ? 20 : 24} />
              </div>
            </div>

            {/* Modern Search */}
            <div className={isMobile ? 'mb-4' : 'mb-6'}>
              <div className="relative">
                <Input
                  placeholder={t('clients.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${isMobile ? 'w-full' : 'w-full max-w-md'} bg-white/60 backdrop-blur-sm border-2 border-teal-200 focus:border-teal-500 rounded-xl`}
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className={`${isMobile ? 'p-4' : 'p-6'} bg-linear-to-br from-teal-100 to-cyan-100 rounded-3xl inline-block mb-6 animate-pulse`}>
                  <Users className="text-teal-600" size={isMobile ? 48 : 64} />
                </div>
                <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-3`}>Ładowanie klientów...</h3>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-16">
                <div className={`${isMobile ? 'p-4' : 'p-6'} bg-linear-to-br from-teal-100 to-cyan-100 rounded-3xl inline-block mb-6`}>
                  <Users className="text-teal-600" size={isMobile ? 48 : 64} />
                </div>
                <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-3`}>{t('clients.noClients')}</h3>
                <p className={`text-gray-600 mb-6 ${isMobile ? 'text-base' : 'text-lg'}`}>{t('clients.addFirst')}</p>
                <button
                  onClick={() => handleOpenDialog()}
                  className={`${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'} bg-linear-to-r from-teal-600 to-cyan-600 text-white rounded-2xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 font-bold shadow-xl`}
                >
                  <Plus className="inline mr-2" size={20} />
                  {t('clients.newClient')}
                </button>
              </div>
            ) : (
              <>
                {/* MOBILE VIEW - Cards */}
                {isMobile ? (
                  <div className="space-y-3">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="group relative overflow-hidden rounded-xl bg-white/80 backdrop-blur-sm border border-white/50 p-4 hover:bg-white/90 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-linear-to-r from-teal-500/5 to-cyan-500/5 group-hover:from-teal-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
                        <div className="relative space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-bold text-lg text-gray-900 mb-1">{client.name}</div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={client.client_type === 'company' ? 'default' : 'secondary'} className="bg-teal-100 text-teal-800 text-xs">
                                  {client.client_type === 'company' ? (
                                    <><Buildings className="mr-1 pointer-events-none" size={12} /> Firma</>
                                  ) : (
                                    <><User className="mr-1 pointer-events-none" size={12} /> Prywatny</>
                                  )}
                                </Badge>
                                <span className="text-sm text-gray-600">{COUNTRIES[client.country as keyof typeof COUNTRIES] || client.country || 'PL'}</span>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Menu">
                                  <DotsThreeVertical className="pointer-events-none" size={20} weight="bold" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                                  <PencilSimple className="mr-2 pointer-events-none" size={16} />
                                  Edytuj
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(client.id)} className="text-red-600">
                                  <Trash className="mr-2 pointer-events-none" size={16} />
                                  Usuń
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="text-gray-600">{client.email}</div>
                            <div className="text-gray-600">{client.phone}</div>
                            {(client.nip_number || client.vat_number) && (
                              <div className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
                                {client.country === 'PL' && client.nip_number ? client.nip_number : client.vat_number}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-teal-200/20 rounded-full blur-lg group-hover:bg-cyan-200/30 transition-all duration-300"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* DESKTOP VIEW - Table */
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {/* Modern Table Header */}
                      <div className="grid grid-cols-7 gap-4 p-4 bg-linear-to-r from-slate-100 to-gray-100 rounded-t-xl border-b border-gray-200">
                        <div className="font-bold text-gray-700">{t('clients.name')}</div>
                        <div className="font-bold text-gray-700">{t('clients.clientType')}</div>
                        <div className="font-bold text-gray-700">{t('clients.country')}</div>
                        <div className="font-bold text-gray-700">{t('clients.email')}</div>
                        <div className="font-bold text-gray-700">{t('clients.phone')}</div>
                        <div className="font-bold text-gray-700">BTW/NIP</div>
                        <div className="font-bold text-gray-700 text-right">{t('clients.actions')}</div>
                      </div>

                      {/* Modern Table Body */}
                      <div className="space-y-2 p-2">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 p-4 hover:bg-white/80 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                          >
                            <div className="absolute inset-0 bg-linear-to-r from-teal-500/5 to-cyan-500/5 group-hover:from-teal-500/10 group-hover:to-cyan-500/10 transition-all duration-300"></div>
                            <div className="relative grid grid-cols-7 gap-4 items-center">
                              <div className="font-bold text-gray-900">{client.name}</div>
                              <div>
                                <Badge variant={client.client_type === 'company' ? 'default' : 'secondary'} className="bg-teal-100 text-teal-800">
                                  {client.client_type === 'company' ? (
                                    <><Buildings className="mr-1 pointer-events-none" size={14} /> Firma</>
                                  ) : (
                                    <><User className="mr-1 pointer-events-none" size={14} /> Prywatny</>
                                  )}
                                </Badge>
                              </div>
                              <div className="font-medium text-gray-800">{COUNTRIES[client.country as keyof typeof COUNTRIES] || client.country || 'PL'}</div>
                              <div className="text-gray-600">{client.email}</div>
                              <div className="text-gray-600">{client.phone}</div>
                              <div className="font-mono text-sm text-gray-800">
                                {client.country === 'PL' && client.nip_number ? client.nip_number : client.vat_number}
                              </div>
                              <div className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenDialog(client)}
                                    className="p-2 bg-teal-100 hover:bg-teal-200 rounded-xl transition-colors duration-200"
                                    title="Edit client"
                                  >
                                    <PencilSimple className="text-teal-600 pointer-events-none" size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(client.id)}
                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors duration-200"
                                    title="Delete client"
                                  >
                                    <Trash className="text-red-600 pointer-events-none" size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-teal-200/20 rounded-full blur-xl group-hover:bg-cyan-200/30 transition-all duration-300"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? t('clients.edit') : t('clients.newClient')}
            </DialogTitle>
            <DialogDescription>
              {editingClient ? 'Edit client information' : 'Add a new client to your database'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('clients.name')} *</Label>
              <div className="flex gap-2">
                <Input
                  id="name"
                  placeholder="Kogbox Waterinstallaties / Jan Kowalski"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!formData.name || formData.name.trim().length < 3) {
                      toast.error('Wpisz co najmniej 3 znaki nazwy, aby wyszukać w KVK');
                      return;
                    }

                    try {
                      setKvkLoading(true);
                      setKvkResults([]);
                      const res = await window.electronAPI?.kvk?.search?.(formData.name);
                      if (!res) {
                        toast.error('Brak odpowiedzi z API KVK');
                        return;
                      }
                      if (!res.ok) {
                        toast.error('KVK error: ' + (res.error || JSON.stringify(res)));
                        return;
                      }

                      const items = res.items || [];
                      if (items.length === 0) {
                        toast.error('Nie znaleziono firmy w KVK');
                      } else if (items.length === 1) {
                        const it = items[0];
                        const addr = it.address;
                        let addressStr = '';
                        if (addr) {
                          if (typeof addr === 'string') addressStr = addr;
                          else if (addr.street || addr.road) {
                            addressStr = `${addr.street || addr.road} ${addr.houseNumber || ''}, ${addr.postalCode || addr.postcode || ''} ${addr.city || addr.place || ''}`.trim();
                          } else {
                            addressStr = JSON.stringify(addr);
                          }
                        }

                        setFormData({
                          ...formData,
                          name: it.name || formData.name,
                          address: addressStr || formData.address,
                          kvk_number: it.kvkNumber || it.kvk || formData.kvk_number,
                          vat_number: formData.vat_number || '',
                          phone: it.phone || it.telefoon || formData.phone,
                          email: it.email || formData.email,
                        });

                        toast.success('Dane uzupełnione z KVK');
                      } else {
                        setKvkResults(items);
                        toast('Znaleziono kilka wyników, wybierz jedną pozycję z listy');
                      }
                    } catch (err) {
                      console.error('KVK search error', err);
                      toast.error('Błąd wyszukiwania KVK');
                    } finally {
                      setKvkLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                >
                  {kvkLoading ? 'Szukam...' : 'Szukaj w KVK'}
                </button>
              </div>
              {kvkResults.length > 0 && (
                <div className="mt-2 space-y-2">
                  {kvkResults.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-md border">
                      <div>
                        <div className="font-semibold">{r.name}</div>
                        <div className="text-sm text-gray-600">KVK: {r.kvkNumber || r.kvk || '-'}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const it = r;
                            const addr = it.address;
                            let addressStr = '';
                            if (addr) {
                              if (typeof addr === 'string') addressStr = addr;
                              else if (addr.street || addr.road) {
                                addressStr = `${addr.street || addr.road} ${addr.houseNumber || ''}, ${addr.postalCode || addr.postcode || ''} ${addr.city || addr.place || ''}`.trim();
                              } else {
                                addressStr = JSON.stringify(addr);
                              }
                            }

                            setFormData({
                              ...formData,
                              name: it.name || formData.name,
                              address: addressStr || formData.address,
                              kvk_number: it.kvkNumber || it.kvk || formData.kvk_number,
                              phone: it.phone || it.telefoon || formData.phone,
                              email: it.email || formData.email,
                            });
                            setKvkResults([]);
                            toast.success('Wybrano firmę z KVK i uzupełniono pola');
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-md"
                        >
                          Wybierz
                        </button>
                        <button onClick={() => setKvkResults([])} className="px-3 py-1 bg-gray-200 rounded-md">Anuluj</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_type">{t('clients.clientType')} *</Label>
                <Select
                  value={formData.client_type}
                  onValueChange={(value: 'individual' | 'company') =>
                    setFormData({ ...formData, client_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company">
                      🏢 {t('clients.company')}
                    </SelectItem>
                    <SelectItem value="individual">
                      👤 {t('clients.individual')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t('clients.country')} *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRIES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {code === 'Other' ? name : `${name} (${code})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('clients.address')} *</Label>
              <Textarea
                id="address"
                placeholder="Straatweg 20, 3131 CR Vlaardiingen, Nederland"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('clients.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@kogbox.nl"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('clients.phone')}</Label>
                <Input
                  id="phone"
                  placeholder="+31 6 12345678 / +48 123 456 789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Dynamiczne pola podatkowe w zależności od kraju */}
            {formData.country === 'PL' && (
              <div className="space-y-2">
                <Label htmlFor="nip_number">{t('clients.nipNumber')} (NIP)</Label>
                <Input
                  id="nip_number"
                  placeholder="123-456-78-90"
                  value={formData.nip_number}
                  onChange={(e) => setFormData({ ...formData, nip_number: e.target.value })}
                />
              </div>
            )}

            {formData.country === 'NL' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kvk_number">{t('clients.kvkNumber')} (KVK)</Label>
                  <Input
                    id="kvk_number"
                    placeholder="12345678"
                    value={formData.kvk_number}
                    onChange={(e) => setFormData({ ...formData, kvk_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vat_number">{t('clients.vatNumber')} (BTW)</Label>
                  <Input
                    id="vat_number"
                    placeholder="NL003314048B23"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                  />
                </div>
              </div>
            )}

            {formData.country !== 'PL' && formData.country !== 'NL' && (
              <div className="space-y-2">
                <Label htmlFor="vat_number">{t('clients.vatNumber')} (VAT/BTW)</Label>
                <Input
                  id="vat_number"
                  placeholder="DE123456789 / FR12345678901"
                  value={formData.vat_number}
                  onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">{t('clients.notes')}</Label>
              <Textarea
                id="notes"
                placeholder="Aanvullende informatie over de klant..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('clients.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('clients.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
