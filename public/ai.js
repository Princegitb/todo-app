// State Management
let aiChatHistory = [];

// DOM Elements
const aiBubble = document.getElementById('ai-chat-bubble');
const aiWidget = document.getElementById('ai-chat-widget');
const aiClose = document.getElementById('ai-chat-close');
const aiMessages = document.getElementById('ai-chat-messages');
const aiInput = document.getElementById('ai-chat-input');
const aiSend = document.getElementById('ai-chat-send');
const suggestionBtns = document.querySelectorAll('.ai-suggestion-btn');

// Toggle Widget Visibility
aiBubble.addEventListener('click', () => {
  aiWidget.classList.toggle('show');
  if (aiWidget.classList.contains('show')) {
    aiInput.focus();
    scrollToBottom();
  }
});

aiClose.addEventListener('click', () => {
  aiWidget.classList.remove('show');
});

// Show AI chat bubble (after login)
function showAIChatBubble(userName = '') {
  if (aiBubble) aiBubble.style.display = 'flex';
  resetAIChat(userName);
}

// Hide AI chat bubble (before login or on logout)
function hideAIChatBubble() {
  if (aiBubble) aiBubble.style.display = 'none';
  if (aiWidget) aiWidget.classList.remove('show');
  aiChatHistory = [];
}

// Start fresh chat session
function resetAIChat(userName = '') {
  aiChatHistory = [];
  if (aiMessages) {
    const displayName = userName ? userName : 'there';
    aiMessages.innerHTML = `
      <div class="ai-message assistant">
        <i class="fa-solid fa-robot message-icon"></i>
        <div class="message-content">
          <p>Hello ${escapeHTML(displayName)}! I am your productivity assistant. You can ask me to list pending items, find high-priority tasks, or summarize your workload!</p>
        </div>
      </div>
    `;
  }
}

// Close widget if clicked outside
document.addEventListener('click', (e) => {
  if (!aiWidget.contains(e.target) && !aiBubble.contains(e.target)) {
    aiWidget.classList.remove('show');
  }
});

// Send Message Listeners
aiSend.addEventListener('click', handleSend);
aiInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSend();
});

// Suggestion Buttons
suggestionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.textContent;
    aiInput.value = text;
    handleSend();
  });
});

// Handle send action
function handleSend() {
  const text = aiInput.value.trim();
  if (!text) return;

  // Clear input
  aiInput.value = '';

  // 1. Add user message to UI & history
  appendMessage('user', text);
  
  // 2. Fetch response from backend
  getAIResponse(text);
}

// Fetch response from server
async function getAIResponse(userMessage) {
  let token = null;
  if (typeof window.getAuthToken === 'function') {
    token = await window.getAuthToken();
  }
  if (!token) {
    appendMessage('assistant', 'Please sign in or create an account to talk with TaskSphere AI about your workload.');
    return;
  }

  showTypingIndicator();

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: userMessage,
        history: aiChatHistory
      })
    });

    if (response.status === 401) {
      removeTypingIndicator();
      appendMessage('assistant', 'Your session has expired. Please sign in again.');
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to communicate with AI Assistant');
    }

    const data = await response.json();
    removeTypingIndicator();

    // Append AI reply to UI
    appendMessage('assistant', data.response);

    // Save to local history
    aiChatHistory.push({ role: 'user', text: userMessage });
    aiChatHistory.push({ role: 'model', text: data.response });

    // Keep history memory compact (max 20 messages)
    if (aiChatHistory.length > 20) {
      aiChatHistory = aiChatHistory.slice(-20);
    }

  } catch (error) {
    removeTypingIndicator();
    appendMessage('assistant', 'Sorry, I encountered an error connecting to the AI service. Please make sure the server is running and your GEMINI_API_KEY is configured.');
    console.error(error);
  }
}

// Append message node to chat logs
function appendMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `ai-message ${sender}`;

  const icon = document.createElement('i');
  icon.className = sender === 'user' ? 'fa-solid fa-user message-icon' : 'fa-solid fa-robot message-icon';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Render markdown text to HTML formatting
  contentDiv.innerHTML = formatMarkdown(text);

  messageDiv.appendChild(icon);
  messageDiv.appendChild(contentDiv);
  aiMessages.appendChild(messageDiv);

  scrollToBottom();
}

// Typing Indicator helpers
function showTypingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'ai-typing-indicator';
  indicator.id = 'ai-typing-indicator';
  indicator.innerHTML = `
    <div class="ai-typing-dot"></div>
    <div class="ai-typing-dot"></div>
    <div class="ai-typing-dot"></div>
  `;
  aiMessages.appendChild(indicator);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById('ai-typing-indicator');
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

// Lightweight client-side Markdown formatter
function formatMarkdown(text) {
  // Escape HTML first to prevent XSS
  let escaped = escapeHTML(text);

  // Convert **bold** to <strong>bold</strong>
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Parse lines to build clean lists and paragraphs
  const lines = escaped.split('\n');
  let inList = false;
  let html = '';

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${trimmed.substring(2)}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (trimmed !== '') {
        html += `<p>${line}</p>`;
      }
    }
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}

// HTML escape helper
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
