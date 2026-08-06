'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Shield, LogIn, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@novixa.com');
  const [password, setPassword] = useState('Novixa@2025');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } else if (error.message.includes('Email not confirmed')) {
          setError('يرجى تأكيد البريد الإلكتروني أولاً');
        } else {
          setError(error.message);
        }
        return;
      }

      // Redirect to dashboard - middleware will handle this
      window.location.href = '/';
    } catch (err: any) {
      setError('حدث خطأ غير متوقع، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#08111F] flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Background glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,242,254,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,242,254,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,100,255,0.5)] border border-cyan-500/30">
              <img src="/logo.png" alt="Novixa Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">
            NOVIXA{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              ADMIN
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">لوحة التحكم الإدارية — تسجيل الدخول</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-2 mb-6 pb-5 border-b border-white/10">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">الدخول الآمن</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                placeholder="admin@novixa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(0,242,254,0.1)] transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(0,242,254,0.1)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="py-3 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium text-center animate-shake">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,242,254,0.3)] hover:opacity-90 hover:scale-[1.02] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                  جاري التحقق...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  تسجيل الدخول إلى اللوحة
                </>
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-500">
              بيانات الدخول إلى لوحة التحكم يتم إدارتها من قِبل مسؤول النظام
            </p>
          </div>
        </div>

        {/* Version tag */}
        <div className="text-center mt-6 flex flex-col items-center gap-1">
          <span className="text-[10px] text-slate-600 font-mono">NOVIXA ADMIN v1.0 · 2025</span>
          <a 
            href="https://suriix.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            تطوير بواسطة <span className="font-bold tracking-widest text-cyan-500">SURIIX</span>
          </a>
        </div>
      </div>
    </div>
  );
}
