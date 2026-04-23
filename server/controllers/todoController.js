const TodoList = require('../models/TodoList');
const User = require('../models/User');

// --- עזר: יצירת shareCode ייחודי ---
function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// 1. שליפת כל הרשימות של המשתמש (owner + member)
exports.getUserLists = async (req, res) => {
  try {
    const lists = await TodoList.find({ members: req.user._id }).sort({ updatedAt: -1 });
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. יצירת רשימה חדשה
exports.createList = async (req, res) => {
  try {
    const { title } = req.body;

    // יצירת shareCode ייחודי
    let shareCode;
    let isUnique = false;
    while (!isUnique) {
      shareCode = generateShareCode();
      const existing = await TodoList.findOne({ shareCode });
      if (!existing) isUnique = true;
    }

    const newList = await TodoList.create({
      title: title || 'רשימה חדשה',
      owner: req.user._id,
      members: [req.user._id], // הבעלים הוא גם member אוטומטית
      shareCode,
      autoReset: true,
      items: []
    });
    res.json(newList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. שליפת רשימה ספציפית (עם populate של members)
exports.getList = async (req, res) => {
  try {
    const list = await TodoList.findOne({ _id: req.params.id, members: req.user._id })
      .populate('members', 'displayName avatar email _id')
      .populate('owner', '_id');
    if (!list) return res.status(404).json({ error: 'רשימה לא נמצאה' });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. עריכת שם רשימה (owner או member)
exports.updateListName = async (req, res) => {
  try {
    const { title } = req.body;
    const list = await TodoList.findOneAndUpdate(
      { _id: req.params.id, members: req.user._id },
      { title },
      { new: true }
    );
    if (!list) return res.status(404).json({ error: 'רשימה לא נמצאה' });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. הצטרפות לרשימה דרך קוד שיתוף
exports.joinByShareCode = async (req, res) => {
  try {
    const { shareCode } = req.params;
    const list = await TodoList.findOne({ shareCode: shareCode.toUpperCase() });

    if (!list) return res.status(404).json({ error: 'קוד שיתוף לא נמצא' });

    const userId = req.user._id.toString();

    // בדיקה שהמשתמש לא כבר חבר
    if (list.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ error: 'כבר חבר ברשימה זו' });
    }

    list.members.push(req.user._id);
    await list.save();

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. הוספת פריט לרשימה
exports.addItem = async (req, res) => {
  try {
    const { text } = req.body;
    const list = await TodoList.findOne({ _id: req.params.listId, members: req.user._id });
    if (!list) return res.status(404).json({ error: 'רשימה לא נמצאה' });

    const newItem = {
      text,
      completed: false,
      id: Date.now().toString(),
      order: list.items.length
    };
    list.items.push(newItem);
    await list.save();

    req.io.to(req.params.listId).emit('task-added', {
      listId: req.params.listId,
      items: list.items
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. עדכון / סימון פריט (text או completed)
exports.updateTodoItem = async (req, res) => {
  try {
    const { listId, itemId, completed, text } = req.body;

    // בניית עדכון דינמי
    const updateFields = {};
    if (completed !== undefined) updateFields['items.$.completed'] = completed;
    if (text !== undefined) updateFields['items.$.text'] = text;

    const list = await TodoList.findOneAndUpdate(
      { _id: listId, 'items.id': itemId },
      { $set: updateFields },
      { new: true }
    );
    if (!list) return res.status(404).json({ error: 'רשימה או פריט לא נמצאו' });

    const allCompleted = list.items.length > 0 && list.items.every(i => i.completed);

    req.io.to(listId).emit('task-updated', {
      listId,
      items: list.items,
      allCompleted
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. מחיקת פריט
exports.deleteItem = async (req, res) => {
  try {
    const list = await TodoList.findOne({ _id: req.params.listId, members: req.user._id });
    if (!list) return res.status(404).json({ error: 'רשימה לא נמצאה' });

    list.items = list.items.filter(i => i.id !== req.params.itemId);
    await list.save();

    req.io.to(req.params.listId).emit('task-deleted', {
      listId: req.params.listId,
      itemId: req.params.itemId,
      items: list.items
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. סידור מחדש (Drag & Drop)
exports.reorderItems = async (req, res) => {
  try {
    const { items } = req.body;
    const { listId } = req.params;

    const list = await TodoList.findByIdAndUpdate(
      listId,
      { $set: { items } },
      { new: true }
    );
    if (!list) return res.status(404).json({ error: 'רשימה לא נמצאה' });

    req.io.to(listId).emit('tasks-reordered', { listId, items: list.items });
    res.json(list);
  } catch (err) {
    console.error('Reorder Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 10. Check All — סימון כל הפריטים
exports.checkAll = async (req, res) => {
  try {
    const { listId } = req.params;
    const list = await TodoList.findOne({ _id: listId, members: req.user._id });
    if (!list) return res.status(404).json({ error: 'רשימה לא נמצאה' });

    list.items.forEach(item => { item.completed = true; });
    await list.save();

    req.io.to(listId).emit('task-updated', {
      listId,
      items: list.items,
      allCompleted: true
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 11. איפוס רשימה (לאחר 3 שניות countdown)
exports.resetList = async (req, res) => {
  try {
    const { listId } = req.body;
    const list = await TodoList.findById(listId);
    if (!list) return res.status(404).json({ error: 'רשימה לא נמצאה' });

    list.items.forEach(item => { item.completed = false; });
    await list.save();

    req.io.to(listId).emit('tasks-reset', { listId, items: list.items });
    res.json(list);
  } catch (err) {
    console.error('Reset Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// 12. מחיקת רשימה שלמה (owner בלבד)
exports.deleteList = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await TodoList.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!list) {
      return res.status(404).json({ error: 'רשימה לא נמצאה או שאין לך הרשאה למחוק אותה' });
    }
    res.json({ message: 'הרשימה נמחקה בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 13. הסרת חבר מרשימה (owner בלבד)
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const list = await TodoList.findOne({ _id: id, owner: req.user._id });
    if (!list) return res.status(403).json({ error: 'אין הרשאה — רק הבעלים יכול להסיר חברים' });

    // לא ניתן להסיר את הבעלים עצמו
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: 'לא ניתן להסיר את עצמך כבעלים' });
    }

    list.members = list.members.filter(m => m.toString() !== userId);
    await list.save();

    req.io.to(id).emit('member-removed', { listId: id, userId });
    res.json({ message: 'החבר הוסר בהצלחה' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 14. Toggle Auto-Reset (owner בלבד)
exports.toggleAutoReset = async (req, res) => {
  try {
    const { id } = req.params;
    const list = await TodoList.findOne({ _id: id, owner: req.user._id });
    if (!list) return res.status(403).json({ error: 'אין הרשאה — רק הבעלים יכול לשנות הגדרות' });

    list.autoReset = !list.autoReset;
    await list.save();

    req.io.to(id).emit('auto-reset-changed', { listId: id, autoReset: list.autoReset });
    res.json({ autoReset: list.autoReset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};