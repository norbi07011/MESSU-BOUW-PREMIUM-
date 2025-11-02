import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoices, useClients } from '@/hooks/useElectronDB';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  ComposedChart, ReferenceLine, Label 
} from 'recharts';
import { Invoice, Client } from '@/types';
import { formatCurrency } from '@/lib/invoice-utils';
import { DownloadSimple, TrendUp, TrendDown, Warning, CheckCircle, Info } from '@phosphor-icons/react';
import { toast } from 'sonner';

const DUTCH_TAX_THRESHOLDS_2024 = {
  ZZP_LOWER_THRESHOLD: 23000,
  ZZP_UPPER_THRESHOLD: 75518,
  VAT_SMALL_BUSINESS_THRESHOLD: 25000,
  INCOME_TAX_BOX1_BRACKET1: 75518,
  INCOME_TAX_BOX1_BRACKET2: 0,
  ZELFSTANDIGENAFTREK: 3750,
  MKBWINSTVRIJSTELLING: 0.14,
  SOCIAL_SECURITY_BASE: 6000,
};

const TAX_RATES = {
  VAT_STANDARD: 21,
  VAT_REDUCED: 9,
  VAT_ZERO: 0,
  INCOME_TAX_BRACKET1: 36.97,
  INCOME_TAX_BRACKET2: 49.5,
};

