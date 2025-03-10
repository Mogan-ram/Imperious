// src/services/api/userProfile.js
import axios from './axios';

export const userProfileService = {
    // Get a user's profile by ID
    getUserProfile: async (userId) => {
        try {
            const response = await axios.get(`/profile/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    // Get the current user's profile
    getMyProfile: async () => {
        try {
            const response = await axios.get('/profile');
            return response.data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            throw error;
        }
    },

    // Update current user's profile
    updateProfile: async (data) => {
        try {
            const response = await axios.put('/profile', data);
            return response.data;
        } catch (error) {
            console.error('Error updating profile:', error);
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
            console.error('Error uploading photo:', error);
            throw error;
        }
    },

    // Get user connections
    getConnections: async (userId = null) => {
        try {
            const url = userId ? `/connections/user/${userId}` : '/connections';
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            console.error('Error fetching connections:', error);
            throw error;
        }
    },

    // Check connection status with another user
    getConnectionStatus: async (userId) => {
        try {
            const response = await axios.get(`/connections/status/${userId}`);
            return response.data;
        } catch (error) {
            console.error('Error checking connection status:', error);
            throw error;
        }
    }
};

export default userProfileService;