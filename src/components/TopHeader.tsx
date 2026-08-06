'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AdminNotification } from '@/lib/types';
import Link from 'next/link';

export default function TopHeader() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setNotifications(data as AdminNotification[]);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('header_admin_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          const newNotif = payload.new as AdminNotification;
          setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('is_read', false);
      
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-20 bg-[#0A1424]/80 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Search Input */}
      <div className="relative max-w-xs md:max-w-md w-full">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="بحث سريع في اللوحة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-4 pr-10 py-2 rounded-xl glass-input text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Sound Alert Toggle */}
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            localStorage.setItem('novixa_sound_enabled', next ? 'true' : 'false');
          }}
          title={soundEnabled ? 'التنبيهات الصوتية مفعّلة' : 'التنبيهات الصوتية مكتومة'}
          className={`p-2.5 rounded-xl border transition-all ${
            soundEnabled
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(0,242,254,0.15)]'
              : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {/* Realtime Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-cyan-400 hover:border-cyan-500/30 transition-all relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[11px] flex items-center justify-center animate-bounce shadow-[0_0_8px_#00F2FE]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute left-0 mt-3 w-80 md:w-96 rounded-2xl bg-[#0F172A]/95 border border-white/10 shadow-2xl backdrop-blur-2xl p-4 z-50 text-right">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-400" /> التنبيهات الحية
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-400 hover:underline font-medium"
                  >
                    تحديد الكل كقروء
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto my-2 space-y-2 divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    لا توجد تنبيهات جديدة حتى الآن
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`pt-2.5 pb-1 px-2 rounded-xl transition-colors ${
                        !notif.is_read ? 'bg-cyan-500/10 border-r-2 border-cyan-400' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-xs text-slate-200">{notif.title}</div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(notif.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>



        {/* User Profile */}
        <div className="flex items-center gap-3 pr-2 border-r border-white/10 mr-1">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-500/40 shadow-[0_0_12px_rgba(0,100,255,0.3)] flex-shrink-0">
            <img src="/logo.png" alt="Novixa" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs font-bold text-white">مسؤول النظام</div>
            <div className="text-[10px] text-cyan-400 font-medium">مدير نوفيكسا</div>
          </div>
        </div>
      </div>
    </header>
  );
}
