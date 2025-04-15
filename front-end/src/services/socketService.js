// src/services/socketService.js
import io from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.messageCallbacks = [];
        this.messagesReadCallbacks = [];
        this.userStatusCallbacks = [];
    }

    connect(email) {
        if (!this.socket) {
            // console.log('Creating new socket connection');
            this.socket = io('http://localhost:5000', {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.setupSocketListeners(email);
        } else if (email && this.connected) {
            // If already connected but email is provided/changed
            // console.log('Socket already connected, notifying with new email:', email);
            this.socket.emit('login', { email });
        }

        return this.socket;
    }

    setupSocketListeners(email) {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            // console.log('Socket connected!');
            this.connected = true;

            // Notify server about login
            if (email) {
                this.socket.emit('login', { email });
                // console.log('Sent login event with email:', email);
            }
        });

        this.socket.on('disconnect', () => {
            // console.log('Socket disconnected');
            this.connected = false;
        });

        this.socket.on('connect_error', (err) => {
            // console.error('Connection error:', err);
        });

        this.socket.on('new_message', (message) => {
            // console.log('Received new_message event:', message);
            this.messageCallbacks.forEach(callback => callback(message));
        });

        this.socket.on('messages_read', (data) => {
            // console.log('Received messages_read event:', data);
            this.messagesReadCallbacks.forEach(callback => callback(data));
        });

        this.socket.on('user_status', (data) => {
            // console.log('Received user_status event:', data);
            this.userStatusCallbacks.forEach(callback => callback(data));
        });
    }

    disconnect() {
        if (this.socket) {
            // console.log('Disconnecting socket');
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    joinConversation(conversationId, email) {
        if (!this.socket || !this.connected) {
            console.error('Cannot join conversation: Socket not connected');
            return;
        }

        if (conversationId && email) {
            // console.log(`Joining conversation: ${conversationId} as ${email}`);
            this.socket.emit('join_conversation', {
                conversation_id: conversationId,
                email
            });
        }
    }

    leaveConversation(conversationId) {
        if (!this.socket || !this.connected) {
            console.error('Cannot leave conversation: Socket not connected');
            return;
        }

        if (conversationId) {
            // console.log(`Leaving conversation: ${conversationId}`);
            this.socket.emit('leave_conversation', {
                conversation_id: conversationId
            });
        }
    }

    sendMessage(conversationId, email, text, attachments = []) {
        if (!this.socket || !this.connected) {
            console.error('Cannot send message: Socket not connected');
            return null;
        }

        if (!conversationId || !email || !text) {
            console.error('Missing required parameters for sending message');
            return null;
        }

        // console.log(`Sending message to conversation ${conversationId} from ${email}`);
        const messageData = {
            conversation_id: conversationId,
            email,
            text,
            attachments
        };

        this.socket.emit('send_message', messageData);

        // Return a temporary message object that can be displayed while waiting for the server response
        return {
            _id: 'temp_' + Date.now(),
            conversation_id: conversationId,
            sender_details: { email },
            text: text,
            created_at: new Date().toISOString(),
            is_temp: true
        };
    }

    // Event listeners with improved management
    onNewMessage(callback) {
        if (typeof callback === 'function') {
            this.messageCallbacks.push(callback);
            // console.log('Added new message callback');
        }
    }

    onMessagesRead(callback) {
        if (typeof callback === 'function') {
            this.messagesReadCallbacks.push(callback);
        }
    }

    onUserStatus(callback) {
        if (typeof callback === 'function') {
            this.userStatusCallbacks.push(callback);
        }
    }

    // Remove event listeners
    offNewMessage(callback) {
        if (callback) {
            this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
        } else {
            this.messageCallbacks = [];
        }
    }

    offMessagesRead(callback) {
        if (callback) {
            this.messagesReadCallbacks = this.messagesReadCallbacks.filter(cb => cb !== callback);
        } else {
            this.messagesReadCallbacks = [];
        }
    }

    offUserStatus(callback) {
        if (callback) {
            this.userStatusCallbacks = this.userStatusCallbacks.filter(cb => cb !== callback);
        } else {
            this.userStatusCallbacks = [];
        }
    }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;