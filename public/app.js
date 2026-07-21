// API Base URLs
const API_URL = '/api/tasks';

// State Management
let tasks = [];
let debounceTimer = null;
let clerk = null;

// DOM Elements
const tasksContainer = document.getElementById('tasks-container');
const tasksLoader = document.getElementById('tasks-loader');
const emptyState = document.getElementById('empty-state');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');

// Auth DOM Elements
const openAuthBtn = document.getElementById('open-auth-btn');

// Form Fields
const taskIdInput = document.getElementById('task-id');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskPrioritySelect = document.getElementById('task-priority');
const taskDueDateInput = document.getElementById('task-due-date');

// Controls
const searchInput = document.getElementById('search-input');
const filterStatusSelect = document.getElementById('filter-status');
const filterPrioritySelect = document.getElementById('filter-priority');
const sortBySelect = document.getElementById('sort-by');

// Buttons
const openAddBtn = document.getElementById('open-add-task-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelModalBtn = document.getElementById('cancel-modal-btn');

// Stats Elements
const statsTotal = document.getElementById('stats-total');
const statsPending = document.getElementById('stats-pending');
const statsCompleted = document.getElementById('stats-completed');
const statsRate = document.getElementById('stats-rate');

// Toast Container
const toastContainer = document.getElementById('toast-container');

// View Details Modal Elements
const viewTaskModal = document.getElementById('view-task-modal');
const closeViewModalBtn = document.getElementById('close-view-modal-btn');
const closeViewModalBottomBtn = document.getElementById('close-view-modal-bottom-btn');
const viewTaskTitle = document.getElementById('view-task-title');
const viewTaskDesc = document.getElementById('view-task-desc');
const viewTaskPriority = document.getElementById('view-task-priority');
const viewTaskDue = document.getElementById('view-task-due');
const viewTaskStatus = document.getElementById('view-task-status');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  initCustomSelects();
  setupEventListeners();
  initClerk();
});

let clerkKeyConfigured = true;

// Initialize Clerk Authentication SDK
async function initClerk() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();

    if (!config.clerkPublishableKey || config.clerkPublishableKey === 'your_clerk_publishable_key_here') {
      console.warn('Clerk Publishable Key is not configured in environment variables');
      clerkKeyConfigured = false;
      renderUnauthenticatedState();
      if (openAuthBtn) {
        openAuthBtn.style.display = 'inline-flex';
        openAuthBtn.onclick = () => openAuthModal();
      }
      return;
    }

    // Wait for window.Clerk constructor if script is still loading
    if (!window.Clerk) {
      let retries = 0;
      while (!window.Clerk && retries < 30) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
      }
    }

    if (!window.Clerk) {
      console.error('Clerk JS SDK script failed to load.');
      renderUnauthenticatedState();
      return;
    }

    const clerkInstance = new window.Clerk(config.clerkPublishableKey);
    await clerkInstance.load();
    clerk = clerkInstance;
    clerkKeyConfigured = true;

    const userBtnDiv = document.getElementById('clerk-user-button');

    const updateUIState = (user) => {
      if (user) {
        if (openAuthBtn) openAuthBtn.style.display = 'none';
        if (userBtnDiv) {
          userBtnDiv.style.display = 'block';
          clerk.mountUserButton(userBtnDiv);
        }
        const displayName = user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || 'User';
        if (typeof showAIChatBubble === 'function') {
          showAIChatBubble(displayName);
        }
        fetchTasks();
      } else {
        if (userBtnDiv) {
          try { clerk.unmountUserButton(userBtnDiv); } catch (e) {}
          userBtnDiv.style.display = 'none';
        }
        if (openAuthBtn) {
          openAuthBtn.style.display = 'inline-flex';
          openAuthBtn.onclick = () => openAuthModal();
        }

        if (typeof hideAIChatBubble === 'function') {
          hideAIChatBubble();
        }

        tasks = [];
        renderUnauthenticatedState();
        updateStats();
      }
    };

    clerk.addListener(({ user }) => {
      updateUIState(user);
    });

    updateUIState(clerk.user);

  } catch (err) {
    console.error('Error initializing Clerk:', err);
    renderUnauthenticatedState();
  }
}

// Get Clerk Auth Token
async function getAuthToken() {
  if (clerk && clerk.session) {
    return await clerk.session.getToken();
  }
  return null;
}
window.getAuthToken = getAuthToken;

