'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, FileQuestion, X, BellRing } from 'lucide-react';
import Link from 'next/link';

interface ToastAlert {
  id: string;
  type: 'order' | 'need_request';
  title: string;
  message: string;
  link: string;
  time: string;
}

export default function RealtimeAlerts() {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  // Function to play synthesized notification chime using Web Audio API
  const playNotificationSound = () => {
    try {
      const isMuted = localStorage.getItem('novixa_sound_enabled') === 'false';
      if (isMuted) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Play double chime (C5 -> E5 -> G5)
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
      gain2.gain.setValueAtTime(0.4, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  useEffect(() => {
    // Listen for new orders
    const ordersChannel = supabase
      .channel('realtime_orders_alert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        async (payload) => {
          const order = payload.new;
          playNotificationSound();

          const toast: ToastAlert = {
            id: Math.random().toString(),
            type: 'order',
            title: 'طلب جديد وصل للتو!',
            message: `طلب من العميل: ${order.customer_name || 'عميل نوفيكسا'} بمبلغ ${order.total || 0} ر.س`,
            link: '/orders',
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          };

          setToasts((prev) => [toast, ...prev]);

          // Save to admin_notifications table
          await supabase.from('admin_notifications').insert({
            type: 'new_order',
            title: 'طلب جديد',
            body: toast.message,
            ref_id: order.id,
            is_read: false,
          });
        }
      )
      .subscribe();

    // Listen for new need requests
    const needChannel = supabase
      .channel('realtime_need_requests_alert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'need_requests' },
        async (payload) => {
          const req = payload.new;
          playNotificationSound();

          const toast: ToastAlert = {
            id: Math.random().toString(),
            type: 'need_request',
            title: 'طلب احتياج جديد!',
            message: `منتج مطلوب: ${req.product_name} - ${req.city || 'الرياض'}`,
            link: '/need-requests',
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          };

          setToasts((prev) => [toast, ...prev]);

          // Save to admin_notifications table
          await supabase.from('admin_notifications').insert({
            type: 'need_request',
            title: 'طلب احتياج جديد',
            body: toast.message,
            ref_id: req.id,
            is_read: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(needChannel);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto p-4 rounded-2xl bg-[#0F172A]/95 border border-cyan-500/40 shadow-[0_10px_30px_rgba(0,242,254,0.2)] backdrop-blur-2xl text-right flex items-start gap-3.5 animate-slide-in"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {toast.type === 'order' ? (
              <ShoppingBag className="w-6 h-6 animate-pulse" />
            ) : (
              <FileQuestion className="w-6 h-6 animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-cyan-400" />
                {toast.title}
              </h4>
              <span className="text-[10px] text-slate-400">{toast.time}</span>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">{toast.message}</p>
            
            <Link
              href={toast.link}
              onClick={() => removeToast(toast.id)}
              className="inline-block mt-2.5 text-xs font-bold text-cyan-400 hover:text-white underline decoration-cyan-400/50"
            >
              عرض التفاصيل ←
            </Link>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
