"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// API dla React - bezpieczny dostęp do Electron funkcjonalności
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Database API
    database: {
        // Invoices
        getInvoices: () => electron_1.ipcRenderer.invoke('db:get-invoices'),
        createInvoice: (invoice) => electron_1.ipcRenderer.invoke('db:create-invoice', invoice),
        updateInvoice: (id, invoice) => electron_1.ipcRenderer.invoke('db:update-invoice', id, invoice),
        deleteInvoice: (id) => electron_1.ipcRenderer.invoke('db:delete-invoice', id),
        // Clients
        getClients: () => electron_1.ipcRenderer.invoke('db:get-clients'),
        createClient: (client) => electron_1.ipcRenderer.invoke('db:create-client', client),
        updateClient: (id, client) => electron_1.ipcRenderer.invoke('db:update-client', id, client),
        deleteClient: (id) => electron_1.ipcRenderer.invoke('db:delete-client', id),
        // Products
        getProducts: () => electron_1.ipcRenderer.invoke('db:get-products'),
        createProduct: (product) => electron_1.ipcRenderer.invoke('db:create-product', product),
        updateProduct: (id, product) => electron_1.ipcRenderer.invoke('db:update-product', id, product),
        deleteProduct: (id) => electron_1.ipcRenderer.invoke('db:delete-product', id),
        // Company
        getCompany: () => electron_1.ipcRenderer.invoke('db:get-company'),
        updateCompany: (company) => electron_1.ipcRenderer.invoke('db:update-company', company),
    },
    // File System API
    fileSystem: {
        savePDF: (filename, buffer) => electron_1.ipcRenderer.invoke('fs:save-pdf', filename, buffer),
        saveCompanyLogo: (filename, data) => electron_1.ipcRenderer.invoke('fs:save-company-logo', filename, data),
        getCompanyLogoPath: (filename) => electron_1.ipcRenderer.invoke('fs:get-company-logo-path', filename),
        openDocumentsFolder: () => electron_1.ipcRenderer.invoke('fs:open-documents-folder'),
        exportCSV: (filename, data) => electron_1.ipcRenderer.invoke('fs:export-csv', filename, data),
        exportExcel: (filename, data) => electron_1.ipcRenderer.invoke('fs:export-excel', filename, data),
    },
    // KVK lookup
    kvk: {
        search: (query) => electron_1.ipcRenderer.invoke('kvk:search', query)
    },
    kvkScrape: {
        scrape: (url) => electron_1.ipcRenderer.invoke('kvk:scrape', url)
    },
    // Backup API
    backup: {
        create: (path) => electron_1.ipcRenderer.invoke('backup:create', path),
        restore: (backupPath) => electron_1.ipcRenderer.invoke('backup:restore', backupPath),
        list: () => electron_1.ipcRenderer.invoke('backup:list'),
        autoBackup: () => electron_1.ipcRenderer.invoke('backup:auto-backup'),
    },
    // Dialog API
    dialog: {
        showSaveDialog: (options) => electron_1.ipcRenderer.invoke('dialog:show-save-dialog', options),
        showOpenDialog: (options) => electron_1.ipcRenderer.invoke('dialog:show-open-dialog', options),
    },
    // Build API
    build: {
        createInstaller: () => electron_1.ipcRenderer.invoke('build:create-installer'),
        openInstallerFolder: () => electron_1.ipcRenderer.invoke('build:open-installer-folder'),
    },
    // System API
    getNetworkAddress: () => electron_1.ipcRenderer.invoke('system:get-network-address'),
    copyToClipboard: (text) => electron_1.ipcRenderer.invoke('system:copy-to-clipboard'),
    // Menu Events
    onMenuAction: (callback) => {
        electron_1.ipcRenderer.on('menu:new-invoice', () => callback('new-invoice'));
        // Cleanup function
        return () => {
            electron_1.ipcRenderer.removeAllListeners('menu:new-invoice');
        };
    },
    // App Info
    isElectron: true,
    version: process.env.npm_package_version || '1.0.0',
    platform: process.platform,
});
