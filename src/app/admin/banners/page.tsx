'use client';

import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
  Clock,
  ExternalLink,
  Sparkles,
  Layers,
  ShoppingBag,
  Percent,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PromoBanner } from '@/lib/types';

const ACTION_TYPES = [
  { id: 'offers', label: 'شاشة العروض والخصومات', icon: Percent },
  { id: 'category', label: 'قسم محدد بالمتجر', icon: Layers },
  { id: 'product', label: 'منتج معين', icon: ShoppingBag },
  { id: 'url', label: 'رابط خارجي', icon: ExternalLink },
];

export default function PromoBannersPage() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    action_type: 'offers',
    action_url: '/offers',
    auto_slide_seconds: 4,
    sort_order: 1,
    is_active: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setBanners(data as PromoBanner[]);
      } else {
        // Fallback to table 'banners'
        const { data: fallbackData } = await supabase
          .from('banners')
          .select('*')
          .order('sort_order', { ascending: true });

        if (fallbackData) {
          const mapped: PromoBanner[] = fallbackData.map((b: any) => ({
            id: b.id,
            title: b.title || '',
            subtitle: b.subtitle || '',
            image_url: b.image_url || '',
            action_type: b.action_type || 'url',
            action_url: b.action_url || '',
            auto_slide_seconds: b.auto_slide_seconds || 4,
            sort_order: b.sort_order || 1,
            is_active: b.is_active,
            created_at: b.created_at,
          }));
          setBanners(mapped);
        }
      }
    } catch (e) {
      console.error('Error fetching promo banners:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const filteredBanners = banners.filter((b) => {
    return (
      b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.action_url?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      action_type: 'offers',
      action_url: '/offers',
      auto_slide_seconds: 4,
      sort_order: banners.length + 1,
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_url: banner.image_url || '',
      action_type: banner.action_type || 'offers',
      action_url: banner.action_url || '',
      auto_slide_seconds: banner.auto_slide_seconds || 4,
      sort_order: banner.sort_order || 1,
      is_active: banner.is_active,
    });
    setShowModal(true);
  };

  // Upload image to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        alert(`فشل رفع البانر: ${uploadError.message}`);
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

  // Toggle active banner status
  const toggleActiveStatus = async (banner: PromoBanner) => {
    const nextState = !banner.is_active;
    setBanners((prev) =>
      prev.map((b) => (b.id === banner.id ? { ...b, is_active: nextState } : b))
    );

    try {
      const { error } = await supabase
        .from('promo_banners')
        .update({ is_active: nextState })
        .eq('id', banner.id);

      if (error) {
        await supabase
          .from('banners')
          .update({ is_active: nextState })
          .eq('id', banner.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save Banner (Insert or Update)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert('يرجى رفع صورة البانر أو إدخال رابط الصورة');
      return;
    }

    try {
      const payload = {
        title: formData.title || null,
        subtitle: formData.subtitle || null,
        image_url: formData.image_url,
        action_type: formData.action_type,
        action_url: formData.action_url || null,
        auto_slide_seconds: Number(formData.auto_slide_seconds),
        sort_order: Number(formData.sort_order),
        is_active: formData.is_active,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('promo_banners')
          .update(payload)
          .eq('id', editingBanner.id);

        if (error) {
          await supabase
            .from('banners')
            .update({
              title: payload.title,
              subtitle: payload.subtitle,
              image_url: payload.image_url,
              action_url: payload.action_url,
              sort_order: payload.sort_order,
              is_active: payload.is_active,
            })
            .eq('id', editingBanner.id);
        }
      } else {
        const { error } = await supabase.from('promo_banners').insert([payload]);
        if (error) {
          await supabase.from('banners').insert([
            {
              title: payload.title,
              subtitle: payload.subtitle,
              image_url: payload.image_url,
              action_url: payload.action_url,
              sort_order: payload.sort_order,
              is_active: payload.is_active,
            },
          ]);
        }
      }

      setShowModal(false);
      fetchBanners();
    } catch (err: any) {
      alert(`فشل الحفظ: ${err.message}`);
    }
  };

  // Delete Banner
  const handleDeleteBanner = async (id: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذا البانر الترويجي؟')) return;
    try {
      const { error } = await supabase.from('promo_banners').delete().eq('id', id);
      if (error) {
        await supabase.from('banners').delete().eq('id', id);
      }
      setBanners((prev) => prev.filter((b) => b.id !== id));
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
            <ImageIcon className="w-7 h-7 text-cyan-400" /> إدارة البانرات الترويجية والعروض
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            التحكم بالصور السلايدر المتحركة بالشاشة الرئيسية، التوجيه الذكي للمنتجات والعروض، وتعديل سرعة الانتقال
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" /> إضافة بانر ترويجي جديد
        </button>
      </div>

      {/* Banners Grid */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>عرض {filteredBanners.length} بانر ترويجي</span>
        <button onClick={fetchBanners} className="flex items-center gap-1.5 hover:text-cyan-400">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث البانرات
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
          جاري تحميل البانرات الترويجية...
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl">
          لا توجد بانرات ترويجية مضافة حالياً
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className={`glass-panel p-5 rounded-3xl space-y-4 relative overflow-hidden transition-all border ${
                !banner.is_active ? 'opacity-60 border-rose-500/20' : 'border-cyan-500/20'
              }`}
            >
              {/* Banner Image Preview Container */}
              <div className="w-full h-44 rounded-2xl bg-slate-900 overflow-hidden relative border border-white/10 group">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Banner Overlay Titles */}
                <div className="absolute bottom-3 right-4 left-4">
                  <h3 className="text-base font-black text-white drop-shadow-md">
                    {banner.title || 'بدون عنوان رئيسي'}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-cyan-300 font-medium drop-shadow">
                      {banner.subtitle}
                    </p>
                  )}
                </div>

                {/* Order Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-mono text-cyan-300 border border-white/10">
                  ترتيب: #{banner.sort_order}
                </div>
              </div>

              {/* Banner Details */}
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>الانتقال كل: <strong className="text-white">{banner.auto_slide_seconds || 4} ثوانٍ</strong></span>
                </div>

                <div className="flex items-center gap-1.5 truncate">
                  <ExternalLink className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="truncate">التوجيه: <strong className="text-white">{banner.action_url || 'شاشة العروض'}</strong></span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  onClick={() => toggleActiveStatus(banner)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    banner.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {banner.is_active ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" /> مفعّل بالسلايدر
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-slate-500" /> معطّل
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(banner)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Banner */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                {editingBanner ? 'تعديل البانر الترويجي' : 'إضافة بانر جديد للسلايدر'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">العنوان الرئيسي</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: عروض الصيدلية الكبرى 20%"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">العنوان الفرعي</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="خصومات حصرية لفترة محدودة"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white"
                  />
                </div>
              </div>

              {/* Action Type and Action URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع التوجيه عند النقر</label>
                  <select
                    value={formData.action_type}
                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white bg-[#0A1424]"
                  >
                    {ACTION_TYPES.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الرابط / معرف التوجيه (`action_url`)</label>
                  <input
                    type="text"
                    value={formData.action_url}
                    onChange={(e) => setFormData({ ...formData, action_url: e.target.value })}
                    placeholder="مثال: /offers أو /pharmacy أو id_123"
                    className="w-full p-3 rounded-xl glass-input text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Auto Slide Seconds & Sort Order */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">مدة الانتقال التلقائي (بالثواني)</label>
                  <select
                    value={formData.auto_slide_seconds}
                    onChange={(e) => setFormData({ ...formData, auto_slide_seconds: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white bg-[#0A1424]"
                  >
                    <option value={3}>3 ثوانٍ (سريع)</option>
                    <option value={4}>4 ثوانٍ (متوسط)</option>
                    <option value={5}>5 ثوانٍ (هادئ)</option>
                    <option value={7}>7 ثوانٍ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ترتيب الظهور (`sort_order`)</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl glass-input text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">صورة البانر الترويجي *</label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    required
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="رابط الصورة أو رفع صورة..."
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
                  <div className="mt-2 w-full h-32 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  تفعيل البانر في السلايدر الرئيسي للتطبيق
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
                  حفظ البانر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
