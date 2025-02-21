import axios from '../axios';

const BASE_URL = '/news-events';

export const newsEventsService = {
    getAll: (page = 1, type = "all") => axios.get(BASE_URL, {
        params: {
            page,
            type,
            limit: 10
        }
    }),

    create: (data) => axios.post(BASE_URL, data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
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