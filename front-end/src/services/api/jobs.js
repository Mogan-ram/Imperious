// src/services/api/jobs.js (CORRECTED URL Template Strings)
import axios from '../axios';

const BASE_URL = '/jobs';

export const jobService = {
    getAllJobs: async (page = 1, limit = 10, search = '', location = '', jobType = '', sortBy = 'created_at', sortOrder = -1) => {
        try {
            const response = await axios.get(BASE_URL, {
                params: { page, limit, search, location, job_type: jobType, sort_by: sortBy, sort_order: sortOrder }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getJobById: async (id) => {
        try {
            const response = await axios.get(`${BASE_URL}/${id}`); // Correct URL
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    createJob: async (jobData) => {
        try {
            const response = await axios.post(BASE_URL, jobData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateJob: async (id, jobData) => {
        try {
            const response = await axios.put(`${BASE_URL}/${id}`, jobData); // Correct URL
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteJob: async (id) => {
        try {
            const response = await axios.delete(`${BASE_URL}/${id}`); // Correct URL
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};