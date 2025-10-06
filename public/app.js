const messagesEl = document.getElementById('messages');
const formEl = document.getElementById('chat-form');
const promptEl = document.getElementById('prompt');
const sendButton = document.getElementById('send-button');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const modelNameEl = document.querySelector('.model-name');
const template = document.getElementById('message-template');
const historyEl = document.getElementById('history');
const newChatButton = document.getElementById('new-chat');

const backgroundUpload = document.getElementById('background-upload');
const clearBackgroundButton = document.getElementById('clear-background');
const modelSelect = document.getElementById('model-select');
const systemCardInput = document.getElementById('system-card');
const memoryInput = document.getElementById('memory-input');
const personaNameInput = document.getElementById('persona-name');
const personaDescriptionInput = document.getElementById('persona-description');
const addPersonaButton = document.getElementById('add-persona');
const deletePersonaButton = document.getElementById('delete-persona');
const personaSelect = document.getElementById('persona-select');
const personaEnabledCheckbox = document.getElementById('persona-enabled');

const STORAGE_KEY = 'local-gpt-conversations-v1';
const SETTINGS_KEY = 'local-gpt-settings-v1';

const MODEL_MIGRATIONS = {
  'GTP-5-mini': 'GPT-5-mini',
  'GPT-nano': 'GPT-5-nano',
};

const defaultSettings = {
  backgroundImage: '',
  model: 'GPT-5',
  systemCard: '',
  memory: '',
  personas: [],
  activePersonaId: null,
  personaEnabled: false,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...defaultSettings };
    }
    const parsed = JSON.parse(raw);
    return {
      ...defaultSettings,
      ...parsed,
      personas: Array.isArray(parsed?.personas) ? parsed.personas : [],
    };
  } catch (error) {
    console.warn('Failed to parse settings', error);
    return { ...defaultSettings };
  }
}

let settings = loadSettings();

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function applyBackground() {
  if (settings.backgroundImage) {
    document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
    document.body.classList.add('has-custom-background');
  } else {
    document.body.style.backgroundImage = '';
    document.body.classList.remove('has-custom-background');
  }
}

function updateSettingsInputs() {
  systemCardInput.value = settings.systemCard;
  memoryInput.value = settings.memory;
  personaEnabledCheckbox.checked = settings.personaEnabled;
  if (MODEL_MIGRATIONS[settings.model]) {
    settings.model = MODEL_MIGRATIONS[settings.model];
    saveSettings();
  }
  if (!modelSelect.querySelector(`option[value="${settings.model}"]`)) {
    settings.model = defaultSettings.model;
    saveSettings();
  }
  modelSelect.value = settings.model;
  renderPersonas();
}

function updateModelDisplay() {
  modelNameEl.textContent = settings.model;
}

function renderPersonas() {
  personaSelect.innerHTML = '';

  if (!settings.personas.length) {
    if (settings.activePersonaId !== null) {
      settings.activePersonaId = null;
      saveSettings();
    }
    const option = document.createElement('option');
    option.textContent = '登録されたペルソナはありません';
    option.value = '';
    option.disabled = true;
    option.selected = true;
    personaSelect.appendChild(option);
    personaSelect.disabled = true;
    deletePersonaButton.disabled = true;
    return;
  }

  personaSelect.disabled = false;

  if (!settings.activePersonaId || !settings.personas.some((p) => p.id === settings.activePersonaId)) {
    settings.activePersonaId = settings.personas[0].id;
    saveSettings();
  }

  for (const persona of settings.personas) {
    const option = document.createElement('option');
    option.value = persona.id;
    option.textContent = persona.name;
    option.selected = persona.id === settings.activePersonaId;
    personaSelect.appendChild(option);
  }

  deletePersonaButton.disabled = !settings.activePersonaId;
}

function handleBackgroundUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('画像ファイルを選択してください。');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    settings.backgroundImage = reader.result;
    saveSettings();
    applyBackground();
    backgroundUpload.value = '';
  };
  reader.readAsDataURL(file);
}

backgroundUpload.addEventListener('change', handleBackgroundUpload);

clearBackgroundButton.addEventListener('click', () => {
  settings.backgroundImage = '';
  saveSettings();
  applyBackground();
});

systemCardInput.addEventListener('input', (event) => {
  settings.systemCard = event.target.value;
  saveSettings();
});

memoryInput.addEventListener('input', (event) => {
  settings.memory = event.target.value;
  saveSettings();
});

modelSelect.addEventListener('change', (event) => {
  settings.model = event.target.value;
  saveSettings();
  updateModelDisplay();
});

personaEnabledCheckbox.addEventListener('change', (event) => {
  settings.personaEnabled = event.target.checked;
  saveSettings();
});

