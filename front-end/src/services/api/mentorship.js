import axios from '../axios';

export const mentorshipService = {
    createRequest: async (data) => {
        try {
            const response = await axios.post('/mentorship/request', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    getRequests: async () => {
        try {
            const response = await axios.get('/mentorship/requests');
            return response;
        } catch (error) {
            throw error;
        }
    },

    updateRequest: async (id, status) => {
        try {
            const response = await axios.put(`/mentorship/request/${id}`, { status });
            return response;
        } catch (error) {
            throw error;
        }
    }
};