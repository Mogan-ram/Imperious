// src/services/api/connection.js
import axios from './axios';

export const connectionService = {
    // Get all connections for the current user
    getConnections: async () => {
        try {
            const response = await axios.get('/connections');
            return response.data;
        } catch (error) {
            console.error('Error fetching connections:', error);
            throw error;
        }
    },

    // Get pending connection requests
    getConnectionRequests: async () => {
        try {
            const response = await axios.get('/connections/requests');
            return response.data;
        } catch (error) {
            console.error('Error fetching connection requests:', error);
            throw error;
        }
    },

    // Send a connection request to another user
    sendConnectionRequest: async (userId) => {
        try {
            const response = await axios.post('/connections/requests', { userId });
            return response.data;
        } catch (error) {
            console.error('Error sending connection request:', error);
            throw error;
        }
    },

    // Respond to a connection request (accept or reject)
    respondToRequest: async (requestId, status) => {
        try {
            const response = await axios.put(`/connections/requests/${requestId}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error responding to connection request:', error);
            throw error;
        }
    },

    // Get the connection status with a specific user
    getConnectionStatus: async (userId) => {
        try {
            const response = await axios.get(`/connections/status/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error checking connection status:', error);
            throw error;
        }
    },

    // Remove a connection with a user
    removeConnection: async (connectionId) => {
        try {
            const response = await axios.delete(`/connections/${connectionId}`);
            return response.data;
        } catch (error) {
            console.error('Error removing connection:', error);
            throw error;
        }
    }
};

export default connectionService;