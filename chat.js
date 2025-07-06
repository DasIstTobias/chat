class ChatManager {
    constructor() {
        this.chats = [];
        this.currentChatId = null;
        this.elizaBot = null;
        this.chatIdCounter = 1;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTheme();
        this.createNewChat();
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
        
        // Auto-focus message input
        this.messageInput.focus();
    }
    
    createNewChat() {
        const chatId = this.chatIdCounter++;
        const chat = {
            id: chatId,
            title: `Chat ${chatId}`,
            messages: [],
            createdAt: new Date(),
            elizaBot: new ElizaBot()
        };
        
        this.chats.unshift(chat);
        this.setCurrentChat(chatId);
        this.updateChatList();
        
        // Add initial message from ELIZA
        const initialMessage = chat.elizaBot.getInitial();
        this.addMessage('bot', initialMessage);
    }
    
    setCurrentChat(chatId) {
        this.currentChatId = chatId;
        this.elizaBot = this.getCurrentChat().elizaBot;
        this.renderMessages();
        this.updateChatList();
        this.messageInput.focus();
    }
    
    getCurrentChat() {
        return this.chats.find(chat => chat.id === this.currentChatId);
    }
    
    updateChatList() {
        this.chatList.innerHTML = '';
        
        this.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === this.currentChatId ? 'active' : ''}`;
            chatItem.addEventListener('click', () => {
                this.setCurrentChat(chat.id);
            });
            
            chatItem.innerHTML = `
                <div class="chat-title">${this.escapeHtml(chat.title)}</div>
                <div class="chat-time">${this.formatTime(chat.createdAt)}</div>
            `;
            
            this.chatList.appendChild(chatItem);
        });
    }
    
    renderMessages() {
        const currentChat = this.getCurrentChat();
        if (!currentChat) return;
        
        this.chatMessages.innerHTML = '';
        
        currentChat.messages.forEach(message => {
            this.renderMessage(message);
        });
        
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.type}`;
        
        const avatar = message.type === 'user' ? 'U' : 'E';
        const avatarColor = message.type === 'user' ? 'user' : 'bot';
        
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
        `;
        
        this.chatMessages.appendChild(messageEl);
    }
    
    addMessage(type, content) {
        const currentChat = this.getCurrentChat();
        if (!currentChat) return;
        
        const message = {
            id: Date.now(),
            type: type,
            content: content,
            timestamp: new Date()
        };
        
        currentChat.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
        
        // Update chat title based on first user message
        if (type === 'user' && currentChat.messages.filter(m => m.type === 'user').length === 1) {
            currentChat.title = content.length > 30 ? content.substring(0, 30) + '...' : content;
            this.updateChatList();
        }
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
            this.addMessage('bot', finalMessage);
            return;
        }
        
        // Get ELIZA's response
        const response = this.elizaBot.transform(content);
        
        // Add bot response with a slight delay for better UX
        setTimeout(() => {
            this.addMessage('bot', response);
            
            // Check if ELIZA quit after this response
            if (this.elizaBot.quit) {
                setTimeout(() => {
                    const confirmRestart = confirm('This session is over.\nStart over?');
                    if (confirmRestart) {
                        this.elizaBot.reset();
                        const initialMessage = this.elizaBot.getInitial();
                        this.addMessage('bot', initialMessage);
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