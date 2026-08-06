'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Bell,
  Send,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  X,
  Shield,
  MessageSquare,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Notification Modal State
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedUserForNotif, setSelectedUserForNotif] = useState<UserProfile | null>(null);
  const [notifData, setNotifData] = useState({
    title: '',
    message: '',
  });
  const [sendingNotif, setSendingNotif] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Query profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUsers(data as UserProfile[]);
      } else {
        // Fallback: fetch from users table
        const { data: fallbackData } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackData) {
          const mapped: UserProfile[] = fallbackData.map((u: any) => ({
            id: u.id,
            full_name: u.full_name || u.name || 'مستخدم نوفيكسا',
            email: u.email || '',
            phone: u.phone || '',
            is_disabled: u.is_disabled || u.status === 'disabled' || false,
            created_at: u.created_at || new Date().toISOString(),
            avatar_url: u.avatar_url || '',
          }));
          setUsers(mapped);
        }
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query)
    );
  });

  // Toggle User Disabled / Enabled State
  const toggleUserDisable = async (user: UserProfile) => {
    const nextDisabledState = !user.is_disabled;
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_disabled: nextDisabledState } : u))
    );

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_disabled: nextDisabledState })
        .eq('id', user.id);

      if (error) {
        await supabase
          .from('users')
          .update({ is_disabled: nextDisabledState })
          .eq('id', user.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Open notification modal for a specific user
  const handleOpenNotifModal = (user: UserProfile) => {
    setSelectedUserForNotif(user);
    setNotifData({
      title: 'إشعار خاص من إدارة NOVIXA',
      message: `مرحباً ${user.full_name}، `,
    });
    setShowNotifModal(true);
  };

  // Send Notification to Database
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForNotif || !notifData.title || !notifData.message) {
      alert('يرجى كتابة عنوان ونص الإشعار');
      return;
    }

    setSendingNotif(true);
    try {
      const payload = {
        user_id: selectedUserForNotif.id,
        title: notifData.title,
        message: notifData.message,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_notifications').insert([payload]);

      if (error) {
        // Fallback to notifications table
        await supabase.from('notifications').insert([payload]);
      }

      alert(`تم إرسال الإشعار بنجاح إلى المستخدم (${selectedUserForNotif.full_name})`);
      setShowNotifModal(false);
    } catch (err: any) {
      alert(`حدث خطأ أثناء إرسال الإشعار: ${err.message}`);
    } finally {
      setSendingNotif(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl glass-panel">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-cyan-400" /> إدارة حسابات المستخدمين والعملاء
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            عرض بيانات العملاء المسجلين، إمكانية تعطيل وتفعيل الحسابات، وإرسال إشعارات مخصصة لكل مستخدم
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="ابحث عن مستخدم باسمه، بريده الإلكتروني، أو رقم الهاتف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-11 pl-4 py-3 rounded-2xl glass-input text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>إجمالي المستخدمين: {filteredUsers.length} من أصل {users.length}</span>
          <button onClick={fetchUsers} className="flex items-center gap-1.5 hover:text-cyan-400">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="bg-white/5 text-slate-300 border-b border-white/10 font-bold">
                <th className="py-4 pr-6">المستخدم</th>
                <th className="py-4">البريد الإلكتروني</th>
                <th className="py-4">رقم الهاتف</th>
                <th className="py-4">تاريخ التسجيل</th>
                <th className="py-4">حالة الحساب</th>
                <th className="py-4 pl-6 text-center">الإجراءات والخيارات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    جاري تحميل حسابات المستخدمين...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    لا يوجد مستخدمون مطابقون لنتيجة البحث
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    {/* Name & Avatar */}
                    <td className="py-4 pr-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-black text-sm flex-shrink-0">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {user.full_name || 'مستخدم بدون اسم'}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate max-w-[140px]">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 text-xs font-mono text-slate-300">
                      {user.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="py-4 text-xs font-mono text-slate-300">
                      {user.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Registration Date */}
                    <td className="py-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                      </span>
                    </td>

                    {/* Account Status Toggle */}
                    <td className="py-4">
                      <button
                        onClick={() => toggleUserDisable(user)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          !user.is_disabled
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {!user.is_disabled ? (
                          <>
                            <UserCheck className="w-4 h-4 text-emerald-400" /> نشط
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 text-rose-400" /> معطّل
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions: Send Notification */}
                    <td className="py-4 pl-6 text-center">
                      <button
                        onClick={() => handleOpenNotifModal(user)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all text-xs font-bold mx-auto"
                      >
                        <Bell className="w-3.5 h-3.5" /> إرسال إشعار
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Send User Notification */}
      {showNotifModal && selectedUserForNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-cyan-400" />
                إرسال إشعار مباشر لـ ({selectedUserForNotif.full_name})
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان الإشعار *</label>
                <input
                  type="text"
                  required
                  value={notifData.title}
                  onChange={(e) => setNotifData({ ...notifData, title: e.target.value })}
                  placeholder="مثال: خصم خاص 20% على طلبيتك القادمة"
                  className="w-full p-3 rounded-xl glass-input text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">نص ومحتوى الإشعار *</label>
                <textarea
                  rows={4}
                  required
                  value={notifData.message}
                  onChange={(e) => setNotifData({ ...notifData, message: e.target.value })}
                  placeholder="اكتب رسالتك للمستخدم هنا..."
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
                  {sendingNotif ? 'جاري الإرسال...' : 'إرسال الإشعار الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
