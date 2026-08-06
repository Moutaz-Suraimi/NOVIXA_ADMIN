'use client';

import React, { useEffect, useState } from 'react';
import {
  FileQuestion,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  DollarSign,
  PackageCheck,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { NeedRequest } from '@/lib/types';

export default function NeedRequestsPage() {
  const [requests, setRequests] = useState<NeedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Selected request for status change modal
  const [selectedRequest, setSelectedRequest] = useState<NeedRequest | null>(null);
  const [newStatus, setNewStatus] = useState<'pending' | 'reviewing' | 'fulfilled' | 'rejected'>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchNeedRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('need_requests')
        .select('*, categories(name)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRequests(data as NeedRequest[]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNeedRequests();
  }, []);

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || req.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (req: NeedRequest) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setAdminNotes(req.admin_notes || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('need_requests')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequest.id
            ? { ...r, status: newStatus, admin_notes: adminNotes }
            : r
        )
      );

      setSelectedRequest(null);
    } catch (err: any) {
      alert(`فشل تحديث الحالة: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileQuestion className="w-7 h-7 text-amber-400" /> إدارة طلبات الاحتياج الخاصة
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            متابعة استفسارات المنتجات الخاصة التي يرغب عملاء الجوال بتوفيرها في المتجر
          </p>
        </div>

        <button
          onClick={fetchNeedRequests}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-amber-300 transition-all text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} /> تحديث الطلبات
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث باسم المنتج المطلوب، المدينة، أو الوصف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100"
          />
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100 bg-[#0F172A] appearance-none cursor-pointer"
          >
            <option value="all">جميع الحالات ({requests.length})</option>
            <option value="pending">قيد الانتظار (pending)</option>
            <option value="reviewing">قيد المراجعة (reviewing)</option>
            <option value="fulfilled">تم التوفير (fulfilled)</option>
            <option value="rejected">مرفوض (rejected)</option>
          </select>
        </div>
      </div>

      {/* Requests Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-2" />
          جاري تحميل طلبات الاحتياج...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl">
          لا توجد طلبات احتياج بهذه المواصفات
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="glass-panel glass-panel-hover p-6 rounded-3xl flex flex-col justify-between space-y-4 relative"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-extrabold text-white text-base leading-snug">
                    {req.product_name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${
                      req.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : req.status === 'reviewing'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : req.status === 'fulfilled'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {req.status === 'pending'
                      ? 'جديد (معلق)'
                      : req.status === 'reviewing'
                      ? 'قيد المراجعة'
                      : req.status === 'fulfilled'
                      ? 'تم التوفير'
                      : 'مرفوض'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                  {req.description || 'لا يوجد وصف تفصيلي'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>المدينة: {req.city || 'الرياض'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                    <span>الميزانية: {req.budget ? `${req.budget} ر.س` : 'غير محددة'}</span>
                  </div>
                </div>

                {req.admin_notes && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300">
                    <span className="font-bold block text-cyan-400 mb-0.5">ملاحظة الإدارة:</span>
                    {req.admin_notes}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {new Date(req.created_at).toLocaleDateString('ar-SA')}
                </span>

                <button
                  onClick={() => handleOpenModal(req)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> تغيير الحالة / الملاحظات
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Status & Notes Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-bold text-white text-base">
                معالجة طلب: <span className="text-amber-400">{selectedRequest.product_name}</span>
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">حالة الطلب الجديدة</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full p-3 rounded-xl glass-input text-sm text-white bg-[#0A1424]"
                >
                  <option value="pending">قيد الانتظار (pending)</option>
                  <option value="reviewing">قيد المراجعة (reviewing)</option>
                  <option value="fulfilled">تم التوفير (fulfilled)</option>
                  <option value="rejected">مرفوض (rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات الإدارة للعميل</label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="مثال: تم توفير المنتج بالمتجر باسم (عسل سدر)، أو نعتذر لعدم التوفر حالياً..."
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold text-xs shadow-lg hover:opacity-90"
                >
                  {saving ? 'جاري الحفظ...' : 'تحديث الطلب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
