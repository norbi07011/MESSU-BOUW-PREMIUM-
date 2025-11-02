import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface DbInvoice {
  id: string;
  invoice_number: string;
  company_id: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  currency: string;
  status: 'unpaid' | 'partial' | 'paid' | 'cancelled';
  total_net: number;
  total_vat: number;
  total_gross: number;
  vat_note: string;
  payment_qr_payload: string;
  payment_reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbClient {
  id: string;
  name: string;
  address: string;
  vat_number: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  unit_price: number;
  vat_rate: number;
  created_at: string;
  updated_at: string;
}

export interface DbCompany {
  id: string;
  name: string;
  address: string;
  kvk: string;
  vat_number: string;
  eori: string;
  iban: string;
  bic: string;
  phone: string;
  phone_mobile: string;
  phone_whatsapp: string;
  website: string;
  email: string;
  email_alt: string;
  bank_name: string;
  account_number: string;
  default_payment_term_days: number;
  default_vat_rate: number;
  currency: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

export interface DbInvoiceLine {
  id: string;
  invoice_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_net: number;
  line_vat: number;
  line_gross: number;
}

export class DatabaseService {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Ścieżka do bazy danych w folderze userData
    this.dbPath = path.join(app.getPath('userData'), 'messu-bouw-faktury.db');
    console.log('Database path:', this.dbPath);

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.initializeTables();
  }

  private initializeTables() {
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

  // CRUD Operacje - Faktury
  getInvoices(): DbInvoice[] {
    const stmt = this.db.prepare(`
      SELECT i.*, c.name as client_name 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      ORDER BY i.created_at DESC
    `);

    const invoices = stmt.all() as any[];

    // Dodaj linie dla każdej faktury
    return invoices.map(invoice => ({
      ...invoice,
      lines: this.getInvoiceLines(invoice.id)
    }));
  }

  getInvoice(id: string): DbInvoice | null {
    const stmt = this.db.prepare('SELECT * FROM invoices WHERE id = ?');
    const invoice = stmt.get(id) as DbInvoice;

    if (invoice) {
      (invoice as any).lines = this.getInvoiceLines(id);
    }

    return invoice;
  }

  createInvoice(invoiceData: Partial<DbInvoice>): DbInvoice {
    const id = uuidv4();
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

    stmt.run(
      id,
      invoiceNumber,
      invoiceData.company_id || '1',
      invoiceData.client_id,
      invoiceData.issue_date,
      invoiceData.due_date,
      invoiceData.currency || 'EUR',
      invoiceData.status || 'unpaid',
      invoiceData.total_net || 0,
      invoiceData.total_vat || 0,
      invoiceData.total_gross || 0,
      invoiceData.vat_note || '',
      invoiceData.payment_qr_payload || '',
      invoiceData.payment_reference || invoiceNumber,
      invoiceData.notes || '',
      now,
      now
    );

    // Zapisz linie faktury
    if ((invoiceData as any).lines && Array.isArray((invoiceData as any).lines)) {
      (invoiceData as any).lines.forEach((line: any) => {
        this.createInvoiceLine(id, line);
      });
    }

    return this.getInvoice(id)!;
  }

  updateInvoice(id: string, invoiceData: Partial<DbInvoice>): DbInvoice {
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE invoices SET
        client_id = ?, issue_date = ?, due_date = ?, currency = ?, status = ?,
        total_net = ?, total_vat = ?, total_gross = ?, vat_note = ?,
        payment_qr_payload = ?, payment_reference = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      invoiceData.client_id,
      invoiceData.issue_date,
      invoiceData.due_date,
      invoiceData.currency,
      invoiceData.status,
      invoiceData.total_net,
      invoiceData.total_vat,
      invoiceData.total_gross,
      invoiceData.vat_note,
      invoiceData.payment_qr_payload,
      invoiceData.payment_reference,
      invoiceData.notes,
      now,
      id
    );

    // Aktualizuj linie faktury
    if ((invoiceData as any).lines && Array.isArray((invoiceData as any).lines)) {
      // Usuń stare linie
      this.db.prepare('DELETE FROM invoice_lines WHERE invoice_id = ?').run(id);

      // Dodaj nowe linie
      (invoiceData as any).lines.forEach((line: any) => {
        this.createInvoiceLine(id, line);
      });
    }

    return this.getInvoice(id)!;
  }

  deleteInvoice(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM invoices WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Linie faktury
  getInvoiceLines(invoiceId: string): DbInvoiceLine[] {
    const stmt = this.db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ?');
    return stmt.all(invoiceId) as DbInvoiceLine[];
  }

  createInvoiceLine(invoiceId: string, lineData: Partial<DbInvoiceLine>): DbInvoiceLine {
    const id = uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO invoice_lines (
        id, invoice_id, product_id, description, quantity, unit_price,
        vat_rate, line_net, line_vat, line_gross
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      invoiceId,
      lineData.product_id || null,
      lineData.description,
      lineData.quantity,
      lineData.unit_price,
      lineData.vat_rate,
      lineData.line_net,
      lineData.line_vat,
      lineData.line_gross
    );

    return { id, invoice_id: invoiceId, ...lineData } as DbInvoiceLine;
  }

  // CRUD Operacje - Klienci
  getClients(): DbClient[] {
    const stmt = this.db.prepare('SELECT * FROM clients ORDER BY name');
    return stmt.all() as DbClient[];
  }

  createClient(clientData: Partial<DbClient>): DbClient {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO clients (id, name, address, vat_number, email, phone, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      clientData.name,
      clientData.address || '',
      clientData.vat_number || '',
      clientData.email || '',
      clientData.phone || '',
      clientData.notes || '',
      now,
      now
    );

    return { id, created_at: now, updated_at: now, ...clientData } as DbClient;
  }

  updateClient(id: string, clientData: Partial<DbClient>): DbClient {
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE clients SET name = ?, address = ?, vat_number = ?, email = ?, 
                        phone = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      clientData.name,
      clientData.address,
      clientData.vat_number,
      clientData.email,
      clientData.phone,
      clientData.notes,
      now,
      id
    );

    const updatedClient = this.db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as DbClient;
    return updatedClient;
  }

  deleteClient(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM clients WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // CRUD Operacje - Produkty
  getProducts(): DbProduct[] {
    const stmt = this.db.prepare('SELECT * FROM products ORDER BY name');
    return stmt.all() as DbProduct[];
  }

  createProduct(productData: Partial<DbProduct>): DbProduct {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO products (id, code, name, description, unit_price, vat_rate, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      productData.code || '',
      productData.name,
      productData.description || '',
      productData.unit_price,
      productData.vat_rate || 21,
      now,
      now
    );

    return { id, created_at: now, updated_at: now, ...productData } as DbProduct;
  }

  updateProduct(id: string, productData: Partial<DbProduct>): DbProduct {
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE products SET code = ?, name = ?, description = ?, unit_price = ?, 
                         vat_rate = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      productData.code,
      productData.name,
      productData.description,
      productData.unit_price,
      productData.vat_rate,
      now,
      id
    );

    const updatedProduct = this.db.prepare('SELECT * FROM products WHERE id = ?').get(id) as DbProduct;
    return updatedProduct;
  }

  deleteProduct(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // CRUD Operacje - Firma
  getCompany(): DbCompany | null {
    const stmt = this.db.prepare('SELECT * FROM companies LIMIT 1');
    return stmt.get() as DbCompany | null;
  }

  updateCompany(companyData: Partial<DbCompany>): DbCompany {
    const existingCompany = this.getCompany();
    const now = new Date().toISOString();

    if (!existingCompany) {
      // Stwórz nową firmę
      const id = uuidv4();
      const stmt = this.db.prepare(`
        INSERT INTO companies (
          id, name, address, kvk, vat_number, eori, iban, bic, phone, phone_mobile,
          phone_whatsapp, website, email, email_alt, bank_name, account_number,
          default_payment_term_days, default_vat_rate, currency, logo_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id, companyData.name, companyData.address, companyData.kvk, companyData.vat_number,
        companyData.eori, companyData.iban, companyData.bic, companyData.phone,
        companyData.phone_mobile, companyData.phone_whatsapp, companyData.website,
        companyData.email, companyData.email_alt, companyData.bank_name,
        companyData.account_number, companyData.default_payment_term_days,
        companyData.default_vat_rate, companyData.currency, companyData.logo_url,
        now, now
      );

      return { id, created_at: now, updated_at: now, ...companyData } as DbCompany;
    } else {
      // Aktualizuj istniejącą firmę
      const stmt = this.db.prepare(`
        UPDATE companies SET
          name = ?, address = ?, kvk = ?, vat_number = ?, eori = ?, iban = ?, bic = ?,
          phone = ?, phone_mobile = ?, phone_whatsapp = ?, website = ?, email = ?,
          email_alt = ?, bank_name = ?, account_number = ?, default_payment_term_days = ?,
          default_vat_rate = ?, currency = ?, logo_url = ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(
        companyData.name, companyData.address, companyData.kvk, companyData.vat_number,
        companyData.eori, companyData.iban, companyData.bic, companyData.phone,
        companyData.phone_mobile, companyData.phone_whatsapp, companyData.website,
        companyData.email, companyData.email_alt, companyData.bank_name,
        companyData.account_number, companyData.default_payment_term_days,
        companyData.default_vat_rate, companyData.currency, companyData.logo_url,
        now, existingCompany.id
      );

      return this.getCompany()!;
    }
  }

  // Pomocnicze funkcje
  private generateInvoiceNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Pobierz lub stwórz licznik
    let counter = this.db.prepare('SELECT last_seq FROM invoice_counters WHERE year = ? AND month = ?').get(year, month) as any;

    if (!counter) {
      this.db.prepare('INSERT INTO invoice_counters (year, month, last_seq) VALUES (?, ?, 1)').run(year, month);
      counter = { last_seq: 1 };
    } else {
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
  importAllData(data: any) {
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
        data.companies.forEach((company: any) => {
          stmt.run(Object.values(company));
        });
      }

      if (data.clients) {
        const stmt = this.db.prepare(`
          INSERT INTO clients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        data.clients.forEach((client: any) => {
          stmt.run(Object.values(client));
        });
      }

      if (data.products) {
        const stmt = this.db.prepare(`
          INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        data.products.forEach((product: any) => {
          stmt.run(Object.values(product));
        });
      }

      if (data.invoices) {
        const stmt = this.db.prepare(`
          INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        data.invoices.forEach((invoice: any) => {
          stmt.run(Object.values(invoice));
        });
      }

      if (data.invoice_lines) {
        const stmt = this.db.prepare(`
          INSERT INTO invoice_lines VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        data.invoice_lines.forEach((line: any) => {
          stmt.run(Object.values(line));
        });
      }

      if (data.invoice_counters) {
        const stmt = this.db.prepare(`
          INSERT INTO invoice_counters VALUES (?, ?, ?)
        `);
        data.invoice_counters.forEach((counter: any) => {
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