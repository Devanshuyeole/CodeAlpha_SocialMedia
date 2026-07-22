document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const conversationsList = document.getElementById('conversations-list');
    const recipientUsernameEl = document.getElementById('recipient-username');
    const messagesDisplay = document.getElementById('messages-display');
    const messageInputForm = document.getElementById('message-input-form');
    const messageInput = document.getElementById('message-input');
    const backToConversationsBtn = document.getElementById('back-to-conversations');
    const logo = document.querySelector('.logo');
    const navProfileLink = document.getElementById('nav-profile-link');
    const logoutButton = document.getElementById('logout-button');
    
    const token = localStorage.getItem('token');
    const loggedInUsername = localStorage.getItem('username');

    if (!token || !loggedInUsername) {
        window.location.href = 'login.html';
        return;
    }

    let activeConversation = { id: null, recipientUsername: null };

    if(logo) logo.addEventListener('click', () => { window.location.href = 'feed.html'; });
    if(navProfileLink) navProfileLink.href = `profile.html?username=${loggedInUsername}`;
    if(logoutButton) logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    });

    async function fetchConversations() {
        try {
            const response = await fetch('http://localhost:5000/api/messages/conversations', {
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('Failed to fetch conversations');
            const conversations = await response.json();
            renderConversations(conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }

    function renderConversations(conversations) {
        conversationsList.innerHTML = '';
        conversations.forEach(convo => {
            const recipient = convo.participants.find(p => p.username !== loggedInUsername);
            if (!recipient) return;

            const convoElement = document.createElement('div');
            convoElement.className = 'conversation-item';
            convoElement.dataset.conversationId = convo._id;
            convoElement.dataset.recipientUsername = recipient.username;

            convoElement.innerHTML = `
                <p class="conversation-username">${recipient.username}</p>
                <p class="conversation-last-message">${convo.lastMessage || 'No messages yet'}</p>
            `;
            conversationsList.appendChild(convoElement);
        });
    }

    async function fetchMessages(conversationId, recipientUsername) {
        activeConversation = { id: conversationId, recipientUsername: recipientUsername };
        
        chatContainer.classList.add('show-chat-window');

        document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
        const activeConvoEl = document.querySelector(`[data-conversation-id="${conversationId}"]`);
        if (activeConvoEl) activeConvoEl.classList.add('active');

        recipientUsernameEl.textContent = recipientUsername;
        messagesDisplay.innerHTML = '';

        try {
            const response = await fetch(`http://localhost:5000/api/messages/${conversationId}`, {
                headers: { 'x-auth-token': token }
            });
            if (!response.ok) throw new Error('Failed to fetch messages');
            const messages = await response.json();
            renderMessages(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    function renderMessages(messages) {
        messagesDisplay.innerHTML = '';
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currentUserId = decodedToken.user.id;
        
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.classList.add(msg.sender._id === currentUserId ? 'sent' : 'received');
            messageElement.textContent = msg.text;
            messagesDisplay.appendChild(messageElement);
        });
        messagesDisplay.scrollTop = messagesDisplay.scrollHeight;
    }

    conversationsList.addEventListener('click', (event) => {
        const conversationItem = event.target.closest('.conversation-item');
        if (conversationItem) {
            const conversationId = conversationItem.dataset.conversationId;
            const recipientUsername = conversationItem.dataset.recipientUsername;
            fetchMessages(conversationId, recipientUsername);
        }
    });

    backToConversationsBtn.addEventListener('click', () => {
        chatContainer.classList.remove('show-chat-window');
        activeConversation = { id: null, recipientUsername: null };
        recipientUsernameEl.textContent = 'Select a conversation';
    });

    messageInputForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = messageInput.value.trim();
        if (!text || !activeConversation.recipientUsername) return;

        try {
            const response = await fetch(`http://localhost:5000/api/messages/${activeConversation.recipientUsername}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ text })
            });
            if (!response.ok) throw new Error('Failed to send message');
            
            messageInput.value = '';
            fetchMessages(activeConversation.id, activeConversation.recipientUsername);
            fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });

    fetchConversations();
});