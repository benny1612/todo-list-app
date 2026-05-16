import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

const ConfirmDialog = ({ isOpen, taskText, onConfirm, onCancel }) => {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default (safer UX)
      setTimeout(() => cancelBtnRef.current?.focus(), 50);

      const handleKey = (e) => {
        if (e.key === 'Escape') onCancel();
      };
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="confirm-card" dir="rtl">
        {/* Icon */}
        <div className="confirm-icon-ring">
          <AlertTriangle className="confirm-icon" />
        </div>

        {/* Title */}
        <h3 id="confirm-title" className="confirm-title">מחיקת משימה</h3>

        {/* Body */}
        <p className="confirm-body">
          האם אתה בטוח שברצונך למחוק את המשימה
        </p>
        {taskText && (
          <p className="confirm-task-name">"{taskText}"</p>
        )}
        <p className="confirm-note">פעולה זו אינה ניתנת לביטול.</p>

        {/* Buttons */}
        <div className="confirm-actions">
          <button
            ref={cancelBtnRef}
            className="confirm-btn-cancel"
            onClick={onCancel}
          >
            <X size={15} />
            ביטול
          </button>
          <button
            className="confirm-btn-delete"
            onClick={onConfirm}
          >
            <Trash2 size={15} />
            מחק
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
