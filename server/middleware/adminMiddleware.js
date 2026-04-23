const ADMIN_EMAIL = 'benny.neiman2@gmail.com';

const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'גישה נדחתה — אזור מנהל בלבד' });
  }
  next();
};

module.exports = { isAdmin };
