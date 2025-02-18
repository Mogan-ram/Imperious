import axios from '../axios';

export const profileService = {
    getProfile: async () => {
        try {
            const response = await axios.get('/profile');
            return response.data;
        } catch (error) {
            console.error('Profile fetch error:', error);
            throw error;
        }
    },
    updateProfile: async (data) => {
        try {
            const response = await axios.put('/profile', data);
            return response.data;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    }
};