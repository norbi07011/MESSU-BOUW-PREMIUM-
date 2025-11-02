import { InvoiceTemplate } from '@/types';
import { defaultTemplates } from '@/lib/invoice-templates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface InvoiceTemplateSelectorProps {
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
}

export function InvoiceTemplateSelector({ selectedTemplateId, onSelect }: InvoiceTemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {defaultTemplates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg',
            selectedTemplateId === template.id && 'ring-2 ring-primary'
          )}
          onClick={() => onSelect(template.id)}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <Badge variant="outline" className="mt-1 text-xs">
                  {template.style}
                </Badge>
              </div>
              {selectedTemplateId === template.id && (
                <div className="bg-primary text-primary-foreground rounded-full p-1">
                  <Check size={16} weight="bold" />
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              {template.description}
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border" 
                  style={{ backgroundColor: template.config.primaryColor }}
                />
                <span className="text-xs text-muted-foreground">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border" 
                  style={{ backgroundColor: template.config.accentColor }}
                />
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {template.config.showLogo && (
                <Badge variant="secondary" className="text-xs">Logo</Badge>
              )}
              {template.config.showQRCode && (
                <Badge variant="secondary" className="text-xs">QR Code</Badge>
              )}
              {template.config.showWeekNumber && (
                <Badge variant="secondary" className="text-xs">Week #</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
