import { useState, useEffect, useCallback } from 'react';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Sprawdź czy działamy w Electron
const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron;
};

// Sprawdź czy działamy na urządzeniu mobilnym (Capacitor)
const isMobile = () => {
  return Capacitor.isNativePlatform();
};

// Uniwersalna funkcja do odczytu z storage
const getStorageItem = async (key: string): Promise<string | null> => {
  if (isMobile()) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
};

// Uniwersalna funkcja do zapisu do storage
const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (isMobile()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
};

// Mock storage dla fallback gdy nie ma Electron
const mockStorage = {
  store: new Map<string, any>(),
  getItem: (key: string) => {
    const item = mockStorage.store.get(key);
    return item ? JSON.stringify(item) : null;
  },
  setItem: (key: string, value: string) => {
    try {
      mockStorage.store.set(key, JSON.parse(value));
    } catch {
      mockStorage.store.set(key, value);
    }
  },
  removeItem: (key: string) => {
    mockStorage.store.delete(key);
  }
};

// Hook dla bazy danych (zamiennik useKV)
export function useElectronDB<T>(
  key: string,
  defaultValue: T,
  entityType?: 'invoices' | 'clients' | 'products' | 'company'
): [T, (value: T) => Promise<void>, boolean] {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Funkcja do pobierania danych
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        let result: any;
        
        switch (entityType) {
          case 'invoices':
            result = await window.electronAPI.database.getInvoices();
            break;
          case 'clients':
            result = await window.electronAPI.database.getClients();
            break;
          case 'products':
            result = await window.electronAPI.database.getProducts();
            break;
          case 'company':
            result = await window.electronAPI.database.getCompany();
            break;
          default:
            // Fallback na localStorage
            const stored = localStorage.getItem(key) || mockStorage.getItem(key);
            result = stored ? JSON.parse(stored) : defaultValue;
        }
        
        setData(result || defaultValue);
      } else if (isMobile()) {
        // Użyj Capacitor Preferences na urządzeniach mobilnych
        const { value } = await Preferences.get({ key });
        if (value) {
          try {
            setData(JSON.parse(value));
          } catch {
            setData(defaultValue);
          }
        } else {
          setData(defaultValue);
        }
      } else {
        // Fallback na localStorage w przeglądarce
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            setData(JSON.parse(stored));
          } catch {
            setData(defaultValue);
          }
        } else {
          setData(defaultValue);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      setData(defaultValue);
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue, entityType]);

  // Funkcja do zapisywania danych
  const updateData = useCallback(async (newValue: T) => {
    try {
      if (isElectron() && window.electronAPI && entityType) {
        // Zapisz do Electron SQLite
        switch (entityType) {
          case 'company':
            if (newValue) {
              await window.electronAPI.database.updateCompany(newValue);
            }
            break;
          // Inne typy będą obsługiwane przez dedykowane funkcje CRUD
          default:
            console.warn(`Direct update not supported for ${entityType}, use specific CRUD functions`);
        }
      } else if (isMobile()) {
        // Użyj Capacitor Preferences na urządzeniach mobilnych
        await Preferences.set({
          key,
          value: JSON.stringify(newValue)
        });
      } else {
        // Fallback na localStorage w przeglądarce
        localStorage.setItem(key, JSON.stringify(newValue));
      }
      
      setData(newValue);
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      throw error;
    }
  }, [key, entityType]);

  // Ładuj dane przy mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [data, updateData, loading];
}

