import { Invoice, Company, Client, InvoiceLine } from '@/types';
import { formatCurrency, formatDate } from '@/lib/invoice-utils';

export async function exportToCSV(invoice: Invoice, company: Company, client: Client): Promise<void> {
  const csvRows: string[] = [];
  
  csvRows.push('Invoice Export');
  csvRows.push('');
  csvRows.push('Invoice Information');
  csvRows.push(`Invoice Number,${invoice.invoice_number}`);
  csvRows.push(`Issue Date,${invoice.issue_date}`);
  csvRows.push(`Due Date,${invoice.due_date}`);
  csvRows.push(`Status,${invoice.status}`);
  csvRows.push(`Currency,${invoice.currency}`);
  csvRows.push('');
  
  csvRows.push('Company Information');
  csvRows.push(`Name,${company.name}`);
  csvRows.push(`Address,${company.address}`);
  csvRows.push(`KVK,${company.kvk}`);
  csvRows.push(`VAT Number,${company.vat_number}`);
  csvRows.push(`IBAN,${company.iban}`);
  csvRows.push(`BIC,${company.bic}`);
  csvRows.push('');
  
  csvRows.push('Client Information');
  csvRows.push(`Name,${client.name}`);
  csvRows.push(`Address,${client.address}`);
  csvRows.push(`VAT Number,${client.vat_number}`);
  csvRows.push(`Email,${client.email}`);
  csvRows.push('');
  
  csvRows.push('Line Items');
  csvRows.push('No.,Description,Quantity,Unit Price,VAT Rate,Net Amount,VAT Amount,Gross Amount');
  invoice.lines.forEach((line, index) => {
    const row = [
      index + 1,
      `"${line.description.replace(/"/g, '""')}"`,
      line.quantity,
      line.unit_price,
      line.vat_rate,
      line.line_net,
      line.line_vat,
      line.line_gross
    ].join(',');
    csvRows.push(row);
  });
  csvRows.push('');
  
  csvRows.push('Totals');
  csvRows.push(`Total Net,${invoice.total_net}`);
  csvRows.push(`Total VAT,${invoice.total_vat}`);
  csvRows.push(`Total Gross,${invoice.total_gross}`);
  
  const csvContent = csvRows.join('\n');
  downloadFile(csvContent, `${invoice.invoice_number}.csv`, 'text/csv');
}

