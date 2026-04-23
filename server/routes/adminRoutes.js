const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const User = require('../models/User');
const TodoList = require('../models/TodoList');

// שמירה על שני middlewares — מחובר + אדמין
const guard = [isAuthenticated, isAdmin];

// GET /api/admin/users — כל המשתמשים
router.get('/users', guard, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/lists — כל הרשימות (עם owner + members)
router.get('/lists', guard, async (req, res) => {
  try {
    const lists = await TodoList.find({})
      .populate('owner', 'displayName email avatar')
      .populate('members', 'displayName email avatar')
      .sort({ updatedAt: -1 });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
