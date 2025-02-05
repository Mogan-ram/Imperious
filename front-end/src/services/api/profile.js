import axios from '../axios';

export const profileService = {
    getProfile: async () => {
        try {
            console.log('Making profile request with headers:', {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            });
            const response = await axios.get('/profile');
            console.log('Profile response:', response);
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