// API Base URL
const API_URL = '/api/tasks';

// State Management
let tasks = [];
let debounceTimer = null;

// DOM Elements
const tasksContainer = document.getElementById('tasks-container');
const tasksLoader = document.getElementById('tasks-loader');
const emptyState = document.getElementById('empty-state');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');

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
  fetchTasks();
  setupEventListeners();
});

// Event Listeners setup
function setupEventListeners() {
  // Modal toggle
  openAddBtn.addEventListener('click', () => openModal());
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
    debounceTimer = setTimeout(fetchTasks, 300);
  });
  filterStatusSelect.addEventListener('change', fetchTasks);
  filterPrioritySelect.addEventListener('change', fetchTasks);
  sortBySelect.addEventListener('change', fetchTasks);

  // Download PDF dropdown toggle
  const downloadDropdownBtn = document.getElementById('download-dropdown-btn');
  const downloadDropdownMenu = document.getElementById('download-dropdown-menu');
  downloadDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    downloadDropdownMenu.classList.toggle('show');
    // Hide other custom selects
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

    const response = await fetch(`${API_URL}?${queryParams.toString()}`);
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

    // Check if task is overdue
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

    // Row click listener (for viewing details)
    row.addEventListener('click', (e) => {
      // Don't trigger details view if clicking checkboxes, edit, or delete buttons
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
  taskModal.classList.add('show');
  document.body.style.overflow = 'hidden'; // Stop scrolling behind

  if (task) {
    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task._id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description || '';
    taskPrioritySelect.value = task.priority;

    if (task.dueDate) {
      // Format to YYYY-MM-DD
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

// Form Submission handling
async function handleFormSubmit(e) {
  e.preventDefault();

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
    let response;
    if (id) {
      // Edit mode
      response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
    } else {
      // Add mode
      response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
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
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: isCompleted })
    });

    if (!response.ok) throw new Error('Failed to update status');

    showToast(isCompleted ? 'Task completed!' : 'Task set to pending');
    fetchTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Delete Task
async function handleDeleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete task');

    showToast('Task deleted successfully');
    fetchTasks();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// Escape HTML helper to prevent XSS injection
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
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
          syncCustomSelect(select);
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
      customSelect.classList.toggle('active');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select').forEach(cs => {
      cs.classList.remove('active');
    });
  });
}

function syncCustomSelect(select) {
  const customSelect = select.nextElementSibling;
  if (!customSelect || !customSelect.classList.contains('custom-select')) return;

  const trigger = customSelect.querySelector('.custom-select-trigger span');
  const options = customSelect.querySelectorAll('.custom-option');

  const selectedOption = Array.from(select.options).find(opt => opt.value === select.value);
  if (selectedOption) {
    trigger.textContent = selectedOption.textContent;
  }

  options.forEach(optDiv => {
    if (optDiv.getAttribute('data-value') === select.value) {
      optDiv.classList.add('selected');
    } else {
      optDiv.classList.remove('selected');
    }
  });
}

function syncAllCustomSelects() {
  document.querySelectorAll('select').forEach(syncCustomSelect);
}


