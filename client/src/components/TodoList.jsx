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

  // פתרון לבעיית DnD ב-React 18 Strict Mode
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  // לוגיקת Auto-Reset עם Countdown
  useEffect(() => {
    const allCompleted =
      currentList?.items?.length > 0 &&
      currentList.items.every(item => item.completed);

    if (allCompleted && !isResetting) {
      setIsResetting(true);
      setCountdown(3);

      // Countdown: 3..2..1
      let count = 3;
      countdownRef.current = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) clearInterval(countdownRef.current);
      }, 1000);

      // איפוס אחרי 3 שניות
      resetTimerRef.current = setTimeout(async () => {
        try {
          await api.post('/todos/reset', { listId: currentList._id });
        } catch (err) {
          console.error('Reset failed:', err);
          setIsResetting(false);
        }
      }, 3000);

    } else if (!allCompleted && isResetting) {
      setIsResetting(false);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    }

    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [currentList]);

  // Drag & Drop
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;

    const newItems = Array.from(currentList.items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setCurrentList({ ...currentList, items: newItems });

    try {
      await api.put(`/todos/${currentList._id}/reorder`, { items: newItems });
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  };

  // הוספת פריט
  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    try {
      await api.post(`/todos/${currentList._id}/items`, { text: newItem });
      setNewItem('');
    } catch (err) {
      toast.error('שגיאה בהוספת משימה');
    }
  };

  // מחיקת פריט
  const deleteItem = async (itemId) => {
    try {
      await api.delete(`/todos/${currentList._id}/items/${itemId}`);
    } catch (err) {
      toast.error('שגיאה במחיקת משימה');
    }
  };

  // Check All
  const handleCheckAll = async () => {
    try {
      await api.put(`/todos/${currentList._id}/check-all`);
    } catch (err) {
      toast.error('שגיאה בסימון הכל');
    }
  };

  // עריכה inline של טקסט משימה
  const handleStartEditItem = (e, item) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setEditingText(item.text);
  };

  const handleSaveEditItem = async (e, itemId) => {
    e.stopPropagation();
    if (!editingText.trim()) return;
    try {
      await api.put('/todos/update-item', {
        listId: currentList._id,
        itemId,
        text: editingText
      });
      setEditingItemId(null);
    } catch (err) {
      toast.error('שגיאה בעדכון משימה');
    }
  };

  const handleCancelEditItem = (e) => {
    e.stopPropagation();
    setEditingItemId(null);
  };

  // העתקת קוד שיתוף
  const handleCopyCode = () => {
    if (!currentList?.shareCode) return;
    navigator.clipboard.writeText(currentList.shareCode);
    setCodeCopied(true);
    toast.success('קוד השיתוף הועתק!');
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (!currentList || !enabled) return null;

  const allDone = currentList.items?.length > 0 && currentList.items.every(i => i.completed);
  const hasItems = currentList.items?.length > 0;

  return (
    <div className="max-w-2xl mx-auto p-4 pb-32 relative min-h-screen" dir="rtl">
      <Toaster position="top-center" toastOptions={{ style: { direction: 'rtl' } }} />

      {/* Overlay Auto-Reset עם Countdown */}
      {isResetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-10 rounded-3xl shadow-2xl text-center border border-blue-400/50 animate-in zoom-in duration-300">
            <PartyPopper className="w-16 h-16 text-white mx-auto mb-4" />
            <h3 className="text-3xl font-black text-white mb-2">עבודה טובה! 🎉</h3>
            <p className="text-blue-100 text-lg mb-6">השלמת בהצלחה את כל המשימות!</p>
            <div className="flex items-center justify-center gap-3 text-white/90">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-lg">מתאפס בעוד </span>
              <span className="text-4xl font-black tabular-nums">{countdown}</span>
              <span className="text-lg">שניות...</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={leaveList}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-colors"
            title="חזרה לדאשבורד"
          >
            <ChevronRight size={24} />
          </button>
          <h2 className="text-3xl font-black text-white tracking-tight flex-1 text-right">
            {currentList.title}
          </h2>
        </div>

        {/* קוד שיתוף */}
        {currentList.shareCode && (
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2 border border-slate-700 w-fit mr-auto">
            <span className="text-xs text-slate-500">קוד שיתוף:</span>
            <span className="font-mono font-bold text-slate-300 tracking-widest text-sm">
              {currentList.shareCode}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-all"
              title="העתק קוד"
            >
              {codeCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        )}
      </div>

      {/* Check All button */}
      {hasItems && !allDone && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleCheckAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/40 text-slate-300 hover:text-green-400 rounded-xl transition-all text-sm font-medium"
          >
            <CheckSquare size={16} />
            סמן הכל
          </button>
        </div>
      )}

      {/* רשימת המשימות */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="todos-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {currentList.items.map((item, index) => (
                <Draggable
                  key={String(item.id)}
                  draggableId={String(item.id)}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        snapshot.isDragging
                          ? 'shadow-2xl border-blue-500 bg-slate-700 scale-[1.02]'
                          : item.completed
                          ? 'bg-slate-800/40 border-slate-700/50 opacity-60'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      {/* ידית גרירה */}
                      <div
                        {...provided.dragHandleProps}
                        className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <GripVertical size={20} />
                      </div>

                      {/* Checkbox */}
                      <button onClick={() => toggleItem(currentList._id, item.id, !item.completed)}>
                        {item.completed
                          ? <CheckCircle2 className="text-green-500 w-6 h-6" />
                          : <Circle className="text-slate-500 w-6 h-6" />
                        }
                      </button>

                      {/* טקסט המשימה — עריכה inline */}
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            className="flex-1 bg-slate-700 rounded-lg px-3 py-1.5 text-white text-right focus:outline-none border border-blue-500"
                            value={editingText}
                            onChange={e => setEditingText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEditItem(e, item.id);
                              if (e.key === 'Escape') handleCancelEditItem(e);
                            }}
                          />
                          <button onClick={e => handleSaveEditItem(e, item.id)}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg transition-all">
                            <Check size={16} />
                          </button>
                          <button onClick={handleCancelEditItem}
                            className="p-1.5 text-slate-400 hover:bg-slate-600 rounded-lg transition-all">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`flex-1 text-base font-medium text-right cursor-pointer ${
                            item.completed ? 'line-through text-slate-500' : 'text-slate-100'
                          }`}
                          onDoubleClick={e => handleStartEditItem(e, item)}
                          title="לחץ פעמיים לעריכה"
                        >
                          {item.text}
                        </span>
                      )}

                      {/* כפתורי עריכה + מחיקה */}
                      {editingItemId !== item.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => handleStartEditItem(e, item)}
                            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                            title="ערוך"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            title="מחק"
                          >
                            <Trash2 size={15} />
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

      {/* מצב ריק */}
      {!hasItems && (
        <div className="p-12 text-center bg-slate-800/30 border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 mt-8">
          אין משימות עדיין. הוסף את הראשונה!
        </div>
      )}

      {/* Input Form קבוע בתחתית */}
      <div className="fixed bottom-8 left-0 right-0 px-4">
        <form
          onSubmit={addItem}
          className="max-w-2xl mx-auto flex gap-3 bg-slate-900/90 backdrop-blur-2xl p-2.5 rounded-3xl border border-slate-700 shadow-2xl"
        >
          <input
            type="text"
            placeholder="מה המשימה הבאה?"
            className="flex-1 bg-transparent px-5 py-3 focus:outline-none text-white text-lg text-right"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newItem.trim()}
            className="bg-blue-600 text-white p-4 rounded-2xl active:scale-95 disabled:opacity-50 transition-all hover:bg-blue-500"
          >
            <Plus size={24} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TodoList;