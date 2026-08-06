'use client';

import React, { useEffect, useState } from 'react';
import {
  Layers,
  Edit,
  Save,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  Package,
  Pill,
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Tag,
  HeartPulse,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Category, CategoryStat, PharmacyProduct } from '@/lib/types';

const SUBCATEGORIES = [
  { id: 'all', name: 'جميع الأصناف' },
  { id: 'medications', name: 'أدوية علاجية' },
  { id: 'vitamins', name: 'فيتامينات ومكملات' },
  { id: 'skincare', name: 'عناية بالبشرة' },
  { id: 'medical_supplies', name: 'مستلزمات طبية' },
  { id: 'baby_care', name: 'عناية بالأطفال' },
];

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'pharmacy'>('categories');

  // --- Categories State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStat>>({});
  const [loadingCats, setLoadingCats] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', sort_order: 0 });

  // --- Pharmacy State ---
  const [pharmacyProducts, setPharmacyProducts] = useState<PharmacyProduct[]>([]);
  const [loadingPharmacy, setLoadingPharmacy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PharmacyProduct | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [pharmacyFormData, setPharmacyFormData] = useState({
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

  const fetchCategoriesAndStats = async () => {
    setLoadingCats(true);
    try {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!catError && catData) {
        setCategories(catData as Category[]);
      }

      const { data: statsData, error: statsError } = await supabase
        .from('category_stats')
        .select('*');

      if (!statsError && statsData) {
        const statsMap: Record<string, CategoryStat> = {};
        (statsData as CategoryStat[]).forEach((stat) => {
          statsMap[stat.id] = stat;
        });
        setCategoryStats(statsMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCats(false);
    }
  };

  const fetchPharmacyProducts = async () => {
    setLoadingPharmacy(true);
    try {
      const { data, error } = await supabase
        .from('pharmacy_products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setPharmacyProducts(data as PharmacyProduct[]);
      } else {
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
          setPharmacyProducts(mapped);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPharmacy(false);
    }
  };

  useEffect(() => {
    fetchCategoriesAndStats();
    fetchPharmacyProducts();
  }, []);

  // Category Actions
  const handleStartEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({ name: category.name, sort_order: category.sort_order || 0 });
  };

  const handleSaveCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editForm.name, sort_order: Number(editForm.sort_order) })
        .eq('id', id);

      if (error) throw error;
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: editForm.name, sort_order: Number(editForm.sort_order) } : c))
      );
      setEditingId(null);
    } catch (err: any) {
      alert(`فشل التعديل: ${err.message}`);
    }
  };

  const toggleCategoryActive = async (category: Category) => {
    const nextActive = !category.is_active;
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? { ...c, is_active: nextActive } : c))
    );
    try {
      await supabase.from('categories').update({ is_active: nextActive }).eq('id', category.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Pharmacy Actions
  const filteredPharmacyProducts = pharmacyProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.spec?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubcat = selectedSubcategory === 'all' || p.subcategory === selectedSubcategory;
    return matchesSearch && matchesSubcat;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setPharmacyFormData({
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
      sort_order: pharmacyProducts.length + 1,
      stock: 25,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (product: PharmacyProduct) => {
    setEditingProduct(product);
    setPharmacyFormData({
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pharmacy_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `pharmacy/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
      if (uploadError) {
        alert(`فشل رفع الصورة: ${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath);
      setPharmacyFormData((prev) => ({ ...prev, image_url: publicUrlData.publicUrl }));
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const togglePharmacyActiveStatus = async (product: PharmacyProduct) => {
    const nextState = !product.is_active;
    setPharmacyProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: nextState } : p))
    );
    try {
      const { error } = await supabase
        .from('pharmacy_products')
        .update({ is_active: nextState, updated_at: new Date().toISOString() })
        .eq('id', product.id);
      if (error) {
        await supabase
          .from('products')
          .update({ is_active: nextState, updated_at: new Date().toISOString() })
          .eq('id', product.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePharmacyProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyFormData.name || !pharmacyFormData.price) {
      alert('يرجى كتابة اسم المنتج وسعره');
      return;
    }
    try {
      let calcDiscount = pharmacyFormData.discount_percentage;
      if (pharmacyFormData.original_price > pharmacyFormData.price && pharmacyFormData.original_price > 0) {
        calcDiscount = Math.round(((pharmacyFormData.original_price - pharmacyFormData.price) / pharmacyFormData.original_price) * 100);
      }
      const payload = {
        name: pharmacyFormData.name,
        spec: pharmacyFormData.spec || null,
        description: pharmacyFormData.description || null,
        price: Number(pharmacyFormData.price),
        original_price: pharmacyFormData.original_price ? Number(pharmacyFormData.original_price) : null,
        discount_percentage: calcDiscount,
        badge: pharmacyFormData.badge || (calcDiscount > 0 ? `%${calcDiscount} خصم` : null),
        image_url: pharmacyFormData.image_url || null,
        subcategory: pharmacyFormData.subcategory,
        is_active: pharmacyFormData.is_active,
        sort_order: Number(pharmacyFormData.sort_order),
        stock: Number(pharmacyFormData.stock),
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase.from('pharmacy_products').update(payload).eq('id', editingProduct.id);
        if (error) {
          await supabase.from('products').update({
            name: payload.name, spec: payload.spec, description: payload.description,
            price: payload.price, original_price: payload.original_price, badge: payload.badge,
            image_url: payload.image_url, category_id: 'pharmacy', is_active: payload.is_active,
            sort_order: payload.sort_order, stock: payload.stock, updated_at: new Date().toISOString(),
          }).eq('id', editingProduct.id);
        }
      } else {
        const { error } = await supabase.from('pharmacy_products').insert([payload]);
        if (error) {
          await supabase.from('products').insert([{
            name: payload.name, spec: payload.spec, description: payload.description,
            price: payload.price, original_price: payload.original_price, badge: payload.badge,
            image_url: payload.image_url, category_id: 'pharmacy', is_active: payload.is_active,
            sort_order: payload.sort_order, stock: payload.stock,
          }]);
        }
      }
      setShowModal(false);
      fetchPharmacyProducts();
    } catch (err: any) {
      alert(`فشل الحفظ: ${err.message}`);
    }
  };

  const handleDeletePharmacyProduct = async (id: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج نهائياً؟')) return;
    try {
      const { error } = await supabase.from('pharmacy_products').delete().eq('id', id);
      if (error) await supabase.from('products').delete().eq('id', id);
      setPharmacyProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`فشل الحذف: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Main Navigation Tabs inside Category Management */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-cyan-400" /> إدارة الأقسام والقطاعات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة كافة أقسام التطبيق وتخصيص منتجات قسم الصيدليات والأدوية بالكامل من شاشة واحدة
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'categories'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> الأقسام العامة ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('pharmacy')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'pharmacy'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Pill className="w-4 h-4" /> منتجات الصيدلية ({pharmacyProducts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: General Categories Grid */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" /> الأقسام الرئيسية في التطبيق
            </h2>
            <button
              onClick={fetchCategoriesAndStats}
              disabled={loadingCats}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loadingCats ? 'animate-spin' : ''}`} /> تحديث الإحصائيات
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat) => {
              const catName = cat?.name || 'قسم';
              const catId = cat?.id || '';
              const stat = categoryStats[catId];
              const productCount = stat?.product_count ?? (catId === 'pharmacy' ? pharmacyProducts.length : 0);
              const isEditing = editingId === catId;
              const isPharmacyCategory = catId === 'pharmacy' || catName.includes('صيدلية') || catName.includes('أدوية');

              return (
                <div
                  key={catId}
                  className={`glass-panel glass-panel-hover p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between transition-all ${
                    isPharmacyCategory ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(0,242,254,0.1)]' : ''
                  } ${!cat.is_active ? 'opacity-60 border-rose-500/20' : ''}`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isPharmacyCategory
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          : 'bg-white/10 text-white'
                      }`}>
                        {isPharmacyCategory ? <Pill className="w-5 h-5" /> : catName.charAt(0)}
                      </div>

                      <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-400">
                        ID: {catId}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">اسم القسم</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full p-2 rounded-xl glass-input text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">ترتيب العرض (sort_order)</label>
                          <input
                            type="number"
                            value={editForm.sort_order}
                            onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
                            className="w-full p-2 rounded-xl glass-input text-xs text-white"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleSaveCategory(cat.id)}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1"
                          >
                            <Save className="w-3.5 h-3.5" /> حفظ
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-white/10 text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                          {cat.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" /> {productCount} منتجات
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ترتيب: #{cat.sort_order}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct Management Button for Pharmacy Category */}
                  {isPharmacyCategory && !isEditing && (
                    <button
                      onClick={() => setActiveTab('pharmacy')}
                      className="mt-4 w-full py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-cyan-500/30 transition-all shadow-[0_0_10px_rgba(0,242,254,0.15)]"
                    >
                      <Pill className="w-4 h-4 text-cyan-400" /> إدارة أدوية ومنتجات الصيدلية 💊
                    </button>
                  )}

                  {!isEditing && (
                    <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => toggleCategoryActive(cat)}
                        className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          cat.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        {cat.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {cat.is_active ? 'مفعّل' : 'معطّل'}
                      </button>

                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> تعديل
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Embedded Pharmacy Products Management */}
      {activeTab === 'pharmacy' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Pill className="w-6 h-6 text-cyan-400" /> إدارة منتجات قسم الصيدلية والأدوية
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                عرض المنتجات الصيدلانية، التصفية حسب الصنف الفرعي، وإضافة أدوية ومستحضرات جديدة
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" /> إضافة منتج صيدلاني جديد
            </button>
          </div>

          {/* Subcategories Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SUBCATEGORIES.map((sub) => {
              const isSelected = selectedSubcategory === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                  }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم المنتج الصيدلاني أو التركيز..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Pharmacy Table */}
          <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>عرض {filteredPharmacyProducts.length} من أصل {pharmacyProducts.length} منتج صيدلاني</span>
              <button onClick={fetchPharmacyProducts} className="flex items-center gap-1.5 hover:text-cyan-400">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPharmacy ? 'animate-spin' : ''}`} /> تحديث البيانات
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-white/5 text-slate-300 border-b border-white/10 font-bold">
                    <th className="py-4 pr-6">المنتج الصيدلاني</th>
                    <th className="py-4">الصنف الفرعي</th>
                    <th className="py-4">السعر</th>
                    <th className="py-4">الشارة (Badge)</th>
                    <th className="py-4">الحالة</th>
                    <th className="py-4 pl-6 text-center">خيارات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {loadingPharmacy ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                        جاري تحميل منتجات الصيدلية...
                      </td>
                    </tr>
                  ) : filteredPharmacyProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        لا توجد منتجات مطابقة لعملية البحث
                      </td>
                    </tr>
                  ) : (
                    filteredPharmacyProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 pr-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 overflow-hidden flex-shrink-0 relative">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-cyan-500 bg-cyan-950/30">
                                  <Pill className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                                {product.name}
                              </div>
                              <div className="text-xs text-slate-400 truncate max-w-xs">
                                {product.spec || 'بدون مواصفات'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 text-xs font-semibold text-slate-300">
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {SUBCATEGORIES.find((s) => s.id === product.subcategory)?.name || product.subcategory}
                          </span>
                        </td>

                        <td className="py-4 font-extrabold text-cyan-400">
                          {product.price} ر.س
                        </td>

                        <td className="py-4 text-xs">
                          {product.badge ? (
                            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1 w-fit">
                              <Tag className="w-3 h-3" /> {product.badge}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        <td className="py-4">
                          <button
                            onClick={() => togglePharmacyActiveStatus(product)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                              product.is_active
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {product.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {product.is_active ? 'مفعّل' : 'مخفي'}
                          </button>
                        </td>

                        <td className="py-4 pl-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePharmacyProduct(product.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* Modal Add / Edit Pharmacy Product */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-cyan-400" />
                {editingProduct ? 'تعديل منتج صيدلاني' : 'إضافة منتج صيدلاني جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePharmacyProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">العنوان / اسم الدواء *</label>
                  <input
                    type="text"
                    required
                    value={pharmacyFormData.name}
                    onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, name: e.target.value })}
                    placeholder="مثال: فيتامين د3 - 5000 وحدة"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الصنف الفرعي *</label>
                  <select
                    value={pharmacyFormData.subcategory}
                    onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, subcategory: e.target.value })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white bg-[#0A1424]"
                  >
                    {SUBCATEGORIES.filter((s) => s.id !== 'all').map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">السعر الحالي (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pharmacyFormData.price}
                    onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, price: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">السعر قبل الخصم</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pharmacyFormData.original_price}
                    onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, original_price: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">التركيز / الوصف السريع (`spec`)</label>
                <input
                  type="text"
                  value={pharmacyFormData.spec}
                  onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, spec: e.target.value })}
                  placeholder="مثال: 60 كبسولة - تركيز 1000 ملجم"
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">صورة المنتج</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={pharmacyFormData.image_url}
                    onChange={(e) => setPharmacyFormData({ ...pharmacyFormData, image_url: e.target.value })}
                    placeholder="رابط الصورة..."
                    className="w-full p-3 rounded-xl glass-input text-sm text-white flex-1"
                  />
                  <label className="px-4 py-3 rounded-xl bg-white/10 text-cyan-300 text-xs font-bold flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" /> {uploadingImage ? 'رفع...' : 'رفع صورة'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-lg"
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
