import axios from '../axios';

const BASE_URL = '/news-events';

export const newsEventsService = {
    getAll: async (page = 1, type = "all") => {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    page,
                    type,
                    limit: 10
                }
            });
            console.log('Service response:', response);
            return response;
        } catch (error) {
            console.error('Service error:', error);
            throw error;
        }
    },
    // Modified version
    // In news-events.js
    create: (data) => {
        // IMPORTANT: Let the browser set Content-Type automatically for FormData
        return axios.post(BASE_URL, data);
    },
    update: (id, data) => axios.put(`${BASE_URL}/${id}`, data),
    delete: (id) => axios.delete(`${BASE_URL}/${id}`),

    createNewsEvent: async (data) => {
        try {
            const response = await axios.post(BASE_URL, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};