export async function exportToJSON(invoice: Invoice, company: Company, client: Client): Promise<void> {
  const data = {
    invoice: {
      number: invoice.invoice_number,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      currency: invoice.currency,
      notes: invoice.notes,
      payment_reference: invoice.payment_reference,
    },
    company: {
      name: company.name,
      address: company.address,
      kvk: company.kvk,
      vat_number: company.vat_number,
      iban: company.iban,
      bic: company.bic,
      email: company.email,
      phone: company.phone,
    },
    client: {
      name: client.name,
      address: client.address,
      vat_number: client.vat_number,
      email: client.email,
      phone: client.phone,
    },
    lines: invoice.lines.map((line, index) => ({
      line_number: index + 1,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      vat_rate: line.vat_rate,
      net_amount: line.line_net,
      vat_amount: line.line_vat,
      gross_amount: line.line_gross,
    })),
    totals: {
      net: invoice.total_net,
      vat: invoice.total_vat,
      gross: invoice.total_gross,
    },
  };

  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${invoice.invoice_number}.json`, 'application/json');
}

export async function exportToExcel(invoice: Invoice, company: Company, client: Client): Promise<void> {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid black; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .info-table td:first-child { font-weight: bold; width: 200px; }
    .totals { font-weight: bold; background-color: #e8e8e8; }
    h1, h2 { color: #333; }
  </style>
</head>
<body>
  <h1>Invoice ${invoice.invoice_number}</h1>
  
  <h2>Invoice Information</h2>
  <table class="info-table">
    <tr><td>Invoice Number</td><td>${invoice.invoice_number}</td></tr>
    <tr><td>Issue Date</td><td>${invoice.issue_date}</td></tr>
    <tr><td>Due Date</td><td>${invoice.due_date}</td></tr>
    <tr><td>Status</td><td>${invoice.status}</td></tr>
    <tr><td>Currency</td><td>${invoice.currency}</td></tr>
  </table>
  
  <h2>Company Information</h2>
  <table class="info-table">
    <tr><td>Name</td><td>${company.name}</td></tr>
    <tr><td>Address</td><td>${company.address}</td></tr>
    <tr><td>KVK</td><td>${company.kvk}</td></tr>
    <tr><td>VAT Number</td><td>${company.vat_number}</td></tr>
    <tr><td>IBAN</td><td>${company.iban}</td></tr>
    <tr><td>BIC</td><td>${company.bic}</td></tr>
    <tr><td>Email</td><td>${company.email}</td></tr>
  </table>
  
  <h2>Client Information</h2>
  <table class="info-table">
    <tr><td>Name</td><td>${client.name}</td></tr>
    <tr><td>Address</td><td>${client.address}</td></tr>
    <tr><td>VAT Number</td><td>${client.vat_number}</td></tr>
    <tr><td>Email</td><td>${client.email}</td></tr>
  </table>
  
  <h2>Line Items</h2>
  <table>
    <thead>
      <tr>
        <th>No.</th>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>VAT Rate</th>
        <th>Net Amount</th>
        <th>VAT Amount</th>
        <th>Gross Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lines.map((line, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${line.description}</td>
          <td>${line.quantity}</td>
          <td>${line.unit_price.toFixed(2)}</td>
          <td>${line.vat_rate}%</td>
          <td>${line.line_net.toFixed(2)}</td>
          <td>${line.line_vat.toFixed(2)}</td>
          <td>${line.line_gross.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <h2>Totals</h2>
  <table>
    <tr class="totals"><td>Total Net</td><td>${invoice.total_net.toFixed(2)}</td></tr>
    <tr class="totals"><td>Total VAT</td><td>${invoice.total_vat.toFixed(2)}</td></tr>
    <tr class="totals"><td>Total Gross</td><td>${invoice.total_gross.toFixed(2)}</td></tr>
  </table>
  
  ${invoice.notes ? `<h2>Notes</h2><p>${invoice.notes}</p>` : ''}
</body>
</html>
  `;

  downloadFile(htmlContent, `${invoice.invoice_number}.xls`, 'application/vnd.ms-excel');
}

export async function exportToXML(invoice: Invoice, company: Company, client: Client): Promise<void> {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<invoice>
  <invoice_info>
    <number>${escapeXml(invoice.invoice_number)}</number>
    <issue_date>${invoice.issue_date}</issue_date>
    <due_date>${invoice.due_date}</due_date>
    <status>${invoice.status}</status>
    <currency>${invoice.currency}</currency>
    <payment_reference>${escapeXml(invoice.payment_reference)}</payment_reference>
  </invoice_info>
  
  <company>
    <name>${escapeXml(company.name)}</name>
    <address>${escapeXml(company.address)}</address>
    <kvk>${escapeXml(company.kvk)}</kvk>
    <vat_number>${escapeXml(company.vat_number)}</vat_number>
    <iban>${escapeXml(company.iban)}</iban>
    <bic>${escapeXml(company.bic)}</bic>
    <email>${escapeXml(company.email)}</email>
  </company>
  
  <client>
    <name>${escapeXml(client.name)}</name>
    <address>${escapeXml(client.address)}</address>
    <vat_number>${escapeXml(client.vat_number)}</vat_number>
    <email>${escapeXml(client.email)}</email>
  </client>
  
  <lines>
    ${invoice.lines.map((line, index) => `
    <line number="${index + 1}">
      <description>${escapeXml(line.description)}</description>
      <quantity>${line.quantity}</quantity>
      <unit_price>${line.unit_price}</unit_price>
      <vat_rate>${line.vat_rate}</vat_rate>
      <net_amount>${line.line_net}</net_amount>
      <vat_amount>${line.line_vat}</vat_amount>
      <gross_amount>${line.line_gross}</gross_amount>
    </line>`).join('')}
  </lines>
  
  <totals>
    <net>${invoice.total_net}</net>
    <vat>${invoice.total_vat}</vat>
    <gross>${invoice.total_gross}</gross>
  </totals>
  
  ${invoice.notes ? `<notes>${escapeXml(invoice.notes)}</notes>` : ''}
</invoice>`;

  downloadFile(xmlContent, `${invoice.invoice_number}.xml`, 'application/xml');
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
