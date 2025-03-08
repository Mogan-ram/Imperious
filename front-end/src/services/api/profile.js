// src/services/api/profile.js
import axios from '../axios';

export const profileService = {
    // Get user profile information
    getProfile: async () => {
        try {
            const response = await axios.get('/profile');
            return response.data;
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw error;
        }
    },

    // Update user profile information
    updateProfile: async (data) => {
        try {
            const response = await axios.put('/profile', data);
            return response.data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    },

    // Upload profile photo
    uploadPhoto: async (formData) => {
        try {
            const response = await axios.post('/profile/photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Photo upload error:', error);
            throw error;
        }
    },

    // Get user connections
    getConnections: async (userId) => {
        try {
            const response = await axios.get(`/profile/connections/${userId}`);
            return response;
        } catch (error) {
            console.error('Error fetching connections:', error);
            throw error;
        }
    }
};

export default profileService;