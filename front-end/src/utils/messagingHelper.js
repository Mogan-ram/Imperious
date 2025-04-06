// src/utils/messagingHelpers.js
import { useNavigate } from 'react-router-dom';
import messagingService from '../services/api/messaging';

/**
 * Helper function to start a conversation with another user and navigate to the chat
 * @param {string} userEmail - Email of the user to chat with
 * @param {string} userId - ID of the user to chat with (optional)
 * @returns {Promise<void>}
 */
export const startConversationWithUser = async (userEmail, navigate) => {
    try {
        if (!userEmail) {
            console.error('Cannot start conversation: No user email provided');
            return null;
        }

        // Create or get conversation
        const conversation = await messagingService.createConversation([userEmail]);

        // Navigate to messages page
        if (navigate) {
            navigate('/messages', { state: { conversationId: conversation._id } });
        }

        return conversation;
    } catch (error) {
        console.error('Error starting conversation:', error);
        return null;
    }
};

/**
 * React hook to get conversation helper functions
 * @returns {Object} Messaging helper functions
 */
export const useMessagingHelpers = () => {
    const navigate = useNavigate();

    const startChat = async (userEmail) => {
        return startConversationWithUser(userEmail, navigate);
    };

    return {
        startChat
    };
};