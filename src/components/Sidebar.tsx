'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileQuestion,
  ShoppingCart,
  Settings,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Pill,
  Image as ImageIcon,
  Users,
  Percent,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { name: 'الرئيسية', href: '/', icon: LayoutDashboard, badge: null },
  { name: 'قسم الصيدلية', href: '/admin/pharmacy', icon: Pill, badge: 'جديد' },
  { name: 'البانرات والعروض', href: '/admin/banners', icon: ImageIcon, badge: null },
  { name: 'إدارة المستخدمين', href: '/admin/users', icon: Users, badge: null },
  { name: 'العروض والخصومات', href: '/admin/discounts', icon: Percent, badge: null },
  { name: 'متابعة الطلبات', href: '/admin/orders', icon: ShoppingCart, badge: null },
  { name: 'طلبات الاحتياج', href: '/need-requests', icon: FileQuestion, badge: 'جديد' },
  { name: 'كتالوج المنتجات', href: '/products', icon: Package, badge: null },
  { name: 'إدارة الأقسام', href: '/categories', icon: Layers, badge: null },
  { name: 'إعدادات التطبيق', href: '/settings', icon: Settings, badge: null },
];


export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl glass-panel text-cyan-400 hover:text-white transition-all shadow-lg"
        aria-label="القائمة"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Desktop Sidebar Container (Always Static in flow) */}
      <aside className="hidden md:flex flex-col static top-0 right-0 z-30 h-screen w-72 flex-shrink-0 bg-[#0A1424]/90 backdrop-blur-2xl border-l border-white/10">
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_0_20px_rgba(0,100,255,0.4)] group-hover:scale-105 transition-transform border border-white/10">
              <Image
                src="/logo.png"
                alt="Novixa Logo"
                width={48}
                height={48}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-1.5">
                NOVIXA <span className="text-cyan-400 text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">ADMIN</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">لوحة تحكم نوفيكسا</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400 shadow-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronLeft className="w-4 h-4 text-cyan-400 mr-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-4 pb-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Container (Fixed overlay) */}
      <aside
        className={`md:hidden fixed inset-y-0 right-0 z-50 h-screen w-72 flex-shrink-0 bg-[#0A1424] shadow-2xl border-l border-white/10 flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : 'translate-x-[100%]'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_0_20px_rgba(0,100,255,0.4)] group-hover:scale-105 transition-transform border border-white/10">
              <Image
                src="/logo.png"
                alt="Novixa Logo"
                width={48}
                height={48}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-wide flex items-center gap-1.5">
                NOVIXA <span className="text-cyan-400 text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30">ADMIN</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">لوحة تحكم نوفيكسا</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400 shadow-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                    }`}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
                
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <ChevronLeft className="w-4 h-4 text-cyan-400 mr-auto opacity-70" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-4 pb-3">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>{loggingOut ? 'جاري الخروج...' : 'تسجيل الخروج'}</span>
          </button>
        </div>

      </aside>
    </>
  );
}
