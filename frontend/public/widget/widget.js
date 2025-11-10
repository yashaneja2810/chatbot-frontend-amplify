// Enhanced embeddable chatbot widget with dark mode, draggable, and resizable features
(function () {
  // Find script tag
  var script = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var botId = script.getAttribute('data-bot-id') || '';
  var companyName = script.getAttribute('data-company-name') || 'AI Assistant';
  var widgetColor = script.getAttribute('data-color') || '#2563eb';

  // Theme support - Always dark mode for professional look
  var isDarkMode = true;
  var themeConfig = {
    light: {
      background: '#ffffff',
      text: '#1a1a1a',
      messageBackground: '#f1f5f9',
      border: '#e5e7eb'
    },
    dark: {
      background: '#1a1a1a',
      text: '#ffffff',
      messageBackground: '#2a2a2a',
      border: 'rgba(255, 255, 255, 0.1)'
    }
  };

  // Size configuration
  var sizes = {
    small: { width: '300px', height: '400px' },
    medium: { width: '340px', height: '480px' },
    large: { width: '380px', height: '560px' }
  };
  var currentSize = 'medium';

  // Use white as default if widgetColor is the old blue
  var buttonColor = (widgetColor === '#2563eb') ? '#ffffff' : widgetColor;
  var iconColor = (buttonColor === '#ffffff') ? '#000000' : '#ffffff';
  
  // Create floating button
  var btn = document.createElement('div');
  btn.style.position = 'fixed';
  btn.style.bottom = '24px';
  btn.style.right = '24px';
  btn.style.width = '56px';
  btn.style.height = '56px';
  btn.style.background = buttonColor;
  btn.style.borderRadius = '50%';
  btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.cursor = 'pointer';
  btn.style.zIndex = 9999;
  btn.style.transition = 'transform 0.2s';
  btn.onmouseover = function() { btn.style.transform = 'scale(1.05)'; };
  btn.onmouseout = function() { btn.style.transform = 'scale(1)'; };
  btn.innerHTML = '<svg width="28" height="28" fill="' + iconColor + '" viewBox="0 0 24 24"><path d="M12 3C7.03 3 3 6.58 3 11c0 1.61.62 3.09 1.69 4.34-.13.5-.5 1.84-.7 2.56-.11.36.24.68.59.57.76-.25 2.12-.7 2.62-.86C8.7 18.47 10.28 19 12 19c4.97 0 9-3.58 9-8s-4.03-8-9-8zm-2 7h4v2h-4v-2zm8 0h-2v2h2v-2zm-8 4h4v2h-4v-2zm8 0h-2v2h2v-2z"/></svg>';

  // Create chat window
  var chat = document.createElement('div');
  chat.style.position = 'fixed';
  chat.style.bottom = '90px';
  chat.style.right = '24px';
  chat.style.width = '340px';
  chat.style.height = '480px';
  chat.style.background = '#2a2a2a';
  chat.style.borderRadius = '12px';
  chat.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
  chat.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  chat.style.display = 'none';
  chat.style.flexDirection = 'column';
  chat.style.overflow = 'hidden';
  chat.style.zIndex = 9999;

  // Make chat window draggable
  var isDragging = false;
  var currentX;
  var currentY;
  var initialX;
  var initialY;
  var xOffset = 0;
  var yOffset = 0;

  // Chat header with controls
  var header = document.createElement('div');
  header.style.background = '#1a1a1a';
  header.style.color = '#fff';
  header.style.padding = '16px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.cursor = 'move';
  header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  
  // Company name with status indicator
  var titleContainer = document.createElement('div');
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.gap = '8px';
  
  var statusDot = document.createElement('div');
  statusDot.style.width = '8px';
  statusDot.style.height = '8px';
  statusDot.style.borderRadius = '50%';
  statusDot.style.background = '#10b981';
  statusDot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.5)';
  
  var title = document.createElement('div');
  title.style.fontWeight = '600';
  title.style.fontSize = '14px';
  title.innerText = companyName;
  
  titleContainer.appendChild(statusDot);
  titleContainer.appendChild(title);
  
  var controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '4px';
  
  // Size toggle
  var sizeBtn = document.createElement('button');
  sizeBtn.innerHTML = '⛶';
  sizeBtn.style.background = 'none';
  sizeBtn.style.border = 'none';
  sizeBtn.style.color = '#9ca3af';
  sizeBtn.style.cursor = 'pointer';
  sizeBtn.style.padding = '4px 8px';
  sizeBtn.style.borderRadius = '4px';
  sizeBtn.style.transition = 'all 0.2s';
  sizeBtn.title = 'Change size';
  sizeBtn.onmouseover = function() { sizeBtn.style.background = 'rgba(255, 255, 255, 0.1)'; sizeBtn.style.color = '#fff'; };
  sizeBtn.onmouseout = function() { sizeBtn.style.background = 'none'; sizeBtn.style.color = '#9ca3af'; };
  
  controls.appendChild(sizeBtn);
  
  header.appendChild(titleContainer);
  header.appendChild(controls);
  chat.appendChild(header);

  // Chat messages
  var messages = document.createElement('div');
  messages.style.flex = '1';
  messages.style.padding = '16px';
  messages.style.overflowY = 'auto';
  messages.style.background = '#1a1a1a';
  chat.appendChild(messages);

  // Chat input
  var inputWrap = document.createElement('div');
  inputWrap.style.display = 'flex';
  inputWrap.style.gap = '8px';
  inputWrap.style.padding = '16px';
  inputWrap.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
  inputWrap.style.background = '#1a1a1a';
  
  var input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type your message...';
  input.style.flex = '1';
  input.style.padding = '10px 12px';
  input.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  input.style.borderRadius = '8px';
  input.style.outline = 'none';
  input.style.background = '#2a2a2a';
  input.style.color = '#fff';
  input.style.fontSize = '14px';
  input.style.transition = 'all 0.2s';
  input.onfocus = function() { input.style.borderColor = 'rgba(255, 255, 255, 0.3)'; };
  input.onblur = function() { input.style.borderColor = 'rgba(255, 255, 255, 0.1)'; };
  
  var sendBtn = document.createElement('button');
  sendBtn.innerHTML = '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>';
  sendBtn.style.background = '#ffffff';
  sendBtn.style.color = '#000';
  sendBtn.style.border = 'none';
  sendBtn.style.padding = '10px 16px';
  sendBtn.style.borderRadius = '8px';
  sendBtn.style.cursor = 'pointer';
  sendBtn.style.fontWeight = '600';
  sendBtn.style.transition = 'all 0.2s';
  sendBtn.style.display = 'flex';
  sendBtn.style.alignItems = 'center';
  sendBtn.style.justifyContent = 'center';
  sendBtn.onmouseover = function() { sendBtn.style.background = '#f3f4f6'; };
  sendBtn.onmouseout = function() { sendBtn.style.background = '#ffffff'; };
  
  inputWrap.appendChild(input);
  inputWrap.appendChild(sendBtn);
  chat.appendChild(inputWrap);

  // Toggle chat
  btn.onclick = function () {
    chat.style.display = chat.style.display === 'none' ? 'flex' : 'none';
  };

  // Theme toggle function
  function toggleTheme() {
    isDarkMode = !isDarkMode;
    const theme = isDarkMode ? themeConfig.dark : themeConfig.light;
    chat.style.background = theme.background;
    messages.style.background = theme.background;
    input.style.background = theme.background;
    input.style.color = theme.text;
    inputWrap.style.borderTop = '1px solid ' + theme.border;
    // Update existing messages
    messages.querySelectorAll('.message-bubble').forEach(bubble => {
      if (bubble.classList.contains('bot-message')) {
        bubble.style.background = theme.messageBackground;
        bubble.style.color = theme.text;
      }
    });
  }

  // Size toggle function
  function toggleSize() {
    const sizeOrder = ['small', 'medium', 'large'];
    const currentIndex = sizeOrder.indexOf(currentSize);
    currentSize = sizeOrder[(currentIndex + 1) % sizeOrder.length];
    const newSize = sizes[currentSize];
    chat.style.width = newSize.width;
    chat.style.height = newSize.height;
  }

  // Format bot response with markdown-like syntax
  function formatBotResponse(text) {
    // Convert **bold** to styled text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Convert bullet points
    text = text.replace(/^- (.*)/gm, '• $1');
    // Convert numbered lists
    text = text.replace(/^\d+\. (.*)/gm, function(match) {
      return '  ' + match;  // Add indentation to numbered lists
    });
    return text;
  }

  // Send message
  function addMessage(text, from) {
    var msg = document.createElement('div');
    msg.style.margin = '12px 0';
    msg.style.textAlign = from === 'user' ? 'right' : 'left';
    
    var bubble = document.createElement('span');
    bubble.className = 'message-bubble ' + (from === 'user' ? 'user-message' : 'bot-message');
    bubble.style.display = 'inline-block';
    bubble.style.maxWidth = '80%';
    bubble.style.padding = '10px 14px';
    bubble.style.borderRadius = '12px';
    bubble.style.fontSize = '14px';
    bubble.style.lineHeight = '1.5';
    bubble.style.background = from === 'user' ? '#ffffff' : '#2a2a2a';
    bubble.style.color = from === 'user' ? '#000' : '#fff';
    bubble.style.border = from === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)';
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.innerHTML = from === 'user' ? text : formatBotResponse(text);
    
    msg.appendChild(bubble);
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    // Call backend API Gateway endpoint
    fetch('https://g31hjitjqk.execute-api.us-east-1.amazonaws.com/prod/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: botId, query: text })
    })
      .then(r => r.json())
      .then(data => {
        if (data && data.response) {
          addMessage(data.response, 'bot');
        } else {
          addMessage('No response from bot.', 'bot');
        }
      })
      .catch(err => {
        console.error('Chat error:', err);
        addMessage('Error contacting bot.', 'bot');
      });
  }
  // Draggable functionality
  function dragStart(e) {
    if (e.target === header) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
    }
  }

  function dragEnd() {
    isDragging = false;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      chat.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
  }

  // Event listeners
  sendBtn.onclick = sendMessage;
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMessage();
  });
  
  sizeBtn.onclick = toggleSize;
  
  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  // Add initial greeting message
  setTimeout(function() {
    addMessage("Hello! I'm your AI assistant. How can I help you today?", 'bot');
  }, 500);

  // Add to page
  document.body.appendChild(btn);
  document.body.appendChild(chat);
})();
