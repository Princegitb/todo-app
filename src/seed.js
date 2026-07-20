const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('./models/Task');
const User = require('./models/User');

// Load environment variables
dotenv.config();

const demoTasksData = [
  {
    title: "Prepare presentation slides",
    description: "Design slides for the Dixon internship review. Highlight the new AI chat integration.",
    priority: "High",
    completed: false,
    dueDate: new Date("2026-07-17T12:00:00Z")
  },
  {
    title: "Finish internship report",
    description: "Write final report covering backend database setup and frontend premium stylesheet enhancements.",
    priority: "High",
    completed: false,
    dueDate: new Date("2026-07-18T12:00:00Z")
  },
  {
    title: "Submit weekly timesheet",
    description: "Complete timesheet logging and submit to the supervisor for approval.",
    priority: "Low",
    completed: false,
    dueDate: new Date("2026-07-19T12:00:00Z")
  },
  {
    title: "Refactor AI response parser",
    description: "Ensure markdown lists and paragraph elements render cleanly in the chat widget.",
    priority: "High",
    completed: false,
    dueDate: new Date("2026-07-20T12:00:00Z")
  },
  {
    title: "Review codebase documentation",
    description: "Read the project README, review API schemas and verify task routes.",
    priority: "Medium",
    completed: true,
    dueDate: new Date("2026-07-21T12:00:00Z")
  },
  {
    title: "Design dark mode variables",
    description: "Draft theme parameters and variables for switching between light and dark UI themes.",
    priority: "Medium",
    completed: false,
    dueDate: new Date("2026-07-22T12:00:00Z")
  },
  {
    title: "Schedule team status call",
    description: "Send calendar invite to coordinate a quick status update on task dashboard upgrades.",
    priority: "High",
    completed: false,
    dueDate: new Date("2026-07-23T12:00:00Z")
  },
  {
    title: "Organize desk workspace",
    description: "Clean monitor screen, organize cables, and clear out old notes.",
    priority: "Low",
    completed: true,
    dueDate: new Date("2026-07-24T12:00:00Z")
  },
  {
    title: "Set up MongoDB indexes",
    description: "Index the search title and filter priority fields to improve query efficiency.",
    priority: "Medium",
    completed: true,
    dueDate: new Date("2026-07-25T12:00:00Z")
  },
  {
    title: "Buy groceries",
    description: "Purchase milk, eggs, bread, coffee beans, and fresh vegetables.",
    priority: "Low",
    completed: false,
    dueDate: new Date("2026-07-26T12:00:00Z")
  }
];

const seedDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in environment");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.");

    // Clear existing tasks and users
    console.log("Clearing existing tasks and users...");
    await Task.deleteMany({});
    await User.deleteMany({});
    console.log("Database cleared.");

    // Create Demo User
    console.log("Creating default demo user...");
    const demoUser = await User.create({
      name: "Demo User",
      email: "demo@tasksphere.com",
      password: "password123"
    });
    console.log(`Demo user created with ID: ${demoUser._id}`);

    // Insert demo tasks assigned to Demo User
    console.log("Inserting 10 demo tasks assigned to demo user...");
    const tasksWithUser = demoTasksData.map(t => ({
      ...t,
      user: demoUser._id
    }));
    await Task.insertMany(tasksWithUser);
    console.log("Successfully seeded 10 demo tasks!");

    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDB();