// Hook dla CRUD operacji na fakturach
export function useInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getInvoices();
        setInvoices(result || []);
      } else if (isMobile()) {
        // Użyj Capacitor Preferences na urządzeniach mobilnych
        const { value } = await Preferences.get({ key: 'invoices' });
        setInvoices(value ? JSON.parse(value) : []);
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        setInvoices(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = useCallback(async (invoice: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.createInvoice(invoice);
        await fetchInvoices(); // Odśwież listę
        return result;
      } else if (isMobile()) {
        // Użyj Capacitor Preferences na urządzeniach mobilnych
        const { value } = await Preferences.get({ key: 'invoices' });
        const invoices = value ? JSON.parse(value) : [];
        const newInvoice = { ...invoice, id: Date.now().toString() };
        const updated = [...invoices, newInvoice];
        await Preferences.set({ key: 'invoices', value: JSON.stringify(updated) });
        await fetchInvoices();
        return newInvoice;
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        const invoices = stored ? JSON.parse(stored) : [];
        const newInvoice = { ...invoice, id: Date.now().toString() };
        const updated = [...invoices, newInvoice];
        localStorage.setItem('invoices', JSON.stringify(updated));
        await fetchInvoices();
        return newInvoice;
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }, [fetchInvoices]);

  const updateInvoice = useCallback(async (id: string, invoice: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateInvoice(id, invoice);
        await fetchInvoices();
        return result;
      } else if (isMobile()) {
        // Użyj Capacitor Preferences na urządzeniach mobilnych
        const { value } = await Preferences.get({ key: 'invoices' });
        const invoices = value ? JSON.parse(value) : [];
        const updated = invoices.map((inv: any) => inv.id === id ? { ...inv, ...invoice } : inv);
        await Preferences.set({ key: 'invoices', value: JSON.stringify(updated) });
        await fetchInvoices();
        return invoice;
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        const invoices = stored ? JSON.parse(stored) : [];
        const updated = invoices.map((inv: any) => inv.id === id ? { ...inv, ...invoice } : inv);
        localStorage.setItem('invoices', JSON.stringify(updated));
        await fetchInvoices();
        return invoice;
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  }, [fetchInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.deleteInvoice(id);
        await fetchInvoices();
        return result;
      } else if (isMobile()) {
        // Użyj Capacitor Preferences na urządzeniach mobilnych
        const { value } = await Preferences.get({ key: 'invoices' });
        const invoices = value ? JSON.parse(value) : [];
        const updated = invoices.filter((inv: any) => inv.id !== id);
        await Preferences.set({ key: 'invoices', value: JSON.stringify(updated) });
        await fetchInvoices();
        return true;
      } else {
        // Fallback na localStorage
        const stored = localStorage.getItem('invoices');
        const invoices = stored ? JSON.parse(stored) : [];
        const updated = invoices.filter((inv: any) => inv.id !== id);
        localStorage.setItem('invoices', JSON.stringify(updated));
        await fetchInvoices();
        return true;
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }, [fetchInvoices]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refetch: fetchInvoices
  };
}

// Hook dla klientów
export function useClients() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getClients();
        setClients(result || []);
      } else {
        const stored = await getStorageItem('clients');
        setClients(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (client: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.createClient(client);
        await fetchClients();
        return result;
      } else {
        const stored = await getStorageItem('clients');
        const clients = stored ? JSON.parse(stored) : [];
        const newClient = { ...client, id: Date.now().toString() };
        const updated = [...clients, newClient];
        await setStorageItem('clients', JSON.stringify(updated));
        await fetchClients();
        return newClient;
      }
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }, [fetchClients]);

  const updateClient = useCallback(async (id: string, client: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateClient(id, client);
        await fetchClients();
        return result;
      } else {
        const stored = await getStorageItem('clients');
        const clients = stored ? JSON.parse(stored) : [];
        const updated = clients.map((cli: any) => cli.id === id ? { ...cli, ...client } : cli);
        await setStorageItem('clients', JSON.stringify(updated));
        await fetchClients();
        return client;
      }
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }, [fetchClients]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.deleteClient(id);
        await fetchClients();
        return result;
      } else {
        const stored = await getStorageItem('clients');
        const clients = stored ? JSON.parse(stored) : [];
        const updated = clients.filter((cli: any) => cli.id !== id);
        await setStorageItem('clients', JSON.stringify(updated));
        await fetchClients();
        return true;
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }, [fetchClients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
}

// Hook dla produktów
export function useProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getProducts();
        setProducts(result || []);
      } else {
        const stored = await getStorageItem('products');
        setProducts(stored ? JSON.parse(stored) : []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (product: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.createProduct(product);
        await fetchProducts();
        return result;
      } else {
        const stored = await getStorageItem('products');
        const products = stored ? JSON.parse(stored) : [];
        const newProduct = { ...product, id: Date.now().toString() };
        const updated = [...products, newProduct];
        await setStorageItem('products', JSON.stringify(updated));
        await fetchProducts();
        return newProduct;
      }
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: string, product: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateProduct(id, product);
        await fetchProducts();
        return result;
      } else {
        const stored = await getStorageItem('products');
        const products = stored ? JSON.parse(stored) : [];
        const updated = products.map((prod: any) => prod.id === id ? { ...prod, ...product } : prod);
        await setStorageItem('products', JSON.stringify(updated));
        await fetchProducts();
        return product;
      }
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.deleteProduct(id);
        await fetchProducts();
        return result;
      } else {
        const stored = await getStorageItem('products');
        const products = stored ? JSON.parse(stored) : [];
        const updated = products.filter((prod: any) => prod.id !== id);
        await setStorageItem('products', JSON.stringify(updated));
        await fetchProducts();
        return true;
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
}

// Hook dla firmy
export function useCompany() {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.getCompany();
        setCompany(result);
      } else {
        const stored = await getStorageItem('company');
        setCompany(stored ? JSON.parse(stored) : null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (companyData: any) => {
    try {
      if (isElectron() && window.electronAPI) {
        const result = await window.electronAPI.database.updateCompany(companyData);
        setCompany(result);
        return result;
      } else {
        await setStorageItem('company', JSON.stringify(companyData));
        setCompany(companyData);
        return companyData;
      }
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    loading,
    updateCompany,
    refetch: fetchCompany
  };
}

// Hook dla file system operacji
export function useFileSystem() {
  const savePDF = useCallback(async (filename: string, buffer: ArrayBuffer) => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.savePDF(filename, buffer);
    } else {
      // Fallback - pobierz plik
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return filename;
    }
  }, []);

  const openDocumentsFolder = useCallback(async () => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.openDocumentsFolder();
    } else {
      console.log('Documents folder opening not available in browser');
    }
  }, []);

  const exportCSV = useCallback(async (filename: string, data: any) => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.exportCSV(filename, data);
    } else {
      // Browser fallback
      const csv = convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return filename;
    }
  }, []);

  const exportExcel = useCallback(async (filename: string, data: any) => {
    if (isElectron() && window.electronAPI) {
      return await window.electronAPI.fileSystem.exportExcel(filename, data);
    } else {
      console.log('Excel export not available in browser');
      return '';
    }
  }, []);

  return {
    savePDF,
    openDocumentsFolder,
    exportCSV,
    exportExcel
  };
}

// Pomocnicza funkcja do konwersji na CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ];
  
  return '\uFEFF' + csvRows.join('\n'); // BOM dla polskich znaków
}
