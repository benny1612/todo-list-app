import { useState, useEffect, useRef } from 'react';
import { useTodo } from '../context/TodoContext';
import {
  CheckCircle2, Circle, Trash2, Plus, GripVertical,
  ChevronRight, Loader2, PartyPopper, Copy, Check,
  CheckSquare, Pencil, X
} from 'lucide-react';
import api from '../services/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import toast, { Toaster } from 'react-hot-toast';

const TodoList = () => {
  const { currentList, toggleItem, leaveList, setCurrentList } = useTodo();
  const [newItem, setNewItem] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [enabled, setEnabled] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const resetTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // פתרון Strict Mode
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => { cancelAnimationFrame(animation); setEnabled(false); };
  }, []);

  // Auto-Reset עם Countdown
  useEffect(() => {
    const allCompleted =
      currentList?.items?.length > 0 &&
      currentList.items.every(i => i.completed);

    if (allCompleted && !isResetting) {
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
    } else if (!allCompleted && isResetting) {
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

  if (!currentList || !enabled) return null;

  const hasItems = currentList.items?.length > 0;
  const allDone = hasItems && currentList.items.every(i => i.completed);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-4 pb-28 relative min-h-screen" dir="rtl">
      <Toaster position="top-center" toastOptions={{ style: { direction: 'rtl', fontSize: '14px' } }} />

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

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={leaveList}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors shrink-0"
          >
            <ChevronRight size={20} />
          </button>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex-1 truncate">
            {currentList.title}
          </h2>
        </div>

        {/* קוד שיתוף */}
        {currentList.shareCode && (
          <div
            onClick={handleCopyCode}
            className="flex items-center justify-between gap-2 bg-slate-800/70 rounded-xl px-3 py-2 border border-slate-700 cursor-pointer hover:border-blue-500/40 transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-slate-500 shrink-0">קוד שיתוף:</span>
              <span className="font-mono font-bold text-slate-300 tracking-widest text-sm truncate">
                {currentList.shareCode}
              </span>
            </div>
            <div className="shrink-0">
              {codeCopied
                ? <Check size={15} className="text-green-400" />
                : <Copy size={15} className="text-slate-500" />
              }
            </div>
          </div>
        )}
      </div>

      {/* Check All */}
      {hasItems && !allDone && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleCheckAll}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/40 text-slate-400 hover:text-green-400 rounded-xl transition-all text-xs font-medium"
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
                      className={`group flex items-center gap-2.5 p-3.5 rounded-2xl border transition-all ${
                        snapshot.isDragging
                          ? 'shadow-2xl border-blue-500 bg-slate-700 scale-[1.01]'
                          : item.completed
                          ? 'bg-slate-800/40 border-slate-700/50 opacity-60'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      {/* ידית גרירה — מוסתרת במובייל, גלויה ב-hover בדסקטופ */}
                      <div
                        {...provided.dragHandleProps}
                        className="text-slate-600 cursor-grab active:cursor-grabbing hidden sm:block"
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
                          : <Circle className="text-slate-500 w-6 h-6" />
                        }
                      </button>

                      {/* טקסט */}
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input
                            autoFocus
                            className="flex-1 min-w-0 bg-slate-700 rounded-lg px-2.5 py-1.5 text-white text-right text-sm focus:outline-none border border-blue-500"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit(item.id);
                              if (e.key === 'Escape') setEditingItemId(null);
                            }}
                          />
                          <button onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 text-green-400 shrink-0">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingItemId(null)}
                            className="p-1.5 text-slate-400 shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`flex-1 min-w-0 text-sm sm:text-base font-medium text-right break-words ${
                            item.completed ? 'line-through text-slate-500' : 'text-slate-100'
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
                            className="p-2 text-slate-600 hover:text-blue-400 rounded-lg transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-2 text-slate-600 hover:text-red-500 rounded-lg transition-all"
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
        <div className="p-10 text-center bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 text-sm mt-6">
          אין משימות. הוסף את הראשונה למטה!
        </div>
      )}

      {/* Input קבוע בתחתית */}
      <div className="fixed bottom-0 left-0 right-0 px-3 pb-5 pt-3 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
        <form
          onSubmit={addItem}
          className="max-w-2xl mx-auto flex gap-2.5 bg-slate-800/95 backdrop-blur-2xl p-2 rounded-2xl border border-slate-700 shadow-2xl"
        >
          <input
            type="text"
            placeholder="מה המשימה הבאה?"
            className="flex-1 min-w-0 bg-transparent px-4 py-3 focus:outline-none text-white text-right text-sm sm:text-base"
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