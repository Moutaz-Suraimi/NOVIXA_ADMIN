'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  Truck,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Gift,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppSetting } from '@/lib/types';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    delivery_fee: '15',
    free_delivery_threshold: '200',
    maintenance_mode: 'false',
    whatsapp_number: '+966500000000',
    app_name: 'نوفيكسا | Novixa',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('app_settings').select('*');
      if (!error && data) {
        const map: Record<string, string> = {};
        (data as AppSetting[]).forEach((row) => {
          map[row.key] = row.value;
        });

        setSettings((prev) => ({
          ...prev,
          ...map,
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }));

      for (const item of updates) {
        await supabase
          .from('app_settings')
          .upsert(item, { onConflict: 'key' });
      }

      setToastMessage('تم حفظ الإعدادات بنجاح وتحديثها فورياً في تطبيق الجوال!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(`حدث خطأ أثناء الحفظ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-cyan-400" /> إعدادات التطبيق والنظام
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            التحكم بشرائح أسعار التوصيل، وضع الصيانة، وتفاصيل التواصل المباشر مع دعم المتجر
          </p>
        </div>

        <button
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 transition-all text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} /> إعادة تحميل
        </button>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-slide-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Settings Form Grid */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Delivery Fee Box */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">رسوم التوصيل الافتراضية</h3>
                <p className="text-xs text-slate-400">القيمة المالية لتوصيل الطلب بالريال السعودي</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1.5">رسوم الشحن (ر.س)</label>
              <input
                type="number"
                step="0.5"
                value={settings.delivery_fee}
                onChange={(e) => setSettings({ ...settings, delivery_fee: e.target.value })}
                className="w-full p-3.5 rounded-2xl glass-input text-sm text-white font-bold"
              />
            </div>
          </div>

          {/* Free Delivery Threshold Box */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">حد التوصيل المجاني</h3>
                <p className="text-xs text-slate-400">المبلغ الأدنى للحصول على توصيل مجاني تلقائياً</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1.5">الحد الأدنى (ر.س)</label>
              <input
                type="number"
                value={settings.free_delivery_threshold}
                onChange={(e) => setSettings({ ...settings, free_delivery_threshold: e.target.value })}
                className="w-full p-3.5 rounded-2xl glass-input text-sm text-white font-bold"
              />
            </div>
          </div>

          {/* WhatsApp Support Number */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">رقم واتساب خدمة العملاء</h3>
                <p className="text-xs text-slate-400">يظهر في تطبيق الجوال للمساعدة المباشرة</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1.5">رقم الجوال الدولي</label>
              <input
                type="text"
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="+966500000000"
                className="w-full p-3.5 rounded-2xl glass-input text-sm text-white font-mono"
              />
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">وضع الصيانة للتطبيق</h3>
                <p className="text-xs text-slate-400">إيقاف استقبال طلبات الجوال مؤقتاً للتحديثات</p>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode === 'true'}
                  onChange={(e) =>
                    setSettings({ ...settings, maintenance_mode: e.target.checked ? 'true' : 'false' })
                  }
                  className="w-5 h-5 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-sm font-bold text-slate-200">
                  {settings.maintenance_mode === 'true' ? 'وضع الصيانة مُفعل الآن' : 'التطبيق يعمل بشكل طبيعي'}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(0,242,254,0.3)] hover:opacity-90 transition-all"
          >
            <Save className="w-5 h-5" />
            {saving ? 'جاري حفظ الإعدادات...' : 'حفظ ونشر التعديلات'}
          </button>
        </div>
      </form>
    </div>
  );
}
