const Task = require('../models/Task');

// @desc    Get all tasks with search, filter, and sort
// @route   GET /api/tasks
// @access  Public
exports.getTasks = async (req, res) => {
  try {
    const { search, completed, priority, sortBy, sortOrder } = req.query;
    const query = {};

    // Search query matching title or description (case-insensitive)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by completed status
    if (completed !== undefined && completed !== '') {
      query.completed = completed === 'true';
    }

    // Filter by priority
    if (priority) {
      query.priority = priority;
    }

    // Sorting setup
    let sort = {};
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      sort[sortBy] = order;
    } else {
      // Default: show closest due date first, then newest
      sort = { dueDate: 1, createdAt: -1 };
    }

    const tasks = await Task.find(query).sort(sort);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Public
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = new Task({
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Public
exports.updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, completed } = req.body;
    const taskId = req.params.id;

    let task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate || null; // Allow clearing due date
    if (completed !== undefined) task.completed = completed;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Public
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully', id: taskId });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};
