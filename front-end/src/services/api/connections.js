// src/services/api/connections.js
import axios from '../axios';

export const connectionService = {
    // Send a connection request to another user
    sendConnectionRequest: async (toUserId) => {
        try {
            const response = await axios.post('/connections/request', { to_user_id: toUserId });
            return response.data;
        } catch (error) {
            console.error('Error sending connection request:', error);
            throw error;
        }
    },

    // Get all pending connection requests received by the current user
    getConnectionRequests: async () => {
        try {
            const response = await axios.get('/connections/requests');
            return response.data;
        } catch (error) {
            console.error('Error fetching connection requests:', error);
            throw error;
        }
    },

    // Accept or reject a connection request
    respondToRequest: async (requestId, status) => {
        try {
            const response = await axios.put(`/connections/request/${requestId}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error responding to connection request:', error);
            throw error;
        }
    },

    // Get all established connections for the current user
    getConnections: async () => {
        try {
            const response = await axios.get('/connections');
            return response.data;
        } catch (error) {
            console.error('Error fetching connections:', error);
            throw error;
        }
    },

    // Get connection statistics
    getConnectionStats: async () => {
        try {
            const response = await axios.get('/connections/stats');
            return response.data;
        } catch (error) {
            console.error('Error fetching connection stats:', error);
            throw error;
        }
    }
};

export default connectionService;