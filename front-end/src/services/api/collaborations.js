import axios from '../axios';

export const collaborationService = {
    exploreProjects: async (filters) => {
        try {
            const response = await axios.get('/collaborations/explore', { params: filters });
            return response;
        } catch (error) {
            throw error;
        }
    },

    createRequest: async (data) => {
        try {
            const response = await axios.post('/collaborations/request', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    getRequests: async () => {
        try {
            const response = await axios.get('/collaborations/requests');
            return response;
        } catch (error) {
            throw error;
        }
    },

    updateRequest: async (requestId, status) => {
        try {
            const response = await axios.put(`/collaborations/request/${requestId}`, { status });
            return response;
        } catch (error) {
            throw error;
        }
    },

    getCollaboratedProjects: async () => {
        try {
            const response = await axios.get('/collaborations/collaborated');
            return response;
        } catch (error) {
            throw error;
        }
    },

    sendMessage: async (requestId, message) => {
        try {
            const response = await axios.post(`/collaborations/request/${requestId}/message`, { message });
            return response;
        } catch (error) {
            throw error;
        }
    },

    getOutgoingRequests: async () => {
        try {
            const response = await axios.get('/collaborations/outgoing');
            return response;
        } catch (error) {
            throw error;
        }
    }
}; 