// Helper: Get Authorization headers
async function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Open Clerk Sign In Modal
function openAuthModal() {
  if (clerk) {
    clerk.openSignIn();
  } else if (!clerkKeyConfigured) {
    showToast('Please add CLERK_PUBLISHABLE_KEY to your Render Environment Variables.', 'error');
  } else {
    showToast('Clerk authentication SDK is loading, please try again in a moment.', 'error');
  }
}

// Render UI state when user is not logged in
function renderUnauthenticatedState() {
  tasksLoader.style.display = 'none';
  tasksContainer.style.display = 'none';
  emptyState.style.display = 'flex';
  
  emptyState.innerHTML = `
    <div class="empty-icon"><i class="fa-solid fa-lock" style="color: var(--primary);"></i></div>
    <h3>Authentication Required</h3>
    <p>Please sign in or create an account with Clerk to view and manage your personal tasks.</p>
    <button class="btn btn-primary" id="empty-state-auth-btn" style="margin-top: 0.75rem;">
      <i class="fa-solid fa-right-to-bracket"></i> Sign In / Register
    </button>
  `;

  const emptyAuthBtn = document.getElementById('empty-state-auth-btn');
  if (emptyAuthBtn) {
    emptyAuthBtn.addEventListener('click', () => openAuthModal());
  }
}

// Main Task Event Listeners setup
function setupEventListeners() {
  // Modal toggle
  openAddBtn.addEventListener('click', () => {
    if (!clerk || !clerk.user) {
      openAuthModal();
      showToast('Please sign in to create tasks', 'error');
      return;
    }
    openModal();
  });
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  // Close modal when clicking backdrop
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  // Form Submission
  taskForm.addEventListener('submit', handleFormSubmit);

  // Search & Filter Listeners
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (clerk && clerk.user) fetchTasks();
    }, 300);
  });
  filterStatusSelect.addEventListener('change', () => { if (clerk && clerk.user) fetchTasks(); });
  filterPrioritySelect.addEventListener('change', () => { if (clerk && clerk.user) fetchTasks(); });
  sortBySelect.addEventListener('change', () => { if (clerk && clerk.user) fetchTasks(); });

  // Download PDF dropdown toggle
  const downloadDropdownBtn = document.getElementById('download-dropdown-btn');
  const downloadDropdownMenu = document.getElementById('download-dropdown-menu');
  downloadDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadDropdownMenu.classList.toggle('show');
    document.querySelectorAll('.custom-select').forEach(cs => cs.classList.remove('active'));
  });

  document.addEventListener('click', () => {
    downloadDropdownMenu.classList.remove('show');
  });

  // Download actions
  document.getElementById('download-current-btn').addEventListener('click', downloadCurrentTasks);
  document.getElementById('download-all-btn').addEventListener('click', downloadAllTasks);

  // View Modal close handlers
  closeViewModalBtn.addEventListener('click', closeViewModal);
  closeViewModalBottomBtn.addEventListener('click', closeViewModal);
  viewTaskModal.addEventListener('click', (e) => {
    if (e.target === viewTaskModal) closeViewModal();
  });
}

// Toast Notifications helper
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = document.createElement('i');
  icon.className = type === 'success'
    ? 'fa-solid fa-circle-check toast-icon'
    : 'fa-solid fa-triangle-exclamation toast-icon';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  toastContainer.appendChild(toast);

  // Auto remove after 3s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Fetch Tasks from API
