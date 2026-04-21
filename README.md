# אפליקציית רשימות משותפות — אפיון מלא

> אפליקציית ווב לניהול רשימות משימות משותפות בזמן אמת

---

## 1. סקירה כללית

אפליקציית ווב לניהול רשימות משימות משותפות בזמן אמת. המשתמש מתחבר דרך חשבון Google, מנהל רשימות אישיות ומשותפות, ויכול לשתף כל רשימה עם משתמשים אחרים במערכת באמצעות קוד ייחודי.

---

## 2. משתמשים ותפקידים

| תפקיד | תיאור | הרשאות |
|--------|--------|---------|
| בעלים (Owner) | יצר את הרשימה | צפייה, עריכה, מחיקת הרשימה, שיתוף |
| שותף (Member) | הצטרף דרך קוד | צפייה, הוספה, עריכה, סימון — אך לא מחיקת הרשימה |
| אורח | לא מחובר | אין גישה |

---

## 3. זרימת משתמש (User Flow)

```
כניסה לאפליקציה
      ↓
מסך Login → כפתור "התחבר עם Google"
      ↓
Google OAuth → חזרה לאפליקציה
      ↓
מסך Dashboard — רשימת כל הרשימות (שלי + משותפות)
      ↓
בחירת רשימה → מסך הרשימה הפנימי
      ↓
עריכה / סימון / שיתוף
```

---

## 4. מסכים ופונקציונליות

### 4.1 מסך Login

- לוגו ושם האפליקציה
- כפתור אחד: **"התחבר עם Google"**
- אם המשתמש כבר מחובר — מועבר ישירות ל-Dashboard

---

### 4.2 מסך Dashboard (ראשי)

**מה רואים:**
- Navbar עם שם המשתמש, תמונת פרופיל מ-Google, וכפתור התנתקות
- רשת כרטיסיות (Grid) — כרטיס אחד לכל רשימה
- כפתור **"+ רשימה חדשה"**

**על כל כרטיסייה:**

| אלמנט | תיאור |
|-------|--------|
| שם הרשימה | כותרת ראשית |
| תג "שלי" / "משותף" | מציין האם הרשימה שלי או הצטרפתי |
| התקדמות | "X מתוך Y משימות הושלמו" + Progress bar |
| תאריך עדכון אחרון | |
| כפתור כניסה | לחיצה נכנסת לרשימה |
| כפתור עריכת שם | עיפרון — עריכה inline |
| כפתור מחיקה | פח — רק לבעלים, עם Confirm dialog |

**פעולות מה-Dashboard:**
- יצירת רשימה חדשה (שם בלבד)
- עריכת שם רשימה
- מחיקת רשימה (לבעלים בלבד)
- הצטרפות לרשימה דרך קוד שיתוף — שדה + כפתור "הצטרף"

---

### 4.3 מסך הרשימה הפנימי

**Header:**
- שם הרשימה (ניתן לעריכה)
- קוד השיתוף של הרשימה (עם כפתור העתקה)
- כפתור חזרה ל-Dashboard

**אזור המשימות:**

| פעולה | תיאור |
|-------|--------|
| הוספת משימה | שדה טקסט + כפתור "הוסף" / Enter |
| סימון משימה | Checkbox בצד שמאל — toggle בין true/false |
| עריכת טקסט | לחיצה על שם המשימה → עריכה inline |
| מחיקת משימה | כפתור X / פח בצד ימין |
| גרירה ושחרור (Drag & Drop) | ידית גרירה `[≡]` בצד שמאל של כל משימה — גרירה לשינוי סדר בתוך הרשימה. הסדר החדש נשמר ב-DB ומשודר לכל השותפים בזמן אמת |
| Check All | כפתור "סמן הכל" — מסמן את כל המשימות בבת אחת |

**מראה כל משימה:**
```
[≡]  [ ✓ ]  טקסט המשימה              [ עריכה ] [ מחיקה ]
```
- `[≡]` — ידית גרירה (Drag Handle) בצד שמאל, גלויה בhover
- משימה מסומנת: טקסט עם קו חוצה + צבע אפור
- משימה לא מסומנת: טקסט רגיל
- בזמן גרירה: המשימה מקבלת צל ורקע בהיר כדי להבדיל אותה מהשאר

---

## 5. לוגיקת Auto-Reset (מרכזית)

