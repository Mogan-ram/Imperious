// services/api/users.js
import axios from './axios';

export const userService = {
    getUsers: async (filters = {}) => {
        try {
            const response = await axios.get('/analytics/users', { params: filters });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};