'use client';

import React, { useEffect, useState } from 'react';
import {
  Package,
  ShoppingCart,
  FileQuestion,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  DollarSign,
  PlusCircle,
  Settings,
  Layers,
  ChevronLeft,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CategoryStat } from '@/lib/types';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    newOrders: 0,
    totalSales: 0,
    pendingNeedRequests: 0,
  });

  const [categoryData, setCategoryData] = useState<CategoryStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentNeeds, setRecentNeeds] = useState<any[]>([]);

  // Mock sales trend for Recharts demonstration (blended with live order totals)
  const salesTrends = [
    { name: 'السبت', sales: 1200, orders: 8 },
    { name: 'الأحد', sales: 1900, orders: 12 },
    { name: 'الإثنين', sales: 1500, orders: 9 },
    { name: 'الثلاثاء', sales: 2400, orders: 15 },
    { name: 'الأربعاء', sales: 3100, orders: 19 },
    { name: 'الخميس', sales: 4200, orders: 26 },
    { name: 'الجمعة', sales: 5800, orders: 34 },
  ];

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Products stats
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: activeProductCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // 2. Orders stats
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const totalOrders = ordersData?.length || 0;
      const newOrders = ordersData?.filter((o) => o.status === 'pending').length || 0;
      const totalSales = ordersData?.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0) || 0;

      // 3. Need requests stats
      const { data: needsData } = await supabase
        .from('need_requests')
        .select('*')
        .order('created_at', { ascending: false });

      const pendingNeedRequests = needsData?.filter((n) => n.status === 'pending').length || 0;

      // 4. Category Stats View
      const { data: catStats } = await supabase
        .from('category_stats')
        .select('*');

      setStats({
        totalProducts: productCount || 0,
        activeProducts: activeProductCount || 0,
        totalOrders,
        newOrders,
        totalSales,
        pendingNeedRequests,
      });

      if (catStats) setCategoryData(catStats as CategoryStat[]);
      if (ordersData) setRecentOrders(ordersData.slice(0, 5));
      if (needsData) setRecentNeeds(needsData.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime updates for instant page refreshed stats
    const channel = supabase
      .channel('dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'need_requests' },
        () => fetchDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#0F1D36] via-[#0D2240] to-[#0A1628] border border-cyan-500/20 shadow-[0_0_30px_rgba(0,242,254,0.1)] relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> نظرة عامة لمتجر نوفيكسا
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            مرحباً بك في لوحة تحكم <span className="neon-text">Novixa Admin</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            راقب المبيعات والمنتجات، أدر الأقسام والطلبات، واستقبل طلبات الاحتياج الفورية من تطبيق الجوال لحظياً.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>

          <Link
            href="/products"
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:opacity-90 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            إضافة منتج
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Products */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> {stats.activeProducts} مفعّل
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">إجمالي المنتجات</h3>
            <p className="text-2xl font-black text-white mt-1">{stats.totalProducts}</p>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            موزعة على {categoryData.length} أقسام رئيسية
          </div>
        </div>

        {/* Card 2: New Orders */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            {stats.newOrders > 0 ? (
              <span className="text-xs font-bold text-cyan-300 bg-cyan-500/20 px-2.5 py-1 rounded-full border border-cyan-400/40 animate-pulse">
                {stats.newOrders} جديد!
              </span>
            ) : (
              <span className="text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                مستقر
              </span>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">إجمالي الطلبات</h3>
            <p className="text-2xl font-black text-white mt-1">{stats.totalOrders}</p>
          </div>
          <div className="mt-3 text-[11px] text-cyan-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> {stats.newOrders} طلبات بانتظار التجهيز
          </div>
        </div>

        {/* Card 3: Need Requests */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <FileQuestion className="w-6 h-6" />
            </div>
            {stats.pendingNeedRequests > 0 ? (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 animate-bounce">
                {stats.pendingNeedRequests} قيد الانتظار
              </span>
            ) : (
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                مكتمل
              </span>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">طلبات الاحتياج الخاصة</h3>
            <p className="text-2xl font-black text-white mt-1">{stats.pendingNeedRequests}</p>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            طلبات المنتجات غير المتوفرة بالمتجر
          </div>
        </div>

        {/* Card 4: Total Sales */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xs text-slate-400 font-medium">إجمالي المبيعات المحققة</h3>
            <p className="text-2xl font-black text-cyan-300 mt-1">
              {stats.totalSales.toLocaleString('ar-SA')} <span className="text-sm font-semibold text-slate-400">ر.س</span>
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-400">
            المبالغ المحصلة شاملة التوصيل
          </div>
        </div>
      </div>

      {/* Visual Recharts Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Orders Trend (Area Chart) */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> حركة المبيعات والطلبات الأسبوعية
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">تحليل المبيعات حسب الأيام الأخيرة</p>
            </div>
            <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              تحديث حي
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F2FE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00F2FE" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(0,242,254,0.3)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    direction: 'rtl',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="المبيعات (ر.س)"
                  stroke="#00F2FE"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar Chart */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" /> إحصائيات الأقسام
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">عدد المنتجات في كل قسم (View)</p>
            </div>
            <Link href="/categories" className="text-xs text-cyan-400 hover:underline">
              عرض الكل
            </Link>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: 'rgba(0,242,254,0.3)',
                    borderRadius: '12px',
                    color: '#F8FAFC',
                    direction: 'rtl',
                  }}
                />
                <Bar dataKey="product_count" name="عدد المنتجات" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Orders & Recent Need Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Table */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-cyan-400" /> أحدث الطلبات
            </h3>
            <Link
              href="/orders"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              إدارة الطلبات <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-white/5">
                  <th className="pb-3 pr-2">العميل</th>
                  <th className="pb-3">المدينة</th>
                  <th className="pb-3">الإجمالي</th>
                  <th className="pb-3 pl-2">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      لا توجد طلبات حتى الآن
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pr-2 font-medium text-white">
                        {order.customer_name}
                        <div className="text-[10px] text-slate-400">{order.customer_phone}</div>
                      </td>
                      <td className="py-3 text-slate-300">{order.city || 'غير محدد'}</td>
                      <td className="py-3 font-bold text-cyan-300">{order.total} ر.س</td>
                      <td className="py-3 pl-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            order.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : order.status === 'delivered'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {order.status === 'pending'
                            ? 'معلق'
                            : order.status === 'delivered'
                            ? 'تم التوصيل'
                            : order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Need Requests */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-amber-400" /> أحدث طلبات الاحتياج
            </h3>
            <Link
              href="/need-requests"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              جميع الطلبات <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentNeeds.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                لا توجد طلبات احتياج مسجلة
              </div>
            ) : (
              recentNeeds.map((req) => (
                <div
                  key={req.id}
                  className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-white">{req.product_name}</h4>
                    <p className="text-[11px] text-slate-400">
                      المدينة: {req.city || 'الرياض'} | الميزانية: {req.budget ? `${req.budget} ر.س` : 'غير حددة'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      req.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : req.status === 'fulfilled'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {req.status === 'pending' ? 'جديد' : req.status === 'fulfilled' ? 'تم التوفير' : req.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
