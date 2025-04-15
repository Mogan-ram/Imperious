// src/services/api/mentorship.js
import axios from '../axios';

export const mentorshipService = {
    createRequest: async (data) => {
        try {
            const response = await axios.post('/mentorship/request', data);
            return response.data;
        } catch (error) {
            console.error('Error creating mentorship request:', error);
            throw error;
        }
    },

    getRequests: async () => {
        try {
            const response = await axios.get('/mentorship/requests');
            // console.log('Mentorship requests API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error getting mentorship requests:', error);
            // Return empty array instead of throwing
            return [];
        }
    },

    getMentors: async () => {
        try {
            const response = await axios.get('/mentorship/mentors');
            // console.log('Mentors API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error getting mentors:', error);
            // Return empty array instead of throwing
            return [];
        }
    },

    updateRequest: async (requestId, status) => {
        try {
            const response = await axios.put(`/mentorship/request/${requestId}`, { status });
            return response.data;
        } catch (error) {
            console.error('Error updating mentorship request:', error);
            throw error;
        }
    },

    // Example update in mentorship.js
    getMentees: async () => {
        try {
            const response = await axios.get('/mentorship/my_mentees');
            return response.data || {
                project_groups: [],
                mentees: [],
                mentor: {
                    name: "Unknown",
                    dept: ""
                },
                mentees_count: 0
            };
        } catch (error) {
            console.error('Error getting mentees:', error);
            return {
                project_groups: [],
                mentees: [],
                mentor: { name: "Unknown", dept: "" },
                mentees_count: 0
            };
        }
    },

    ignoreRequest: async (requestId) => {
        try {
            const response = await axios.put(`/mentorship/request/${requestId}/ignore`);
            return response.data;
        } catch (error) {
            console.error('Error ignoring mentorship request:', error);
            throw error;
        }
    }
};