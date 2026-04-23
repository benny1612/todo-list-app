import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ThemeToggle from './ThemeToggle';
import {
  ChevronRight, Users, ListChecks, Mail, Calendar,
  RefreshCw, Shield, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

const ADMIN_EMAIL = 'benny.neiman2@gmail.com';

const AdminPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [lists, setLists] = useState([]);
  const [tab, setTab] = useState('users'); // 'users' | 'lists'
  const [loading, setLoading] = useState(true);
  const [expandedList, setExpandedList] = useState(null);

  useEffect(() => {
    if (user?.email !== ADMIN_EMAIL) return;
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, listsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/lists')
      ]);
      setUsers(usersRes.data);
      setLists(listsRes.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

  if (user?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center p-8">
          <Shield size={48} className="mx-auto mb-3 text-red-400" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">גישה נדחתה</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">אזור מנהל בלבד</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:opacity-80 transition">
            חזור
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white transition-colors">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between" dir="rtl">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-500/10 rounded-lg">
                <Shield size={18} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-white">לוח בקרה</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Admin</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              title="רענן נתונים"
              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
            >
              <RefreshCw size={16} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-6" dir="rtl">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-blue-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">משתמשים</span>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{users.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <ListChecks size={16} className="text-purple-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">רשימות</span>
            </div>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{lists.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl mb-5 w-fit">
          {[
            { id: 'users', label: 'משתמשים', icon: Users },
            { id: 'lists', label: 'רשימות', icon: ListChecks }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : tab === 'users' ? (
          /* ─── Users Tab ─── */
          <div className="space-y-2">
            {users.map(u => (
              <div
                key={u._id}
                className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl"
              >
                <img
                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=3b82f6&color=fff`}
                  alt={u.displayName}
                  className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-600 shrink-0 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {u.displayName}
                    </span>
                    {u.email === ADMIN_EMAIL && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-bold shrink-0">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <Mail size={10} />
                    <span className="truncate">{u.email}</span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
                  <Calendar size={10} />
                  {formatDate(u.createdAt)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ─── Lists Tab ─── */
          <div className="space-y-2">
            {lists.map(list => {
              const isExpanded = expandedList === list._id;
              const done = list.items?.filter(i => i.completed).length || 0;
              const total = list.items?.length || 0;
              return (
                <div
                  key={list._id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setExpandedList(isExpanded ? null : list._id)}
                  >
                    <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl shrink-0">
                      <ListChecks size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate block">
                        {list.title}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users size={10} /> {list.members?.length || 0} חברים
                        </span>
                        <span>·</span>
                        <span>{done}/{total} משימות</span>
                        <span>·</span>
                        <span>{formatDate(list.updatedAt)}</span>
                        {!list.autoReset && (
                          <>
                            <span>·</span>
                            <span className="text-amber-500">ללא איפוס אוטו'</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono px-2 py-0.5 rounded-lg">
                        {list.shareCode}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700 p-4" dir="rtl">
                      {/* Owner */}
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">בעלים</p>
                        {list.owner && (
                          <div className="flex items-center gap-2">
                            <img
                              src={list.owner.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(list.owner.displayName || 'U')}&background=f59e0b&color=fff`}
                              className="w-7 h-7 rounded-full border border-amber-300 shrink-0 object-cover"
                              alt=""
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-200">{list.owner.displayName}</span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">{list.owner.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Members */}
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">חברים ({list.members?.length})</p>
                        <div className="space-y-1.5">
                          {list.members?.map(m => (
                            <div key={m._id} className="flex items-center gap-2">
                              <img
                                src={m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.displayName || 'U')}&background=3b82f6&color=fff`}
                                className="w-6 h-6 rounded-full shrink-0 object-cover"
                                alt=""
                              />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{m.displayName}</span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500">{m.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items */}
                      {total > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">משימות ({total})</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {list.items?.map(item => (
                              <div key={item.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <span className={`w-3 h-3 rounded-full shrink-0 ${item.completed ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                <span className={item.completed ? 'line-through text-slate-400 dark:text-slate-600' : ''}>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
