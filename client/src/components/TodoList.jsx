import { useState, useEffect, useRef } from 'react';
import { useTodo } from '../context/TodoContext';
import { useAuth } from '../context/AuthContext';
import MembersPanel from './MembersPanel';
import ThemeToggle from './ThemeToggle';
import {
  CheckCircle2, Circle, Trash2, Plus, GripVertical,
  ChevronRight, Loader2, PartyPopper, Copy, Check,
  CheckSquare, Pencil, X, Users, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast, { Toaster } from 'react-hot-toast';

const TodoList = () => {
  const { currentList, toggleItem, leaveList, setCurrentList, removeMember, toggleAutoReset } = useTodo();
  const { user } = useAuth();
  const [newItem, setNewItem] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [enabled, setEnabled] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const resetTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const isOwner = currentList?.owner?._id?.toString() === user?._id?.toString()
    || currentList?.owner?.toString() === user?._id?.toString();

  // פתרון Strict Mode
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => { cancelAnimationFrame(animation); setEnabled(false); };
  }, []);

  // Auto-Reset עם Countdown — רק אם autoReset פעיל
  useEffect(() => {
    const allCompleted =
      currentList?.items?.length > 0 &&
      currentList.items.every(i => i.completed);

    if (allCompleted && !isResetting && currentList?.autoReset) {
      setIsResetting(true);
      setCountdown(3);
      let count = 3;
      countdownRef.current = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) clearInterval(countdownRef.current);
      }, 1000);
      resetTimerRef.current = setTimeout(async () => {
        try {
          await api.post('/todos/reset', { listId: currentList._id });
        } catch {
          setIsResetting(false);
        }
      }, 3000);
    } else if ((!allCompleted || !currentList?.autoReset) && isResetting) {
      setIsResetting(false);
      clearTimeout(resetTimerRef.current);
      clearInterval(countdownRef.current);
    }
    return () => { clearTimeout(resetTimerRef.current); clearInterval(countdownRef.current); };
  }, [currentList]);

  const onDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const newItems = Array.from(currentList.items);
    const [moved] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, moved);
    setCurrentList({ ...currentList, items: newItems });
    try {
      await api.put(`/todos/${currentList._id}/reorder`, { items: newItems });
    } catch { /* silent */ }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      await api.post(`/todos/${currentList._id}/items`, { text: newItem });
      setNewItem('');
    } catch {
      toast.error('שגיאה בהוספת משימה');
    }
  };

  const deleteItem = async (itemId) => {
    try { await api.delete(`/todos/${currentList._id}/items/${itemId}`); }
    catch { toast.error('שגיאה במחיקה'); }
  };

  const handleCheckAll = async () => {
    try { await api.put(`/todos/${currentList._id}/check-all`); }
    catch { toast.error('שגיאה'); }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEdit = async (itemId) => {
    if (!editingText.trim()) return;
    try {
      await api.put('/todos/update-item', { listId: currentList._id, itemId, text: editingText });
      setEditingItemId(null);
    } catch { toast.error('שגיאה בעדכון'); }
  };

  const handleCopyCode = () => {
    if (!currentList?.shareCode) return;
    navigator.clipboard.writeText(currentList.shareCode);
    setCodeCopied(true);
    toast.success('קוד הועתק!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleToggleAutoReset = async () => {
    try {
      await toggleAutoReset(currentList._id);
      toast.success(currentList.autoReset ? 'איפוס אוטומטי כובה' : 'איפוס אוטומטי הופעל');
    } catch {
      toast.error('שגיאה בשינוי ההגדרה');
    }
  };

  const handleMemberRemoved = (userId) => {
    setCurrentList(prev => ({
      ...prev,
      members: prev.members?.filter(m => (m._id || m).toString() !== userId)
    }));
  };

  if (!currentList || !enabled) return null;

  const hasItems = currentList.items?.length > 0;
  const allDone = hasItems && currentList.items.every(i => i.completed);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors" dir="rtl">
      <Toaster position="top-center" toastOptions={{ style: { direction: 'rtl', fontSize: '14px' } }} />

      {/* Members Panel */}
      {showMembers && (
        <MembersPanel
          list={currentList}
          currentUserId={user?._id}
          onClose={() => setShowMembers(false)}
          onMemberRemoved={handleMemberRemoved}
        />
      )}

      {/* Overlay Auto-Reset */}
      {isResetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-3xl shadow-2xl text-center border border-blue-400/50 w-full max-w-xs">
            <PartyPopper className="w-14 h-14 text-white mx-auto mb-3" />
            <h3 className="text-2xl font-black text-white mb-2">עבודה טובה! 🎉</h3>
            <p className="text-blue-100 mb-5 text-sm">השלמת את כל המשימות!</p>
            <div className="flex items-center justify-center gap-2 text-white/90">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">מתאפס בעוד </span>
              <span className="text-3xl font-black tabular-nums">{countdown}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Navbar */}
      <nav className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-3 sticky top-0 z-10 transition-colors">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Right: back + title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={leaveList}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 dark:text-slate-400 transition-colors shrink-0"
            >
              <ChevronRight size={20} />
            </button>
            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight truncate">
              {currentList.title}
            </h2>
          </div>

          {/* Left: actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Auto-Reset toggle */}
            <button
              onClick={handleToggleAutoReset}
              disabled={!isOwner}
              title={isOwner
                ? (currentList.autoReset ? 'כבה איפוס אוטומטי' : 'הפעל איפוס אוטומטי')
                : 'רק הבעלים יכול לשנות הגדרה זו'
              }
              className={`
                p-2 rounded-xl transition-all text-xs font-bold flex items-center gap-1
                ${currentList.autoReset
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20'
                  : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
                ${!isOwner ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <RefreshCw size={15} />
              <span className="hidden sm:inline">{currentList.autoReset ? 'איפוס אוטו׳' : 'ללא איפוס'}</span>
            </button>

            {/* Members */}
            <button
              onClick={() => setShowMembers(true)}
              className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all flex items-center gap-1"
              title="חברים ברשימה"
            >
              <Users size={18} />
              {currentList.members?.length > 0 && (
                <span className="text-[11px] font-bold">{currentList.members.length}</span>
              )}
            </button>

            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 pb-28">
        {/* קוד שיתוף */}
        {currentList.shareCode && (
          <div
            onClick={handleCopyCode}
            className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800/70 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500/40 transition-all mb-4 shadow-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">קוד שיתוף:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 tracking-widest text-sm truncate">
                {currentList.shareCode}
              </span>
            </div>
            <div className="shrink-0">
              {codeCopied
                ? <Check size={15} className="text-green-500" />
                : <Copy size={15} className="text-slate-400 dark:text-slate-500" />
              }
            </div>
          </div>
        )}

        {/* Check All */}
        {hasItems && !allDone && (
          <div className="flex justify-end mb-3">
            <button
              onClick={handleCheckAll}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-green-500/40 text-slate-500 dark:text-slate-400 hover:text-green-500 dark:hover:text-green-400 rounded-xl transition-all text-xs font-medium"
            >
              <CheckSquare size={14} />
              סמן הכל
            </button>
          </div>
        )}

        {/* משימות */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="todos-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2.5">
                {currentList.items.map((item, index) => (
                  <Draggable key={String(item.id)} draggableId={String(item.id)} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group flex items-center gap-2.5 p-3.5 rounded-2xl border transition-all ${snapshot.isDragging
                            ? 'shadow-2xl border-blue-500 bg-blue-50 dark:bg-slate-700 scale-[1.01]'
                            : item.completed
                              ? 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/50 opacity-60'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                      >
                        {/* ידית גרירה — גלויה בכל מכשיר כולל מובייל */}
                        <div
                          {...provided.dragHandleProps}
                          className="text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing touch-none shrink-0 p-1 -ml-1"
                        >
                          <GripVertical size={18} />
                        </div>

                        {/* Checkbox */}
                        <button
                          onClick={() => toggleItem(currentList._id, item.id, !item.completed)}
                          className="shrink-0"
                        >
                          {item.completed
                            ? <CheckCircle2 className="text-green-500 w-6 h-6" />
                            : <Circle className="text-slate-300 dark:text-slate-500 w-6 h-6" />
                          }
                        </button>

                        {/* טקסט */}
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              autoFocus
                              className="flex-1 min-w-0 bg-slate-100 dark:bg-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white text-right text-sm focus:outline-none border border-blue-500"
                              value={editingText}
                              onChange={e => setEditingText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit(item.id);
                                if (e.key === 'Escape') setEditingItemId(null);
                              }}
                            />
                            <button onClick={() => handleSaveEdit(item.id)}
                              className="p-1.5 text-green-500 shrink-0">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditingItemId(null)}
                              className="p-1.5 text-slate-400 shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`flex-1 min-w-0 text-sm sm:text-base font-medium text-right break-words ${item.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-100'
                              }`}
                            onDoubleClick={() => handleStartEdit(item)}
                          >
                            {item.text}
                          </span>
                        )}

                        {/* כפתורי עריכה / מחיקה */}
                        {editingItemId !== item.id && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 rounded-lg transition-all"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {!hasItems && (
          <div className="p-10 text-center bg-white dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-slate-400 dark:text-slate-500 text-sm mt-6">
            אין משימות. הוסף את הראשונה למטה!
          </div>
        )}
      </div>

      {/* Input קבוע בתחתית */}
      <div className="fixed bottom-0 left-0 right-0 px-3 pb-5 pt-3 bg-gradient-to-t from-slate-50 dark:from-slate-900 via-slate-50/90 dark:via-slate-900/90 to-transparent">
        <form
          onSubmit={addItem}
          className="max-w-2xl mx-auto flex gap-2.5 bg-white dark:bg-slate-800/95 backdrop-blur-2xl p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl"
        >
          <input
            type="text"
            placeholder="מה המשימה הבאה?"
            className="flex-1 min-w-0 bg-transparent px-4 py-3 focus:outline-none text-slate-800 dark:text-white placeholder:text-slate-400 text-right text-sm sm:text-base"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            className="bg-blue-600 text-white p-3.5 rounded-xl active:scale-95 disabled:opacity-50 transition-all hover:bg-blue-500 shrink-0"
          >
            <Plus size={22} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TodoList;