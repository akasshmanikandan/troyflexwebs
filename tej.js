/* ==========================================
   Tej AI Assistant - JavaScript Client Engine
   Controls UI states, session memory, Web Speech
   TTS/STT APIs, and Vercel serverless backend.
   ========================================== */

(function () {
  // --- Configuration & Constants ---
  const API_ENDPOINT = '/api/chat';
  const MASCOT_IMAGE = 'tej.png';
  const SUGGESTIONS = [
    'Tell me about Troyflex',
    'What are your services?',
    'Show pricing packages',
    'How do I schedule a call?'
  ];
  const WELCOME_MESSAGE = `Hi! I'm **Tej**, your Troyflex digital assistant. 🚀 I can help you explore our services, find a pricing package, learn about our launch process, or guide you to book a proposal call. How can I help you today?`;

  // --- State Variables ---
  let isOpen = false;
  let isRecording = false;
  let ttsEnabled = sessionStorage.getItem('tej_tts_enabled') === 'true';
  let chatHistory = [];
  let recognition = null;

  // --- SVG Icons ---
  const ICONS = {
    volumeOn: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
    volumeOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
    close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    mic: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>`,
    send: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`
  };

  // --- Dynamic DOM Injection ---
  function injectWidgetHTML() {
    // Check if container exists, create if not
    let root = document.getElementById('tej-widget-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tej-widget-root';
      document.body.appendChild(root);
    }

    const widgetTemplate = `
      <!-- Collapsed Floating Action Button -->
      <button id="tej-trigger" aria-label="Open Tej AI Assistant">
        <div class="tej-pulse-ring"></div>
        <img class="tej-trigger-icon" src="${MASCOT_IMAGE}" alt="Tej" />
      </button>

      <!-- Expanded Chat Card Window -->
      <div id="tej-chat-window" role="dialog" aria-label="Tej AI Chat Panel">
        <!-- Header -->
        <div class="tej-header">
          <div class="tej-header-profile">
            <div class="tej-header-avatar">
              <img src="${MASCOT_IMAGE}" alt="Tej Profile" />
              <div class="tej-header-status-dot"></div>
            </div>
            <div class="tej-header-info">
              <h4>Tej</h4>
              <span>AI Representative • Online</span>
            </div>
          </div>
          <div class="tej-header-controls">
            <!-- Text-to-Speech Toggle -->
            <button id="tej-tts-toggle" class="tej-control-btn ${ttsEnabled ? 'active' : ''}" title="Toggle Voice Responses">
              ${ttsEnabled ? ICONS.volumeOn : ICONS.volumeOff}
            </button>
            <!-- Close Button -->
            <button id="tej-close-btn" class="tej-control-btn" title="Close Panel">
              ${ICONS.close}
            </button>
          </div>
        </div>

        <!-- Chat Logs Body -->
        <div id="tej-chat-body" class="tej-body"></div>

        <!-- Suggestion Chips -->
        <div id="tej-suggestions" class="tej-suggestions"></div>

        <!-- Footer Input Area -->
        <div class="tej-footer">
          <div class="tej-input-wrapper">
            <input type="text" id="tej-input-field" class="tej-input" placeholder="Ask Tej a question..." autocomplete="off" />
            <!-- Microphone Button -->
            <button id="tej-mic-btn" class="tej-mic-btn" title="Speak to Tej">
              ${ICONS.mic}
            </button>
          </div>
          <!-- Send Button -->
          <button id="tej-send-btn" class="tej-send-btn" title="Send Message">
            ${ICONS.send}
          </button>
        </div>
      </div>
    `;

    root.innerHTML = widgetTemplate;
  }

  // --- Initializer ---
  function init() {
    injectWidgetHTML();
    setupSpeechRecognition();
    loadSessionHistory();
    setupEventListeners();
  }

  // --- Load Conversation History ---
  function loadSessionHistory() {
    const chatBody = document.getElementById('tej-chat-body');
    const storedHistory = sessionStorage.getItem('tej_chat_history');

    if (storedHistory) {
      try {
        chatHistory = JSON.parse(storedHistory);
      } catch (e) {
        console.error('Error parsing stored chat history', e);
        chatHistory = [];
      }
    }

    if (chatHistory.length === 0) {
      // Add initial greeting from Tej
      addMessage('bot', WELCOME_MESSAGE, false);
      saveSessionHistory();
    } else {
      // Render previous logs
      chatHistory.forEach(msg => {
        renderMessageBubble(msg.role === 'user' ? 'user' : 'bot', msg.content);
      });
      scrollToBottom();
    }

    renderSuggestions();
  }

  // --- Save Conversation History ---
  function saveSessionHistory() {
    sessionStorage.setItem('tej_chat_history', JSON.stringify(chatHistory));
  }

  // --- Event Bindings ---
  function setupEventListeners() {
    const trigger = document.getElementById('tej-trigger');
    const closeBtn = document.getElementById('tej-close-btn');
    const ttsToggle = document.getElementById('tej-tts-toggle');
    const sendBtn = document.getElementById('tej-send-btn');
    const inputField = document.getElementById('tej-input-field');
    const micBtn = document.getElementById('tej-mic-btn');

    // Toggle Chat Panel
    trigger.addEventListener('click', toggleChatPanel);
    closeBtn.addEventListener('click', () => toggleChatPanel(false));

    // Toggle Text to Speech
    ttsToggle.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      sessionStorage.setItem('tej_tts_enabled', ttsEnabled);
      ttsToggle.classList.toggle('active', ttsEnabled);
      ttsToggle.innerHTML = ttsEnabled ? ICONS.volumeOn : ICONS.volumeOff;
      if (!ttsEnabled && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    });

    // Send click
    sendBtn.addEventListener('click', handleUserSendMessage);

    // Send keypress Enter
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleUserSendMessage();
      }
    });

    // Mic click
    if (micBtn) {
      micBtn.addEventListener('click', toggleVoiceDictation);
    }
  }

  // --- UI Layout Controls ---
  function toggleChatPanel(forceState) {
    const windowEl = document.getElementById('tej-chat-window');
    const triggerEl = document.getElementById('tej-trigger');
    
    isOpen = typeof forceState === 'boolean' ? forceState : !isOpen;
    
    if (isOpen) {
      windowEl.classList.add('open');
      triggerEl.style.display = 'none'; // Hide trigger when panel is open
      document.getElementById('tej-input-field').focus();
      scrollToBottom();
    } else {
      windowEl.classList.remove('open');
      triggerEl.style.display = 'flex'; // Show trigger when panel is closed
      if (isRecording) {
        stopSpeechRecording();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }

  // --- Message UI Operations ---
  function renderMessageBubble(sender, text) {
    const chatBody = document.getElementById('tej-chat-body');
    const bubble = document.createElement('div');
    bubble.className = `tej-message tej-message-${sender}`;

    // Convert simple markdown links [text](url) to HTML links
    let formattedText = text;
    
    // Replace Markdown bold '**' or '*'
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace Markdown links [Anchor](Url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    formattedText = formattedText.replace(markdownLinkRegex, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Replace linebreaks with <br>
    formattedText = formattedText.replace(/\n/g, '<br>');

    bubble.innerHTML = formattedText;
    chatBody.appendChild(bubble);
  }

  function addMessage(sender, content, save = true) {
    renderMessageBubble(sender, content);
    scrollToBottom();

    if (save) {
      chatHistory.push({
        role: sender === 'user' ? 'user' : 'assistant',
        content: content
      });
      saveSessionHistory();
    }
  }

  function renderSuggestions() {
    const container = document.getElementById('tej-suggestions');
    container.innerHTML = '';
    
    SUGGESTIONS.forEach(text => {
      const chip = document.createElement('button');
      chip.className = 'tej-chip';
      chip.innerText = text;
      chip.addEventListener('click', () => {
        handleSendMessageText(text);
      });
      container.appendChild(chip);
    });
  }

  function showTypingIndicator() {
    const chatBody = document.getElementById('tej-chat-body');
    const indicator = document.createElement('div');
    indicator.id = 'tej-typing';
    indicator.className = 'tej-typing-indicator';
    indicator.innerHTML = `
      <span class="tej-dot"></span>
      <span class="tej-dot"></span>
      <span class="tej-dot"></span>
    `;
    chatBody.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('tej-typing');
    if (indicator) {
      indicator.remove();
    }
  }

  function scrollToBottom() {
    const chatBody = document.getElementById('tej-chat-body');
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // --- API Handlers ---
  async function handleSendMessageText(text) {
    if (!text.trim()) return;

    // Add user message
    addMessage('user', text);

    // Show loading
    showTypingIndicator();

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Only send non-system messages to API
          messages: chatHistory.filter(msg => msg.role !== 'system')
        })
      });

      removeTypingIndicator();

      if (!response.ok) {
        throw new Error('API server returned an error');
      }

      const data = await response.json();
      const reply = data.reply || "Sorry, I'm experiencing some difficulties connection. Please check back in a moment or contact us at support@troyflex.dev.";
      
      // Add agent reply
      addMessage('bot', reply);
      
      // Voice synthesis read-out
      speakText(reply);

    } catch (e) {
      console.error('Error communicating with Tej API backend', e);
      removeTypingIndicator();
      addMessage('bot', 'Oops! I had trouble connecting to the brain center. Please feel free to email support@troyflex.dev directly for inquiries.');
    }
  }

  function handleUserSendMessage() {
    const field = document.getElementById('tej-input-field');
    const text = field.value;
    if (!text.trim()) return;
    
    field.value = '';
    handleSendMessageText(text);
  }

  // --- Voice Synthesis (Text-to-Speech) ---
  function speakText(text) {
    if (!ttsEnabled || !window.speechSynthesis) return;

    // Stop speaking current text
    window.speechSynthesis.cancel();

    // Strip HTML and markdown characters for cleaner vocalization
    let cleanText = text.replace(/<[^>]*>/g, ''); // strip HTML tags
    cleanText = cleanText.replace(/\*\*|__/g, ''); // strip bold
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // strip links and leave text
    
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Retrieve system voices and choose a suitable English speaker
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to select Google UK English Male/Female or standard US English
    let selectedVoice = voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
                        voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                        voices.find(v => v.lang.startsWith('en'));
                        
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 1.05; // slightly faster conversational speed
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }

  // Ensure voices are loaded asynchronously in Chrome/Edge
  if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  // --- Voice Recognition (Speech-to-Text) ---
  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Hide mic button if browser doesn't support speech recognition
      const micBtn = document.getElementById('tej-mic-btn');
      if (micBtn) {
        micBtn.style.display = 'none';
      }
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isRecording = true;
      showVoiceRecordingUI();
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error', e.error);
      stopSpeechRecording();
    };

    recognition.onend = () => {
      stopSpeechRecording();
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (transcript && transcript.trim()) {
        const inputField = document.getElementById('tej-input-field');
        inputField.value = transcript;
        
        // Auto-send voice message after short delay for better UX
        setTimeout(() => {
          handleUserSendMessage();
        }, 600);
      }
    };
  }

  function toggleVoiceDictation() {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      // Stop TTS if it was talking before starting to listen
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognition.start();
    }
  }

  function showVoiceRecordingUI() {
    const windowEl = document.getElementById('tej-chat-window');
    const micBtn = document.getElementById('tej-mic-btn');
    
    if (micBtn) {
      micBtn.classList.add('recording');
    }

    // Create a beautiful listening overlay
    const overlay = document.createElement('div');
    overlay.id = 'tej-voice-overlay';
    overlay.className = 'tej-voice-overlay';
    overlay.innerHTML = `
      <div class="tej-voice-waves">
        <div class="tej-voice-wave"></div>
        <div class="tej-voice-wave"></div>
        <div class="tej-voice-wave"></div>
        <div class="tej-voice-wave"></div>
        <div class="tej-voice-wave"></div>
      </div>
      <div class="tej-voice-text">Listening to you...</div>
      <button id="tej-voice-cancel-btn" class="tej-chip" style="margin-top: 10px; border-color: var(--color-pink); color: var(--color-pink);">Cancel</button>
    `;

    windowEl.appendChild(overlay);

    document.getElementById('tej-voice-cancel-btn').addEventListener('click', () => {
      if (recognition) {
        recognition.abort();
      }
      stopSpeechRecording();
    });
  }

  function stopSpeechRecording() {
    isRecording = false;
    const micBtn = document.getElementById('tej-mic-btn');
    const overlay = document.getElementById('tej-voice-overlay');
    
    if (micBtn) {
      micBtn.classList.remove('recording');
    }
    if (overlay) {
      overlay.remove();
    }
  }

  // Run initializations on DOM content ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
