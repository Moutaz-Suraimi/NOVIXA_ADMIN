'use client';

import React, { useEffect, useState } from 'react';
import {
  Percent,
  Plus,
  Layers,
  Sparkles,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Edit2,
  Tag,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CategoryDiscount, Category } from '@/lib/types';

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<CategoryDiscount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingBulk, setApplyingBulk] = useState(false);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(15);
  const [badgeText, setBadgeText] = useState<string>('عرض لفترة محدودة');
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Categories
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData && catData.length > 0) {
        setCategories(catData as Category[]);
        if (!selectedCategory && catData[0]) {
          setSelectedCategory(catData[0].id);
        }
      } else {
        // Fallback default categories
        setCategories([
          { id: 'pharmacy', name: 'الصيدليات والأدوية', icon: 'pill', sort_order: 1, is_active: true },
          { id: 'electronics', name: 'المنتجات الرقمية والتقنية', icon: 'laptop', sort_order: 2, is_active: true },
          { id: 'supermarket', name: 'السوبرماركت والغذائيات', icon: 'shopping-bag', sort_order: 3, is_active: true },
          { id: 'restaurants', name: 'المطاعم والوجبات السريعة', icon: 'utensils', sort_order: 4, is_active: true },
        ]);
        setSelectedCategory('pharmacy');
      }

      // 2. Fetch Category Discounts
      const { data: discData, error } = await supabase
        .from('category_discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && discData) {
        setDiscounts(discData as CategoryDiscount[]);
      }
    } catch (e) {
      console.error('Error fetching discounts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply discount to entire category in DB
  const handleApplyCategoryDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || discountPercentage <= 0) {
      alert('يرجى اختيار القسم وتحديد نسبة خصم أكبر من 0');
      return;
    }

    const catObj = categories.find((c) => c.id === selectedCategory);
    const categoryName = catObj ? catObj.name : selectedCategory;

    if (
      !confirm(
        `هل أنت تأكد من تطبيق خصم بنسبة ${discountPercentage}% وشارة "${badgeText}" على كافة منتجات قسم (${categoryName})؟`
      )
    ) {
      return;
    }

    setApplyingBulk(true);
    try {
      // 1. Upsert / Save into category_discounts table
      const discountRulePayload = {
        category_id: selectedCategory,
        category_name: categoryName,
        discount_percentage: discountPercentage,
        badge_text: badgeText,
        is_active: isActive,
        created_at: new Date().toISOString(),
      };

      await supabase.from('category_discounts').upsert([discountRulePayload]);

      // 2. Execute bulk update on products under this category
      // Fetch all products under selectedCategory
      let targetTable = selectedCategory === 'pharmacy' ? 'pharmacy_products' : 'products';
      const { data: targetProducts } = await supabase
        .from(targetTable)
        .select('*')
        .eq('category_id', selectedCategory);

      if (targetProducts && targetProducts.length > 0) {
        for (const prod of targetProducts) {
          const originalPrice = prod.original_price || prod.price;
          const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));

          await supabase
            .from(targetTable)
            .update({
              original_price: originalPrice,
              price: discountedPrice,
              discount_percentage: discountPercentage,
              badge: `${discountPercentage}% خصم`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', prod.id);
        }
      }

      alert(`تم تطبيق خصم ${discountPercentage}% بنجاح على جميع منتجات قسم (${categoryName})!`);
      fetchData();
    } catch (err: any) {
      alert(`حدث خطأ أثناء تطبيق الخصم: ${err.message}`);
    } finally {
      setApplyingBulk(false);
    }
  };

  // Delete / Reset discount rule
  const handleDeleteDiscountRule = async (id: string) => {
    if (!confirm('هل تريد إزالة هذا الخصم؟')) return;
    try {
      await supabase.from('category_discounts').delete().eq('id', id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Percent className="w-7 h-7 text-cyan-400" /> إدارة الخصومات والعروض الشاملة
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تطبيق نسبة خصم مئوية تلقائية على أقسام بأكملها بضغطة زر واحدة وتحديث أسعار المنتجات بالكامل
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Apply Discount Form */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl space-y-5 h-fit border border-cyan-500/20 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Zap className="w-5 h-5 text-amber-400" /> تطبيق خصم جماعي جديد
          </h2>

          <form onSubmit={handleApplyCategoryDiscount} className="space-y-4 text-right">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">اختر القسم المستهدف *</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-3 rounded-xl glass-input text-sm text-white bg-[#0A1424]"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Discount Percentage */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نسبة الخصم (%) *</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-full p-3 rounded-xl glass-input text-sm text-white font-mono font-bold text-left pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">%</span>
              </div>
            </div>

            {/* Badge Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الشارة / النص الترويجي</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="عرض لفترة محدودة، الأكثر مبيعاً"
                className="w-full p-3 rounded-xl glass-input text-sm text-white"
              />
            </div>

            {/* Active Switch */}
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
                تفعيل الخصم فورا على جميع أسعار المنتجات بالقسم
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={applyingBulk}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              {applyingBulk ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> جاري تطبيق الخصومات...
                </>
              ) : (
                <>
                  <Percent className="w-4 h-4" /> تطبيق الخصم بضغطة زر
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Active Discounts List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-cyan-400" /> قواعد الخصومات النشطة بالأقسام
            </h2>
            <button onClick={fetchData} className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
              جاري تحميل قوائم الخصومات...
            </div>
          ) : discounts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400/60 mx-auto" />
              <p>لا توجد قواعد خصومات مفعلة حالياً على الأقسام</p>
              <p className="text-xs text-slate-500">استخدم النموذج على اليمين لتطبيق خصم شامل على أي قسم</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discounts.map((disc) => (
                <div
                  key={disc.id || disc.category_id}
                  className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 relative hover:border-cyan-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 text-xs font-bold border border-cyan-500/20">
                      {disc.category_name || disc.category_id}
                    </span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      %{disc.discount_percentage} خصم
                    </span>
                  </div>

                  {disc.badge_text && (
                    <div className="text-xs text-slate-300 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" /> الشارة: <strong>{disc.badge_text}</strong>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> مفعّل بنجاح
                    </span>
                    {disc.id && (
                      <button
                        onClick={() => handleDeleteDiscountRule(disc.id!)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                        title="إلغاء الخصم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