```
שלב 1: משתמש מסמן משימה אחרונה / לוחץ "Check All"
              ↓
שלב 2: השרת בודק — האם כל המשימות completed = true?
              ↓ כן
שלב 3: מוצגת הודעת הצלחה:
        "🎉 השלמת בהצלחה את הרשימה! היא תתאפס בקרוב..."
              ↓
שלב 4: המתנה של 3 שניות (Countdown גלוי)
              ↓
שלב 5: השרת מאפס את כל המשימות ל-completed = false
              ↓
שלב 6: Socket משדר "tasks-reset" לכל המחוברים לרשימה
              ↓
שלב 7: כל המסכים מתעדכנים בו-זמנית — Checkboxes מתרוקנים
```

---

## 6. Drag & Drop — שינוי סדר משימות

### איך זה עובד

כל משימה בתוך רשימה ניתנת לגרירה ושחרור לצורך שינוי הסדר שלה.

### חוויית המשתמש (UX)

| שלב | תיאור |
|-----|--------|
| Hover על משימה | ידית גרירה `≡` מופיעה בצד שמאל |
| תחילת גרירה | המשימה "מתרוממת" עם צל וסקאלה קלה |
| בזמן גרירה | placeholder שקוף מציין את המיקום החדש |
| שחרור | המשימה נופלת למקומה החדש באנימציה חלקה |
| לאחר שחרור | הסדר נשמר ב-DB ומשודר לכל השותפים |

### כללים

- גרירה פועלת **בתוך אותה רשימה בלבד** — לא ניתן להעביר משימה בין רשימות שונות
- גרירה זמינה **לכל חברי הרשימה** (בעלים ושותפים)
- שינוי הסדר מתעדכן **בזמן אמת** אצל כל המחוברים לרשימה
- על מכשיר נייד — גרירה מופעלת בלחיצה ארוכה (Long Press)

### טכני

- ספרייה: `@dnd-kit/core` + `@dnd-kit/sortable`
- כל משימה מכילה שדה `order: Number` ב-DB
- לאחר שחרור — נשלחת קריאה `PUT /api/tasks/:listId/reorder` עם המערך המסודר מחדש
- Socket מקרין `tasks-reordered` עם הסדר החדש לכל חברי החדר

---

## 7. מערכת שיתוף

### איך זה עובד

1. כל רשימה נוצרת עם **קוד ייחודי בן 8 תווים** (לדוגמה: `AB12-XY89`)
2. הבעלים רואה את הקוד בתוך מסך הרשימה
3. כפתור "העתק קוד" — מעתיק ללוח
4. משתמש אחר נכנס ל-Dashboard → מקליד קוד → לוחץ "הצטרף"
5. הרשימה מופיעה ב-Dashboard שלו עם תג "משותף"
6. **שני המשתמשים רואים שינויים בזמן אמת**

### הגבלות

- אי אפשר להצטרף לרשימה שכבר חבר בה
- אי אפשר להצטרף לרשימה שבבעלותך
- קוד שגוי מציג הודעת שגיאה

---

## 8. זמן אמת (Real-Time)

כל שינוי ברשימה משודר מיידית לכל המשתמשים המחוברים לאותה רשימה:

| פעולה | מה מתעדכן אצל השותפים |
|-------|----------------------|
| הוספת משימה | המשימה מופיעה בתחתית |
| סימון משימה | ה-Checkbox מתעדכן |
| עריכת טקסט | הטקסט משתנה |
| מחיקת משימה | המשימה נעלמת |
| שינוי סדר | הסדר מתעדכן |
| Auto-Reset | כל ה-Checkboxes מתרוקנים + הודעה |

### Socket Events

| Event | כיוון | תיאור |
|-------|-------|--------|
| `join-list` | Client → Server | כניסה לחדר הרשימה |
| `leave-list` | Client → Server | יציאה מהחדר |
| `task-added` | Server → Room | משימה חדשה נוספה |
| `task-updated` | Server → Room | משימה עודכנה/סומנה |
| `task-deleted` | Server → Room | משימה נמחקה |
| `tasks-reordered` | Server → Room | סדר משימות שונה |
| `tasks-reset` | Server → Room | Auto-Reset הופעל |

---

## 9. מודלי נתונים

### User

| שדה | סוג | תיאור |
|-----|-----|--------|
| `googleId` | String | מזהה Google (ייחודי) |
| `displayName` | String | שם מלא |
| `email` | String | אימייל |
| `avatar` | String | URL תמונת פרופיל |
| `createdAt` | Date | תאריך הצטרפות |

