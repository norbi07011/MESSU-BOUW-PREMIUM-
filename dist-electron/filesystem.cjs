"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemService = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const exceljs_1 = __importDefault(require("exceljs"));
class FileSystemService {
    constructor() {
        // Główny folder dokumentów aplikacji
        this.documentsPath = path_1.default.join(electron_1.app.getPath('documents'), 'NORBS Faktury');
        this.invoicesPath = path_1.default.join(this.documentsPath, 'faktury-pdf');
        this.backupPath = path_1.default.join(this.documentsPath, 'backup');
        this.exportPath = path_1.default.join(this.documentsPath, 'eksport');
        this.templatesPath = path_1.default.join(this.documentsPath, 'szablony');
        this.ensureDirectoriesExist();
    }
    ensureDirectoriesExist() {
        const directories = [
            this.documentsPath,
            this.invoicesPath,
            this.backupPath,
            this.exportPath,
            this.templatesPath
        ];
        directories.forEach(dir => {
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
                console.log(`Created directory: ${dir}`);
            }
        });
    }
    // Zapisywanie PDF faktury
    async savePDF(filename, buffer) {
        try {
            // Sanitize filename
            const sanitizedFilename = this.sanitizeFilename(filename);
            const filePath = path_1.default.join(this.invoicesPath, sanitizedFilename);
            // Konwertuj ArrayBuffer na Buffer
            const nodeBuffer = Buffer.from(buffer);
            // Zapisz plik
            fs_1.default.writeFileSync(filePath, nodeBuffer);
            console.log(`PDF saved to: ${filePath}`);
            return filePath;
        }
        catch (error) {
            console.error('Error saving PDF:', error);
            throw new Error(`Nie udało się zapisać PDF: ${error}`);
        }
    }
    // Otwieranie folderu dokumentów
    async openDocumentsFolder() {
        try {
            await electron_1.shell.openPath(this.documentsPath);
        }
        catch (error) {
            console.error('Error opening documents folder:', error);
            throw new Error(`Nie udało się otworzyć folderu: ${error}`);
        }
    }
    // Eksport do CSV
    async exportCSV(filename, data) {
        try {
            const sanitizedFilename = this.sanitizeFilename(filename);
            const filePath = path_1.default.join(this.exportPath, `${sanitizedFilename}.csv`);
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
                ...data.map(row => headers.map(header => {
                    const value = row[header];
                    // Escape CSV values
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(','))
            ].join('\n');
            // Zapisz z BOM dla poprawnego wyświetlania polskich znaków w Excel
            const bom = '\uFEFF';
            fs_1.default.writeFileSync(filePath, bom + csvContent, 'utf8');
            console.log(`CSV exported to: ${filePath}`);
            return filePath;
        }
        catch (error) {
            console.error('Error exporting CSV:', error);
            throw new Error(`Nie udało się wyeksportować CSV: ${error}`);
        }
    }
    // Eksport do Excel
    async exportExcel(filename, data) {
        try {
            const sanitizedFilename = this.sanitizeFilename(filename);
            const filePath = path_1.default.join(this.exportPath, `${sanitizedFilename}.xlsx`);
            if (!data || data.length === 0) {
                throw new Error('Brak danych do eksportu');
            }
            // Stwórz workbook
            const workbook = new exceljs_1.default.Workbook();
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
                column.eachCell({ includeEmpty: true }, (cell) => {
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
        }
        catch (error) {
            console.error('Error exporting Excel:', error);
            throw new Error(`Nie udało się wyeksportować Excel: ${error}`);
        }
    }
    // Eksport do JSON
    async exportJSON(filename, data) {
        try {
            const sanitizedFilename = this.sanitizeFilename(filename);
            const filePath = path_1.default.join(this.exportPath, `${sanitizedFilename}.json`);
            const jsonContent = JSON.stringify(data, null, 2);
            fs_1.default.writeFileSync(filePath, jsonContent, 'utf8');
            console.log(`JSON exported to: ${filePath}`);
            return filePath;
        }
        catch (error) {
            console.error('Error exporting JSON:', error);
            throw new Error(`Nie udało się wyeksportować JSON: ${error}`);
        }
    }
    // Eksport do XML
    async exportXML(filename, data) {
        try {
            const sanitizedFilename = this.sanitizeFilename(filename);
            const filePath = path_1.default.join(this.exportPath, `${sanitizedFilename}.xml`);
            // Prosty XML generator
            const xmlContent = this.convertToXML(data);
            fs_1.default.writeFileSync(filePath, xmlContent, 'utf8');
            console.log(`XML exported to: ${filePath}`);
            return filePath;
        }
        catch (error) {
            console.error('Error exporting XML:', error);
            throw new Error(`Nie udało się wyeksportować XML: ${error}`);
        }
    }
    // Zapisywanie szablonu faktury
    async saveInvoiceTemplate(templateName, templateData) {
        try {
            const sanitizedName = this.sanitizeFilename(templateName);
            const filePath = path_1.default.join(this.templatesPath, `${sanitizedName}.json`);
            const templateContent = JSON.stringify(templateData, null, 2);
            fs_1.default.writeFileSync(filePath, templateContent, 'utf8');
            console.log(`Template saved to: ${filePath}`);
            return filePath;
        }
        catch (error) {
            console.error('Error saving template:', error);
            throw new Error(`Nie udało się zapisać szablonu: ${error}`);
        }
    }
    // Ładowanie szablonów faktur
    async loadInvoiceTemplates() {
        try {
            if (!fs_1.default.existsSync(this.templatesPath)) {
                return [];
            }
            const files = fs_1.default.readdirSync(this.templatesPath)
                .filter(file => file.endsWith('.json'));
            const templates = files.map(file => {
                try {
                    const filePath = path_1.default.join(this.templatesPath, file);
                    const content = fs_1.default.readFileSync(filePath, 'utf8');
                    return JSON.parse(content);
                }
                catch (error) {
                    console.error(`Error loading template ${file}:`, error);
                    return null;
                }
            }).filter(template => template !== null);
            return templates;
        }
        catch (error) {
            console.error('Error loading templates:', error);
            return [];
        }
    }
    // Lista plików w folderze backup
    getBackupFiles() {
        try {
            if (!fs_1.default.existsSync(this.backupPath)) {
                return [];
            }
            return fs_1.default.readdirSync(this.backupPath)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                const filePath = path_1.default.join(this.backupPath, file);
                const stats = fs_1.default.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    date: stats.mtime,
                    size: stats.size
                };
            })
                .sort((a, b) => b.date.getTime() - a.date.getTime());
        }
        catch (error) {
            console.error('Error getting backup files:', error);
            return [];
        }
    }
    // Czyszczenie starych plików
    async cleanupOldFiles(days = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            const folders = [this.backupPath, this.exportPath];
            folders.forEach(folder => {
                if (fs_1.default.existsSync(folder)) {
                    const files = fs_1.default.readdirSync(folder);
                    files.forEach(file => {
                        const filePath = path_1.default.join(folder, file);
                        const stats = fs_1.default.statSync(filePath);
                        if (stats.mtime < cutoffDate) {
                            fs_1.default.unlinkSync(filePath);
                            console.log(`Deleted old file: ${filePath}`);
                        }
                    });
                }
            });
        }
        catch (error) {
            console.error('Error cleaning up old files:', error);
        }
    }
    // Pomocnicze funkcje
    sanitizeFilename(filename) {
        // Usuń lub zamień niebezpieczne znaki
        return filename
            .replace(/[^a-z0-9ąćęłńóśźż\-_.]/gi, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^_+|_+$/g, '');
    }
    convertToXML(data, rootElement = 'root') {
        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
        const toXML = (obj, name) => {
            if (Array.isArray(obj)) {
                return obj.map((item, index) => toXML(item, `${name}_${index}`)).join('\n');
            }
            else if (typeof obj === 'object' && obj !== null) {
                const properties = Object.keys(obj).map(key => toXML(obj[key], key)).join('\n');
                return `<${name}>\n${properties}\n</${name}>`;
            }
            else {
                const value = obj !== null && obj !== undefined ? obj.toString() : '';
                return `<${name}>${this.escapeXML(value)}</${name}>`;
            }
        };
        return xmlHeader + toXML(data, rootElement);
    }
    escapeXML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    // Gettery dla ścieżek
    get documentsFolderPath() {
        return this.documentsPath;
    }
    get invoicesFolderPath() {
        return this.invoicesPath;
    }
    get backupFolderPath() {
        return this.backupPath;
    }
    get exportFolderPath() {
        return this.exportPath;
    }
    get templatesFolderPath() {
        return this.templatesPath;
    }
}
exports.FileSystemService = FileSystemService;
