import axios from '../axios';

export const feedService = {
    getFeeds: () => axios.get('/feeds'),
    createFeed: (data) => axios.post('/feeds', data)
};