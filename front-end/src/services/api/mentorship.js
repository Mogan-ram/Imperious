// src/services/api/mentorship.js
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
    //get all mentors
    getMentors: async () => {
        try {
            const response = await axios.get('/mentorship/mentors');
            return response;
        } catch (error) {
            throw error;
        }
    },

    updateRequest: async (requestId, status) => {
        try {
            // CORRECTED URL:  /mentorship/request/:id
            const response = await axios.put(`/mentorship/request/${requestId}`, { status });
            return response;
        } catch (error) {
            throw error;
        }
    },

    getMentees: async () => {
        try {
            const response = await axios.get('/mentorship/my_mentees');
            return response.data; // Return response.data, not the whole response
        } catch (error) {
            throw error;
        }
    },

    // NEW: Add ignoreRequest function
    ignoreRequest: async (requestId) => {
        try {
            const response = await axios.put(`/mentorship/request/${requestId}/ignore`); // New endpoint
            return response;
        } catch (error) {
            throw error;
        }
    }
};