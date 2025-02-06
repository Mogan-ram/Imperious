import axios from '../../services/axios';

export const newsEventsService = {
    getAll: async (page = 1, type) => {
        const response = await axios.get(`/api/news-events`, {
            params: {
                page,
                type,
                limit: 10
            }
        });
        return response;
    },

    create: async (formData) => {
        const response = await axios.post('/api/news-events', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    },

    update: async (id, data) => {
        const response = await axios.put(`/api/news-events/${id}`, data);
        return response;
    },

    delete: async (id) => {
        const response = await axios.delete(`/api/news-events/${id}`);
        return response;
    }
};