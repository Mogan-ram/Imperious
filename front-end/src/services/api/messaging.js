// src/services/api/messaging.js
import axios from '../axios';

export const messagingService = {
    // Get all conversations for the current user
    getConversations: async () => {
        try {
            const response = await axios.get('/api/conversations');
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    },

    // Create a new conversation
    createConversation: async (participants) => {
        try {
            const response = await axios.post('/api/conversations', { participants });
            return response.data;
        } catch (error) {
            console.error('Error creating conversation:', error);
            throw error;
        }
    },

    // Get messages for a conversation with pagination
    getMessages: async (conversationId, page = 1, perPage = 20) => {
        try {
            const response = await axios.get(`/api/conversations/${conversationId}/messages`, {
                params: { page, per_page: perPage }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching messages:', error);
            throw error;
        }
    },

    // Search users to start a conversation
    searchUsers: async (query = '', role = '', dept = '') => {
        try {
            const response = await axios.get('/api/users/search', {
                params: { q: query, role, dept }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching users:', error);
            throw error;
        }
    }
};

export default messagingService;