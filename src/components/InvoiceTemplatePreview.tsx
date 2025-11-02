import { Invoice, Client, Company, InvoiceTemplate } from '@/types';
import { formatCurrency, getISOWeekNumber } from '@/lib/invoice-utils';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface InvoiceTemplatePreviewProps {
  invoice: Partial<Invoice>;
  client: Client | undefined;
  company: Company | undefined;
  template: InvoiceTemplate;
  scale?: number;
}

export function InvoiceTemplatePreview({
  invoice,
  client,
  company,
  template,
  scale = 0.5,
}: InvoiceTemplatePreviewProps) {
  const { t } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (invoice.payment_qr_payload && template.config.showQRCode) {
      QRCode.toDataURL(invoice.payment_qr_payload, { width: 200, margin: 1 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [invoice.payment_qr_payload, template.config.showQRCode]);

  const weekNumber = invoice.issue_date ? getISOWeekNumber(invoice.issue_date) : '';

  return (
    <div 
      className="bg-white text-foreground shadow-xl overflow-auto"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${794 / scale}px`,
        height: `${1123 / scale}px`,
        fontFamily: template.config.fontFamily,
      }}
    >
      <div className="w-[794px] min-h-[1123px] p-12">
        {template.style === 'classic' && <ClassicTemplate invoice={invoice} client={client} company={company} template={template} qrCodeUrl={qrCodeUrl} weekNumber={weekNumber} t={t} />}
        {template.style === 'modern' && <ModernTemplate invoice={invoice} client={client} company={company} template={template} qrCodeUrl={qrCodeUrl} weekNumber={weekNumber} t={t} />}
        {template.style === 'minimal' && <MinimalTemplate invoice={invoice} client={client} company={company} template={template} qrCodeUrl={qrCodeUrl} weekNumber={weekNumber} t={t} />}
        {template.style === 'professional' && <ProfessionalTemplate invoice={invoice} client={client} company={company} template={template} qrCodeUrl={qrCodeUrl} weekNumber={weekNumber} t={t} />}
        {template.style === 'creative' && <CreativeTemplate invoice={invoice} client={client} company={company} template={template} qrCodeUrl={qrCodeUrl} weekNumber={weekNumber} t={t} />}
      </div>
    </div>
  );
}

function ClassicTemplate({ invoice, client, company, template, qrCodeUrl, weekNumber, t }: any) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start border-b-2 pb-6" style={{ borderColor: template.config.primaryColor }}>
        <div>
          {template.config.showLogo && company?.logo_url && (
            <img src={company.logo_url} alt="Logo" className="h-16 mb-4 object-contain" />
          )}
          <h1 className="text-2xl font-bold" style={{ color: template.config.primaryColor }}>
            {company?.name}
          </h1>
          <div className="text-sm mt-2 text-gray-600 space-y-1">
            <p>{company?.address}</p>
            <p>KVK: {company?.kvk} | BTW: {company?.vat_number}</p>
            <p>{company?.email}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold" style={{ color: template.config.accentColor }}>
            {t('pdf.invoice')}
          </h2>
          <p className="text-xl font-mono mt-2">{invoice.invoice_number}</p>
          {template.config.showWeekNumber && (
            <p className="text-sm text-gray-500 mt-1">Week {weekNumber}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-2" style={{ color: template.config.primaryColor }}>
            {t('pdf.billTo')}
          </h3>
          <div className="space-y-1">
            <p className="font-medium">{client?.name}</p>
            <p className="text-sm text-gray-600">{client?.address}</p>
            {client?.vat_number && <p className="text-sm">BTW: {client.vat_number}</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2" style={{ color: template.config.primaryColor }}>
            {t('pdf.invoiceDetails')}
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.issueDate')}:</span>
              <span className="font-medium">{invoice.issue_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.dueDate')}:</span>
              <span className="font-medium">{invoice.due_date}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2" style={{ borderColor: template.config.primaryColor }}>
              <th className="text-left py-2 font-semibold">{t('pdf.description')}</th>
              <th className="text-right py-2 font-semibold">{t('pdf.quantity')}</th>
              <th className="text-right py-2 font-semibold">{t('pdf.unitPrice')}</th>
              <th className="text-right py-2 font-semibold">{t('pdf.vat')}</th>
              <th className="text-right py-2 font-semibold">{t('pdf.total')}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines?.map((line: any, idx: number) => (
              <tr key={idx} className="border-b">
                <td className="py-3">{line.description}</td>
                <td className="text-right py-3">{line.quantity}</td>
                <td className="text-right py-3">{formatCurrency(line.unit_price)}</td>
                <td className="text-right py-3">{line.vat_rate}%</td>
                <td className="text-right py-3 font-medium">{formatCurrency(line.line_gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-start mt-8">
        {template.config.showQRCode && qrCodeUrl && (
          <div className="text-center">
            <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
            <p className="text-xs text-gray-500 mt-2">{t('pdf.scanToPay')}</p>
          </div>
        )}
        <div className="ml-auto w-80">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.subtotal')}:</span>
              <span>{formatCurrency(invoice.total_net || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.vatAmount')}:</span>
              <span>{formatCurrency(invoice.total_vat || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 text-lg font-bold" style={{ borderColor: template.config.accentColor }}>
              <span>{t('pdf.totalAmount')}:</span>
              <span style={{ color: template.config.accentColor }}>{formatCurrency(invoice.total_gross || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernTemplate({ invoice, client, company, template, qrCodeUrl, weekNumber, t }: any) {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-lg text-white" style={{ 
        background: `linear-gradient(135deg, ${template.config.primaryColor} 0%, ${template.config.accentColor} 100%)` 
      }}>
        <div className="flex justify-between items-start">
          <div>
            {template.config.showLogo && company?.logo_url && (
              <img src={company.logo_url} alt="Logo" className="h-12 mb-3 brightness-0 invert object-contain" />
            )}
            <h1 className="text-2xl font-bold">{company?.name}</h1>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">{t('pdf.invoice')}</h2>
            <p className="text-xl font-mono mt-1">{invoice.invoice_number}</p>
            {template.config.showWeekNumber && <p className="text-sm opacity-90">Week {weekNumber}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 border-l-4 rounded" style={{ borderColor: template.config.accentColor }}>
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide" style={{ color: template.config.primaryColor }}>
            {t('pdf.billTo')}
          </h3>
          <p className="font-medium">{client?.name}</p>
          <p className="text-sm text-gray-600">{client?.address}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide" style={{ color: template.config.primaryColor }}>
            {t('pdf.invoiceDetails')}
          </h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.issueDate')}:</span>
              <span className="font-medium">{invoice.issue_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.dueDate')}:</span>
              <span className="font-medium">{invoice.due_date}</span>
            </div>
          </div>
        </div>
      </div>

      <table className="w-full mt-6">
        <thead>
          <tr className="text-white" style={{ backgroundColor: template.config.primaryColor }}>
            <th className="text-left py-3 px-3 font-semibold">{t('pdf.description')}</th>
            <th className="text-right py-3 px-3 font-semibold">{t('pdf.quantity')}</th>
            <th className="text-right py-3 px-3 font-semibold">{t('pdf.unitPrice')}</th>
            <th className="text-right py-3 px-3 font-semibold">{t('pdf.total')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines?.map((line: any, idx: number) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="py-3 px-3">{line.description}</td>
              <td className="text-right py-3 px-3">{line.quantity}</td>
              <td className="text-right py-3 px-3">{formatCurrency(line.unit_price)}</td>
              <td className="text-right py-3 px-3 font-medium">{formatCurrency(line.line_gross)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="bg-gray-50 p-4 rounded-lg w-80">
          <div className="space-y-2">
            <div className="flex justify-between gap-12 text-sm">
              <span className="text-gray-600">{t('pdf.subtotal')}:</span>
              <span>{formatCurrency(invoice.total_net || 0)}</span>
            </div>
            <div className="flex justify-between gap-12 text-sm">
              <span className="text-gray-600">{t('pdf.vatAmount')}:</span>
              <span>{formatCurrency(invoice.total_vat || 0)}</span>
            </div>
            <div className="flex justify-between gap-12 pt-2 border-t-2 text-xl font-bold" style={{ borderColor: template.config.accentColor }}>
              <span>{t('pdf.totalAmount')}:</span>
              <span style={{ color: template.config.accentColor }}>{formatCurrency(invoice.total_gross || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinimalTemplate({ invoice, client, company, template, qrCodeUrl, weekNumber, t }: any) {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4 pb-8 border-b">
        {template.config.showLogo && company?.logo_url && (
          <img src={company.logo_url} alt="Logo" className="h-16 mx-auto object-contain" />
        )}
        <h1 className="text-4xl font-light tracking-wide" style={{ color: template.config.primaryColor }}>
          {t('pdf.invoice')}
        </h1>
        <p className="text-2xl font-mono">{invoice.invoice_number}</p>
        {template.config.showWeekNumber && <p className="text-sm text-gray-500">Week {weekNumber}</p>}
      </div>

      <div className="grid grid-cols-3 gap-8 text-sm">
        <div>
          <h3 className="font-semibold mb-3 text-xs uppercase tracking-widest" style={{ color: template.config.primaryColor }}>From</h3>
          <p className="font-medium">{company?.name}</p>
          <p className="text-gray-600">{company?.address}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-xs uppercase tracking-widest" style={{ color: template.config.primaryColor }}>To</h3>
          <p className="font-medium">{client?.name}</p>
          <p className="text-gray-600">{client?.address}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-xs uppercase tracking-widest" style={{ color: template.config.primaryColor }}>Details</h3>
          <div className="space-y-2">
            <div><span className="text-gray-600">Issue:</span> <span className="ml-2">{invoice.issue_date}</span></div>
            <div><span className="text-gray-600">Due:</span> <span className="ml-2">{invoice.due_date}</span></div>
          </div>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b text-xs uppercase tracking-wider" style={{ borderColor: template.config.primaryColor }}>
            <th className="text-left py-3 font-semibold">{t('pdf.description')}</th>
            <th className="text-right py-3 font-semibold">{t('pdf.quantity')}</th>
            <th className="text-right py-3 font-semibold">{t('pdf.unitPrice')}</th>
            <th className="text-right py-3 font-semibold">{t('pdf.total')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines?.map((line: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-4">{line.description}</td>
              <td className="text-right py-4">{line.quantity}</td>
              <td className="text-right py-4">{formatCurrency(line.unit_price)}</td>
              <td className="text-right py-4 font-medium">{formatCurrency(line.line_gross)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-80 space-y-3">
          <div className="flex justify-between text-sm pb-3 border-b">
            <span className="text-gray-600">{t('pdf.subtotal')}</span>
            <span>{formatCurrency(invoice.total_net || 0)}</span>
          </div>
          <div className="flex justify-between text-sm pb-3 border-b">
            <span className="text-gray-600">{t('pdf.vatAmount')}</span>
            <span>{formatCurrency(invoice.total_vat || 0)}</span>
          </div>
          <div className="flex justify-between text-2xl font-light pt-3">
            <span>{t('pdf.totalAmount')}</span>
            <span style={{ color: template.config.accentColor }}>{formatCurrency(invoice.total_gross || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfessionalTemplate({ invoice, client, company, template, qrCodeUrl, weekNumber, t }: any) {
  return (
    <div className="space-y-6">
      <div className="border-2 p-6" style={{ borderColor: template.config.primaryColor }}>
        <div className="flex justify-between items-start">
          <div>
            {template.config.showLogo && company?.logo_url && (
              <img src={company.logo_url} alt="Logo" className="h-16 mb-4 object-contain" />
            )}
            <h1 className="text-2xl font-bold" style={{ color: template.config.primaryColor }}>
              {company?.name}
            </h1>
            <div className="text-sm mt-3 space-y-1">
              <p>{company?.address}</p>
              <p className="font-medium">KVK: {company?.kvk}</p>
              <p className="font-medium">BTW: {company?.vat_number}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-gray-100 px-6 py-4 rounded">
              <h2 className="text-2xl font-bold" style={{ color: template.config.accentColor }}>
                {t('pdf.invoice')}
              </h2>
              <p className="text-xl font-mono mt-2">{invoice.invoice_number}</p>
              {template.config.showWeekNumber && <p className="text-sm text-gray-500 mt-1">Week {weekNumber}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border-2 p-4" style={{ borderColor: template.config.accentColor }}>
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wide" style={{ color: template.config.primaryColor }}>
            {t('pdf.billTo')}
          </h3>
          <p className="font-medium text-lg">{client?.name}</p>
          <p className="text-sm text-gray-600 mt-1">{client?.address}</p>
        </div>
        <div className="border-2 p-4" style={{ borderColor: template.config.accentColor }}>
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wide" style={{ color: template.config.primaryColor }}>
            {t('pdf.invoiceDetails')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.issueDate')}:</span>
              <span className="font-medium">{invoice.issue_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.dueDate')}:</span>
              <span className="font-medium">{invoice.due_date}</span>
            </div>
          </div>
        </div>
      </div>

      <table className="w-full border-2" style={{ borderColor: template.config.primaryColor }}>
        <thead>
          <tr className="text-white" style={{ backgroundColor: template.config.primaryColor }}>
            <th className="text-left py-3 px-4 font-bold">#</th>
            <th className="text-left py-3 px-4 font-bold">{t('pdf.description')}</th>
            <th className="text-right py-3 px-4 font-bold">{t('pdf.quantity')}</th>
            <th className="text-right py-3 px-4 font-bold">{t('pdf.unitPrice')}</th>
            <th className="text-right py-3 px-4 font-bold">{t('pdf.total')}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines?.map((line: any, idx: number) => (
            <tr key={idx} className="border-b">
              <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
              <td className="py-3 px-4">{line.description}</td>
              <td className="text-right py-3 px-4">{line.quantity}</td>
              <td className="text-right py-3 px-4">{formatCurrency(line.unit_price)}</td>
              <td className="text-right py-3 px-4 font-bold">{formatCurrency(line.line_gross)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="border-2 p-4 w-96" style={{ borderColor: template.config.accentColor }}>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.subtotal')}:</span>
              <span className="font-medium">{formatCurrency(invoice.total_net || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.vatAmount')}:</span>
              <span className="font-medium">{formatCurrency(invoice.total_vat || 0)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t-2 text-lg font-bold" style={{ borderColor: template.config.primaryColor }}>
              <span>{t('pdf.totalAmount')}:</span>
              <span className="text-2xl" style={{ color: template.config.accentColor }}>
                {formatCurrency(invoice.total_gross || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreativeTemplate({ invoice, client, company, template, qrCodeUrl, weekNumber, t }: any) {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl p-8 text-white" style={{ 
        background: `linear-gradient(45deg, ${template.config.primaryColor} 0%, ${template.config.accentColor} 100%)` 
      }}>
        <div className="flex justify-between items-start">
          <div>
            {template.config.showLogo && company?.logo_url && (
              <img src={company.logo_url} alt="Logo" className="h-14 mb-4 brightness-0 invert object-contain" />
            )}
            <h1 className="text-3xl font-bold">{company?.name}</h1>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold">{t('pdf.invoice')}</h2>
            <p className="text-xl font-mono mt-2">{invoice.invoice_number}</p>
            {template.config.showWeekNumber && <p className="text-sm opacity-75 mt-1">Week {weekNumber}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg p-5" style={{ backgroundColor: `${template.config.accentColor}15` }}>
          <h3 className="font-bold mb-3 uppercase text-xs tracking-wider" style={{ color: template.config.primaryColor }}>
            {t('pdf.billTo')}
          </h3>
          <p className="font-bold text-lg">{client?.name}</p>
          <p className="text-sm text-gray-600 mt-1">{client?.address}</p>
        </div>
        <div className="rounded-lg p-5 border-2" style={{ borderColor: template.config.accentColor }}>
          <h3 className="font-bold mb-3 uppercase text-xs tracking-wider" style={{ color: template.config.primaryColor }}>
            {t('pdf.invoiceDetails')}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.issueDate')}</span>
              <span className="font-bold">{invoice.issue_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('pdf.dueDate')}</span>
              <span className="font-bold">{invoice.due_date}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border-2" style={{ borderColor: template.config.accentColor }}>
        <table className="w-full">
          <thead>
            <tr className="text-white" style={{ backgroundColor: template.config.primaryColor }}>
              <th className="text-left py-3 px-4 font-bold">{t('pdf.description')}</th>
              <th className="text-right py-3 px-4 font-bold">{t('pdf.quantity')}</th>
              <th className="text-right py-3 px-4 font-bold">{t('pdf.unitPrice')}</th>
              <th className="text-right py-3 px-4 font-bold">{t('pdf.total')}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines?.map((line: any, idx: number) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                <td className="py-3 px-4 font-medium">{line.description}</td>
                <td className="text-right py-3 px-4">{line.quantity}</td>
                <td className="text-right py-3 px-4">{formatCurrency(line.unit_price)}</td>
                <td className="text-right py-3 px-4 font-bold">{formatCurrency(line.line_gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="rounded-lg p-6 w-96" style={{ backgroundColor: `${template.config.accentColor}15` }}>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('pdf.subtotal')}</span>
              <span className="font-medium">{formatCurrency(invoice.total_net || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('pdf.vatAmount')}</span>
              <span className="font-medium">{formatCurrency(invoice.total_vat || 0)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 text-xl font-bold" style={{ borderColor: template.config.accentColor }}>
              <span>{t('pdf.totalAmount')}</span>
              <span style={{ color: template.config.accentColor }}>{formatCurrency(invoice.total_gross || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
