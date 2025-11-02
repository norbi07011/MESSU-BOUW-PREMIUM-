import { contextBridge, ipcRenderer } from 'electron';

// API dla React - bezpieczny dostęp do Electron funkcjonalności
contextBridge.exposeInMainWorld('electronAPI', {
  // Database API
  database: {
    // Invoices
    getInvoices: () => ipcRenderer.invoke('db:get-invoices'),
    createInvoice: (invoice: any) => ipcRenderer.invoke('db:create-invoice', invoice),
    updateInvoice: (id: string, invoice: any) => ipcRenderer.invoke('db:update-invoice', id, invoice),
    deleteInvoice: (id: string) => ipcRenderer.invoke('db:delete-invoice', id),

    // Clients
    getClients: () => ipcRenderer.invoke('db:get-clients'),
    createClient: (client: any) => ipcRenderer.invoke('db:create-client', client),
    updateClient: (id: string, client: any) => ipcRenderer.invoke('db:update-client', id, client),
    deleteClient: (id: string) => ipcRenderer.invoke('db:delete-client', id),

    // Products
    getProducts: () => ipcRenderer.invoke('db:get-products'),
    createProduct: (product: any) => ipcRenderer.invoke('db:create-product', product),
    updateProduct: (id: string, product: any) => ipcRenderer.invoke('db:update-product', id, product),
    deleteProduct: (id: string) => ipcRenderer.invoke('db:delete-product', id),

    // Company
    getCompany: () => ipcRenderer.invoke('db:get-company'),
    updateCompany: (company: any) => ipcRenderer.invoke('db:update-company', company),
  },

  // File System API
  fileSystem: {
    savePDF: (filename: string, buffer: ArrayBuffer) => ipcRenderer.invoke('fs:save-pdf', filename, buffer),
    saveCompanyLogo: (filename: string, data: Uint8Array) => ipcRenderer.invoke('fs:save-company-logo', filename, data),
    getCompanyLogoPath: (filename: string) => ipcRenderer.invoke('fs:get-company-logo-path', filename),
    openDocumentsFolder: () => ipcRenderer.invoke('fs:open-documents-folder'),
    exportCSV: (filename: string, data: any) => ipcRenderer.invoke('fs:export-csv', filename, data),
    exportExcel: (filename: string, data: any) => ipcRenderer.invoke('fs:export-excel', filename, data),
  },

  // KVK lookup
  kvk: {
    search: (query: string) => ipcRenderer.invoke('kvk:search', query)
  },
  kvkScrape: {
    scrape: (url: string) => ipcRenderer.invoke('kvk:scrape', url)
  },

  // Backup API
  backup: {
    create: (path?: string) => ipcRenderer.invoke('backup:create', path),
    restore: (backupPath: string) => ipcRenderer.invoke('backup:restore', backupPath),
    list: () => ipcRenderer.invoke('backup:list'),
    autoBackup: () => ipcRenderer.invoke('backup:auto-backup'),
  },

  // Dialog API
  dialog: {
    showSaveDialog: (options: any) => ipcRenderer.invoke('dialog:show-save-dialog', options),
    showOpenDialog: (options: any) => ipcRenderer.invoke('dialog:show-open-dialog', options),
  },

  // Build API
  build: {
    createInstaller: () => ipcRenderer.invoke('build:create-installer'),
    openInstallerFolder: () => ipcRenderer.invoke('build:open-installer-folder'),
  },

  // System API
  getNetworkAddress: () => ipcRenderer.invoke('system:get-network-address'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('system:copy-to-clipboard'),

  // Menu Events
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu:new-invoice', () => callback('new-invoice'));

    // Cleanup function
    return () => {
      ipcRenderer.removeAllListeners('menu:new-invoice');
    };
  },

  // App Info
  isElectron: true,
  version: process.env.npm_package_version || '1.0.0',
  platform: process.platform,
});

// Types dla TypeScript
export interface ElectronAPI {
  database: {
    getInvoices: () => Promise<any[]>;
    createInvoice: (invoice: any) => Promise<any>;
    updateInvoice: (id: string, invoice: any) => Promise<any>;
    deleteInvoice: (id: string) => Promise<boolean>;
    getClients: () => Promise<any[]>;
    createClient: (client: any) => Promise<any>;
    updateClient: (id: string, client: any) => Promise<any>;
    deleteClient: (id: string) => Promise<boolean>;
    getProducts: () => Promise<any[]>;
    createProduct: (product: any) => Promise<any>;
    updateProduct: (id: string, product: any) => Promise<any>;
    deleteProduct: (id: string) => Promise<boolean>;
    getCompany: () => Promise<any>;
    updateCompany: (company: any) => Promise<any>;
  };
  fileSystem: {
    savePDF: (filename: string, buffer: ArrayBuffer) => Promise<string>;
    saveCompanyLogo: (filename: string, data: Uint8Array) => Promise<string>;
    getCompanyLogoPath: (filename: string) => Promise<string>;
    openDocumentsFolder: () => Promise<void>;
    exportCSV: (filename: string, data: any) => Promise<string>;
    exportExcel: (filename: string, data: any) => Promise<string>;
  };
  backup: {
    create: (path?: string) => Promise<string>;
    restore: (backupPath: string) => Promise<boolean>;
    list: () => Promise<any[]>;
    autoBackup: () => Promise<string>;
  };
  dialog: {
    showSaveDialog: (options: any) => Promise<any>;
    showOpenDialog: (options: any) => Promise<any>;
  };
  build: {
    createInstaller: () => Promise<boolean>;
    openInstallerFolder: () => Promise<void>;
  };
  getNetworkAddress: () => Promise<string>;
  copyToClipboard: (text: string) => Promise<void>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  isElectron: boolean;
  version: string;
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}