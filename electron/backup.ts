import { DatabaseService } from './database';
import { FileSystemService } from './filesystem';
import path from 'path';
import fs from 'fs';

export class BackupService {
  private dbService: DatabaseService;
  private fsService: FileSystemService;

  constructor(dbService: DatabaseService, fsService: FileSystemService) {
    this.dbService = dbService;
    this.fsService = fsService;
  }

  // Tworzenie backup
  async createBackup(customPath?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.json`;
      
      // Ścieżka do zapisu
      const backupPath = customPath || path.join(this.fsService.backupFolderPath, filename);
      
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
      fs.writeFileSync(backupPath, jsonContent, 'utf8');
      
      console.log(`Backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error(`Nie udało się utworzyć kopii zapasowej: ${error}`);
    }
  }

  // Przywracanie z backup
  async restoreBackup(backupPath: string): Promise<boolean> {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Plik kopii zapasowej nie istnieje');
      }

      // Wczytaj dane z pliku
      const fileContent = fs.readFileSync(backupPath, 'utf8');
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
      } else {
        throw new Error('Nie udało się przywrócić danych');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error(`Nie udało się przywrócić kopii zapasowej: ${error}`);
    }
  }

  // Lista dostępnych kopii zapasowych
  async listBackups(): Promise<Array<{
    name: string;
    path: string;
    date: Date;
    size: number;
    isValid: boolean;
  }>> {
    try {
      const backupFiles = this.fsService.getBackupFiles();
      
      return backupFiles.map(file => {
        let isValid = false;
        
        try {
          const content = fs.readFileSync(file.path, 'utf8');
          const data = JSON.parse(content);
          isValid = !!(data.version && data.data);
        } catch {
          isValid = false;
        }
        
        return {
          ...file,
          isValid
        };
      });
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  // Automatyczny backup (uruchamiany okresowo)
  async autoBackup(): Promise<string> {
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
      } else {
        console.log('Auto backup skipped - recent backup exists');
        return '';
      }
    } catch (error) {
      console.error('Error in auto backup:', error);
      throw new Error(`Nie udało się wykonać automatycznej kopii zapasowej: ${error}`);
    }
  }

  // Eksport wybranych danych
  async exportSelected(options: {
    invoices?: boolean;
    clients?: boolean;
    products?: boolean;
    company?: boolean;
  }): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `export_selected_${timestamp}.json`;
      const exportPath = path.join(this.fsService.exportFolderPath, filename);
      
      const data: any = {};
      
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
      fs.writeFileSync(exportPath, jsonContent, 'utf8');
      
      console.log(`Selected data exported: ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('Error exporting selected data:', error);
      throw new Error(`Nie udało się wyeksportować wybranych danych: ${error}`);
    }
  }

  // Import wybranych danych
  async importSelected(filePath: string, options: {
    invoices?: boolean;
    clients?: boolean;
    products?: boolean;
    company?: boolean;
  }): Promise<boolean> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Plik do importu nie istnieje');
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
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
    } catch (error) {
      console.error('Error importing selected data:', error);
      throw new Error(`Nie udało się zaimportować wybranych danych: ${error}`);
    }
  }

  // Walidacja pliku backup
  async validateBackup(backupPath: string): Promise<{
    isValid: boolean;
    errors: string[];
    info: any;
  }> {
    const result = {
      isValid: false,
      errors: [] as string[],
      info: {} as any
    };

    try {
      if (!fs.existsSync(backupPath)) {
        result.errors.push('Plik nie istnieje');
        return result;
      }

      const fileContent = fs.readFileSync(backupPath, 'utf8');
      
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
        
      } catch (parseError) {
        result.errors.push('Nieprawidłowy format JSON');
      }
      
    } catch (error) {
      result.errors.push(`Błąd odczytu pliku: ${error}`);
    }

    return result;
  }

  // Pomocnicze funkcje
  private async getLastBackupTime(): Promise<Date> {
    try {
      const backups = await this.listBackups();
      if (backups.length > 0) {
        return backups[0].date;
      }
    } catch (error) {
      console.error('Error getting last backup time:', error);
    }
    
    // Jeśli brak backupów, zwróć datę sprzed tygodnia
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return weekAgo;
  }

  private async cleanupOldBackups(keepCount: number): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > keepCount) {
        const toDelete = backups.slice(keepCount);
        
        toDelete.forEach(backup => {
          try {
            fs.unlinkSync(backup.path);
            console.log(`Deleted old backup: ${backup.name}`);
          } catch (error) {
            console.error(`Error deleting backup ${backup.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  // Kompresja backup (opcjonalnie)
  async compressBackup(backupPath: string): Promise<string> {
    // Tu można dodać kompresję zip jeśli potrzeba
    // Obecnie zwraca oryginalną ścieżkę
    return backupPath;
  }

  // Dekompresja backup (opcjonalnie)
  async decompressBackup(compressedPath: string): Promise<string> {
    // Tu można dodać dekompresję zip jeśli potrzeba
    // Obecnie zwraca oryginalną ścieżkę
    return compressedPath;
  }
}