const mongoose = require('mongoose');

function generateShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const TodoListSchema = new mongoose.Schema({
  title: { type: String, default: 'רשימה חדשה' },

  // הבעלים המקורי
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // כל המשתמשים עם גישה (כולל הבעלים)
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // קוד שיתוף ייחודי 8 תווים
  shareCode: { type: String, unique: true, default: generateShareCode },

  // האם הרשימה מתאפסת אוטומטית כשכל המשימות הושלמו
  autoReset: { type: Boolean, default: true },

  items: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
      completed: { type: Boolean, default: false },
      order: { type: Number, default: 0 }
    }
  ],

  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

TodoListSchema.index({ members: 1 });

module.exports = mongoose.model('TodoList', TodoListSchema);