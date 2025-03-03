// src/services/api/auth.js
import axios from '../axios';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await axios.post('/login', credentials);
            if (response.data && response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token); // Make sure this matches your backend
            }
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error; // Re-throw the error so the component can handle it
        }
    },

    signup: async (userData) => {
        try {
            const response = await axios.post('/signup', userData);
            return response;
        } catch (error) {
            console.error('Signup error:', error); // Log the full error
            throw error; // Re-throw the error so calling code can handle.
        }
    },

    getProfile: async () => {
        try {
            const response = await axios.get('/profile');
            return response;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    updateProfile: async (data) => {
        try {
            const response = await axios.put('/profile', data);
            return response.data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
};