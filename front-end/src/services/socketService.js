// src/services/socketService.js
import io from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect(email) {
        if (!this.socket) {
            this.socket = io('http://localhost:5000');

            this.socket.on('connect', () => {
                console.log('Connected to Socket.IO server');
                this.connected = true;

                // Notify server about login
                if (email) {
                    this.socket.emit('login', { email });
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from Socket.IO server');
                this.connected = false;
            });
        } else if (email && this.connected) {
            // If already connected but email is provided/changed
            this.socket.emit('login', { email });
        }

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    joinConversation(conversationId, email) {
        if (this.socket && conversationId && email) {
            this.socket.emit('join_conversation', {
                conversation_id: conversationId,
                email
            });
        }
    }

    leaveConversation(conversationId) {
        if (this.socket && conversationId) {
            this.socket.emit('leave_conversation', {
                conversation_id: conversationId
            });
        }
    }

    sendMessage(conversationId, email, text, attachments = []) {
        if (this.socket && conversationId && email && text) {
            console.log(`Sending message to conversation ${conversationId}`);
            this.socket.emit('send_message', {
                conversation_id: conversationId,
                email,
                text,
                attachments
            });

            // Add this line - immediately add a temporary message to the UI
            return {
                _id: 'temp_' + Date.now(),
                conversation_id: conversationId,
                sender_details: { email },
                sender: 'self', // We'll use this as a marker
                text: text,
                created_at: new Date().toISOString(),
                is_temp: true
            };
        }
        return null;
    }

    // Add event listeners
    onNewMessage(callback) {
        if (this.socket) {
            console.log("Setting up new_message listener");
            this.socket.on('new_message', (message) => {
                console.log("Received new message from socket:", message);
                callback(message);
            });
        }
    }

    onMessagesRead(callback) {
        if (this.socket) {
            this.socket.on('messages_read', callback);
        }
    }

    onUserStatus(callback) {
        if (this.socket) {
            this.socket.on('user_status', callback);
        }
    }

    // Remove event listeners
    offNewMessage() {
        if (this.socket) {
            this.socket.off('new_message');
        }
    }

    offMessagesRead() {
        if (this.socket) {
            this.socket.off('messages_read');
        }
    }

    offUserStatus() {
        if (this.socket) {
            this.socket.off('user_status');
        }
    }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;