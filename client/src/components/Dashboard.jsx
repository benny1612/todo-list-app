import { useAuth } from '../context/AuthContext';
import { useTodo } from '../context/TodoContext';
import TodoList from './TodoList';
import {
  LogOut, Plus, ListChecks, ArrowLeft, Trash2,
  Loader2, Pencil, Check, X, Users, User
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

  useEffect(() => {
    fetchLists();
  }, [currentList]);

  // --- יצירת רשימה חדשה ---
  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    try {
      const res = await api.post('/todos', { title: newListTitle });
      setNewListTitle('');
      toast.success('הרשימה נוצרה!');
      joinList(res.data._id);
    } catch (err) {
      toast.error('שגיאה ביצירת רשימה');
      console.error(err);
    }
  };

  // --- מחיקת רשימה ---
  const handleDeleteList = async (e, listId, listTitle) => {
    e.stopPropagation();
    const isConfirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את הרשימה "${listTitle}"?\nכל המשימות יימחקו לצמיתות.`
    );
    if (isConfirmed) {
      try {
        await api.delete(`/todos/${listId}`);
        fetchLists();
        toast.success('הרשימה נמחקה');
      } catch (err) {
        toast.error('שגיאה במחיקת הרשימה');
        console.error(err);
      }
    }
  };

  // --- הצטרפות דרך קוד שיתוף ---
  const handleJoinByCode = async () => {
    const code = shareCodeInput.trim().toUpperCase();
    if (!code) return;
    setJoiningCode(true);
    try {
      const res = await api.post(`/todos/join/${code}`);
      toast.success('הצטרפת לרשימה בהצלחה! 🎉');
      setShareCodeInput('');
      joinList(res.data._id);
    } catch (err) {
      const msg = err.response?.data?.error || 'קוד שגוי';
      toast.error(msg);
    } finally {
      setJoiningCode(false);
    }
  };

  // --- עריכת שם רשימה inline ---
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
      toast.success('שם הרשימה עודכן');
    } catch (err) {
      toast.error('שגיאה בעדכון שם');
    }
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingListId(null);
  };

  // --- Progress ---
  const getProgress = (items = []) => {
    if (!items.length) return { done: 0, total: 0, pct: 0 };
    const done = items.filter(i => i.completed).length;
    return { done, total: items.length, pct: Math.round((done / items.length) * 100) };
  };

  // --- תאריך ---
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('he-IL', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (currentList) return <TodoList />;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Toaster position="top-center" toastOptions={{ style: { direction: 'rtl' } }} />

      {/* Navbar */}
      <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700 p-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center" dir="rtl">
          <div className="flex items-center gap-3">
            <img src={user?.avatar} alt="avatar" className="w-10 h-10 rounded-full border-2 border-blue-500" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">שלום,</p>
              <p className="font-bold text-slate-100">{user?.displayName}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-400 transition-all"
            title="התנתק"
          >
            <LogOut size={22} />
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6" dir="rtl">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-l from-white to-slate-500 bg-clip-text text-transparent text-right">
            הרשימות שלי
          </h1>
          <p className="text-slate-400 mb-6 text-right">נהל את רשימות המשימות שלך בזמן אמת</p>

          {/* יצירת רשימה חדשה */}
          <div className="flex gap-2 p-2 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl focus-within:border-blue-500 transition-all mb-3">
            <input
              type="text"
              placeholder="שם לרשימה חדשה..."
              className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-white text-right"
              value={newListTitle}
              onChange={e => setNewListTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateList()}
            />
            <button
              onClick={handleCreateList}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl transition-all font-bold flex items-center gap-2"
            >
              <Plus size={18} /> צור
            </button>
          </div>

          {/* הצטרפות לרשימה דרך קוד שיתוף */}
          <div className="flex gap-2 p-2 bg-slate-800/60 rounded-2xl border border-slate-700/50 focus-within:border-purple-500 transition-all">
            <input
              type="text"
              placeholder="קוד שיתוף (לדוגמה: AB12-XY89)"
              className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-white text-right tracking-widest uppercase"
              value={shareCodeInput}
              onChange={e => setShareCodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
              maxLength={9}
            />
            <button
              onClick={handleJoinByCode}
              disabled={joiningCode || !shareCodeInput.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 rounded-xl transition-all font-bold flex items-center gap-2"
            >
              {joiningCode ? <Loader2 size={18} className="animate-spin" /> : <Users size={18} />}
              הצטרף
            </button>
          </div>
        </div>

        {/* רשימת הכרטיסיות */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">רשימות פעילות</h3>

          {loading ? (
            <div className="p-8 text-center text-slate-500 animate-pulse font-medium">טוען נתונים...</div>
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
                  className="w-full p-5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-2xl transition-all group cursor-pointer hover:border-blue-500/30"
                >
                  {/* שורה עליונה: אייקון + שם + תגים + כפתורים */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                        <ListChecks size={20} />
                      </div>

                      {/* שם הרשימה — עריכה inline */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            className="flex-1 bg-slate-700 rounded-lg px-3 py-1.5 text-white text-right focus:outline-none border border-blue-500"
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit(e, list._id);
                              if (e.key === 'Escape') handleCancelEdit(e);
                            }}
                          />
                          <button onClick={e => handleSaveEdit(e, list._id)}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-all">
                            <Check size={16} />
                          </button>
                          <button onClick={handleCancelEdit}
                            className="p-1.5 text-slate-400 hover:bg-slate-600 rounded-lg transition-all">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-100 truncate">{list.title}</p>
                            {/* תג שלי / משותף */}
                            {isOwner ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold shrink-0">שלי</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold shrink-0">משותף</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{formatDate(list.updatedAt)}</p>
                        </div>
                      )}
                    </div>

                    {/* כפתורי פעולה */}
                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => handleStartEdit(e, list)}
                          className="p-2 text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          title="ערוך שם"
                        >
                          <Pencil size={16} />
                        </button>
                        {isOwner && (
                          <button
                            onClick={e => handleDeleteList(e, list._id, list.title)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="מחק רשימה"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        <ArrowLeft size={18} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-[-4px] transition-all mr-1" />
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500">{done} מתוך {total} הושלמו</span>
                      <span className="text-xs text-slate-500">{pct}%</span>
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
            <div className="p-12 text-center bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500">
              אין רשימות כרגע. צור אחת למעלה!
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;