async function fetchTasks() {
  if (!clerk || !clerk.user) {
    renderUnauthenticatedState();
    return;
  }

  tasksLoader.style.display = 'block';
  tasksContainer.style.display = 'none';
  emptyState.style.display = 'none';

  try {
    const search = searchInput.value.trim();
    const completed = filterStatusSelect.value;
    const priority = filterPrioritySelect.value;

    let sortBy = 'dueDate';
    let sortOrder = 'asc';

    if (sortBySelect.value === 'dueDateDesc') {
      sortBy = 'dueDate';
      sortOrder = 'desc';
    } else if (sortBySelect.value === 'createdAt') {
      sortBy = 'createdAt';
      sortOrder = 'desc';
    }

    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (completed !== '') queryParams.append('completed', completed);
    if (priority !== '') queryParams.append('priority', priority);
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}?${queryParams.toString()}`, {
      headers: headers
    });

    if (response.status === 401) {
      openAuthModal();
      showToast('Session expired or unauthorized. Please sign in again.', 'error');
      return;
    }

    if (!response.ok) throw new Error('Failed to load tasks');

    tasks = await response.json();
    renderTasks();
    updateStats();
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Error fetching tasks', 'error');
  } finally {
    tasksLoader.style.display = 'none';
  }
}

// Render task list in UI
function renderTasks() {
  tasksContainer.innerHTML = '';

  if (tasks.length === 0) {
    tasksContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    emptyState.innerHTML = `
      <div class="empty-icon"><i class="fa-regular fa-clipboard"></i></div>
      <h3>No tasks found</h3>
      <p>Try refining your search/filters or create a new task to get started!</p>
    `;
    return;
  }

  tasksContainer.style.display = 'block';
  emptyState.style.display = 'none';

  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'tasks-table-wrapper';

  const table = document.createElement('table');
  table.className = 'tasks-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th class="col-checkbox"></th>
        <th class="col-task">Task</th>
        <th class="col-desc">Description</th>
        <th class="col-priority">Priority</th>
        <th class="col-due">Due Date</th>
        <th class="col-status">Status</th>
        <th class="col-edit"></th>
        <th class="col-delete"></th>
      </tr>
    </thead>
    <tbody id="tasks-table-body"></tbody>
  `;

  const tbody = table.querySelector('#tasks-table-body');

  tasks.forEach(task => {
    const row = document.createElement('tr');
    row.className = `task-row ${task.completed ? 'task-completed' : ''}`;
    row.setAttribute('data-id', task._id);

    let isOverdue = false;
    let formattedDate = 'No due date';

    if (task.dueDate) {
      const dueDateObj = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dueDateVal = new Date(dueDateObj);
      dueDateVal.setHours(0, 0, 0, 0);

      if (dueDateVal < today && !task.completed) {
        isOverdue = true;
      }

      formattedDate = dueDateObj.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    row.innerHTML = `
      <td class="col-checkbox" data-label="Select">
        <label class="task-checkbox-container">
          <input type="checkbox" class="task-toggle" ${task.completed ? 'checked' : ''}>
          <span class="custom-checkbox">
            <i class="fa-solid fa-check"></i>
          </span>
        </label>
      </td>
      <td class="col-task" data-label="Task">
        <span class="task-title">${escapeHTML(task.title)}</span>
      </td>
      <td class="col-desc" data-label="Description">
        <span class="task-desc">${task.description ? escapeHTML(task.description) : '<span class="text-muted-placeholder">-</span>'}</span>
      </td>
      <td class="col-priority" data-label="Priority">
        <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
      </td>
      <td class="col-due" data-label="Due Date">
        <span class="due-badge ${isOverdue ? 'overdue' : ''}">
          <i class="fa-regular fa-calendar"></i>
          <span>${formattedDate}${isOverdue ? ' (Overdue)' : ''}</span>
        </span>
      </td>
      <td class="col-status" data-label="Status">
        <span class="status-badge ${task.completed ? 'completed' : 'pending'}">${task.completed ? 'Completed' : 'Pending'}</span>
      </td>
      <td class="col-edit">
        <button class="action-btn edit-btn" title="Edit Task">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </td>
      <td class="col-delete">
        <button class="action-btn delete-btn" title="Delete Task">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;

    // Attach Event Handlers
    const toggleInput = row.querySelector('.task-toggle');
    toggleInput.addEventListener('change', () => toggleTaskCompletion(task._id, toggleInput.checked));

    const editBtn = row.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => openModal(task));

    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => handleDeleteTask(task._id));

    row.addEventListener('click', (e) => {
      if (
        e.target.closest('.col-checkbox') ||
        e.target.closest('.col-edit') ||
        e.target.closest('.col-delete') ||
        e.target.closest('.task-toggle') ||
        e.target.closest('.edit-btn') ||
        e.target.closest('.delete-btn')
      ) {
        return;
      }
      openViewModal(task);
    });

    tbody.appendChild(row);
  });

  tableWrapper.appendChild(table);
  tasksContainer.appendChild(tableWrapper);
}

// Calculate and render stats dashboard
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  statsTotal.textContent = total;
  statsPending.textContent = pending;
  statsCompleted.textContent = completed;
  statsRate.textContent = `${rate}%`;
}

// Modal handling
function openModal(task = null) {
  if (!clerk || !clerk.user) {
    openAuthModal();
    showToast('Please sign in to manage tasks', 'error');
    return;
  }

  taskModal.classList.add('show');
  document.body.style.overflow = 'hidden';

  if (task) {
    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task._id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskPrioritySelect.value = task.priority;

    if (task.dueDate) {
      const date = new Date(task.dueDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      taskDueDateInput.value = `${year}-${month}-${day}`;
    } else {
      taskDueDateInput.value = '';
    }
  } else {
    modalTitle.textContent = 'Create New Task';
    taskForm.reset();
    taskIdInput.value = '';
  }
  syncAllCustomSelects();
}

function closeModal() {
  taskModal.classList.remove('show');
  document.body.style.overflow = '';
}

// View Details Modal handling
function openViewModal(task) {
  viewTaskTitle.textContent = task.title;
  viewTaskDesc.textContent = task.description || 'No description provided.';
  
  viewTaskPriority.textContent = task.priority;
  viewTaskPriority.className = `priority-badge ${task.priority.toLowerCase()}`;

  let formattedDate = 'No due date';
  let isOverdue = false;

  if (task.dueDate) {
    const dueDateObj = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDateVal = new Date(dueDateObj);
    dueDateVal.setHours(0, 0, 0, 0);

    if (dueDateVal < today && !task.completed) {
      isOverdue = true;
    }

    formattedDate = dueDateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  viewTaskDue.innerHTML = `<i class="fa-regular fa-calendar"></i> <span>${formattedDate}${isOverdue ? ' (Overdue)' : ''}</span>`;
  viewTaskDue.className = `due-badge ${isOverdue ? 'overdue' : ''}`;

  viewTaskStatus.textContent = task.completed ? 'Completed' : 'Pending';
  viewTaskStatus.className = `status-badge ${task.completed ? 'completed' : 'pending'}`;

  viewTaskModal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeViewModal() {
  viewTaskModal.classList.remove('show');
  document.body.style.overflow = '';
}

// Form Submission handling
async function handleFormSubmit(e) {
  e.preventDefault();

  if (!clerk || !clerk.user) {
    openAuthModal();
    showToast('Please sign in to manage tasks', 'error');
    return;
  }

  const id = taskIdInput.value;
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const priority = taskPrioritySelect.value;
  const dueDate = taskDueDateInput.value;

  if (!title) {
    showToast('Task title is required', 'error');
    return;
  }

  const taskData = { title, description, priority, dueDate };

  try {
    const headers = await getAuthHeaders();
    let response;
    if (id) {
      response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(taskData)
      });
    } else {
      response = await fetch(API_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(taskData)
      });
    }

    if (response.status === 401) {
      openAuthModal();
      showToast('Session expired or unauthorized. Please sign in again.', 'error');
      return;
    }

    if (!response.ok) throw new Error('Failed to save task');

    showToast(id ? 'Task updated successfully' : 'Task created successfully');
    closeModal();
    fetchTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Toggle Completed Checkbox
async function toggleTaskCompletion(id, isCompleted) {
  if (!clerk || !clerk.user) {
    openAuthModal();
    return;
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify({ completed: isCompleted })
    });

    if (response.status === 401) {
      openAuthModal();
      showToast('Session expired or unauthorized. Please sign in again.', 'error');
      return;
    }

    if (!response.ok) throw new Error('Failed to update status');

    showToast(isCompleted ? 'Task completed!' : 'Task set to pending');
    fetchTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Delete Task
async function handleDeleteTask(id) {
  if (!clerk || !clerk.user) {
    openAuthModal();
    return;
  }

  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: headers
    });

    if (response.status === 401) {
      openAuthModal();
      showToast('Session expired or unauthorized. Please sign in again.', 'error');
      return;
    }

    if (!response.ok) throw new Error('Failed to delete task');

    showToast('Task deleted successfully');
    fetchTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// PDF Download Functions
function downloadCurrentTasks() {
  if (!clerk || !clerk.user || tasks.length === 0) {
    showToast('No tasks available to download', 'error');
    return;
  }
  generatePdf(tasks, 'Current_Filtered_Tasks.pdf');
}

async function downloadAllTasks() {
  if (!clerk || !clerk.user) {
    openAuthModal();
    showToast('Please sign in to download tasks', 'error');
    return;
  }

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}?sortBy=dueDate&sortOrder=asc`, {
      headers: headers
    });
    if (!response.ok) throw new Error('Failed to fetch all tasks');

    const allTasks = await response.json();
    if (allTasks.length === 0) {
      showToast('No tasks available in workspace to download', 'error');
      return;
    }

    generatePdf(allTasks, 'All_Workspace_Tasks.pdf');
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Error generating PDF', 'error');
  }
}

function generatePdf(taskList, fileName) {
  const container = document.createElement('div');
  container.className = 'pdf-print-container';

  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const userName = currentUser ? currentUser.name : 'Workspace User';

  let tableRows = '';
  taskList.forEach(task => {
    let formattedDate = 'No due date';
    if (task.dueDate) {
      formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    }

    const statusStr = task.completed ? 'Completed' : 'Pending';
    const descStr = task.description ? escapeHTML(task.description) : '-';

    tableRows += `
      <tr>
        <td><strong>${escapeHTML(task.title)}</strong></td>
        <td class="col-desc">${descStr}</td>
        <td>${task.priority}</td>
        <td>${formattedDate}</td>
        <td>${statusStr}</td>
      </tr>
    `;
  });

  container.innerHTML = `
    <div class="pdf-print-header">
      <h2>TaskSphere Summary Report</h2>
      <p>User: ${escapeHTML(userName)} | Generated on ${todayStr} | Total Tasks: ${taskList.length}</p>
    </div>
    <div class="tasks-table-wrapper">
      <table class="tasks-table">
        <thead>
          <tr>
            <th>Task Title</th>
            <th class="col-desc">Description</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;

  const opt = {
    margin: 10,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  html2pdf().set(opt).from(container).save();
}

// Escape HTML helper to prevent XSS injection
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Custom Select initialization and synchronisation logic
function initCustomSelects() {
  const selects = document.querySelectorAll('select');

  selects.forEach(select => {
    if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select')) {
      return;
    }

    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.setAttribute('data-select-id', select.id);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `
      <span></span>
      <i class="fa-solid fa-chevron-down"></i>
    `;

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options';

    customSelect.appendChild(trigger);
    customSelect.appendChild(optionsContainer);
    select.insertAdjacentElement('afterend', customSelect);

    function buildOptions() {
      optionsContainer.innerHTML = '';
      Array.from(select.options).forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'custom-option';
        if (opt.value === select.value) {
          optionDiv.classList.add('selected');
          trigger.querySelector('span').textContent = opt.textContent;
        }
        optionDiv.textContent = opt.textContent;
        optionDiv.setAttribute('data-value', opt.value);

        optionDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          select.value = opt.value;
          select.dispatchEvent(new Event('change'));
          customSelect.classList.remove('active');
          syncCustomSelect(select.id);
        });

        optionsContainer.appendChild(optionDiv);
      });
    }

    buildOptions();

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select').forEach(cs => {
        if (cs !== customSelect) cs.classList.remove('active');
      });
      const dropdownMenu = document.getElementById('download-dropdown-menu');
      if (dropdownMenu) dropdownMenu.classList.remove('show');

      customSelect.classList.toggle('active');
    });

    select.addEventListener('change', () => {
      syncCustomSelect(select.id);
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(cs => cs.classList.remove('active'));
  });
}

function syncCustomSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const customSelect = document.querySelector(`.custom-select[data-select-id="${selectId}"]`);
  if (!customSelect) return;

  const triggerSpan = customSelect.querySelector('.custom-select-trigger span');
  const options = customSelect.querySelectorAll('.custom-option');

  Array.from(select.options).forEach(opt => {
    if (opt.value === select.value && triggerSpan) {
      triggerSpan.textContent = opt.textContent;
    }
  });

  options.forEach(optionDiv => {
    if (optionDiv.getAttribute('data-value') === select.value) {
      optionDiv.classList.add('selected');
    } else {
      optionDiv.classList.remove('selected');
    }
  });
}

function syncAllCustomSelects() {
  const selects = document.querySelectorAll('select');
  selects.forEach(select => syncCustomSelect(select.id));
}
