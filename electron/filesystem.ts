import { app, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

export class FileSystemService {
  private documentsPath: string;
  private invoicesPath: string;
  private backupPath: string;
  private exportPath: string;
  private templatesPath: string;

  constructor() {
    // Główny folder dokumentów aplikacji
    this.documentsPath = path.join(app.getPath('documents'), 'NORBS Faktury');
    this.invoicesPath = path.join(this.documentsPath, 'faktury-pdf');
    this.backupPath = path.join(this.documentsPath, 'backup');
    this.exportPath = path.join(this.documentsPath, 'eksport');
    this.templatesPath = path.join(this.documentsPath, 'szablony');
    
    this.ensureDirectoriesExist();
  }

  private ensureDirectoriesExist() {
    const directories = [
      this.documentsPath,
      this.invoicesPath,
      this.backupPath,
      this.exportPath,
      this.templatesPath
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  // Zapisywanie PDF faktury
  async savePDF(filename: string, buffer: ArrayBuffer): Promise<string> {
    try {
      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.invoicesPath, sanitizedFilename);
      
      // Konwertuj ArrayBuffer na Buffer
      const nodeBuffer = Buffer.from(buffer);
      
      // Zapisz plik
      fs.writeFileSync(filePath, nodeBuffer);
      
      console.log(`PDF saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error(`Nie udało się zapisać PDF: ${error}`);
    }
  }

  // Zapisywanie logo firmy
  async saveCompanyLogo(filename: string, data: Uint8Array): Promise<string> {
    try {
      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.documentsPath, 'logo', sanitizedFilename);
      
      // Ensure logo directory exists
      const logoDir = path.join(this.documentsPath, 'logo');
      if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
      }
      
      // Convert Uint8Array to Buffer and save
      const nodeBuffer = Buffer.from(data);
      fs.writeFileSync(filePath, nodeBuffer);
      
      console.log(`Company logo saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error saving company logo:', error);
      throw new Error(`Nie udało się zapisać logo: ${error}`);
    }
  }

  // Pobieranie ścieżki logo firmy
  async getCompanyLogoPath(filename: string): Promise<string> {
    const sanitizedFilename = this.sanitizeFilename(filename);
    const filePath = path.join(this.documentsPath, 'logo', sanitizedFilename);
    
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    
    throw new Error('Logo nie istnieje');
  }

  // Otwieranie folderu dokumentów
  async openDocumentsFolder(): Promise<void> {
    try {
      await shell.openPath(this.documentsPath);
    } catch (error) {
      console.error('Error opening documents folder:', error);
      throw new Error(`Nie udało się otworzyć folderu: ${error}`);
    }
  }

  // Eksport do CSV
  async exportCSV(filename: string, data: any[]): Promise<string> {
    try {
      const sanitizedFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.exportPath, `${sanitizedFilename}.csv`);
      
      if (!data || data.length === 0) {
        throw new Error('Brak danych do eksportu');
      }

      // Pobierz nagłówki z pierwszego obiektu
      const headers = Object.keys(data[0]);
      
      // Stwórz CSV content
      const csvContent = [
        // Nagłówki
        headers.join(','),
        // Dane
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape CSV values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Zapisz z BOM dla poprawnego wyświetlania polskich znaków w Excel
      const bom = '\uFEFF';
      fs.writeFileSync(filePath, bom + csvContent, 'utf8');
      
      console.log(`CSV exported to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error exporting CSV:', error);
      throw new Error(`Nie udało się wyeksportować CSV: ${error}`);
    }
  }

  // Eksport do Excel
  async exportExcel(filename: string, data: any[]): Promise<string> {
    try {
      const sanitizedFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.exportPath, `${sanitizedFilename}.xlsx`);
      
      if (!data || data.length === 0) {
        throw new Error('Brak danych do eksportu');
      }

      // Stwórz workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Dane');

      // Pobierz nagłówki
      const headers = Object.keys(data[0]);
      
      // Dodaj nagłówki
      worksheet.addRow(headers);
      
      // Stylizuj nagłówki
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Dodaj dane
      data.forEach(row => {
        const values = headers.map(header => row[header]);
        worksheet.addRow(values);
      });

      // Auto-width kolumn
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        (column as any).eachCell!({ includeEmpty: true }, (cell: any) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Zapisz plik
      await workbook.xlsx.writeFile(filePath);
      
      console.log(`Excel exported to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error exporting Excel:', error);
      throw new Error(`Nie udało się wyeksportować Excel: ${error}`);
    }
  }

  // Eksport do JSON
  async exportJSON(filename: string, data: any): Promise<string> {
    try {
      const sanitizedFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.exportPath, `${sanitizedFilename}.json`);
      
      const jsonContent = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonContent, 'utf8');
      
      console.log(`JSON exported to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error exporting JSON:', error);
      throw new Error(`Nie udało się wyeksportować JSON: ${error}`);
    }
  }

  // Eksport do XML
  async exportXML(filename: string, data: any): Promise<string> {
    try {
      const sanitizedFilename = this.sanitizeFilename(filename);
      const filePath = path.join(this.exportPath, `${sanitizedFilename}.xml`);
      
      // Prosty XML generator
      const xmlContent = this.convertToXML(data);
      fs.writeFileSync(filePath, xmlContent, 'utf8');
      
      console.log(`XML exported to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error exporting XML:', error);
      throw new Error(`Nie udało się wyeksportować XML: ${error}`);
    }
  }

  // Zapisywanie szablonu faktury
  async saveInvoiceTemplate(templateName: string, templateData: any): Promise<string> {
    try {
      const sanitizedName = this.sanitizeFilename(templateName);
      const filePath = path.join(this.templatesPath, `${sanitizedName}.json`);
      
      const templateContent = JSON.stringify(templateData, null, 2);
      fs.writeFileSync(filePath, templateContent, 'utf8');
      
      console.log(`Template saved to: ${filePath}`);
      return filePath;
    } catch (error) {
      console.error('Error saving template:', error);
      throw new Error(`Nie udało się zapisać szablonu: ${error}`);
    }
  }

  // Ładowanie szablonów faktur
  async loadInvoiceTemplates(): Promise<any[]> {
    try {
      if (!fs.existsSync(this.templatesPath)) {
        return [];
      }

      const files = fs.readdirSync(this.templatesPath)
        .filter(file => file.endsWith('.json'));

      const templates = files.map(file => {
        try {
          const filePath = path.join(this.templatesPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(content);
        } catch (error) {
          console.error(`Error loading template ${file}:`, error);
          return null;
        }
      }).filter(template => template !== null);

      return templates;
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  }

  // Lista plików w folderze backup
  getBackupFiles(): Array<{name: string, path: string, date: Date, size: number}> {
    try {
      if (!fs.existsSync(this.backupPath)) {
        return [];
      }

      return fs.readdirSync(this.backupPath)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(this.backupPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            date: stats.mtime,
            size: stats.size
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error getting backup files:', error);
      return [];
    }
  }

  // Czyszczenie starych plików
  async cleanupOldFiles(days: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const folders = [this.backupPath, this.exportPath];

      folders.forEach(folder => {
        if (fs.existsSync(folder)) {
          const files = fs.readdirSync(folder);
          files.forEach(file => {
            const filePath = path.join(folder, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < cutoffDate) {
              fs.unlinkSync(filePath);
              console.log(`Deleted old file: ${filePath}`);
            }
          });
        }
      });
    } catch (error) {
      console.error('Error cleaning up old files:', error);
    }
  }

  // Pomocnicze funkcje
  private sanitizeFilename(filename: string): string {
    // Usuń lub zamień niebezpieczne znaki
    return filename
      .replace(/[^a-z0-9ąćęłńóśźż\-_.]/gi, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private convertToXML(data: any, rootElement: string = 'root'): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
    
    const toXML = (obj: any, name: string): string => {
      if (Array.isArray(obj)) {
        return obj.map((item, index) => 
          toXML(item, `${name}_${index}`)
        ).join('\n');
      } else if (typeof obj === 'object' && obj !== null) {
        const properties = Object.keys(obj).map(key => 
          toXML(obj[key], key)
        ).join('\n');
        return `<${name}>\n${properties}\n</${name}>`;
      } else {
        const value = obj !== null && obj !== undefined ? obj.toString() : '';
        return `<${name}>${this.escapeXML(value)}</${name}>`;
      }
    };

    return xmlHeader + toXML(data, rootElement);
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Gettery dla ścieżek
  get documentsFolderPath(): string {
    return this.documentsPath;
  }

  get invoicesFolderPath(): string {
    return this.invoicesPath;
  }

  get backupFolderPath(): string {
    return this.backupPath;
  }

  get exportFolderPath(): string {
    return this.exportPath;
  }

  get templatesFolderPath(): string {
    return this.templatesPath;
  }
}