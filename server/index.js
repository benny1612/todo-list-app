const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// 1. טוענים משתני סביבה ראשון
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('passport');

// 2. טוענים passport אחרי שה-env נטען
require('./config/passport');

const app = express();
const server = http.createServer(app);

// הגדרת Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// הפיכת io לזמין בתוך req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware בסיסי
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Session — חובה לפני Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// אתחול Passport
app.use(passport.initialize());
app.use(passport.session());

// לוגיקת Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // כניסה לחדר הרשימה
  socket.on('join-list', (listId) => {
    socket.join(listId);
    console.log(`Socket ${socket.id} joined list: ${listId}`);
  });

  // יציאה מחדר הרשימה
  socket.on('leave-list', (listId) => {
    socket.leave(listId);
    console.log(`Socket ${socket.id} left list: ${listId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// חיבור למסד נתונים
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/todos', require('./routes/todoRoutes'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server & Socket running on port ${PORT}`));