function createPrintableTable(tasksList) {
  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'tasks-table-wrapper';

  const table = document.createElement('table');
  table.className = 'tasks-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th class="col-task" style="width: 25%;">Task</th>
        <th class="col-desc" style="width: 35%;">Description</th>
        <th class="col-priority" style="width: 13%;">Priority</th>
        <th class="col-due" style="width: 15%;">Due Date</th>
        <th class="col-status" style="width: 12%;">Status</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');

  tasksList.forEach(task => {
    const row = document.createElement('tr');
    row.className = `task-row ${task.completed ? 'task-completed' : ''}`;

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
      <td class="col-task">
        <span class="task-title" style="font-weight: 600;">${escapeHTML(task.title)}</span>
      </td>
      <td class="col-desc">
        <span class="task-desc">${task.description ? escapeHTML(task.description) : '<span class="text-muted-placeholder">-</span>'}</span>
      </td>
      <td class="col-priority">
        <span class="priority-badge ${task.priority.toLowerCase()}">${task.priority}</span>
      </td>
      <td class="col-due">
        <span class="due-badge ${isOverdue ? 'overdue' : ''}">
          <i class="fa-regular fa-calendar"></i>
          <span>${formattedDate}${isOverdue ? ' (Overdue)' : ''}</span>
        </span>
      </td>
      <td class="col-status">
        <span class="status-badge ${task.completed ? 'completed' : 'pending'}">${task.completed ? 'Completed' : 'Pending'}</span>
      </td>
    `;
    tbody.appendChild(row);
  });

  tableWrapper.appendChild(table);
  return tableWrapper;
}

async function downloadCurrentTasks() {
  if (tasks.length === 0) {
    showToast('No tasks to download', 'error');
    return;
  }

  showToast('Generating PDF...');

  try {
    const printContainer = document.createElement('div');
    printContainer.className = 'pdf-print-container';

    // Get filter labels
    const statusLabel = filterStatusSelect.options[filterStatusSelect.selectedIndex].text;
    const priorityLabel = filterPrioritySelect.options[filterPrioritySelect.selectedIndex].text;
    const sortLabel = sortBySelect.options[sortBySelect.selectedIndex].text;

    printContainer.innerHTML = `
      <div class="pdf-print-header">
        <h2>TaskSphere - Tasks Report</h2>
        <p style="margin-top: 4px; font-size: 12px; color: var(--text-secondary);">
          <strong>Status:</strong> ${statusLabel} | 
          <strong>Priority:</strong> ${priorityLabel} | 
          <strong>Sort:</strong> ${sortLabel}
        </p>
        <p style="margin-top: 4px; font-size: 11px; color: var(--text-muted);">
          Generated on: ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    const tableElement = createPrintableTable(tasks);
    printContainer.appendChild(tableElement);

    const opt = {
      margin: 0.4,
      filename: 'tasks_current_view.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().from(printContainer).set(opt).save();
    showToast('PDF downloaded successfully');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    showToast('Failed to generate PDF', 'error');
  }
}

async function downloadAllTasks() {
  showToast('Fetching all tasks...');

  try {
    // Get sorting parameters
    let sortBy = 'dueDate';
    let sortOrder = 'asc';

    if (sortBySelect.value === 'dueDateDesc') {
      sortBy = 'dueDate';
      sortOrder = 'desc';
    } else if (sortBySelect.value === 'createdAt') {
      sortBy = 'createdAt';
      sortOrder = 'desc';
    }

    const response = await fetch(`${API_URL}?sortBy=${sortBy}&sortOrder=${sortOrder}`);
    if (!response.ok) throw new Error('Failed to fetch all tasks');

    const allTasks = await response.json();
    if (allTasks.length === 0) {
      showToast('No tasks found to download', 'error');
      return;
    }

    showToast('Generating PDF...');

    const printContainer = document.createElement('div');
    printContainer.className = 'pdf-print-container';

    printContainer.innerHTML = `
      <div class="pdf-print-header">
        <h2>TaskSphere - All Tasks Report</h2>
        <p style="margin-top: 4px; font-size: 11px; color: var(--text-muted);">
          Generated on: ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    const tableElement = createPrintableTable(allTasks);
    printContainer.appendChild(tableElement);

    const opt = {
      margin: 0.4,
      filename: 'tasks_all.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().from(printContainer).set(opt).save();
    showToast('PDF downloaded successfully');
  } catch (error) {
    console.error('PDF Generation Error:', error);
    showToast('Failed to generate PDF', 'error');
  }
}

// Task Detail View Modal toggles
function openViewModal(task) {
  viewTaskTitle.textContent = task.title;
  viewTaskDesc.textContent = task.description || 'No description provided.';
  
  // Priority Badge Styling
  viewTaskPriority.className = `priority-badge ${task.priority.toLowerCase()}`;
  viewTaskPriority.textContent = task.priority;
  
  // Overdue status check and date layout
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
  
  viewTaskDue.className = `due-badge ${isOverdue ? 'overdue' : ''}`;
  viewTaskDue.innerHTML = `<i class="fa-regular fa-calendar"></i> <span>${formattedDate}${isOverdue ? ' (Overdue)' : ''}</span>`;
  
  // Status Badge Styling
  viewTaskStatus.className = `status-badge ${task.completed ? 'completed' : 'pending'}`;
  viewTaskStatus.textContent = task.completed ? 'Completed' : 'Pending';

  viewTaskModal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeViewModal() {
  viewTaskModal.classList.remove('show');
  document.body.style.overflow = '';
}
