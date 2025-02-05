import axios from '../axios';

export const authService = {
    login: (credentials) => axios.post('/login', credentials),
    signup: (userData) => axios.post('/signup', userData),
    getProfile: () => axios.get('/profile'),
    updateProfile: (data) => axios.put('/profile', data)
}; 