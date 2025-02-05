import axios from '../axios';

export const newsEventsService = {
    getAll: (page, type) => axios.get(`/news-events?page=${page}&type=${type}`),
    create: (data) => axios.post('/news-events', data),
    update: (id, data) => axios.put(`/news-events/${id}`, data),
    delete: (id) => axios.delete(`/news-events/${id}`)
};