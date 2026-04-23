const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

const {
  createList,
  getList,
  getUserLists,
  updateListName,
  joinByShareCode,
  addItem,
  updateTodoItem,
  deleteItem,
  reorderItems,
  checkAll,
  resetList,
  deleteList,
  removeMember,
  toggleAutoReset
} = require('../controllers/todoController');

// --- רשימות ---
router.get('/', isAuthenticated, getUserLists);
router.post('/', isAuthenticated, createList);

// הצטרפות דרך קוד — חייב לפני /:id כדי ש-"join" לא יזוהה כ-id
router.post('/join/:shareCode', isAuthenticated, joinByShareCode);

// איפוס — חייב לפני /:listId/items
router.post('/reset', isAuthenticated, resetList);

// update-item — חייב לפני /:id
router.put('/update-item', isAuthenticated, updateTodoItem);

router.get('/:id', isAuthenticated, getList);
router.put('/:id/name', isAuthenticated, updateListName);
router.delete('/:id', isAuthenticated, deleteList);

// --- ניהול חברים ---
router.delete('/:id/members/:userId', isAuthenticated, removeMember);

// --- Auto-Reset toggle ---
router.put('/:id/auto-reset', isAuthenticated, toggleAutoReset);

// --- משימות ---
router.post('/:listId/items', isAuthenticated, addItem);
router.delete('/:listId/items/:itemId', isAuthenticated, deleteItem);
router.put('/:listId/reorder', isAuthenticated, reorderItems);
router.put('/:listId/check-all', isAuthenticated, checkAll);

module.exports = router;