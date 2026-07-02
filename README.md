# 📝 To-Do List Web Application

A modern, responsive, and feature-rich To-Do List web application built using the MERN stack. The application helps users efficiently organize, prioritize, and manage their daily tasks through an intuitive interface.

---

## 🚀 Features

- ✅ Create new tasks
- ✏️ Edit existing tasks
- 🗑️ Delete tasks
- ✔️ Mark tasks as completed
- 📅 Set due dates
- 🚩 Priority levels (High, Medium, Low)
- 🔍 Search tasks
- 🎯 Filter tasks by status and priority
- 📱 Fully responsive design
- 🌙 Modern UI with smooth interactions
- 💾 Persistent data storage using MongoDB

---

## 🛠️ Tech Stack

### Frontend
- React.js
- HTML5
- CSS3
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas
- Mongoose

---

## 📂 Project Structure

```text
TO_DO_LIST/
│
├── client/
│   ├── public/
│   ├── src/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── docs/
│   └── Project Documentation.md
│
├── .env
├── README.md
└── package.json
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/todo-list.git
cd todo-list
```

### 2. Install Dependencies

Frontend

```bash
cd client
npm install
```

Backend

```bash
cd ../server
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the **server** directory.

```env
PORT=3000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

---

## ▶️ Running the Application

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

```bash
cd client
npm start
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | /api/tasks | Get all tasks |
| GET | /api/tasks/:id | Get task by ID |
| POST | /api/tasks | Create new task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

---

## 📸 Screenshots

Add screenshots of your application here.

- Dashboard
- Task List
- Add Task Form
- Mobile View

---

## 🎯 Future Enhancements

- User Authentication
- Task Categories
- Reminder Notifications
- Calendar View
- Drag & Drop Reordering
- Team Collaboration
- Dark/Light Theme Toggle
- Analytics Dashboard

---

## 📖 Project Workflow

```text
Start
   │
   ▼
Open Application
   │
   ▼
Create Task
   │
   ▼
Store in MongoDB
   │
   ▼
Display Tasks
   │
   ├── Edit
   ├── Delete
   ├── Complete
   ├── Search
   └── Filter
   │
   ▼
Update Database
   │
   ▼
Refresh UI
   │
   ▼
End
```

---

## 👨‍💻 Author

**Prince**

B.Tech – Automation & Robotics Engineering

---

## 📄 License

This project is developed for educational and learning purposes.