export default function Reports() {
  const { t, i18n } = useTranslation();
  const { invoices } = useInvoices();
  const { clients } = useClients();
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    (invoices || []).forEach(inv => {
      const year = new Date(inv.issue_date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [invoices]);

  const report = useMemo(() => {
    const year = parseInt(selectedYear);
    const yearInvoices = (invoices || []).filter(inv => {
      const invYear = new Date(inv.issue_date).getFullYear();
      return invYear === year;
    });

    const totalNet = yearInvoices.reduce((sum, inv) => sum + inv.total_net, 0);
    const totalVat = yearInvoices.reduce((sum, inv) => sum + inv.total_vat, 0);
    const totalGross = yearInvoices.reduce((sum, inv) => sum + inv.total_gross, 0);

    const vatBreakdown = yearInvoices.reduce((acc, inv) => {
      inv.lines.forEach(line => {
        const rate = line.vat_rate;
        if (!acc[rate]) {
          acc[rate] = { net: 0, vat: 0, gross: 0, count: 0 };
        }
        acc[rate].net += line.line_net;
        acc[rate].vat += line.line_vat;
        acc[rate].gross += line.line_gross;
        acc[rate].count += 1;
      });
      return acc;
    }, {} as Record<number, { net: number; vat: number; gross: number; count: number }>);

    const clientTotals = new Map<string, { name: string; total: number; count: number }>();
    yearInvoices.forEach(inv => {
      const client = clients?.find(c => c.id === inv.client_id);
      const clientName = client?.name || 'Unknown';
      const existing = clientTotals.get(inv.client_id) || { name: clientName, total: 0, count: 0 };
      clientTotals.set(inv.client_id, {
        name: clientName,
        total: existing.total + inv.total_gross,
        count: existing.count + 1,
      });
    });

    const topClients = Array.from(clientTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthInvoices = yearInvoices.filter(inv => {
        const invMonth = new Date(inv.issue_date).getMonth() + 1;
        return invMonth === month;
      });
      const monthNet = monthInvoices.reduce((sum, inv) => sum + inv.total_net, 0);
      const monthVat = monthInvoices.reduce((sum, inv) => sum + inv.total_vat, 0);
      const monthGross = monthInvoices.reduce((sum, inv) => sum + inv.total_gross, 0);
      
      return {
        month,
        monthName: t(`months.${month}`),
        totalNet: monthNet,
        totalVat: monthVat,
        totalGross: monthGross,
        count: monthInvoices.length,
        cumulative: 0,
      };
    });

    let cumulative = 0;
    monthlyData.forEach(m => {
      cumulative += m.totalGross;
      m.cumulative = cumulative;
    });

    const quarterlyData = [
      {
        quarter: 'Q1',
        months: [1, 2, 3],
        revenue: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalGross, 0),
        net: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalNet, 0),
        vat: monthlyData.slice(0, 3).reduce((sum, m) => sum + m.totalVat, 0),
      },
      {
        quarter: 'Q2',
        months: [4, 5, 6],
        revenue: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.totalGross, 0),
        net: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.totalNet, 0),
        vat: monthlyData.slice(3, 6).reduce((sum, m) => sum + m.totalVat, 0),
      },
      {
        quarter: 'Q3',
        months: [7, 8, 9],
        revenue: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.totalGross, 0),
        net: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.totalNet, 0),
        vat: monthlyData.slice(6, 9).reduce((sum, m) => sum + m.totalVat, 0),
      },
      {
        quarter: 'Q4',
        months: [10, 11, 12],
        revenue: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.totalGross, 0),
        net: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.totalNet, 0),
        vat: monthlyData.slice(9, 12).reduce((sum, m) => sum + m.totalVat, 0),
      },
    ];

    const taxAnalysis = {
      estimatedIncomeTax: 0,
      zelfstandigenaftrek: DUTCH_TAX_THRESHOLDS_2024.ZELFSTANDIGENAFTREK,
      mkbWinstvrijstelling: totalNet * DUTCH_TAX_THRESHOLDS_2024.MKBWINSTVRIJSTELLING,
      taxableIncome: Math.max(0, totalNet - DUTCH_TAX_THRESHOLDS_2024.ZELFSTANDIGENAFTREK),
      socialSecurity: DUTCH_TAX_THRESHOLDS_2024.SOCIAL_SECURITY_BASE,
      vatToReturn: totalVat,
      netAfterTax: 0,
    };

    if (taxAnalysis.taxableIncome <= DUTCH_TAX_THRESHOLDS_2024.INCOME_TAX_BOX1_BRACKET1) {
      taxAnalysis.estimatedIncomeTax = taxAnalysis.taxableIncome * (TAX_RATES.INCOME_TAX_BRACKET1 / 100);
    } else {
      const bracket1Tax = DUTCH_TAX_THRESHOLDS_2024.INCOME_TAX_BOX1_BRACKET1 * (TAX_RATES.INCOME_TAX_BRACKET1 / 100);
      const bracket2Tax = (taxAnalysis.taxableIncome - DUTCH_TAX_THRESHOLDS_2024.INCOME_TAX_BOX1_BRACKET1) * (TAX_RATES.INCOME_TAX_BRACKET2 / 100);
      taxAnalysis.estimatedIncomeTax = bracket1Tax + bracket2Tax;
    }

    taxAnalysis.netAfterTax = totalNet - taxAnalysis.estimatedIncomeTax - taxAnalysis.socialSecurity + taxAnalysis.mkbWinstvrijstelling;

    const statusWarnings: Array<{ type: string; message: string }> = [];
    if (totalGross >= DUTCH_TAX_THRESHOLDS_2024.ZZP_UPPER_THRESHOLD) {
      statusWarnings.push({
        type: 'info',
        message: `Revenue exceeds €${DUTCH_TAX_THRESHOLDS_2024.ZZP_UPPER_THRESHOLD.toLocaleString()} - Consider VAR (Verklaring Arbeidsrelatie) requirements`,
      });
    }
    if (totalNet >= DUTCH_TAX_THRESHOLDS_2024.VAT_SMALL_BUSINESS_THRESHOLD) {
      statusWarnings.push({
        type: 'warning',
        message: `Revenue exceeds €${DUTCH_TAX_THRESHOLDS_2024.VAT_SMALL_BUSINESS_THRESHOLD.toLocaleString()} - Small business VAT exemption (KOR) not applicable`,
      });
    }

    return {
      totalNet,
      totalVat,
      totalGross,
      invoiceCount: yearInvoices.length,
      topClients,
      monthlyData,
      quarterlyData,
      vatBreakdown,
      taxAnalysis,
      statusWarnings,
    };
  }, [selectedYear, invoices, clients, t]);

  const handleExportCSV = () => {
    const year = parseInt(selectedYear);
    const yearInvoices = (invoices || []).filter(inv => {
      const invYear = new Date(inv.issue_date).getFullYear();
      return invYear === year;
    });

    const headers = [
      'Invoice Number',
      'Client',
      'Issue Date',
      'Due Date',
      'Net',
      'VAT',
      'Gross',
      'Status',
    ];

    const rows = yearInvoices.map(inv => {
      const client = clients?.find(c => c.id === inv.client_id);
      return [
        inv.invoice_number,
        client?.name || 'Unknown',
        inv.issue_date,
        inv.due_date,
        inv.total_net.toFixed(2),
        inv.total_vat.toFixed(2),
        inv.total_gross.toFixed(2),
        inv.status,
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices-${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  if (availableYears.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-3xl font-semibold mb-6">{t('reports.title')}</h1>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">{t('reports.noData')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vatPieData = Object.entries(report.vatBreakdown).map(([rate, data]: [string, any]) => ({
    name: `${rate}% VAT`,
    value: data.gross,
    vatAmount: data.vat,
  }));

  const COLORS = ['oklch(0.45 0.15 250)', 'oklch(0.55 0.20 250)', 'oklch(0.65 0.10 250)', 'oklch(0.75 0.05 250)'];

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{t('reports.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive financial analysis for Dutch ZZP (Zelfstandige Zonder Personeel)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV}>
            <DownloadSimple className="mr-2" />
            {t('reports.exportCSV')}
          </Button>
        </div>
      </div>

      {report.statusWarnings.length > 0 && (
        <div className="space-y-2">
          {report.statusWarnings.map((warning, idx) => (
            <Card key={idx} className={warning.type === 'warning' ? 'border-yellow-500' : 'border-blue-500'}>
              <CardContent className="flex items-start gap-3 p-4">
                {warning.type === 'warning' ? (
                  <Warning className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                ) : (
                  <Info className="text-blue-600 shrink-0 mt-0.5" size={20} />
                )}
                <p className="text-sm">{warning.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="tax">Dutch Tax Analysis</TabsTrigger>
          <TabsTrigger value="vat">VAT Breakdown</TabsTrigger>
          <TabsTrigger value="clients">Client Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue (Gross)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{formatCurrency(report.totalGross, i18n.language)}</div>
                <p className="text-xs text-muted-foreground mt-1">Including VAT</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Net Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{formatCurrency(report.totalNet, i18n.language)}</div>
                <p className="text-xs text-muted-foreground mt-1">Excluding VAT</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total VAT Collected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{formatCurrency(report.totalVat, i18n.language)}</div>
                <p className="text-xs text-muted-foreground mt-1">To be returned to Belastingdienst</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Invoice Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{report.invoiceCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Total invoices in {selectedYear}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quarterly Performance</CardTitle>
                <CardDescription>Revenue distribution across quarters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.quarterlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="quarter" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                      <Legend />
                      <Bar dataKey="net" fill="oklch(0.45 0.15 250)" name="Net Revenue" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="vat" fill="oklch(0.55 0.20 250)" name="VAT" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>VAT Distribution by Rate</CardTitle>
                <CardDescription>Breakdown of revenue by VAT category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vatPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {vatPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dutch ZZP Tax Thresholds {selectedYear}</CardTitle>
              <CardDescription>Annual income limits and regulatory thresholds for freelancers in the Netherlands</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">VAT Small Business Exemption (KOR)</span>
                    <span className="text-sm font-mono">€{DUTCH_TAX_THRESHOLDS_2024.VAT_SMALL_BUSINESS_THRESHOLD.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min((report.totalNet / DUTCH_TAX_THRESHOLDS_2024.VAT_SMALL_BUSINESS_THRESHOLD) * 100, 100)} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {formatCurrency(report.totalNet, i18n.language)} ({((report.totalNet / DUTCH_TAX_THRESHOLDS_2024.VAT_SMALL_BUSINESS_THRESHOLD) * 100).toFixed(1)}%)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">ZZP Lower Income Threshold</span>
                    <span className="text-sm font-mono">€{DUTCH_TAX_THRESHOLDS_2024.ZZP_LOWER_THRESHOLD.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min((report.totalNet / DUTCH_TAX_THRESHOLDS_2024.ZZP_LOWER_THRESHOLD) * 100, 100)} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum for tax deductions eligibility
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">ZZP Upper Income Threshold (VAR)</span>
                    <span className="text-sm font-mono">€{DUTCH_TAX_THRESHOLDS_2024.ZZP_UPPER_THRESHOLD.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min((report.totalGross / DUTCH_TAX_THRESHOLDS_2024.ZZP_UPPER_THRESHOLD) * 100, 100)} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Above this: VAR declaration required
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Income Tax Bracket 1 Limit</span>
                    <span className="text-sm font-mono">€{DUTCH_TAX_THRESHOLDS_2024.INCOME_TAX_BOX1_BRACKET1.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={Math.min((report.taxAnalysis.taxableIncome / DUTCH_TAX_THRESHOLDS_2024.INCOME_TAX_BOX1_BRACKET1) * 100, 100)} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tax rate: {TAX_RATES.INCOME_TAX_BRACKET1}% (above: {TAX_RATES.INCOME_TAX_BRACKET2}%)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Breakdown</CardTitle>
              <CardDescription>Detailed revenue analysis by month for {selectedYear}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={report.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalNet" fill="oklch(0.45 0.15 250)" name="Net Revenue" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="totalVat" fill="oklch(0.55 0.20 250)" name="VAT" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="oklch(0.65 0.15 150)" strokeWidth={3} name="Cumulative Revenue" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cumulative Revenue Growth</CardTitle>
              <CardDescription>Year-to-date cumulative revenue progression</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.monthlyData}>
                    <defs>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.45 0.15 250)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="oklch(0.45 0.15 250)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="oklch(0.45 0.15 250)" 
                      fillOpacity={1} 
                      fill="url(#colorCumulative)" 
                      name="Cumulative Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Invoice Count</CardTitle>
              <CardDescription>Number of invoices issued per month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="oklch(0.55 0.20 250)" name="Invoice Count" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Gross Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">{formatCurrency(report.totalNet, i18n.language)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total revenue before deductions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Zelfstandigenaftrek</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">
                  -{formatCurrency(report.taxAnalysis.zelfstandigenaftrek, i18n.language)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Self-employed tax deduction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">MKB Winstvrijstelling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono text-green-600">
                  -{formatCurrency(report.taxAnalysis.mkbWinstvrijstelling, i18n.language)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">14% profit exemption for SMEs</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estimated Tax Calculation for {selectedYear}</CardTitle>
              <CardDescription>Comprehensive tax breakdown for Dutch ZZP freelancers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Gross Income (Net Revenue)</span>
                  <span className="font-mono font-semibold">{formatCurrency(report.totalNet, i18n.language)}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b text-green-600">
                  <span className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    Zelfstandigenaftrek (Self-Employed Deduction)
                  </span>
                  <span className="font-mono">-{formatCurrency(report.taxAnalysis.zelfstandigenaftrek, i18n.language)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b">
                  <span className="font-medium">Taxable Income (Box 1)</span>
                  <span className="font-mono font-semibold">{formatCurrency(report.taxAnalysis.taxableIncome, i18n.language)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b text-red-600">
                  <span>Estimated Income Tax</span>
                  <span className="font-mono">-{formatCurrency(report.taxAnalysis.estimatedIncomeTax, i18n.language)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b text-green-600">
                  <span className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    MKB Winstvrijstelling (14%)
                  </span>
                  <span className="font-mono">+{formatCurrency(report.taxAnalysis.mkbWinstvrijstelling, i18n.language)}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b text-red-600">
                  <span>Social Security Contributions (Estimated)</span>
                  <span className="font-mono">-{formatCurrency(report.taxAnalysis.socialSecurity, i18n.language)}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-t-2 border-primary mt-2">
                  <span className="font-bold text-lg">Estimated Net After Tax</span>
                  <span className="font-mono font-bold text-lg text-primary">
                    {formatCurrency(report.taxAnalysis.netAfterTax, i18n.language)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 bg-muted rounded-lg px-4">
                  <span className="font-medium">Effective Tax Rate</span>
                  <span className="font-mono font-semibold">
                    {((1 - (report.taxAnalysis.netAfterTax / report.totalNet)) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Info size={16} className="text-blue-600" />
                  Important Notes:
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Zelfstandigenaftrek: €{DUTCH_TAX_THRESHOLDS_2024.ZELFSTANDIGENAFTREK.toLocaleString()} deduction for qualifying self-employed individuals</li>
                  <li>• MKB Winstvrijstelling: 14% of profit is tax-exempt for small and medium enterprises</li>
                  <li>• Income tax rates: {TAX_RATES.INCOME_TAX_BRACKET1}% up to €{DUTCH_TAX_THRESHOLDS_2024.INCOME_TAX_BOX1_BRACKET1.toLocaleString()}, {TAX_RATES.INCOME_TAX_BRACKET2}% above</li>
                  <li>• Social security contributions vary based on personal circumstances</li>
                  <li>• This is an estimate - consult a tax advisor for accurate calculations</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Burden Visualization</CardTitle>
              <CardDescription>Visual breakdown of income distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: 'Income Distribution',
                        'Net After Tax': report.taxAnalysis.netAfterTax,
                        'Income Tax': report.taxAnalysis.estimatedIncomeTax,
                        'Social Security': report.taxAnalysis.socialSecurity,
                      }
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                    <Legend />
                    <Bar dataKey="Net After Tax" stackId="a" fill="oklch(0.65 0.15 150)" />
                    <Bar dataKey="Income Tax" stackId="a" fill="oklch(0.577 0.245 27.325)" />
                    <Bar dataKey="Social Security" stackId="a" fill="oklch(0.55 0.20 250)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>VAT Summary</CardTitle>
              <CardDescription>Total VAT collected to be returned to Belastingdienst</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono text-primary mb-2">
                {formatCurrency(report.totalVat, i18n.language)}
              </div>
              <p className="text-sm text-muted-foreground">
                VAT amount to be returned in quarterly or monthly declarations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>VAT Breakdown by Rate</CardTitle>
              <CardDescription>Detailed analysis of revenue and VAT by tax rate</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>VAT Rate</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-right">VAT Amount</TableHead>
                    <TableHead className="text-right">Gross Amount</TableHead>
                    <TableHead className="text-right">Line Items</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(report.vatBreakdown).map(([rate, data]: [string, any]) => (
                    <TableRow key={rate}>
                      <TableCell className="font-medium">
                        <Badge variant={rate === '21' ? 'default' : rate === '9' ? 'secondary' : 'outline'}>
                          {rate}% {rate === '21' ? '(Standard)' : rate === '9' ? '(Reduced)' : '(Zero/Reverse)'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(data.net, i18n.language)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {formatCurrency(data.vat, i18n.language)}
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(data.gross, i18n.language)}</TableCell>
                      <TableCell className="text-right font-mono">{data.count}</TableCell>
                      <TableCell className="text-right font-mono">
                        {((data.gross / report.totalGross) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>VAT Revenue Distribution</CardTitle>
              <CardDescription>Visual comparison of revenue across VAT categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.entries(report.vatBreakdown).map(([rate, data]: [string, any]) => ({
                    rate: `${rate}% VAT`,
                    net: data.net,
                    vat: data.vat,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rate" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                    <Legend />
                    <Bar dataKey="net" fill="oklch(0.45 0.15 250)" name="Net Amount" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vat" fill="oklch(0.55 0.20 250)" name="VAT Amount" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dutch VAT Rates Explanation</CardTitle>
              <CardDescription>Understanding VAT categories in the Netherlands</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <Badge className="mb-2">21% Standard Rate</Badge>
                  <h4 className="font-semibold text-sm mb-2">Algemeen tarief (BTW)</h4>
                  <p className="text-xs text-muted-foreground">
                    Applied to most goods and services in the Netherlands. This is the default rate for B2B and B2C transactions.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <Badge variant="secondary" className="mb-2">9% Reduced Rate</Badge>
                  <h4 className="font-semibold text-sm mb-2">Verlaagd tarief (BTW)</h4>
                  <p className="text-xs text-muted-foreground">
                    Applied to specific goods like food, books, medicines, passenger transport, and accommodation services.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <Badge variant="outline" className="mb-2">0% Zero Rate</Badge>
                  <h4 className="font-semibold text-sm mb-2">Reverse Charge / Export</h4>
                  <p className="text-xs text-muted-foreground">
                    Used for exports outside EU, reverse charge B2B services within EU, or specific exempt services.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Warning size={16} className="text-yellow-600" />
                  VAT Filing Requirements:
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Monthly filing if annual turnover {'>'} €1,883,000</li>
                  <li>• Quarterly filing for most ZZP/SME businesses</li>
                  <li>• Deadline: 1 month after end of period</li>
                  <li>• Small Business Exemption (KOR): Available if turnover {'<'} €25,000</li>
                  <li>• Keep VAT records for 7 years</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Revenue</CardTitle>
              <CardDescription>Top 10 clients contributing to {selectedYear} revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {report.topClients.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t('reports.noData')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Client Name</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                      <TableHead className="text-right">Invoice Count</TableHead>
                      <TableHead className="text-right">Avg per Invoice</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.topClients.map((client, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-bold text-muted-foreground">#{index + 1}</TableCell>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(client.total, i18n.language)}
                        </TableCell>
                        <TableCell className="text-right font-mono">{client.count}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(client.total / client.count, i18n.language)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {((client.total / report.totalGross) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Revenue Distribution</CardTitle>
              <CardDescription>Visual comparison of top client contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} fontSize={12} />
                    <Tooltip formatter={(value: number) => formatCurrency(value, i18n.language)} />
                    <Bar dataKey="total" fill="oklch(0.45 0.15 250)" name="Revenue" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
