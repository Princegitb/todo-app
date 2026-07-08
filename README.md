# 📝 To-Do List Web Application

A modern, responsive, and feature-rich To-Do List web application built using **Node.js, Express, MongoDB (Mongoose), and Vanilla HTML/CSS/JavaScript**. The application helps users efficiently organize, prioritize, and manage their daily tasks through an intuitive, clean interface.

---

## 🚀 Features

- ✅ **Create new tasks**: Add tasks with title, description, priority, and due dates.
- ✏️ **Edit existing tasks**: Modify task details inline or via edit options.
- 🗑️ **Delete tasks**: Remove tasks you no longer need.
- ✔️ **Mark tasks as completed**: Keep track of finished vs. pending tasks.
- 📅 **Set due dates**: Assign deadlines to your tasks.
- 🚩 **Priority levels**: Categorize tasks using priority levels (High, Medium, Low).
- 🔍 **Search tasks**: Instantly find specific tasks by matching text in titles or descriptions.
- 🎯 **Filter tasks**: Narrow down your list by task status and priority.
- 📱 **Fully responsive design**: Optimized for mobile, tablet, and desktop views.
- 🌙 **Modern UI**: Styled with clean, modern CSS, hover states, and smooth interactions.
- 💾 **Persistent data storage**: Fully powered by a MongoDB database with Mongoose schemas.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas, Mongoose
- **Frontend**: HTML5, Vanilla CSS3 (with CSS Custom Properties), JavaScript (ES6+)
- **Environment Management**: dotenv
- **Development Tooling**: nodemon (for auto-reloading during development)

---

## 📂 Project Structure

```text
TO_DO_LIST/
│
├── docs/
│   └── To-Do List Web Application PRD.md   # Product Requirement Document
│
├── public/                                  # Static Frontend Assets
│   ├── index.html                           # Main UI Markup
│   └── style.css                            # Layout & Theme Styling
│
├── src/                                     # Express Backend Logic
│   ├── config/
│   │   └── db.js                            # MongoDB Connection Config
│   ├── controllers/
│   │   └── taskController.js                # Route Handlers / Controller logic
│   ├── models/
│   │   └── Task.js                          # Mongoose Task Schema & Model
│   ├── routes/
│   │   └── taskRoutes.js                    # API Routes Definition
│   └── server.js                            # Express Server & Static File Host
│
├── .env                                     # Environment Variables (Local only)
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone or Open the Directory
Make sure you are in the project's root folder:
```bash
cd TO_DO_LIST
```

### 2. Install Dependencies
Install all required Node.js packages:
```bash
npm install
```

### 3. Environment Variables
Create or verify the `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
```

---

## ▶️ Running the Application

### Development Mode
Runs the server with `nodemon` for auto-reloading on file changes:
```bash
npm run dev
```

### Production Mode
Runs the server using standard `node`:
```bash
npm start
```

Once started, open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

---

## 🌐 API Endpoints

All backend routes are prefixed with `/api/tasks`.

| Method | Endpoint | Description |
|---------|----------|-------------|
| **GET** | `/api/tasks` | Get all tasks (supports query filtering/search) |
| **POST** | `/api/tasks` | Create a new task |
| **PUT** | `/api/tasks/:id` | Update an existing task's details or completion status |
| **DELETE** | `/api/tasks/:id` | Delete a task |

---

## 🎯 Future Enhancements

- 🔑 **User Authentication**: Register/Login to maintain personalized task lists.
- 🗂️ **Task Categories/Tags**: Organize tasks by folders (e.g., Work, Personal, Shopping).
- 🔔 **Reminder Notifications**: Notify users when a deadline is approaching.
- 📅 **Calendar View**: See tasks mapped out on a calendar grid.
- 🌓 **Dark/Light Theme Toggle**: Quick switcher for theme preference.

---

## 👨‍💻 Author

**Prince**
*B.Tech – Automation & Robotics Engineering*
