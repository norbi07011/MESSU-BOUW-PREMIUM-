"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class DatabaseService {
    constructor() {
        // Ścieżka do bazy danych w folderze userData
        this.dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'norbs-faktury.db');
        console.log('Database path:', this.dbPath);
        this.db = new better_sqlite3_1.default(this.dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.initializeTables();
        this.seedDefaultData();
    }
    initializeTables() {
        // Tabela firm
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        kvk TEXT,
        vat_number TEXT,
        eori TEXT,
        iban TEXT,
        bic TEXT,
        phone TEXT,
        phone_mobile TEXT,
        phone_whatsapp TEXT,
        website TEXT,
        email TEXT,
        email_alt TEXT,
        bank_name TEXT,
        account_number TEXT,
        default_payment_term_days INTEGER DEFAULT 14,
        default_vat_rate REAL DEFAULT 21,
        currency TEXT DEFAULT 'EUR',
        logo_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Tabela klientów
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        vat_number TEXT,
        email TEXT,
        phone TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Tabela produktów
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        code TEXT,
        name TEXT NOT NULL,
        description TEXT,
        unit_price REAL NOT NULL,
        vat_rate REAL DEFAULT 21,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
        // Tabela faktur
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        company_id TEXT,
        client_id TEXT,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        currency TEXT DEFAULT 'EUR',
        status TEXT DEFAULT 'unpaid',
        total_net REAL DEFAULT 0,
        total_vat REAL DEFAULT 0,
        total_gross REAL DEFAULT 0,
        vat_note TEXT,
        payment_qr_payload TEXT,
        payment_reference TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (client_id) REFERENCES clients (id)
      )
    `);
        // Tabela linii faktur
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_lines (
        id TEXT PRIMARY KEY,
        invoice_id TEXT NOT NULL,
        product_id TEXT,
        description TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        vat_rate REAL NOT NULL,
        line_net REAL NOT NULL,
        line_vat REAL NOT NULL,
        line_gross REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);
        // Tabela liczników faktur
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS invoice_counters (
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        last_seq INTEGER DEFAULT 0,
        PRIMARY KEY (year, month)
      )
    `);
        // Indeksy dla lepszej wydajności
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices (issue_date);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
      CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices (client_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines (invoice_id);
    `);
        console.log('Database tables initialized successfully');
    }
    seedDefaultData() {
        // Sprawdź czy firma już istnieje
        const existingCompany = this.db.prepare('SELECT id FROM companies LIMIT 1').get();
        if (!existingCompany) {
            const companyId = (0, uuid_1.v4)();
            const now = new Date().toISOString();
            this.db.prepare(`
        INSERT INTO companies (
          id, name, address, kvk, vat_number, iban, bic, email, bank_name, 
          account_number, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(companyId, 'NORBS SERVICE', 'Amsterdam, Netherlands', '94061629', 'NL005061645B57', 'NL25INGB0109126122', 'INGBNL2A', 'info@norbsservice.nl', 'ING Bank', 'NL25INGB0109126122', now, now);
            console.log('Default company data seeded');
        }
    }
    // CRUD Operacje - Faktury
    getInvoices() {
        const stmt = this.db.prepare(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      ORDER BY i.created_at DESC
    `);
        const invoices = stmt.all();
        // Dodaj linie dla każdej faktury
        return invoices.map(invoice => ({
            ...invoice,
            lines: this.getInvoiceLines(invoice.id)
        }));
    }
    getInvoice(id) {
        const stmt = this.db.prepare('SELECT * FROM invoices WHERE id = ?');
        const invoice = stmt.get(id);
        if (invoice) {
            invoice.lines = this.getInvoiceLines(id);
        }
        return invoice;
    }
    createInvoice(invoiceData) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        // Generuj numer faktury
        const invoiceNumber = this.generateInvoiceNumber();
        const stmt = this.db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, company_id, client_id, issue_date, due_date,
        currency, status, total_net, total_vat, total_gross, vat_note,
        payment_qr_payload, payment_reference, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, invoiceNumber, invoiceData.company_id || '1', invoiceData.client_id, invoiceData.issue_date, invoiceData.due_date, invoiceData.currency || 'EUR', invoiceData.status || 'unpaid', invoiceData.total_net || 0, invoiceData.total_vat || 0, invoiceData.total_gross || 0, invoiceData.vat_note || '', invoiceData.payment_qr_payload || '', invoiceData.payment_reference || invoiceNumber, invoiceData.notes || '', now, now);
        // Zapisz linie faktury
        if (invoiceData.lines && Array.isArray(invoiceData.lines)) {
            invoiceData.lines.forEach((line) => {
                this.createInvoiceLine(id, line);
            });
        }
        return this.getInvoice(id);
    }
    updateInvoice(id, invoiceData) {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      UPDATE invoices SET
        client_id = ?, issue_date = ?, due_date = ?, currency = ?, status = ?,
        total_net = ?, total_vat = ?, total_gross = ?, vat_note = ?,
        payment_qr_payload = ?, payment_reference = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `);
        stmt.run(invoiceData.client_id, invoiceData.issue_date, invoiceData.due_date, invoiceData.currency, invoiceData.status, invoiceData.total_net, invoiceData.total_vat, invoiceData.total_gross, invoiceData.vat_note, invoiceData.payment_qr_payload, invoiceData.payment_reference, invoiceData.notes, now, id);
        // Aktualizuj linie faktury
        if (invoiceData.lines && Array.isArray(invoiceData.lines)) {
            // Usuń stare linie
            this.db.prepare('DELETE FROM invoice_lines WHERE invoice_id = ?').run(id);
            // Dodaj nowe linie
            invoiceData.lines.forEach((line) => {
                this.createInvoiceLine(id, line);
            });
        }
        return this.getInvoice(id);
    }
    deleteInvoice(id) {
        const stmt = this.db.prepare('DELETE FROM invoices WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // Linie faktury
    getInvoiceLines(invoiceId) {
        const stmt = this.db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ?');
        return stmt.all(invoiceId);
    }
    createInvoiceLine(invoiceId, lineData) {
        const id = (0, uuid_1.v4)();
        const stmt = this.db.prepare(`
      INSERT INTO invoice_lines (
        id, invoice_id, product_id, description, quantity, unit_price,
        vat_rate, line_net, line_vat, line_gross
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, invoiceId, lineData.product_id || null, lineData.description, lineData.quantity, lineData.unit_price, lineData.vat_rate, lineData.line_net, lineData.line_vat, lineData.line_gross);
        return { id, invoice_id: invoiceId, ...lineData };
    }
    // CRUD Operacje - Klienci
    getClients() {
        const stmt = this.db.prepare('SELECT * FROM clients ORDER BY name');
        return stmt.all();
    }
    createClient(clientData) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      INSERT INTO clients (id, name, address, vat_number, email, phone, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, clientData.name, clientData.address || '', clientData.vat_number || '', clientData.email || '', clientData.phone || '', clientData.notes || '', now, now);
        return { id, created_at: now, updated_at: now, ...clientData };
    }
    updateClient(id, clientData) {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      UPDATE clients SET name = ?, address = ?, vat_number = ?, email = ?, 
                        phone = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `);
        stmt.run(clientData.name, clientData.address, clientData.vat_number, clientData.email, clientData.phone, clientData.notes, now, id);
        const updatedClient = this.db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
        return updatedClient;
    }
    deleteClient(id) {
        const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // CRUD Operacje - Produkty
    getProducts() {
        const stmt = this.db.prepare('SELECT * FROM products ORDER BY name');
        return stmt.all();
    }
    createProduct(productData) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      INSERT INTO products (id, code, name, description, unit_price, vat_rate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, productData.code || '', productData.name, productData.description || '', productData.unit_price, productData.vat_rate || 21, now, now);
        return { id, created_at: now, updated_at: now, ...productData };
    }
    updateProduct(id, productData) {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
      UPDATE products SET code = ?, name = ?, description = ?, unit_price = ?, 
                         vat_rate = ?, updated_at = ?
      WHERE id = ?
    `);
        stmt.run(productData.code, productData.name, productData.description, productData.unit_price, productData.vat_rate, now, id);
        const updatedProduct = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
        return updatedProduct;
    }
    deleteProduct(id) {
        const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }
    // CRUD Operacje - Firma
    getCompany() {
        const stmt = this.db.prepare('SELECT * FROM companies LIMIT 1');
        return stmt.get();
    }
    updateCompany(companyData) {
        const existingCompany = this.getCompany();
        const now = new Date().toISOString();
        if (!existingCompany) {
            // Stwórz nową firmę
            const id = (0, uuid_1.v4)();
            const stmt = this.db.prepare(`
        INSERT INTO companies (
          id, name, address, kvk, vat_number, eori, iban, bic, phone, phone_mobile,
          phone_whatsapp, website, email, email_alt, bank_name, account_number,
          default_payment_term_days, default_vat_rate, currency, logo_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(id, companyData.name, companyData.address, companyData.kvk, companyData.vat_number, companyData.eori, companyData.iban, companyData.bic, companyData.phone, companyData.phone_mobile, companyData.phone_whatsapp, companyData.website, companyData.email, companyData.email_alt, companyData.bank_name, companyData.account_number, companyData.default_payment_term_days, companyData.default_vat_rate, companyData.currency, companyData.logo_url, now, now);
            return { id, created_at: now, updated_at: now, ...companyData };
        }
        else {
            // Aktualizuj istniejącą firmę
            const stmt = this.db.prepare(`
        UPDATE companies SET
          name = ?, address = ?, kvk = ?, vat_number = ?, eori = ?, iban = ?, bic = ?,
          phone = ?, phone_mobile = ?, phone_whatsapp = ?, website = ?, email = ?,
          email_alt = ?, bank_name = ?, account_number = ?, default_payment_term_days = ?,
          default_vat_rate = ?, currency = ?, logo_url = ?, updated_at = ?
        WHERE id = ?
      `);
            stmt.run(companyData.name, companyData.address, companyData.kvk, companyData.vat_number, companyData.eori, companyData.iban, companyData.bic, companyData.phone, companyData.phone_mobile, companyData.phone_whatsapp, companyData.website, companyData.email, companyData.email_alt, companyData.bank_name, companyData.account_number, companyData.default_payment_term_days, companyData.default_vat_rate, companyData.currency, companyData.logo_url, now, existingCompany.id);
            return this.getCompany();
        }
    }
    // Pomocnicze funkcje
    generateInvoiceNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        // Pobierz lub stwórz licznik
        let counter = this.db.prepare('SELECT last_seq FROM invoice_counters WHERE year = ? AND month = ?').get(year, month);
        if (!counter) {
            this.db.prepare('INSERT INTO invoice_counters (year, month, last_seq) VALUES (?, ?, 1)').run(year, month);
            counter = { last_seq: 1 };
        }
        else {
            const newSeq = counter.last_seq + 1;
            this.db.prepare('UPDATE invoice_counters SET last_seq = ? WHERE year = ? AND month = ?').run(newSeq, year, month);
            counter.last_seq = newSeq;
        }
        return `FV-${year}-${month.toString().padStart(2, '0')}-${counter.last_seq.toString().padStart(3, '0')}`;
    }
    // Export wszystkich danych
    exportAllData() {
        return {
            companies: this.db.prepare('SELECT * FROM companies').all(),
            clients: this.db.prepare('SELECT * FROM clients').all(),
            products: this.db.prepare('SELECT * FROM products').all(),
            invoices: this.db.prepare('SELECT * FROM invoices').all(),
            invoice_lines: this.db.prepare('SELECT * FROM invoice_lines').all(),
            invoice_counters: this.db.prepare('SELECT * FROM invoice_counters').all(),
            exported_at: new Date().toISOString()
        };
    }
    // Import wszystkich danych
    importAllData(data) {
        const transaction = this.db.transaction(() => {
            // Wyczyść istniejące dane
            this.db.prepare('DELETE FROM invoice_lines').run();
            this.db.prepare('DELETE FROM invoices').run();
            this.db.prepare('DELETE FROM products').run();
            this.db.prepare('DELETE FROM clients').run();
            this.db.prepare('DELETE FROM companies').run();
            this.db.prepare('DELETE FROM invoice_counters').run();
            // Import danych
            if (data.companies) {
                const stmt = this.db.prepare(`
          INSERT INTO companies VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                data.companies.forEach((company) => {
                    stmt.run(Object.values(company));
                });
            }
            if (data.clients) {
                const stmt = this.db.prepare(`
          INSERT INTO clients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                data.clients.forEach((client) => {
                    stmt.run(Object.values(client));
                });
            }
            if (data.products) {
                const stmt = this.db.prepare(`
          INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
                data.products.forEach((product) => {
                    stmt.run(Object.values(product));
                });
            }
            if (data.invoices) {
                const stmt = this.db.prepare(`
          INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                data.invoices.forEach((invoice) => {
                    stmt.run(Object.values(invoice));
                });
            }
            if (data.invoice_lines) {
                const stmt = this.db.prepare(`
          INSERT INTO invoice_lines VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                data.invoice_lines.forEach((line) => {
                    stmt.run(Object.values(line));
                });
            }
            if (data.invoice_counters) {
                const stmt = this.db.prepare(`
          INSERT INTO invoice_counters VALUES (?, ?, ?)
        `);
                data.invoice_counters.forEach((counter) => {
                    stmt.run(Object.values(counter));
                });
            }
        });
        transaction();
        return true;
    }
    close() {
        this.db.close();
    }
}
exports.DatabaseService = DatabaseService;
