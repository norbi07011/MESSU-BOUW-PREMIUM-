import { InvoiceTemplate } from '@/types';

export const defaultTemplates: InvoiceTemplate[] = [
  {
    id: 'classic',
    name: 'Classic Professional',
    style: 'classic',
    description: 'Traditional business invoice with clear structure and professional appearance',
    config: {
      primaryColor: 'oklch(0.20 0 0)',
      accentColor: 'oklch(0.45 0.15 250)',
      fontFamily: 'Inter',
      headerStyle: 'spacious',
      tableStyle: 'lined',
      footerStyle: 'detailed',
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
  {
    id: 'modern',
    name: 'Modern Blue',
    style: 'modern',
    description: 'Contemporary design with bold blue accents and clean typography',
    config: {
      primaryColor: 'oklch(0.45 0.15 250)',
      accentColor: 'oklch(0.55 0.20 250)',
      fontFamily: 'Inter',
      headerStyle: 'compact',
      tableStyle: 'striped',
      footerStyle: 'standard',
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    style: 'minimal',
    description: 'Minimalist layout focusing on essential information with maximum white space',
    config: {
      primaryColor: 'oklch(0.30 0 0)',
      accentColor: 'oklch(0.50 0.01 250)',
      fontFamily: 'Inter',
      headerStyle: 'centered',
      tableStyle: 'minimal',
      footerStyle: 'compact',
      showLogo: true,
      showQRCode: true,
      showBankDetails: false,
      showWeekNumber: false,
    },
  },
  {
    id: 'professional',
    name: 'Professional Corporate',
    style: 'professional',
    description: 'Executive-level invoice with detailed information and formal presentation',
    config: {
      primaryColor: 'oklch(0.25 0.05 260)',
      accentColor: 'oklch(0.40 0.12 260)',
      fontFamily: 'Inter',
      headerStyle: 'spacious',
      tableStyle: 'bordered',
      footerStyle: 'detailed',
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
  {
    id: 'creative',
    name: 'Creative Orange',
    style: 'creative',
    description: 'Vibrant and energetic design with orange accents for creative businesses',
    config: {
      primaryColor: 'oklch(0.50 0.15 40)',
      accentColor: 'oklch(0.60 0.20 40)',
      fontFamily: 'Inter',
      headerStyle: 'compact',
      tableStyle: 'striped',
      footerStyle: 'standard',
      showLogo: true,
      showQRCode: true,
      showBankDetails: true,
      showWeekNumber: true,
    },
  },
];

export function getTemplateById(templateId: string): InvoiceTemplate {
  return defaultTemplates.find(t => t.id === templateId) || defaultTemplates[0];
}

export function getTemplatePreviewStyles(template: InvoiceTemplate) {
  return {
    primaryColor: template.config.primaryColor,
    accentColor: template.config.accentColor,
    fontFamily: template.config.fontFamily,
  };
}
