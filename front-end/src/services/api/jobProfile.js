// src/services/api/jobProfile.js
import axios from '../axios';

export const jobProfileService = {
    // Get the current user's job profile
    getJobProfile: async () => {
        try {
            const response = await axios.get('/profile/job');
            return response.data;
        } catch (error) {
            // If the profile doesn't exist yet, return null instead of throwing an error
            if (error.response && error.response.status === 404) {
                return null;
            }
            console.error('Error fetching job profile:', error);
            throw error;
        }
    },

    // Create a new job profile
    createJobProfile: async (profileData) => {
        try {
            const response = await axios.post('/profile/job', profileData);
            return response.data;
        } catch (error) {
            console.error('Error creating job profile:', error);
            throw error;
        }
    },

    // Update an existing job profile
    updateJobProfile: async (profileData) => {
        try {
            const response = await axios.put('/profile/job', profileData);
            return response.data;
        } catch (error) {
            console.error('Error updating job profile:', error);
            throw error;
        }
    },

    // Add a new job experience to profile
    addJobExperience: async (experienceData) => {
        try {
            const response = await axios.post('/profile/job/experience', experienceData);
            return response.data;
        } catch (error) {
            console.error('Error adding job experience:', error);
            throw error;
        }
    },

    // Update an existing job experience
    updateJobExperience: async (experienceId, experienceData) => {
        try {
            const response = await axios.put(`/profile/job/experience/${experienceId}`, experienceData);
            return response.data;
        } catch (error) {
            console.error('Error updating job experience:', error);
            throw error;
        }
    },

    // Delete a job experience
    deleteJobExperience: async (experienceId) => {
        try {
            const response = await axios.delete(`/profile/job/experience/${experienceId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting job experience:', error);
            throw error;
        }
    }
};

export default jobProfileService;