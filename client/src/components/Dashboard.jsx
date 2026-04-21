import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import TodoList from './TodoList';
import {
  LogOut, Plus, ListChecks, ArrowLeft, Trash2,
  Loader2, Pencil, Check, X, Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { currentList, joinList } = useTodo();
  const [newListTitle, setNewListTitle] = useState('');
  const [userLists, setUserLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const fetchLists = async () => {
    try {
      const res = await api.get('/todos');
      setUserLists(res.data);
    } catch (err) {
      console.error('Error fetching lists', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLists(); }, [currentList]);

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const res = await api.post('/todos', { title: newListTitle });
      setNewListTitle('');
      toast.success('הרשימה נוצרה!');
      joinList(res.data._id);
    } catch (err) {
      toast.error('שגיאה ביצירת רשימה');
    }
  };

  const handleDeleteList = async (e, listId, listTitle) => {
    e.stopPropagation();
    if (!window.confirm(`למחוק את "${listTitle}"? לא ניתן לשחזר.`)) return;
    try {
      await api.delete(`/todos/${listId}`);
      fetchLists();
      toast.success('הרשימה נמחקה');
    } catch (err) {
      toast.error('שגיאה במחיקת הרשימה');
    }
  };

  const handleJoinByCode = async () => {
    const code = shareCodeInput.trim().toUpperCase();
    if (!code) return;
    setJoiningCode(true);
    try {
      const res = await api.post(`/todos/join/${code}`);
      toast.success('הצטרפת בהצלחה! 🎉');
      setShareCodeInput('');
      joinList(res.data._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'קוד שגוי');
    } finally {
      setJoiningCode(false);
    }
  };

  const handleStartEdit = (e, list) => {
    e.stopPropagation();
    setEditingListId(list._id);
    setEditingTitle(list.title);
  };

  const handleSaveEdit = async (e, listId) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;
    try {
      await api.put(`/todos/${listId}/name`, { title: editingTitle });
      fetchLists();
      setEditingListId(null);
      toast.success('שם עודכן');
    } catch {
      toast.error('שגיאה בעדכון שם');
    }
  };

  const handleCancelEdit = (e) => { e.stopPropagation(); setEditingListId(null); };

  const getProgress = (items = []) => {
    if (!items.length) return { done: 0, total: 0, pct: 0 };
    const done = items.filter(i => i.completed).length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
    : '';

  if (currentList) return <TodoList />;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toaster position="top-center" toastOptions={{ style: { direction: 'rtl', fontSize: '14px' } }} />

      {/* Navbar */}
      <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center" dir="rtl">
          <div className="flex items-center gap-2 min-w-0">
            <img src={user?.avatar} alt="avatar" className="w-9 h-9 rounded-full border-2 border-blue-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold leading-none">שלום,</p>
              <p className="font-bold text-slate-100 text-sm truncate max-w-[140px]">{user?.displayName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all shrink-0"
            title="התנתק"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-5" dir="rtl">
        {/* כותרת */}
        <div className="mb-5">
          <h1 className="text-3xl sm:text-4xl font-black mb-1 bg-gradient-to-l from-white to-slate-500 bg-clip-text text-transparent">
            הרשימות שלי
          </h1>
          <p className="text-slate-400 text-sm">נהל רשימות משימות שיתופיות בזמן אמת</p>
        </div>

        {/* יצירת רשימה */}
        <div className="flex gap-2 p-2 bg-slate-800 rounded-2xl border border-slate-700 focus-within:border-blue-500 transition-all mb-3">
          <input
            type="text"
            placeholder="שם לרשימה חדשה..."
            className="flex-1 min-w-0 bg-transparent px-3 py-2.5 focus:outline-none text-white text-right text-sm"
            value={newListTitle}
            onChange={e => setNewListTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateList()}
          />
          <button
            onClick={handleCreateList}
            disabled={!newListTitle.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} />
            <span>צור</span>
          </button>
        </div>

        {/* הצטרפות דרך קוד */}
        <div className="flex gap-2 p-2 bg-slate-800/60 rounded-2xl border border-slate-700/50 focus-within:border-purple-500 transition-all mb-6">
          <input
            type="text"
            placeholder="קוד שיתוף..."
            className="flex-1 min-w-0 bg-transparent px-3 py-2.5 focus:outline-none text-white text-right tracking-widest uppercase text-sm"
            value={shareCodeInput}
            onChange={e => setShareCodeInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
            maxLength={9}
          />
          <button
            onClick={handleJoinByCode}
            disabled={joiningCode || !shareCodeInput.trim()}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-all font-bold text-sm flex items-center gap-1.5 shrink-0"
          >
            {joiningCode
              ? <Loader2 size={16} className="animate-spin" />
              : <Users size={16} />
            }
            <span>הצטרף</span>
          </button>
        </div>

        {/* רשימת כרטיסיות */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">רשימות פעילות</h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 animate-pulse text-sm">טוען...</div>
          ) : userLists.length > 0 ? (
            userLists.map(list => {
              const { done, total, pct } = getProgress(list.items);
              const isOwner = list.owner?.toString() === user?._id?.toString()
                || list.owner === user?._id;
              const isEditing = editingListId === list._id;

              return (
                <div
                  key={list._id}
                  onClick={() => !isEditing && joinList(list._id)}
                  className="w-full p-4 bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-2xl transition-all group cursor-pointer hover:border-blue-500/40"
                >
                  {/* שורה עליונה */}
                  <div className="flex items-center gap-3 mb-3">
                    {/* אייקון */}
                    <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                      <ListChecks size={18} />
                    </div>

                    {/* שם + תגים */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            className="flex-1 min-w-0 bg-slate-700 rounded-lg px-2.5 py-1 text-white text-right text-sm focus:outline-none border border-blue-500"
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit(e, list._id);
                              if (e.key === 'Escape') handleCancelEdit(e);
                            }}
                          />
                          <button onClick={e => handleSaveEdit(e, list._id)}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg shrink-0">
                            <Check size={14} />
                          </button>
                          <button onClick={handleCancelEdit}
                            className="p-1.5 text-slate-400 hover:bg-slate-600 rounded-lg shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-100 text-sm truncate max-w-[160px] sm:max-w-none">
                            {list.title}
                          </span>
                          {isOwner
                            ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold shrink-0">שלי</span>
                            : <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold shrink-0">משותף</span>
                          }
                        </div>
                      )}
                      {!isEditing && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(list.updatedAt)}</p>
                      )}
                    </div>

                    {/* כפתורי פעולה */}
                    {!isEditing && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={e => handleStartEdit(e, list)}
                          className="p-2 text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                          title="ערוך שם"
                        >
                          <Pencil size={14} />
                        </button>
                        {isOwner && (
                          <button
                            onClick={e => handleDeleteList(e, list._id, list.title)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                            title="מחק"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <ArrowLeft size={16} className="text-slate-600 group-hover:text-blue-400 transition-all" />
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-slate-500">{pct}%</span>
                      <span className="text-[11px] text-slate-500">{done} מתוך {total} הושלמו</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 text-sm">
              אין רשימות כרגע. צור אחת למעלה!
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;