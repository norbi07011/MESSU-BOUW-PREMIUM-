"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupService = exports.fsService = exports.dbService = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const database_1 = require("./database");
const filesystem_1 = require("./filesystem");
const backup_1 = require("./backup");
let mainWindow = null;
let dbService;
let fsService;
let backupService;
const createWindow = () => {
    // Stwórz główne okno aplikacji
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path_1.default.join(__dirname, 'preload.js'),
            webSecurity: !electron_is_dev_1.default,
        },
        icon: path_1.default.join(__dirname, '../assets/icon.png'),
        title: 'NORBS Fakturowanie - Aplikacja Lokalna',
        titleBarStyle: 'default',
        show: false,
        autoHideMenuBar: true,
    });
    // URL aplikacji
    const startUrl = electron_is_dev_1.default
        ? 'http://localhost:5000'
        : `file://${path_1.default.join(__dirname, '../dist/index.html')}`;
    mainWindow.loadURL(startUrl);
    // Pokaż okno gdy gotowe
    mainWindow.once('ready-to-show', () => {
        if (mainWindow) {
            mainWindow.show();
            if (electron_is_dev_1.default) {
                mainWindow.webContents.openDevTools();
            }
        }
    });
    // Obsługa zamknięcia okna
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Obsługa linków zewnętrznych
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
};
// Inicjalizacja aplikacji
electron_1.app.whenReady().then(async () => {
    // Inicjalizuj serwisy
    exports.dbService = dbService = new database_1.DatabaseService();
    exports.fsService = fsService = new filesystem_1.FileSystemService();
    exports.backupService = backupService = new backup_1.BackupService(dbService, fsService);
    // Utwórz okno
    createWindow();
    // macOS - ponowne otworzenie okna
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
    // Stwórz menu aplikacji
    createMenu();
});
// Zamknięcie aplikacji
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Bezpieczeństwo - zapobieganie otwieraniu nowych okien
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
});
// IPC Handlers - komunikacja z React
electron_1.ipcMain.handle('db:get-invoices', async () => {
    return dbService.getInvoices();
});
electron_1.ipcMain.handle('db:create-invoice', async (event, invoice) => {
    return dbService.createInvoice(invoice);
});
electron_1.ipcMain.handle('db:update-invoice', async (event, id, invoice) => {
    return dbService.updateInvoice(id, invoice);
});
electron_1.ipcMain.handle('db:delete-invoice', async (event, id) => {
    return dbService.deleteInvoice(id);
});
electron_1.ipcMain.handle('db:get-clients', async () => {
    return dbService.getClients();
});
electron_1.ipcMain.handle('db:create-client', async (event, client) => {
    return dbService.createClient(client);
});
electron_1.ipcMain.handle('db:update-client', async (event, id, client) => {
    return dbService.updateClient(id, client);
});
electron_1.ipcMain.handle('db:delete-client', async (event, id) => {
    return dbService.deleteClient(id);
});
electron_1.ipcMain.handle('db:get-products', async () => {
    return dbService.getProducts();
});
electron_1.ipcMain.handle('db:create-product', async (event, product) => {
    return dbService.createProduct(product);
});
electron_1.ipcMain.handle('db:update-product', async (event, id, product) => {
    return dbService.updateProduct(id, product);
});
electron_1.ipcMain.handle('db:delete-product', async (event, id) => {
    return dbService.deleteProduct(id);
});
electron_1.ipcMain.handle('db:get-company', async () => {
    return dbService.getCompany();
});
electron_1.ipcMain.handle('db:update-company', async (event, company) => {
    return dbService.updateCompany(company);
});
// File System Handlers
electron_1.ipcMain.handle('fs:save-pdf', async (event, filename, buffer) => {
    return fsService.savePDF(filename, buffer);
});
electron_1.ipcMain.handle('fs:open-documents-folder', async () => {
    return fsService.openDocumentsFolder();
});
electron_1.ipcMain.handle('fs:export-csv', async (event, filename, data) => {
    return fsService.exportCSV(filename, data);
});
electron_1.ipcMain.handle('fs:export-excel', async (event, filename, data) => {
    return fsService.exportExcel(filename, data);
});
// Backup Handlers
electron_1.ipcMain.handle('backup:create', async () => {
    return backupService.createBackup();
});
electron_1.ipcMain.handle('backup:restore', async (event, backupPath) => {
    return backupService.restoreBackup(backupPath);
});
electron_1.ipcMain.handle('backup:list', async () => {
    return backupService.listBackups();
});
electron_1.ipcMain.handle('backup:auto-backup', async () => {
    return backupService.autoBackup();
});
// Dialog Handlers
electron_1.ipcMain.handle('dialog:show-save-dialog', async (event, options) => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showSaveDialog(mainWindow, options);
    return result;
});
electron_1.ipcMain.handle('dialog:show-open-dialog', async (event, options) => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showOpenDialog(mainWindow, options);
    return result;
});
// Build Handlers
electron_1.ipcMain.handle('build:create-installer', async () => {
    try {
        const { execSync } = require('child_process');
        const path = require('path');
        // Get the app root directory
        const appRoot = electron_1.app.isPackaged
            ? path.dirname(electron_1.app.getPath('exe'))
            : path.join(__dirname, '..');
        // Run electron-builder
        execSync('npm run dist', {
            cwd: appRoot,
            stdio: 'inherit'
        });
        return true;
    }
    catch (error) {
        console.error('Build installer error:', error);
        return false;
    }
});
electron_1.ipcMain.handle('build:open-installer-folder', async () => {
    try {
        const path = require('path');
        const { shell } = require('electron');
        const appRoot = electron_1.app.isPackaged
            ? path.dirname(electron_1.app.getPath('exe'))
            : path.join(__dirname, '..');
        const distPath = path.join(appRoot, 'dist');
        shell.openPath(distPath);
    }
    catch (error) {
        console.error('Open installer folder error:', error);
    }
});
// Menu aplikacji
function createMenu() {
    const template = [
        {
            label: 'Plik',
            submenu: [
                {
                    label: 'Nowa Faktura',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => {
                        mainWindow?.webContents.send('menu:new-invoice');
                    }
                },
                { type: 'separator' },
                {
                    label: 'Eksportuj Dane',
                    click: async () => {
                        const result = await electron_1.dialog.showSaveDialog(mainWindow, {
                            defaultPath: 'norbs-faktury-backup.json',
                            filters: [
                                { name: 'JSON Files', extensions: ['json'] }
                            ]
                        });
                        if (!result.canceled && result.filePath) {
                            await backupService.createBackup(result.filePath);
                        }
                    }
                },
                {
                    label: 'Importuj Dane',
                    click: async () => {
                        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
                            filters: [
                                { name: 'JSON Files', extensions: ['json'] }
                            ]
                        });
                        if (!result.canceled && result.filePaths[0]) {
                            await backupService.restoreBackup(result.filePaths[0]);
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Zakończ',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edycja',
            submenu: [
                { role: 'undo', label: 'Cofnij' },
                { role: 'redo', label: 'Ponów' },
                { type: 'separator' },
                { role: 'cut', label: 'Wytnij' },
                { role: 'copy', label: 'Kopiuj' },
                { role: 'paste', label: 'Wklej' },
                { role: 'selectall', label: 'Zaznacz wszystko' }
            ]
        },
        {
            label: 'Widok',
            submenu: [
                { role: 'reload', label: 'Odśwież' },
                { role: 'forceReload', label: 'Wymuś odświeżenie' },
                { role: 'toggleDevTools', label: 'Narzędzia deweloperskie' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Resetuj powiększenie' },
                { role: 'zoomIn', label: 'Powiększ' },
                { role: 'zoomOut', label: 'Pomniejsz' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Pełny ekran' }
            ]
        },
        {
            label: 'Okno',
            submenu: [
                { role: 'minimize', label: 'Minimalizuj' },
                { role: 'close', label: 'Zamknij' }
            ]
        },
        {
            label: 'Pomoc',
            submenu: [
                {
                    label: 'O Aplikacji',
                    click: () => {
                        electron_1.dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'O Aplikacji',
                            message: 'NORBS Fakturowanie',
                            detail: 'Aplikacja lokalna do zarządzania fakturami\nWersja: 1.0.0\nAutor: NORBS Solutions'
                        });
                    }
                },
                {
                    label: 'Otwórz Folder Dokumentów',
                    click: () => {
                        fsService.openDocumentsFolder();
                    }
                }
            ]
        }
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
