'use client';

import React, { useEffect, useState } from 'react';
import {
  Pill,
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
  X,
  ArrowUpDown,
  Tag,
  HeartPulse,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PharmacyProduct } from '@/lib/types';

const SUBCATEGORIES = [
  { id: 'all', name: 'جميع الأصناف' },
  { id: 'medications', name: 'أدوية علاجية' },
  { id: 'vitamins', name: 'فيتامينات ومكملات' },
  { id: 'skincare', name: 'عناية بالبشرة' },
  { id: 'medical_supplies', name: 'مستلزمات طبية' },
  { id: 'baby_care', name: 'عناية بالأطفال' },
];

export default function PharmacyPage() {
  const [products, setProducts] = useState<PharmacyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PharmacyProduct | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    spec: '',
    description: '',
    price: 0,
    original_price: 0,
    discount_percentage: 0,
    badge: '15% خصم',
    image_url: '',
    subcategory: 'medications',
    is_active: true,
    sort_order: 1,
    stock: 20,
  });

  const fetchPharmacyProducts = async () => {
    setLoading(true);
    try {
      // Primary query: pharmacy_products table
      const { data, error } = await supabase
        .from('pharmacy_products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setProducts(data as PharmacyProduct[]);
      } else {
        // Fallback: Fetch from products table with category_id 'pharmacy' if exists
        const { data: fallbackData } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', 'pharmacy')
          .order('sort_order', { ascending: true });

        if (fallbackData) {
          const mapped: PharmacyProduct[] = fallbackData.map((p: any) => ({
            id: p.id,
            name: p.name,
            spec: p.spec || '',
            description: p.description || '',
            price: Number(p.price) || 0,
            original_price: p.original_price ? Number(p.original_price) : undefined,
            discount_percentage: p.original_price && p.price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0,
            badge: p.badge || '',
            image_url: p.image_url || '',
            subcategory: p.subcategory || 'medications',
            is_active: p.is_active,
            sort_order: p.sort_order || 0,
            stock: p.stock || 0,
          }));
          setProducts(mapped);
        }
      }
    } catch (e) {
      console.error('Error fetching pharmacy products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacyProducts();
  }, []);

  // Filter products by search query and subcategory
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.spec?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubcat =
      selectedSubcategory === 'all' || p.subcategory === selectedSubcategory;

    return matchesSearch && matchesSubcat;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      spec: '',
      description: '',
      price: 0,
      original_price: 0,
      discount_percentage: 0,
      badge: 'الأكثر مبيعاً',
      image_url: '',
      subcategory: 'medications',
      is_active: true,
      sort_order: products.length + 1,
      stock: 25,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (product: PharmacyProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      spec: product.spec || '',
      description: product.description || '',
      price: Number(product.price) || 0,
      original_price: Number(product.original_price) || 0,
      discount_percentage: product.discount_percentage || 0,
      badge: product.badge || '',
      image_url: product.image_url || '',
      subcategory: product.subcategory || 'medications',
      is_active: product.is_active,
      sort_order: product.sort_order || 0,
      stock: product.stock || 0,
    });
    setShowModal(true);
  };

  // Upload image to Supabase Storage bucket 'products' or 'pharmacy'
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pharmacy_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `pharmacy/${fileName}`;

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

  // Toggle active status in DB
  const toggleActiveStatus = async (product: PharmacyProduct) => {
    const nextState = !product.is_active;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: nextState } : p))
    );

    try {
      const { error } = await supabase
        .from('pharmacy_products')
        .update({ is_active: nextState, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) {
        // Fallback to products table if pharmacy_products query fails
        await supabase
          .from('products')
          .update({ is_active: nextState, updated_at: new Date().toISOString() })
          .eq('id', product.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update sort order priority
  const handleSortOrderChange = async (product: PharmacyProduct, newOrder: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, sort_order: newOrder } : p))
    );

    try {
      const { error } = await supabase
        .from('pharmacy_products')
        .update({ sort_order: newOrder, updated_at: new Date().toISOString() })
        .eq('id', product.id);

      if (error) {
        await supabase
          .from('products')
          .update({ sort_order: newOrder, updated_at: new Date().toISOString() })
          .eq('id', product.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save product (Insert or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('يرجى كتابة اسم المنتج وسعره الرئيسي');
      return;
    }

    try {
      // Calculate discount percentage if original_price is provided
      let calcDiscount = formData.discount_percentage;
      if (formData.original_price > formData.price && formData.original_price > 0) {
        calcDiscount = Math.round(((formData.original_price - formData.price) / formData.original_price) * 100);
      }

      const payload = {
        name: formData.name,
        spec: formData.spec || null,
        description: formData.description || null,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : null,
        discount_percentage: calcDiscount,
        badge: formData.badge || (calcDiscount > 0 ? `%${calcDiscount} خصم` : null),
        image_url: formData.image_url || null,
        subcategory: formData.subcategory,
        is_active: formData.is_active,
        sort_order: Number(formData.sort_order),
        stock: Number(formData.stock),
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('pharmacy_products')
          .update(payload)
          .eq('id', editingProduct.id);

        if (error) {
          // Fallback to products table
          await supabase
            .from('products')
            .update({
              name: payload.name,
              spec: payload.spec,
              description: payload.description,
              price: payload.price,
              original_price: payload.original_price,
              badge: payload.badge,
              image_url: payload.image_url,
              category_id: 'pharmacy',
              is_active: payload.is_active,
              sort_order: payload.sort_order,
              stock: payload.stock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingProduct.id);
        }
      } else {
        const { error } = await supabase.from('pharmacy_products').insert([payload]);
        if (error) {
          // Fallback to products table
          await supabase.from('products').insert([
            {
              name: payload.name,
              spec: payload.spec,
              description: payload.description,
              price: payload.price,
              original_price: payload.original_price,
              badge: payload.badge,
              image_url: payload.image_url,
              category_id: 'pharmacy',
              is_active: payload.is_active,
              sort_order: payload.sort_order,
              stock: payload.stock,
            },
          ]);
        }
      }

      setShowModal(false);
      fetchPharmacyProducts();
    } catch (err: any) {
      alert(`فشل الحفظ: ${err.message}`);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج الصيدلاني نهائياً؟')) return;
    try {
      const { error } = await supabase.from('pharmacy_products').delete().eq('id', id);
      if (error) {
        await supabase.from('products').delete().eq('id', id);
      }
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
            <Pill className="w-7 h-7 text-cyan-400" /> إدارة قسم الصيدليات والأدوية
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إضافة وتعديل الأدوية، الفيتامينات، مستحضرات العناية بالبشرة، وترتيب أولويات الظهور بحسب الصنف
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" /> إضافة منتج صيدلاني جديد
        </button>
      </div>

      {/* Subcategory Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {SUBCATEGORIES.map((cat) => {
          const isSelected = selectedSubcategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedSubcategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث باسم المنتج الصيدلاني، التركيز/الوصف، أو الصنف الفرعي..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>عرض {filteredProducts.length} من أصل {products.length} منتج صيدلاني</span>
          <button onClick={fetchPharmacyProducts} className="flex items-center gap-1.5 hover:text-cyan-400">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث البيانات
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-300 border-b border-white/10 font-bold">
                <th className="py-4 pr-6">المنتج الصيدلاني</th>
                <th className="py-4">الصنف الفرعي</th>
                <th className="py-4">السعر الخصمي</th>
                <th className="py-4">الشارة (Badge)</th>
                <th className="py-4">ترتيب الأولوية (`sort_order`)</th>
                <th className="py-4">الحالة (`is_active`)</th>
                <th className="py-4 pl-6 text-center">خيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    جاري تحميل منتجات قسم الصيدليات...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد منتجات صيدلانية مطابقة لعملية البحث
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    {/* Name & Spec */}
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
                            <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-950/30">
                              <Pill className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-400 truncate max-w-xs">
                            {product.spec || 'بدون تركيز/مواصفات'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Subcategory */}
                    <td className="py-4 text-xs font-semibold text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {SUBCATEGORIES.find((s) => s.id === product.subcategory)?.name || product.subcategory}
                      </span>
                    </td>

                    {/* Price & Original Price */}
                    <td className="py-4">
                      <div className="font-extrabold text-cyan-400">{product.price} ر.س</div>
                      {product.original_price && Number(product.original_price) > Number(product.price) && (
                        <div className="text-[11px] text-slate-500 line-through">
                          {product.original_price} ر.س
                        </div>
                      )}
                    </td>

                    {/* Badge */}
                    <td className="py-4 text-xs">
                      {product.badge ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 w-fit">
                          <Tag className="w-3 h-3" /> {product.badge}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Sort Order Input */}
                    <td className="py-4">
                      <input
                        type="number"
                        value={product.sort_order}
                        onChange={(e) => handleSortOrderChange(product, Number(e.target.value))}
                        className="w-16 p-1.5 rounded-lg glass-input text-center text-xs text-cyan-300 font-mono font-bold"
                      />
                    </td>

                    {/* Active Toggle */}
                    <td className="py-4">
                      <button
                        onClick={() => toggleActiveStatus(product)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          product.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {product.is_active ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-400" /> مفعّل
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-500" /> مخفي
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-6 text-center">
                      <div className="flex items-center justify-center gap-2">
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
                <HeartPulse className="w-5 h-5 text-cyan-400" />
                {editingProduct ? 'تعديل منتج صيدلاني' : 'إضافة منتج صيدلاني جديد'}
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">العنوان / اسم الدواء *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: فيتامين د3 - 5000 وحدة"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الصنف الفرعي *</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white bg-[#0A1424]"
                  >
                    {SUBCATEGORIES.filter((s) => s.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">السعر الحالي (ر.س) *</label>
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

                {/* Badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الشارة / الـ Badge (مثال: 15% خصم)</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="15% خصم، الأكثر مبيعاً، وصفة سريعة"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                {/* Sort order */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ترتيب الأولوية (`sort_order`)</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Spec / Concentration */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">التركيز / الوصف السريع (`spec`)</label>
                <input
                  type="text"
                  value={formData.spec}
                  onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                  placeholder="مثال: 60 كبسولة - تركيز 1000 ملجم"
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف والتعليمات</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اكتب طريقة الاستخدام والجرعات الموصى بها..."
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">صورة المنتج الصيدلاني</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="رابط الصورة أو رفع ملف..."
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

              {/* Active Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  تفعيل ظهور المنتج بالصيدلية فورياً
                </label>
              </div>

              {/* Action Buttons */}
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
                  حفظ المنتَج
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