addPersonaButton.addEventListener('click', () => {
  const name = personaNameInput.value.trim();
  const description = personaDescriptionInput.value.trim();

  if (!name) {
    alert('ペルソナ名を入力してください。');
    return;
  }

  if (!description) {
    alert('ペルソナの詳細を入力してください。');
    return;
  }

  const persona = {
    id: crypto.randomUUID(),
    name,
    description,
  };

  settings.personas.push(persona);
  settings.activePersonaId = persona.id;
  saveSettings();
  renderPersonas();

  personaNameInput.value = '';
  personaDescriptionInput.value = '';
});

personaSelect.addEventListener('change', (event) => {
  settings.activePersonaId = event.target.value || null;
  saveSettings();
  renderPersonas();
});

deletePersonaButton.addEventListener('click', () => {
  if (!settings.activePersonaId) return;
  settings.personas = settings.personas.filter((persona) => persona.id !== settings.activePersonaId);
  settings.activePersonaId = settings.personas[0]?.id ?? null;
  saveSettings();
  renderPersonas();
});

function buildChatPayload(conversationMessages) {
  const messages = [];
  if (Array.isArray(conversationMessages)) {
    for (const message of conversationMessages) {
      if (!message || typeof message.role !== 'string') continue;
      if (typeof message.content !== 'string') continue;
      messages.push({ role: message.role, content: message.content });
    }
  }

  const systemParts = [];
  const systemCard = settings.systemCard.trim();
  const memory = settings.memory.trim();

  if (systemCard) {
    systemParts.push(systemCard);
  }

  if (memory) {
    systemParts.push(`共有メモリ:\n${memory}`);
  }

  if (settings.personaEnabled && settings.activePersonaId) {
    const persona = settings.personas.find((item) => item.id === settings.activePersonaId);
    if (persona) {
      const personaPrompt = `あなたは「${persona.name}」というペルソナになりきって応答してください。\n${persona.description}`;
      systemParts.push(personaPrompt);
    }
  }

  return {
    system: systemParts.join('\n\n'),
    messages,
  };
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    console.warn('Failed to parse conversations', error);
  }
  return [];
}

let conversations = loadConversations();
let activeConversationId = conversations[0]?.id ?? createConversation().id;

function saveConversations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function createConversation() {
  const conversation = {
    id: crypto.randomUUID(),
    title: '新しいチャット',
    messages: [
      {
        role: 'assistant',
        content: 'こんにちは！ご用件を教えてください。',
      },
    ],
    createdAt: Date.now(),
  };
  conversations.unshift(conversation);
  setActiveConversation(conversation.id);
  saveConversations();
  renderHistory();
  renderMessages();
  return conversation;
}

function setActiveConversation(id) {
  activeConversationId = id;
  renderHistory();
  renderMessages();
}

function getActiveConversation() {
  return conversations.find((conv) => conv.id === activeConversationId);
}

function renderHistory() {
  historyEl.innerHTML = '';
  if (conversations.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'まだチャットはありません。新しいチャットを開始してみましょう。';
    historyEl.appendChild(empty);
    return;
  }

  for (const conversation of conversations) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'chat-history-item';
    if (conversation.id === activeConversationId) {
      item.classList.add('active');
    }
    item.textContent = conversation.title;
    item.addEventListener('click', () => {
      setActiveConversation(conversation.id);
    });
    historyEl.appendChild(item);
  }
}

