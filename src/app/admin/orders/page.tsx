'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  Bell,
  Send,
  Phone,
  User,
  Calendar,
  RefreshCw,
  X,
  Sparkles,
  HelpCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/lib/types';

interface NeedRequest {
  id: string;
  user_id?: string;
  user_name?: string;
  phone?: string;
  item_name: string;
  notes?: string;
  status: 'pending' | 'fulfilled' | 'cancelled';
  created_at: string;
}

const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  processing: { label: 'جار المعالجة', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  shipped: { label: 'تم الشحن', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  delivered: { label: 'تم التسليم', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  cancelled: { label: 'ملغي', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [needRequests, setNeedRequests] = useState<NeedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'orders' | 'need_requests'>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Notification Modal State
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [targetUserName, setTargetUserName] = useState<string>('');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  const fetchOrdersAndNeeds = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!orderErr && orderData) {
        setOrders(orderData as Order[]);
      }

      // 2. Fetch Need Requests
      const { data: needData } = await supabase
        .from('need_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (needData) {
        setNeedRequests(needData as NeedRequest[]);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndNeeds();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filter need requests
  const filteredNeedRequests = needRequests.filter((n) => {
    return (
      n.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Update order status in Supabase
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        console.error('Update error:', error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open notification modal for customer
  const handleOpenNotifyCustomer = (userId: string, userName: string, defaultText: string) => {
    setTargetUserId(userId);
    setTargetUserName(userName);
    setNotifTitle('تحديث بشأن طلبيتك في NOVIXA');
    setNotifMessage(`مرحباً ${userName}، ${defaultText}`);
    setShowNotifModal(true);
  };

  // Send Notification Submit
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !notifTitle || !notifMessage) return;

    setSendingNotif(true);
    try {
      await supabase.from('user_notifications').insert([
        {
          user_id: targetUserId,
          title: notifTitle,
          message: notifMessage,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);

      alert('تم إرسال الإشعار إلى المستخدم بنجاح');
      setShowNotifModal(false);
    } catch (err: any) {
      alert(`حدث خطأ: ${err.message}`);
    } finally {
      setSendingNotif(false);
    }
  };

  // Update Need Request status
  const handleUpdateNeedStatus = async (id: string, status: 'fulfilled' | 'cancelled') => {
    setNeedRequests((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status } : n))
    );

    try {
      await supabase.from('need_requests').update({ status }).eq('id', id);
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
            <ShoppingBag className="w-7 h-7 text-cyan-400" /> متابعة الطلبات وطلبات الاحتياج
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة حالات الطلبات، متابعة طلبات المنتجات غير المتوفرة (Need Requests)، وإشعار العملاء لحظياً
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            طلبات الشراء ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('need_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'need_requests'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> طلبات الاحتياج ({needRequests.length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'orders'
                ? 'ابحث برقم الطلب، اسم العميل، أو رقم الهاتف...'
                : 'ابحث عن المنتج المطلوب أو اسم المستخدم...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {activeTab === 'orders' && (
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-3 rounded-2xl glass-input text-xs text-white bg-[#0A1424]"
            >
              <option value="all">جميع حالات الطلبات</option>
              <option value="pending">قيد الانتظار (Pending)</option>
              <option value="processing">جار المعالجة (Processing)</option>
              <option value="shipped">تم الشحن (Shipped)</option>
              <option value="delivered">تم التسليم (Delivered)</option>
              <option value="cancelled">ملغي (Cancelled)</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table View */}
      {activeTab === 'orders' && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>عرض {filteredOrders.length} طلب شراء</span>
            <button onClick={fetchOrdersAndNeeds} className="flex items-center gap-1.5 hover:text-cyan-400">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-white/5 text-slate-300 border-b border-white/10 font-bold">
                  <th className="py-4 pr-6">رقم الطلب</th>
                  <th className="py-4">العميل</th>
                  <th className="py-4">إجمالي المبلغ</th>
                  <th className="py-4">تاريخ الطلب</th>
                  <th className="py-4">حالة الطلب</th>
                  <th className="py-4 pl-6 text-center">تحديث الحالة & الإشعارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                      جاري تحميل قائمة الطلبات...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      لا توجد طلبات مطابقة لعملية الفلترة
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusInfo = ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS.pending;
                    return (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                        {/* Order ID */}
                        <td className="py-4 pr-6 font-mono font-bold text-cyan-300">
                          #{order.id.substring(0, 8)}
                        </td>

                        {/* Customer */}
                        <td className="py-4">
                          <div className="font-bold text-white">{order.customer_name || 'عميل نوفيكسا'}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.customer_phone || 'بدون رقم'}
                          </div>
                        </td>

                        {/* Total Price */}
                        <td className="py-4 font-black text-emerald-400">
                          {order.total ?? order.total_price ?? 0} ر.س
                        </td>

                        {/* Date */}
                        <td className="py-4 text-xs text-slate-400">
                          {new Date(order.created_at).toLocaleDateString('ar-SA')}
                        </td>

                        {/* Status Select */}
                        <td className="py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border bg-[#0A1424] cursor-pointer ${statusInfo.color}`}
                          >
                            <option value="pending">قيد الانتظار</option>
                            <option value="processing">جار المعالجة</option>
                            <option value="shipped">تم الشحن</option>
                            <option value="delivered">تم التسليم</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-4 pl-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                              }}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-400 transition-all"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {order.user_id && (
                              <button
                                onClick={() =>
                                  handleOpenNotifyCustomer(
                                    order.user_id!,
                                    order.customer_name || 'العميل',
                                    `تم تحديث حالة طلبيتك (#${order.id.substring(0, 6)}) إلى (${statusInfo.label})`
                                  )
                                }
                                className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all"
                                title="إرسال إشعار للعميل"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Need Requests Table View */}
      {activeTab === 'need_requests' && (
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>عرض {filteredNeedRequests.length} طلب احتياج لمنتجات غير متوفرة</span>
            <button onClick={fetchOrdersAndNeeds} className="flex items-center gap-1.5 hover:text-cyan-400">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-white/5 text-slate-300 border-b border-white/10 font-bold">
                  <th className="py-4 pr-6">اسم المنتج المطلوب</th>
                  <th className="py-4">العميل ورقم التواصل</th>
                  <th className="py-4">ملاحظات العميل</th>
                  <th className="py-4">تاريخ الطلب</th>
                  <th className="py-4">الحالة</th>
                  <th className="py-4 pl-6 text-center">توفير المنتج & التواصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                      جاري تحميل طلبات الاحتياج...
                    </td>
                  </tr>
                ) : filteredNeedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      لا توجد طلبات احتياج مضافة حالياً
                    </td>
                  </tr>
                ) : (
                  filteredNeedRequests.map((need) => (
                    <tr key={need.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pr-6 font-bold text-cyan-300">
                        {need.item_name}
                      </td>

                      <td className="py-4 text-xs">
                        <div className="font-bold text-white">{need.user_name || 'عميل نوفيكسا'}</div>
                        <div className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {need.phone || 'بدون رقم'}
                        </div>
                      </td>

                      <td className="py-4 text-xs text-slate-300 max-w-xs truncate">
                        {need.notes || '-'}
                      </td>

                      <td className="py-4 text-xs text-slate-400">
                        {new Date(need.created_at).toLocaleDateString('ar-SA')}
                      </td>

                      <td className="py-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            need.status === 'fulfilled'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : need.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {need.status === 'fulfilled'
                            ? 'تم التوفير'
                            : need.status === 'cancelled'
                            ? 'ملغي'
                            : 'قيد الانتظار'}
                        </span>
                      </td>

                      <td className="py-4 pl-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateNeedStatus(need.id, 'fulfilled')}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold"
                          >
                            تحديد كـ "تم التوفير"
                          </button>

                          {need.user_id && (
                            <button
                              onClick={() =>
                                handleOpenNotifyCustomer(
                                  need.user_id!,
                                  need.user_name || 'العميل',
                                  `بشرى سارة! تم توفير المنتج المطلوب (${need.item_name}) بنجاح.`
                                )
                              }
                              className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                              title="إرسال إشعار للعميل"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Send Customer Notification */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                إرسال إشعار لـ ({targetUserName})
              </h2>
              <button
                onClick={() => setShowNotifModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان الإشعار</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">محتوى الإشعار</label>
                <textarea
                  rows={4}
                  required
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNotifModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-lg hover:opacity-90 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendingNotif ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
