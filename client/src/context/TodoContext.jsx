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

    return () => {
      socket.off('task-added');
      socket.off('task-updated');
      socket.off('task-deleted');
      socket.off('tasks-reordered');
      socket.off('tasks-reset');
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

  return (
    <TodoContext.Provider value={{
      currentList,
      joinList,
      leaveList,
      toggleItem,
      setCurrentList,
      deleteItem
    }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodo = () => useContext(TodoContext);