'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Upload,
  Star,
  Sparkles,
  RefreshCw,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/lib/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: 0,
    original_price: 0,
    stock: 0,
    badge: '',
    spec: '',
    description: '',
    image_url: '',
    is_active: true,
    is_featured: false,
  });

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      // Fetch Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catData) setCategories(catData as Category[]);

      // Fetch Products with category relation
      const { data: prodData, error } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (!error && prodData) {
        setProducts(prodData as Product[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  // Filter products by search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.spec?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || product.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || 'honey',
      price: 0,
      original_price: 0,
      stock: 10,
      badge: 'جديد',
      spec: '',
      description: '',
      image_url: '',
      is_active: true,
      is_featured: false,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: Number(product.price) || 0,
      original_price: Number(product.original_price) || 0,
      stock: product.stock || 0,
      badge: product.badge || '',
      spec: product.spec || '',
      description: product.description || '',
      image_url: product.image_url || '',
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setShowModal(true);
  };

  // Upload Image to Supabase Storage Bucket 'products'
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        alert(`فشل رفع الصورة: ${uploadError.message}`);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, image_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Toggle Active Status in DB
  const toggleActiveStatus = async (product: Product) => {
    const nextState = !product.is_active;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: nextState } : p))
    );

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: nextState, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) {
        // Rollback
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, is_active: product.is_active } : p))
        );
        alert('حدث خطأ أثناء تحديث حالة المنتج');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Featured Status
  const toggleFeaturedStatus = async (product: Product) => {
    const nextState = !product.is_featured;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_featured: nextState } : p))
    );

    try {
      await supabase
        .from('products')
        .update({ is_featured: nextState, updated_at: new Date().toISOString() })
        .eq('id', product.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Product (Insert / Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category_id) {
      alert('يرجى كتابة اسم المنتج واختيار القسم');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : null,
        stock: Number(formData.stock),
        badge: formData.badge || null,
        spec: formData.spec || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchProductsAndCategories();
    } catch (err: any) {
      alert(`فشل الحفظ: ${err.message}`);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج نهائياً؟')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`فشل الحذف: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-cyan-400" /> إدارة كتالوج المنتجات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل أسعار ومخزون المنتجات وتحديث حالات ظهورها في تطبيق الجوال فورياً
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" /> إضافة منتج جديد
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث عن منتج بالاسم، المواصفات أو الوصف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Category Select Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100 bg-[#0F172A] appearance-none cursor-pointer"
          >
            <option value="all">جميع الأقسام ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Interactive Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>يتم عرض {filteredProducts.length} من أصل {products.length} منتج</span>
          <button onClick={fetchProductsAndCategories} className="flex items-center gap-1.5 hover:text-cyan-400">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> إعادة تحميل
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-300 border-b border-white/10 font-bold">
                <th className="py-4 pr-6">المنتج</th>
                <th className="py-4">القسم</th>
                <th className="py-4">السعر الحسابي</th>
                <th className="py-4">المخزون</th>
                <th className="py-4">الشارة</th>
                <th className="py-4">تفعيل الظهور (Mobile)</th>
                <th className="py-4 pl-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    جاري تحميل المنتجات من Supabase...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد منتجات مطابقة لعملية البحث
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    {/* Product Name & Image */}
                    <td className="py-4 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0 relative">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                            {product.name}
                            {product.is_featured && (
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-xs">{product.spec || 'بدون مواصفات'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 text-xs font-semibold text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
                        {product.categories?.name || product.category_id}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-4">
                      <div className="font-extrabold text-cyan-400">{product.price} ر.س</div>
                      {product.original_price && Number(product.original_price) > Number(product.price) && (
                        <div className="text-[11px] text-slate-500 line-through">
                          {product.original_price} ر.س
                        </div>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.stock > 10
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : product.stock > 0
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {product.stock > 0 ? `${product.stock} قطعة` : 'نفذت الكمية'}
                      </span>
                    </td>

                    {/* Badge */}
                    <td className="py-4 text-xs">
                      {product.badge ? (
                        <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold">
                          {product.badge}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Active Toggle */}
                    <td className="py-4">
                      <button
                        onClick={() => toggleActiveStatus(product)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          product.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {product.is_active ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-400" /> نشط في التطبيق
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-500" /> متوقف
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleFeaturedStatus(product)}
                          title={product.is_featured ? 'إلغاء التمييز' : 'تمييز المنتج بالرئيسية'}
                          className={`p-2 rounded-xl border transition-all ${
                            product.is_featured
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          <Star className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(product)}
                          title="تعديل"
                          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          title="حذف"
                          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المنتج *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: عسل سدر بلدي فاخر"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">القسم *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white bg-[#0A1424]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">السعر (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">السعر قبل الخصم (اختياري)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">المخزون المتاح *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                {/* Badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الشارة (مثال: الأكثر مبيعاً)</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="الأكثر مبيعاً، حصري، خصم 20%"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>
              </div>

              {/* Spec */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">المواصفات السريعة (spec)</label>
                <input
                  type="text"
                  value={formData.spec}
                  onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                  placeholder="مثال: 500 جرام - طبيعي 100%"
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف التفصيلي</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب شرحاً وافياً عن المنتج ومزاياه..."
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              {/* Image Upload & URL */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">صورة المنتج</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="رابط الصورة الحالية أو رفع صورة..."
                    className="w-full p-3 rounded-xl glass-input text-sm text-white flex-1"
                  />
                  <label className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-white/10 transition-all">
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'جاري الرفع...' : 'رفع صورة إلى Supabase'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
                {formData.image_url && (
                  <div className="mt-2 w-20 h-20 rounded-xl bg-slate-900 border border-white/10 overflow-hidden">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  تفعيل المنتج فورياً في التطبيق
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  منتج مميز (في الشاشة الرئيسية)
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-lg hover:opacity-90"
                >
                  حفظ التغيرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
