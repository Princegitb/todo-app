# 📝 TaskSphere | AI-Powered Premium To-Do Dashboard

**TaskSphere** is a modern, premium, and fully-responsive To-Do List web application featuring an integrated, context-aware **AI Chat Assistant** powered by Google's Gemini API. The app enables users to organize their daily workflows and converse with an AI coach to analyze, prioritize, and summarize their tasks in real-time.

---

## 🚀 Features

- 🤖 **Gemini AI Chat Assistant**: Open a floating chat panel to consult an AI productivity coach about your pending tasks, priority focus areas, and workload summaries.
- ✅ **Complete Task CRUD**: Create, edit, and delete tasks with titles, descriptions, due dates, and priority indicators.
- 📅 **Logical Deadline Tracking**: Assign due dates, with active color-coded overdue indicators for missed deadlines.
- 🚩 **Categorized Priorities**: Sort and filter tasks instantly using Low, Medium, and High priority badges.
- 🔍 **Search & Filters**: Instantly find specific tasks via fuzzy search over titles and descriptions, and filter by status or priority.
- 📱 **Mobile-First Responsiveness**: Premium mobile viewport layouts transforming tables into elegant grids with horizontal badge clusters.
- 🌙 **Modern Aesthetics**: Sleek dashboard styling with smooth micro-animations, glassmorphic menus, and custom scrollbars.
- 💾 **Persistent DB Storage**: Fully powered by a MongoDB Atlas cloud deployment with Mongoose schemas.
- 🧪 **Demo DB Seeder**: Comes with a built-in script to instantly populate your dashboard with 10 realistic tasks.

---

## 🛠️ Tech Stack

- **Backend**: Node.js (v24+), Express.js (v5+)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`) via native Node `fetch()`
- **Database**: MongoDB Atlas, Mongoose
- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables), JavaScript (ES6+)
- **Environment Management**: dotenv
- **Development Tooling**: nodemon (auto-reload on edits)

---

## 📂 Project Structure

```text
TO_DO_LIST/
│
├── docs/
│   └── To-Do List Web Application PRD.md   # Product Requirement Document
│
├── public/                                  # Static Frontend Assets
│   ├── index.html                           # Main UI Markup (includes AI widget)
│   ├── style.css                            # Dashboard & AI Responsive Layout
│   ├── app.js                               # Core Task Management Logic
│   └── ai.js                                # Frontend AI Widget Controller
│
├── src/                                     # Express Backend Logic
│   ├── config/
│   │   └── db.js                            # MongoDB Connection Config
│   ├── controllers/
│   │   ├── taskController.js                # Task CRUD Handlers
│   │   └── aiController.js                  # Gemini AI Chat Controller
│   ├── models/
│   │   └── Task.js                          # Mongoose Task Schema & Model
│   ├── routes/
│   │   ├── taskRoutes.js                    # Task CRUD API Router
│   │   └── aiRoutes.js                      # AI Chat API Router
│   ├── seed.js                              # MongoDB Demo Data Seeder
│   └── server.js                            # Express Server & Endpoint Registrar
│
├── .env                                     # Environment Variables (Local)
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Navigate to Project Root
```bash
cd TO_DO_LIST
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Seed Database (Optional)
Populate your database with 10 demo tasks:
```bash
node src/seed.js
```

---

## ▶️ Running the Application

### Development Mode (with nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Once started, navigate to: [http://localhost:3000](http://localhost:3000)

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| **GET** | `/api/tasks` | Get all tasks (supports search, sort, and filters) |
| **POST** | `/api/tasks` | Create a new task |
| **PUT** | `/api/tasks/:id` | Update task details or completion status |
| **DELETE** | `/api/tasks/:id` | Delete a task |
| **POST** | `/api/ai/chat` | Send message and conversation history to Gemini AI assistant |

---

## 🎯 Future Enhancements

- 🔑 **User Authentication**: Secure register/login portals with JWT to isolate personal task boards.
- 🗂️ **Task Categories/Tags**: Group tasks by folders (e.g., Work, Personal, Shopping).
- 🌓 **Dark Theme Switcher**: Toggle between light and dark modes.
- 🔔 **Reminder Notifications**: Notify users when a task deadline is approaching.