function renderMessages() {
  messagesEl.innerHTML = '';
  const active = getActiveConversation();
  if (!active) {
    return;
  }

  for (const message of active.messages) {
    addMessageToDOM(message);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addMessageToDOM(message) {
  const fragment = template.content.cloneNode(true);
  const wrapper = fragment.querySelector('.message');
  const avatar = fragment.querySelector('.avatar');
  const content = fragment.querySelector('.content');

  wrapper.classList.add(message.role);
  avatar.textContent = message.role === 'assistant' ? 'GPT' : 'You';
  content.textContent = message.content;

  messagesEl.appendChild(fragment);
}

function appendSystemMessage(text) {
  const active = getActiveConversation();
  if (!active) return;
  const message = { role: 'assistant', content: text };
  active.messages.push(message);
  addMessageToDOM(message);
  saveConversations();
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function updateStatus(state) {
  switch (state) {
    case 'typing':
      statusText.textContent = '応答を生成しています…';
      statusDot.style.background = '#f5c518';
      statusDot.style.boxShadow = '0 0 10px rgba(245, 197, 24, 0.8)';
      break;
    case 'error':
      statusText.textContent = 'エラーが発生しました';
      statusDot.style.background = '#d72638';
      statusDot.style.boxShadow = '0 0 10px rgba(215, 38, 56, 0.8)';
      break;
    default:
      statusText.textContent = '待機中';
      statusDot.style.background = '#10a37f';
      statusDot.style.boxShadow = '0 0 10px rgba(16, 163, 127, 0.8)';
  }
}

function autoResizeTextarea() {
  promptEl.style.height = 'auto';
  promptEl.style.height = `${Math.min(promptEl.scrollHeight, 200)}px`;
}

promptEl.addEventListener('input', autoResizeTextarea);
autoResizeTextarea();

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prompt = promptEl.value.trim();
  if (!prompt) return;

  const active = getActiveConversation() ?? createConversation();
  const userMessage = { role: 'user', content: prompt };
  active.messages.push(userMessage);
  if (active.title === '新しいチャット') {
    active.title = prompt.slice(0, 24) || '新しいチャット';
  }

  addMessageToDOM(userMessage);
  saveConversations();
  renderHistory();
  promptEl.value = '';
  autoResizeTextarea();
  sendButton.disabled = true;
  updateStatus('typing');

  const assistantFragment = template.content.cloneNode(true);
  const typingIndicator = assistantFragment.querySelector('.message');
  const typingAvatar = assistantFragment.querySelector('.avatar');
  const typingContent = assistantFragment.querySelector('.content');
  typingIndicator.classList.add('assistant');
  typingAvatar.textContent = 'GPT';
  typingContent.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  messagesEl.appendChild(assistantFragment);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  try {
    const { system, messages: requestMessages } = buildChatPayload(active.messages);
    const payload = {
      messages: requestMessages,
      model: settings.model,
      system,
    };

    if (!window.EventSource) {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const assistantMessage = await response.json();
      const spinner = typingIndicator.querySelector('.typing-indicator');
      if (spinner) spinner.remove();
      const contentEl = typingIndicator.querySelector('.content');
      contentEl.textContent = assistantMessage.content;
      active.messages.push(assistantMessage);
      saveConversations();
      updateStatus('idle');
      sendButton.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return;
    }

    const assistantMessage = { role: 'assistant', content: '' };
    active.messages.push(assistantMessage);
    const spinner = typingIndicator.querySelector('.typing-indicator');
    const contentEl = typingIndicator.querySelector('.content');
    if (spinner) spinner.remove();
    contentEl.textContent = '';

    let completed = false;
    let accumulatedText = '';

    const finalizeSuccess = () => {
      if (completed) return;
      completed = true;
      saveConversations();
      updateStatus('idle');
      sendButton.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const finalizeError = (message) => {
      if (completed) return;
      completed = true;
      if (assistantMessage.content) {
        contentEl.textContent = assistantMessage.content;
      } else {
        const index = active.messages.indexOf(assistantMessage);
        if (index !== -1) {
          active.messages.splice(index, 1);
        }
        typingIndicator.remove();
      }
      saveConversations();
      appendSystemMessage(message || '申し訳ありません。応答の取得中にエラーが発生しました。');
      updateStatus('error');
      sendButton.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    let streamId = null;

    try {
      const initResponse = await fetch('/api/chat/stream/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!initResponse.ok) {
        throw new Error(`Stream init failed: ${initResponse.status}`);
      }

      const initData = await initResponse.json();
      if (!initData || typeof initData.streamId !== 'string') {
        throw new Error('Stream init response malformed');
      }
      streamId = initData.streamId;
    } catch (err) {
      console.error('Failed to initialize stream', err);
      const fallbackResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`API request failed: ${fallbackResponse.status}`);
      }

      const assistantResponse = await fallbackResponse.json();
      const spinner = typingIndicator.querySelector('.typing-indicator');
      if (spinner) spinner.remove();
      const contentEl = typingIndicator.querySelector('.content');
      contentEl.textContent = assistantResponse.content;
      assistantMessage.content = assistantResponse.content;
      saveConversations();
      updateStatus('idle');
      sendButton.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return;
    }

    const eventSource = new EventSource(`/api/chat/stream?streamId=${encodeURIComponent(streamId)}`);

    eventSource.addEventListener('message', (event) => {
      if (!event.data) return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.warn('Failed to parse stream chunk', err);
        return;
      }

      if (data.error) {
        eventSource.close();
        finalizeError(typeof data.error === 'string' ? data.error : undefined);
        return;
      }

      if (typeof data.delta === 'string') {
        accumulatedText += data.delta;
        assistantMessage.content = accumulatedText;
        contentEl.textContent = accumulatedText;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      if (data.done) {
        eventSource.close();
        finalizeSuccess();
      }
    });

    eventSource.addEventListener('error', () => {
      eventSource.close();
      finalizeError();
    });

    return;
  } catch (error) {
    console.error(error);
    typingIndicator.remove();
    if (!assistantMessage.content) {
      const index = active.messages.indexOf(assistantMessage);
      if (index !== -1) {
        active.messages.splice(index, 1);
        saveConversations();
      }
    } else {
      saveConversations();
    }
    appendSystemMessage('申し訳ありません。応答の取得中にエラーが発生しました。');
    updateStatus('error');
    sendButton.disabled = false;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
});

newChatButton.addEventListener('click', () => {
  createConversation();
  promptEl.focus();
});

renderHistory();
renderMessages();
applyBackground();
updateSettingsInputs();
updateModelDisplay();

// Submit with Enter but allow Shift+Enter for newline
promptEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    formEl.requestSubmit();
  }
});
