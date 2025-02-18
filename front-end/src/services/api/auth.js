import axios from '../axios';

export const authService = {
    login: async (credentials) => {
        try {
            const response = await axios.post('/login', credentials);
            if (response.data && response.data.access_token) {
                localStorage.setItem('access_token', response.data.access_token);
                localStorage.setItem('refresh_token', response.data.refresh_token);
            }
            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    signup: async (userData) => {
        try {
            const response = await axios.post('/signup', userData);
            return response;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
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