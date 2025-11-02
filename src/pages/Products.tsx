import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks/useElectronDB';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, PencilSimple, Trash, Package } from '@phosphor-icons/react';
import { Product } from '@/types';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/invoice-utils';

export default function Products() {
  const { t, i18n } = useTranslation();
  const { products, createProduct, updateProduct, deleteProduct } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    unit_price: 0,
    vat_rate: 21,
  });

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products || [];
    const term = searchTerm.toLowerCase();
    return (products || []).filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description,
        unit_price: product.unit_price,
        vat_rate: product.vat_rate,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        unit_price: 0,
        vat_rate: 21,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success('Product updated');
      } else {
        await createProduct(formData);
        toast.success('Product created');
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Error saving product');
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('products.confirmDelete'))) {
      try {
        await deleteProduct(id);
        toast.success('Product deleted');
      } catch (error) {
        toast.error('Error deleting product');
        console.error('Delete error:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-purple-600 via-pink-600 to-rose-700 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                📦 {t('products.title')}
              </h1>
              <p className="text-pink-100 text-lg">Katalog produktów i usług</p>
            </div>
            <button 
              onClick={() => handleOpenDialog()}
              className="px-8 py-4 bg-linear-to-r from-amber-500 to-orange-600 text-white rounded-2xl hover:from-amber-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
            >
              <Plus className="inline mr-2" size={24} />
              {t('products.newProduct')}
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Modern Products Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/30 shadow-2xl">
          <div className="absolute inset-0 bg-linear-to-br from-slate-500/5 to-gray-500/5"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('products.title')}</h2>
                <p className="text-gray-600">Zarządzaj katalogiem produktów i usług</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package className="text-purple-600" size={24} />
              </div>
            </div>
            
            {/* Modern Search */}
            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder={t('products.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-md bg-white/60 backdrop-blur-sm border-2 border-purple-200 focus:border-purple-500 rounded-xl"
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 bg-linear-to-br from-purple-100 to-pink-100 rounded-3xl inline-block mb-6">
                  <Package className="text-purple-600" size={64} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('products.noProducts')}</h3>
                <p className="text-gray-600 mb-6 text-lg">{t('products.addFirst')}</p>
                <button 
                  onClick={() => handleOpenDialog()}
                  className="px-8 py-4 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 font-bold text-lg shadow-xl"
                >
                  <Plus className="inline mr-2" size={20} />
                  {t('products.newProduct')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {/* Modern Table Header */}
                  <div className="grid grid-cols-6 gap-4 p-4 bg-linear-to-r from-slate-100 to-gray-100 rounded-t-xl border-b border-gray-200">
                    <div className="font-bold text-gray-700">{t('products.code')}</div>
                    <div className="font-bold text-gray-700">{t('products.name')}</div>
                    <div className="font-bold text-gray-700">{t('products.description')}</div>
                    <div className="font-bold text-gray-700 text-right">{t('products.unitPrice')}</div>
                    <div className="font-bold text-gray-700 text-right">{t('products.vatRate')}</div>
                    <div className="font-bold text-gray-700 text-right">{t('products.actions')}</div>
                  </div>
                  
                  {/* Modern Table Body */}
                  <div className="space-y-2 p-2">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="group relative overflow-hidden rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 p-4 hover:bg-white/80 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.01]"
                      >
                        <div className="absolute inset-0 bg-linear-to-r from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-300"></div>
                        <div className="relative grid grid-cols-6 gap-4 items-center">
                          <div className="font-mono text-sm font-bold text-gray-900">{product.code}</div>
                          <div className="font-bold text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-600">{product.description}</div>
                          <div className="text-right font-mono font-bold text-gray-900">{formatCurrency(product.unit_price, i18n.language)}</div>
                          <div className="text-right font-mono font-bold text-purple-600">{product.vat_rate}%</div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenDialog(product)}
                                className="p-2 bg-purple-100 hover:bg-purple-200 rounded-xl transition-colors duration-200"
                                title="Edit product"
                              >
                                <PencilSimple className="text-purple-600" size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-2 bg-red-100 hover:bg-red-200 rounded-xl transition-colors duration-200"
                                title="Delete product"
                              >
                                <Trash className="text-red-600" size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-purple-200/20 rounded-full blur-xl group-hover:bg-pink-200/30 transition-all duration-300"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t('products.edit') : t('products.newProduct')}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Edit product information' : 'Add a new product or service'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('products.code')}</Label>
                <Input
                  id="code"
                  placeholder="PROD-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('products.name')} *</Label>
                <Input
                  id="name"
                  placeholder="Rioolreiniging"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('products.description')}</Label>
              <Input
                id="description"
                placeholder="Professionele rioolreiniging incl. materiaal"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_price">{t('products.unitPrice')} (EUR) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  placeholder="1500.00"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vat_rate">{t('products.vatRate')} (%) *</Label>
                <Input
                  id="vat_rate"
                  type="number"
                  step="0.01"
                  placeholder="21"
                  value={formData.vat_rate}
                  onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('products.cancel')}
            </Button>
            <Button onClick={handleSave}>{t('products.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
