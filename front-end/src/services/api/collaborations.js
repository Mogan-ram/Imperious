// src/services/api/collaborations.js - Debug version
import axios from '../axios';

export const collaborationService = {
    exploreProjects: async (filters) => {
        try {
            console.log('Sending filters to backend:', filters);
            const response = await axios.get('/collaborations/explore', { params: filters });
            console.log('Explore API raw response:', response);
            return response.data;
        } catch (error) {
            console.error('Error exploring projects:', error);
            // Return empty array instead of throwing
            return [];
        }
    },

    createRequest: async (data) => {
        try {
            const response = await axios.post('/collaborations/request', data);
            return response.data;
        } catch (error) {
            console.error('Error creating request:', error);
            throw error;
        }
    },

    getRequests: async () => {
        try {
            const response = await axios.get('/collaborations/requests');
            console.log('Requests API raw response:', response);
            return response.data;
        } catch (error) {
            console.error('Error getting requests:', error);
            // Return empty array instead of throwing
            return [];
        }
    },

    updateRequest: async (requestId, status) => {
        try {
            const response = await axios.put(`/collaborations/request/${requestId}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating request:', error);
            throw error;
        }
    },

    getCollaboratedProjects: async () => {
        try {
            console.log('Fetching collaborated projects...');
            const response = await axios.get('/collaborations/collaborated');
            console.log('Collaborated API raw response:', response);

            // Log the structure of the response to debug
            if (response.data) {
                console.log('Response.data type:', typeof response.data);
                console.log('Is array?', Array.isArray(response.data));
                if (typeof response.data === 'object') {
                    console.log('Keys:', Object.keys(response.data));
                }
            }

            return response.data;
        } catch (error) {
            console.error('Error getting collaborated projects:', error);
            console.error('Error details:', error.response ? error.response.data : 'No response data');
            // Return empty array instead of throwing
            return [];
        }
    },

    sendMessage: async (requestId, message) => {
        try {
            const response = await axios.post(`/collaborations/request/${requestId}/message`, { message });
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    },

    getOutgoingRequests: async () => {
        try {
            const response = await axios.get('/collaborations/outgoing');
            console.log('Outgoing API raw response:', response);
            return response.data;
        } catch (error) {
            console.error('Error getting outgoing requests:', error);
            // Return empty array instead of throwing
            return [];
        }
    }
};