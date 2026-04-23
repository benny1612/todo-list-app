import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { socket } from '../services/socket';

const TodoContext = createContext();

export const TodoProvider = ({ children }) => {
  const [currentList, setCurrentList] = useState(null);

  // האזנה לאירועי Socket בזמן אמת
  useEffect(() => {
    socket.connect();

    const updateItems = (listId, items) => {
      setCurrentList(prev =>
        prev && prev._id === listId ? { ...prev, items } : prev
      );
    };

    socket.on('task-added', ({ listId, items }) => updateItems(listId, items));
    socket.on('task-updated', ({ listId, items }) => updateItems(listId, items));
    socket.on('task-deleted', ({ listId, items }) => updateItems(listId, items));
    socket.on('tasks-reordered', ({ listId, items }) => updateItems(listId, items));
    socket.on('tasks-reset', ({ listId, items }) => updateItems(listId, items));

    // עדכון autoReset בזמן אמת
    socket.on('auto-reset-changed', ({ listId, autoReset }) => {
      setCurrentList(prev =>
        prev && prev._id === listId ? { ...prev, autoReset } : prev
      );
    });

    // הסרת חבר בזמן אמת
    socket.on('member-removed', ({ listId, userId }) => {
      setCurrentList(prev => {
        if (!prev || prev._id !== listId) return prev;
        return {
          ...prev,
          members: prev.members?.filter(m =>
            (m._id || m).toString() !== userId
          )
        };
      });
    });

    return () => {
      socket.off('task-added');
      socket.off('task-updated');
      socket.off('task-deleted');
      socket.off('tasks-reordered');
      socket.off('tasks-reset');
      socket.off('auto-reset-changed');
      socket.off('member-removed');
      socket.disconnect();
    };
  }, []);

  // שחזור הרשימה האחרונה אחרי רענון
  useEffect(() => {
    const lastListId = localStorage.getItem('lastListId');
    if (lastListId) {
      joinList(lastListId);
    }
  }, []);

  const joinList = async (listId) => {
    localStorage.setItem('lastListId', listId);
    socket.emit('join-list', listId);
    try {
      const res = await api.get(`/todos/${listId}`);
      setCurrentList(res.data);
    } catch (err) {
      console.error('Failed to fetch list:', err);
      localStorage.removeItem('lastListId');
    }
  };

  const leaveList = () => {
    if (currentList) {
      socket.emit('leave-list', currentList._id);
    }
    localStorage.removeItem('lastListId');
    setCurrentList(null);
  };

  const toggleItem = async (listId, itemId, completed) => {
    try {
      await api.put('/todos/update-item', { listId, itemId, completed });
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const deleteItem = async (listId, itemId) => {
    try {
      await api.delete(`/todos/${listId}/items/${itemId}`);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const removeMember = async (listId, userId) => {
    await api.delete(`/todos/${listId}/members/${userId}`);
    // socket event מטפל בעדכון ה-UI
  };

  const toggleAutoReset = async (listId) => {
    try {
      const res = await api.put(`/todos/${listId}/auto-reset`);
      setCurrentList(prev =>
        prev && prev._id === listId ? { ...prev, autoReset: res.data.autoReset } : prev
      );
    } catch (err) {
      console.error('toggleAutoReset failed:', err);
    }
  };

  return (
    <TodoContext.Provider value={{
      currentList,
      joinList,
      leaveList,
      toggleItem,
      setCurrentList,
      deleteItem,
      removeMember,
      toggleAutoReset
    }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => useContext(TodoContext);