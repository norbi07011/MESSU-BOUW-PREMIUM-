"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class BackupService {
    constructor(dbService, fsService) {
        this.dbService = dbService;
        this.fsService = fsService;
    }
    // Tworzenie backup
    async createBackup(customPath) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `backup_${timestamp}.json`;
            // Ścieżka do zapisu
            const backupPath = customPath || path_1.default.join(this.fsService.backupFolderPath, filename);
            // Pobierz wszystkie dane z bazy
            const data = this.dbService.exportAllData();
            // Dodaj metadane backup
            const backupData = {
                version: '1.0.0',
                created_at: new Date().toISOString(),
                app_version: '1.0.0',
                data: data
            };
            // Zapisz do pliku
            const jsonContent = JSON.stringify(backupData, null, 2);
            fs_1.default.writeFileSync(backupPath, jsonContent, 'utf8');
            console.log(`Backup created: ${backupPath}`);
            return backupPath;
        }
        catch (error) {
            console.error('Error creating backup:', error);
            throw new Error(`Nie udało się utworzyć kopii zapasowej: ${error}`);
        }
    }
    // Przywracanie z backup
    async restoreBackup(backupPath) {
        try {
            if (!fs_1.default.existsSync(backupPath)) {
                throw new Error('Plik kopii zapasowej nie istnieje');
            }
            // Wczytaj dane z pliku
            const fileContent = fs_1.default.readFileSync(backupPath, 'utf8');
            const backupData = JSON.parse(fileContent);
            // Sprawdź wersję backup
            if (!backupData.version || !backupData.data) {
                throw new Error('Nieprawidłowy format pliku kopii zapasowej');
            }
            // Przywróć dane do bazy
            const success = this.dbService.importAllData(backupData.data);
            if (success) {
                console.log(`Backup restored from: ${backupPath}`);
                return true;
            }
            else {
                throw new Error('Nie udało się przywrócić danych');
            }
        }
        catch (error) {
            console.error('Error restoring backup:', error);
            throw new Error(`Nie udało się przywrócić kopii zapasowej: ${error}`);
        }
    }
    // Lista dostępnych kopii zapasowych
    async listBackups() {
        try {
            const backupFiles = this.fsService.getBackupFiles();
            return backupFiles.map(file => {
                let isValid = false;
                try {
                    const content = fs_1.default.readFileSync(file.path, 'utf8');
                    const data = JSON.parse(content);
                    isValid = !!(data.version && data.data);
                }
                catch {
                    isValid = false;
                }
                return {
                    ...file,
                    isValid
                };
            });
        }
        catch (error) {
            console.error('Error listing backups:', error);
            return [];
        }
    }
    // Automatyczny backup (uruchamiany okresowo)
    async autoBackup() {
        try {
            // Sprawdź czy potrzebny jest nowy backup
            const lastBackupTime = await this.getLastBackupTime();
            const now = new Date();
            const timeDiff = now.getTime() - lastBackupTime.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            // Backup co tydzień
            if (daysDiff >= 7) {
                const backupPath = await this.createBackup();
                // Wyczyść stare backupy (zostaw tylko 10 najnowszych)
                await this.cleanupOldBackups(10);
                return backupPath;
            }
            else {
                console.log('Auto backup skipped - recent backup exists');
                return '';
            }
        }
        catch (error) {
            console.error('Error in auto backup:', error);
            throw new Error(`Nie udało się wykonać automatycznej kopii zapasowej: ${error}`);
        }
    }
    // Eksport wybranych danych
    async exportSelected(options) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `export_selected_${timestamp}.json`;
            const exportPath = path_1.default.join(this.fsService.exportFolderPath, filename);
            const data = {};
            if (options.invoices) {
                data.invoices = this.dbService.getInvoices();
            }
            if (options.clients) {
                data.clients = this.dbService.getClients();
            }
            if (options.products) {
                data.products = this.dbService.getProducts();
            }
            if (options.company) {
                data.company = this.dbService.getCompany();
            }
            const exportData = {
                version: '1.0.0',
                created_at: new Date().toISOString(),
                selection: options,
                data: data
            };
            const jsonContent = JSON.stringify(exportData, null, 2);
            fs_1.default.writeFileSync(exportPath, jsonContent, 'utf8');
            console.log(`Selected data exported: ${exportPath}`);
            return exportPath;
        }
        catch (error) {
            console.error('Error exporting selected data:', error);
            throw new Error(`Nie udało się wyeksportować wybranych danych: ${error}`);
        }
    }
    // Import wybranych danych
    async importSelected(filePath, options) {
        try {
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error('Plik do importu nie istnieje');
            }
            const fileContent = fs_1.default.readFileSync(filePath, 'utf8');
            const importData = JSON.parse(fileContent);
            if (!importData.version || !importData.data) {
                throw new Error('Nieprawidłowy format pliku');
            }
            // Import wybranych danych
            if (options.invoices && importData.data.invoices) {
                // Tu można dodać logikę importu faktur
                console.log('Invoices import not implemented yet');
            }
            if (options.clients && importData.data.clients) {
                // Tu można dodać logikę importu klientów
                console.log('Clients import not implemented yet');
            }
            if (options.products && importData.data.products) {
                // Tu można dodać logikę importu produktów
                console.log('Products import not implemented yet');
            }
            if (options.company && importData.data.company) {
                this.dbService.updateCompany(importData.data.company);
            }
            console.log(`Selected data imported from: ${filePath}`);
            return true;
        }
        catch (error) {
            console.error('Error importing selected data:', error);
            throw new Error(`Nie udało się zaimportować wybranych danych: ${error}`);
        }
    }
    // Walidacja pliku backup
    async validateBackup(backupPath) {
        const result = {
            isValid: false,
            errors: [],
            info: {}
        };
        try {
            if (!fs_1.default.existsSync(backupPath)) {
                result.errors.push('Plik nie istnieje');
                return result;
            }
            const fileContent = fs_1.default.readFileSync(backupPath, 'utf8');
            try {
                const data = JSON.parse(fileContent);
                if (!data.version) {
                    result.errors.push('Brak informacji o wersji');
                }
                if (!data.data) {
                    result.errors.push('Brak danych do przywrócenia');
                }
                if (!data.created_at) {
                    result.errors.push('Brak informacji o dacie utworzenia');
                }
                // Sprawdź strukturę danych
                if (data.data) {
                    const expectedTables = ['companies', 'clients', 'products', 'invoices'];
                    expectedTables.forEach(table => {
                        if (!data.data[table]) {
                            result.errors.push(`Brak tabeli: ${table}`);
                        }
                    });
                }
                result.info = {
                    version: data.version,
                    created_at: data.created_at,
                    app_version: data.app_version,
                    dataSize: data.data ? Object.keys(data.data).length : 0
                };
                if (result.errors.length === 0) {
                    result.isValid = true;
                }
            }
            catch (parseError) {
                result.errors.push('Nieprawidłowy format JSON');
            }
        }
        catch (error) {
            result.errors.push(`Błąd odczytu pliku: ${error}`);
        }
        return result;
    }
    // Pomocnicze funkcje
    async getLastBackupTime() {
        try {
            const backups = await this.listBackups();
            if (backups.length > 0) {
                return backups[0].date;
            }
        }
        catch (error) {
            console.error('Error getting last backup time:', error);
        }
        // Jeśli brak backupów, zwróć datę sprzed tygodnia
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
    }
    async cleanupOldBackups(keepCount) {
        try {
            const backups = await this.listBackups();
            if (backups.length > keepCount) {
                const toDelete = backups.slice(keepCount);
                toDelete.forEach(backup => {
                    try {
                        fs_1.default.unlinkSync(backup.path);
                        console.log(`Deleted old backup: ${backup.name}`);
                    }
                    catch (error) {
                        console.error(`Error deleting backup ${backup.name}:`, error);
                    }
                });
            }
        }
        catch (error) {
            console.error('Error cleaning up old backups:', error);
        }
    }
    // Kompresja backup (opcjonalnie)
    async compressBackup(backupPath) {
        // Tu można dodać kompresję zip jeśli potrzeba
        // Obecnie zwraca oryginalną ścieżkę
        return backupPath;
    }
    // Dekompresja backup (opcjonalnie)
    async decompressBackup(compressedPath) {
        // Tu można dodać dekompresję zip jeśli potrzeba
        // Obecnie zwraca oryginalną ścieżkę
        return compressedPath;
    }
}
exports.BackupService = BackupService;
