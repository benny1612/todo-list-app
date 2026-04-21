const express = require('express');
const passport = require('passport');
const router = express.Router();

// התחלת תהליך ההתחברות מול גוגל
// הכתובת המלאה תהיה: http://localhost:5000/api/auth/google
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// ה-Callback שגוגל חוזר אליו אחרי שהמשתמש אישר
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // בסיום מוצלח, מעבירים את המשתמש חזרה ל-Frontend (Vite)
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  }
);

// קבלת פרטי המשתמש המחובר (בשביל ה-AuthContext ב-React)
router.get('/user', (req, res) => {
  res.send(req.user);
});

// התנתקות
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  });
});

module.exports = router;