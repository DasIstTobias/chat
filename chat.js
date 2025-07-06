class ChatManager {
    constructor() {
        this.chats = [];
        this.currentChatId = null;
        this.elizaBot = null;
        this.chatIdCounter = 1;
        this.sidebarCollapsed = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTheme();
        this.loadChats();
        
        if (this.chats.length === 0) {
            this.createNewChat();
        } else {
            this.setCurrentChat(this.chats[0].id);
        }
    }
    
    initializeElements() {
        this.chatList = document.getElementById('chatList');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.closeSettings = document.getElementById('closeSettings');
        this.themeSelect = document.getElementById('themeSelect');
        this.chatbotSelect = document.getElementById('chatbotSelect');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.sidebar = document.querySelector('.sidebar');
        this.mainChat = document.querySelector('.main-chat');
        this.chatTitle = document.getElementById('chatTitle');
        this.deleteAllChatsBtn = document.getElementById('deleteAllChatsBtn');
        this.confirmationOverlay = document.getElementById('confirmationOverlay');
        this.closeConfirmation = document.getElementById('closeConfirmation');
        this.cancelConfirmation = document.getElementById('cancelConfirmation');
        this.confirmAction = document.getElementById('confirmAction');
        this.confirmationTitle = document.getElementById('confirmationTitle');
        this.confirmationMessage = document.getElementById('confirmationMessage');
        this.chatInputContainer = document.getElementById('chatInputContainer');
    }
    
    bindEvents() {
        // Message input events
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
        
        // Chat management events
        this.newChatBtn.addEventListener('click', () => {
            this.createNewChat();
        });
        
        // Settings events
        this.settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });
        
        this.closeSettings.addEventListener('click', () => {
            this.hideSettings();
        });
        
        this.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === this.settingsOverlay) {
                this.hideSettings();
            }
        });
        
        this.themeSelect.addEventListener('change', () => {
            this.setTheme(this.themeSelect.value);
        });
        
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Delete all chats
        this.deleteAllChatsBtn.addEventListener('click', () => {
            this.showConfirmation(
                'Delete All Chats',
                'Are you sure you want to delete all chats? This action cannot be undone.',
                () => this.deleteAllChats()
            );
        });
        
        // Confirmation overlay events
        this.closeConfirmation.addEventListener('click', () => {
            this.hideConfirmation();
        });
        
        this.cancelConfirmation.addEventListener('click', () => {
            this.hideConfirmation();
        });
        
        this.confirmationOverlay.addEventListener('click', (e) => {
            if (e.target === this.confirmationOverlay) {
                this.hideConfirmation();
            }
        });
        
        // Auto-focus message input
        this.messageInput.focus();
    }
    
    createNewChat() {
        const chatId = this.chatIdCounter++;
        const chat = {
            id: chatId,
            title: 'New Chat',
            messages: [],
            createdAt: new Date(),
            lastUsed: new Date(),
            elizaBot: new ElizaBot()
        };
        
        this.chats.unshift(chat);
        this.setCurrentChat(chatId);
        this.updateChatList();
        this.saveChats();
        
        // Add initial message from ELIZA
        const initialMessage = chat.elizaBot.getInitial();
        this.addMessage('bot', initialMessage, 'eliza');
    }
    
    setCurrentChat(chatId) {
        this.currentChatId = chatId;
        const currentChat = this.getCurrentChat();
        if (currentChat) {
            currentChat.lastUsed = new Date();
            this.elizaBot = currentChat.elizaBot;
            this.updateChatTitle();
            this.renderMessages();
            this.updateChatList();
            this.saveChats();
        }
        this.messageInput.focus();
    }
    
    getCurrentChat() {
        return this.chats.find(chat => chat.id === this.currentChatId);
    }
    
    updateChatList() {
        this.chatList.innerHTML = '';
        
        // Sort chats by last used (most recent first)
        const sortedChats = [...this.chats].sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
        
        // Group chats by time categories
        const now = new Date();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        const categories = {
            current: [],
            lastWeek: [],
            lastMonth: [],
            longTimeAgo: []
        };
        
        sortedChats.forEach(chat => {
            const lastUsed = new Date(chat.lastUsed);
            if (lastUsed > oneDayAgo) {
                categories.current.push(chat);
            } else if (lastUsed > oneWeekAgo) {
                categories.lastWeek.push(chat);
            } else if (lastUsed > oneMonthAgo) {
                categories.lastMonth.push(chat);
            } else {
                categories.longTimeAgo.push(chat);
            }
        });
        
        // Render categories
        this.renderChatCategory('Current', categories.current);
        this.renderChatCategory('Last 7 Days', categories.lastWeek);
        this.renderChatCategory('Last Month', categories.lastMonth);
        this.renderChatCategory('Long Time Ago', categories.longTimeAgo);
    }
    
    renderChatCategory(title, chats) {
        if (chats.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'chat-section';
        
        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'chat-section-title';
        sectionTitle.textContent = title;
        section.appendChild(sectionTitle);
        
        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === this.currentChatId ? 'active' : ''}`;
            
            const chatContent = document.createElement('div');
            chatContent.className = 'chat-content';
            chatContent.addEventListener('click', () => {
                this.setCurrentChat(chat.id);
            });
            
            chatContent.innerHTML = `
                <div class="chat-title">${this.escapeHtml(chat.title)}</div>
                <div class="chat-time">${this.formatTime(new Date(chat.lastUsed))}</div>
            `;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'chat-delete';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showConfirmation(
                    'Delete Chat',
                    `Are you sure you want to delete "${chat.title}"?`,
                    () => this.deleteChat(chat.id)
                );
            });
            
            chatItem.appendChild(chatContent);
            chatItem.appendChild(deleteBtn);
            section.appendChild(chatItem);
        });
        
        this.chatList.appendChild(section);
    }
    
    renderMessages() {
        const currentChat = this.getCurrentChat();
        if (!currentChat) return;
        
        // Check if chat is empty (only has initial bot message)
        const userMessages = currentChat.messages.filter(m => m.type === 'user');
        const isEmpty = userMessages.length === 0;
        
        if (isEmpty) {
            this.renderEmptyChat(currentChat);
        } else {
            this.renderRegularChat(currentChat);
        }
        
        this.scrollToBottom();
    }
    
    renderEmptyChat(chat) {
        this.mainChat.classList.add('empty');
        this.chatInputContainer.style.display = 'none';
        this.chatMessages.innerHTML = '';
        
        const emptyContainer = document.createElement('div');
        emptyContainer.className = 'empty-chat-container';
        
        // Bot welcome message
        const botMessage = chat.messages.find(m => m.type === 'bot');
        if (botMessage) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'bot-welcome';
            welcomeDiv.textContent = botMessage.content;
            emptyContainer.appendChild(welcomeDiv);
        }
        
        // Centered input container
        const centeredInputContainer = document.createElement('div');
        centeredInputContainer.className = 'centered-input-container';
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'input-wrapper';
        inputWrapper.innerHTML = `
            <select class="chatbot-select" id="centeredChatbotSelect">
                <option value="eliza">ELIZA</option>
            </select>
            <input type="text" 
                   class="message-input" 
                   id="centeredMessageInput" 
                   placeholder="Type your message here..." 
                   autocomplete="off">
            <button class="send-btn" id="centeredSendBtn">
                <span class="send-icon">→</span>
            </button>
        `;
        
        centeredInputContainer.appendChild(inputWrapper);
        emptyContainer.appendChild(centeredInputContainer);
        
        this.chatMessages.appendChild(emptyContainer);
        
        // Bind events for the centered input elements
        const centeredInput = document.getElementById('centeredMessageInput');
        const centeredSendBtn = document.getElementById('centeredSendBtn');
        
        if (centeredInput) {
            centeredInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendCenteredMessage();
                }
            });
            centeredInput.focus();
        }
        
        if (centeredSendBtn) {
            centeredSendBtn.addEventListener('click', () => {
                this.sendCenteredMessage();
            });
        }
    }
    
    renderRegularChat(chat) {
        this.mainChat.classList.remove('empty');
        this.chatInputContainer.style.display = 'block';
        this.chatMessages.innerHTML = '';
        
        chat.messages.forEach(message => {
            this.renderMessage(message);
        });
    }
    
    sendCenteredMessage() {
        const centeredInput = document.getElementById('centeredMessageInput');
        if (!centeredInput) return;
        
        const content = centeredInput.value.trim();
        if (!content) return;
        
        // Add user message
        this.addMessage('user', content);
        
        // Get ELIZA's response
        const response = this.elizaBot.transform(content);
        
        // Add bot response with a slight delay for better UX
        setTimeout(() => {
            this.addMessage('bot', response, 'eliza');
        }, 300);
    }
    
    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.type}`;
        
        const avatar = message.type === 'user' ? 'U' : (message.bot === 'eliza' ? 'E' : 'B');
        
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        `;
        
        this.chatMessages.appendChild(messageEl);
    }
    
    addMessage(type, content, bot = null) {
        const currentChat = this.getCurrentChat();
        if (!currentChat) return;
        
        const message = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date(),
            bot: bot
        };
        
        currentChat.messages.push(message);
        currentChat.lastUsed = new Date();
        
        // Re-render messages to handle layout changes
        this.renderMessages();
        
        // Update chat title based on first user message
        if (type === 'user' && currentChat.messages.filter(m => m.type === 'user').length === 1) {
            currentChat.title = content.length > 30 ? content.substring(0, 30) + '...' : content;
            this.updateChatTitle();
            this.updateChatList();
        }
        
        this.saveChats();
    }
    
    sendMessage() {
        const content = this.messageInput.value.trim();
        if (!content) return;
        
        // Add user message
        this.addMessage('user', content);
        this.messageInput.value = '';
        
        // Check if ELIZA wants to quit
        if (this.elizaBot.quit) {
            const finalMessage = this.elizaBot.getFinal();
            this.addMessage('bot', finalMessage, 'eliza');
            return;
        }
        
        // Get ELIZA's response
        const response = this.elizaBot.transform(content);
        
        // Add bot response with a slight delay for better UX
        setTimeout(() => {
            this.addMessage('bot', response, 'eliza');
            
            // Check if ELIZA quit after this response
            if (this.elizaBot.quit) {
                setTimeout(() => {
                    const confirmRestart = confirm('This session is over.\nStart over?');
                    if (confirmRestart) {
                        this.elizaBot.reset();
                        const initialMessage = this.elizaBot.getInitial();
                        this.addMessage('bot', initialMessage, 'eliza');
                    }
                }, 500);
            }
        }, 300);
        
        this.messageInput.focus();
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showSettings() {
        this.settingsOverlay.classList.add('show');
    }
    
    hideSettings() {
        this.settingsOverlay.classList.remove('show');
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('eliza-theme') || 'dark';
        this.themeSelect.value = savedTheme;
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('eliza-theme', theme);
    }
    
    // LocalStorage methods
    saveChats() {
        const chatsData = this.chats.map(chat => ({
            ...chat,
            // Don't save the ElizaBot instance, we'll recreate it
            elizaBot: null
        }));
        localStorage.setItem('randombytes-chats', JSON.stringify(chatsData));
        localStorage.setItem('randombytes-chat-counter', this.chatIdCounter.toString());
    }
    
    loadChats() {
        const savedChats = localStorage.getItem('randombytes-chats');
        const savedCounter = localStorage.getItem('randombytes-chat-counter');
        
        if (savedChats) {
            try {
                const chatsData = JSON.parse(savedChats);
                this.chats = chatsData.map(chat => ({
                    ...chat,
                    createdAt: new Date(chat.createdAt),
                    lastUsed: new Date(chat.lastUsed),
                    elizaBot: new ElizaBot() // Recreate the bot instance
                }));
                
                // Restore chat states by replaying messages
                this.chats.forEach(chat => {
                    chat.messages.forEach(message => {
                        if (message.type === 'user') {
                            chat.elizaBot.transform(message.content);
                        }
                    });
                });
            } catch (e) {
                console.error('Error loading chats:', e);
                this.chats = [];
            }
        }
        
        if (savedCounter) {
            this.chatIdCounter = parseInt(savedCounter);
        }
    }
    
    // UI methods
    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        if (this.sidebarCollapsed) {
            this.sidebar.classList.add('collapsed');
        } else {
            this.sidebar.classList.remove('collapsed');
        }
    }
    
    updateChatTitle() {
        const currentChat = this.getCurrentChat();
        if (currentChat && this.chatTitle) {
            this.chatTitle.textContent = currentChat.title;
        }
    }
    
    bindMessageEvents() {
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            this.messageInput.focus();
        }
        
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => {
                this.sendMessage();
            });
        }
    }
    
    // Confirmation dialog methods
    showConfirmation(title, message, onConfirm) {
        this.confirmationTitle.textContent = title;
        this.confirmationMessage.textContent = message;
        this.confirmAction.onclick = () => {
            onConfirm();
            this.hideConfirmation();
        };
        this.confirmationOverlay.classList.add('show');
    }
    
    hideConfirmation() {
        this.confirmationOverlay.classList.remove('show');
        this.confirmAction.onclick = null;
    }
    
    // Chat deletion methods
    deleteChat(chatId) {
        const chatIndex = this.chats.findIndex(chat => chat.id === chatId);
        if (chatIndex === -1) return;
        
        this.chats.splice(chatIndex, 1);
        
        // If we deleted the current chat, switch to another one
        if (this.currentChatId === chatId) {
            if (this.chats.length > 0) {
                this.setCurrentChat(this.chats[0].id);
            } else {
                this.createNewChat();
            }
        }
        
        this.updateChatList();
        this.saveChats();
    }
    
    deleteAllChats() {
        this.chats = [];
        this.currentChatId = null;
        this.createNewChat();
        this.saveChats();
    }
    
    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        return `${days}d`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the chat manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatManager();
});