### List

| שדה | סוג | תיאור |
|-----|-----|--------|
| `name` | String | שם הרשימה |
| `owner` | → User | מי יצר |
| `members` | [→ User] | שותפים |
| `shareCode` | String | קוד 8 תווים ייחודי |
| `createdAt` | Date | תאריך יצירה |
| `updatedAt` | Date | תאריך עדכון אחרון |

### Task

| שדה | סוג | תיאור |
|-----|-----|--------|
| `listId` | → List | שייכות לרשימה |
| `text` | String | תוכן המשימה |
| `completed` | Boolean | false כברירת מחדל |
| `order` | Number | מיקום ל-Drag & Drop |
| `createdAt` | Date | תאריך יצירה |

---

## 10. API Endpoints

### Auth

| Method | Path | תיאור |
|--------|------|--------|
| GET | `/auth/google` | התחלת תהליך Google OAuth |
| GET | `/auth/google/callback` | Callback מ-Google |
| GET | `/auth/me` | פרטי המשתמש המחובר |
| GET | `/auth/logout` | התנתקות |

### Lists

| Method | Path | תיאור |
|--------|------|--------|
| GET | `/api/lists` | כל הרשימות של המשתמש |
| POST | `/api/lists` | יצירת רשימה חדשה |
| PUT | `/api/lists/:id` | עריכת שם רשימה |
| DELETE | `/api/lists/:id` | מחיקת רשימה |
| POST | `/api/lists/join/:shareCode` | הצטרפות דרך קוד שיתוף |

### Tasks

| Method | Path | תיאור |
|--------|------|--------|
| GET | `/api/tasks/:listId` | כל המשימות ברשימה |
| POST | `/api/tasks/:listId` | הוספת משימה |
| PUT | `/api/tasks/:id` | עריכת / סימון משימה |
| DELETE | `/api/tasks/:id` | מחיקת משימה |
| PUT | `/api/tasks/:listId/reorder` | עדכון סדר לאחר D&D |
| PUT | `/api/tasks/:listId/check-all` | Check All + Auto-Reset |

---

## 11. ארכיטקטורה טכנית

### Stack

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| State | Context API |
| HTTP | Axios |
| Real-Time Client | Socket.io-client |
| Backend | Node.js + Express |
| Database | MongoDB Atlas + Mongoose |
| Auth | Google OAuth 2.0 + Passport.js |
| Real-Time Server | Socket.io |
| Drag & Drop | @dnd-kit |
| Notifications | react-hot-toast |

### מבנה תיקיות

```
collaborative-todo/
├── server/
│   ├── config/
│   │   ├── db.js
│   │   └── passport.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── listController.js
│   │   └── taskController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── List.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── listRoutes.js
│   │   └── taskRoutes.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── .env
│   └── server.js
│
└── client/
    ├── src/
    │   ├── api/
    │   │   ├── axiosInstance.js
    │   │   ├── listsApi.js
    │   │   └── tasksApi.js
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   └── LoginPage.jsx
    │   │   ├── Dashboard/
    │   │   │   ├── Dashboard.jsx
    │   │   │   └── ListCard.jsx
    │   │   ├── TodoList/
    │   │   │   ├── TodoListPage.jsx
    │   │   │   ├── TaskItem.jsx
    │   │   │   └── AddTaskForm.jsx
    │   │   └── Shared/
    │   │       ├── Navbar.jsx
    │   │       └── ShareModal.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── SocketContext.jsx
    │   ├── hooks/
    │   │   └── useSocket.js
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 12. דרישות לא-פונקציונליות

| דרישה | פירוט |
|-------|-------|
| Mobile First | מותאם מלא לנייד, טאבלט ומחשב |
| ביצועים | עדכוני Real-Time מתחת ל-200ms |
| אבטחה | Sessions מוצפנים, Routes מוגנים, אין גישה ללא Login |
| UX | Loading states, Error messages, Confirm dialogs לפני מחיקה |
| נגישות | כפתורים עם labels, ניגודיות צבעים תקנית |

---

## 13. זרימת אימות (Auth Flow)

```
User לוחץ "התחבר עם Google"
        ↓
Passport.js → Google OAuth 2.0
        ↓
Google Callback → יצירת / עדכון User ב-DB
        ↓
Session נשמר (express-session + MongoDB store)
        ↓
Redirect → Dashboard
```

---

*מסמך אפיון v1.0 — מוכן לפיתוח ✅*
