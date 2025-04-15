// src/services/api/news-events.js
import axios from '../axios';

const BASE_URL = '/news-events';

export const newsEventsService = {
    /**
     * Get all news and events with optional filtering
     * 
     * @param {number} page - Page number for pagination
     * @param {string} type - Filter by type (news, event, or all)
     * @returns {Promise} API response
     */
    getAll: async (page = 1, type = "all") => {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    page,
                    type,
                    limit: 10
                }
            });
            // console.log('Service response:', response);
            return response;
        } catch (error) {
            // console.error('Service error:', error);
            throw error;
        }
    },

    /**
     * Get a specific news/event by ID
     * 
     * @param {string} id - News/event ID
     * @returns {Promise} API response
     */
    getById: async (id) => {
        try {
            const response = await axios.get(`${BASE_URL}/${id}`);
            return response;
        } catch (error) {
            console.error(`Error fetching news/event with ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * Create a news/event
     * 
     * @param {object} data - News/event data
     * @returns {Promise} API response
     */
    create: (data) => {
        return axios.post(BASE_URL, data);
    },

    /**
     * Update a news/event
     * 
     * @param {string} id - News/event ID
     * @param {object} data - Updated news/event data
     * @returns {Promise} API response
     */
    update: (id, data) => axios.put(`${BASE_URL}/${id}`, data),

    /**
     * Delete a news/event
     * 
     * @param {string} id - News/event ID
     * @returns {Promise} API response
     */
    delete: (id) => axios.delete(`${BASE_URL}/${id}`),

    /**
     * Create a news event specifically (convenience method)
     * 
     * @param {object} data - News/event data
     * @returns {Promise} API response
     */
    createNewsEvent: async (data) => {
        try {
            const response = await axios.post(BASE_URL, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default newsEventsService;