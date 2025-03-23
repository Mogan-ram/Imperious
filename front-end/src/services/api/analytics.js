// src/services/api/analytics.js
import axios from './axios'; // Import your configured Axios instance

export const analyticsService = {
    // Get general analytics data (counts, distributions, etc.)
    getAnalytics: async () => {
        try {
            const response = await axios.get('/analytics');
            return response.data;
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    },

    // Get users list for analytics (with filtering and pagination)
    getUsers: async (filters = {}) => {
        try {
            // Build query parameters
            const queryParams = new URLSearchParams();

            // Add filters to query parameters
            Object.entries(filters).forEach(([key, value]) => {
                if (value) {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/analytics/users?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching users for analytics:', error);
            throw error;
        }
    },

    // Get all projects for analytics purpose
    getAllProjects: async () => {
        try {
            // Use the dedicated endpoint for all projects
            const response = await axios.get('/projects/all');
            return response.data;
        } catch (error) {
            console.error('Error fetching all projects for analytics:', error);
            throw error;
        }
    },
};