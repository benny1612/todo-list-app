import { X, UserX, Users, Crown, Shield } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MembersPanel = ({ list, currentUserId, onClose, onMemberRemoved }) => {
  const isOwner = list.owner?._id?.toString() === currentUserId?.toString()
    || list.owner?.toString() === currentUserId?.toString();

  const handleRemove = async (memberId, memberName) => {
    if (!window.confirm(`להסיר את "${memberName}" מהרשימה?`)) return;
    try {
      await api.delete(`/todos/${list._id}/members/${memberId}`);
      toast.success(`${memberName} הוסר מהרשימה`);
      onMemberRemoved(memberId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'שגיאה בהסרת החבר');
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="
          w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden
          bg-white dark:bg-slate-800
          border-slate-200 dark:border-slate-700
        "
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            <h2 className="font-bold text-slate-800 dark:text-white text-base">
              חברים ברשימה
            </h2>
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-2 py-0.5 font-medium">
              {list.members?.length || 0}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto" dir="rtl">
          {list.members?.map(member => {
            const memberId = member._id?.toString();
            const isOwnerMember = memberId === (
              list.owner?._id?.toString() || list.owner?.toString()
            );
            const isMe = memberId === currentUserId?.toString();

            return (
              <div
                key={memberId}
                className="
                  flex items-center gap-3 p-2.5 rounded-xl transition-colors
                  bg-slate-50 dark:bg-slate-700/50
                  hover:bg-slate-100 dark:hover:bg-slate-700
                "
              >
                {/* Avatar */}
                <img
                  src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.displayName)}&background=3b82f6&color=fff`}
                  alt={member.displayName}
                  className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-600 shrink-0 object-cover"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {member.displayName}
                      {isMe && <span className="text-slate-400 dark:text-slate-500 font-normal"> (את/ה)</span>}
                    </span>
                    {isOwnerMember && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold shrink-0">
                        <Crown size={9} /> בעלים
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{member.email}</p>
                </div>

                {/* Remove button — owner only, can't remove self or other owner */}
                {isOwner && !isOwnerMember && (
                  <button
                    onClick={() => handleRemove(memberId, member.displayName)}
                    className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                    title={`הסר את ${member.displayName}`}
                  >
                    <UserX size={16} />
                  </button>
                )}

                {/* View-only badge for non-owners */}
                {!isOwner && !isOwnerMember && (
                  <Shield size={14} className="shrink-0 text-slate-300 dark:text-slate-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            {isOwner
              ? 'כבעלים, תוכל/י להסיר חברים מהרשימה'
              : 'רק הבעלים יכול להסיר חברים'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembersPanel;
