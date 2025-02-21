// src/services/api/analytics.js
import axios from './axios'; // Import your configured Axios instance

export const analyticsService = {
    getAnalytics: async () => {
        try {
            const response = await axios.get('/analytics');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};