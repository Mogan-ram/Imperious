import axios from '../axios';

export const projectService = {
    createProject: async (formData) => {
        try {
            const response = await axios.post('/projects', formData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getProjects: async () => {
        try {
            const response = await axios.get('/projects');
            console.log('Projects API response:', response); // Debug log
            return response;
        } catch (error) {
            throw error;
        }
    },

    getProjectById: async (id) => {
        try {
            const response = await axios.get(`/projects/${id}`, projectService.getAuthConfig());
            return { data: response.data };
        } catch (error) {
            throw error;
        }
    },

    getAuthConfig: () => {
        return {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            withCredentials: true
        }
    },

    updateProject: async (id, data) => {
        try {
            const response = await axios.put(`/projects/${id}`, data, projectService.getAuthConfig());
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteProject: async (id) => {
        try {
            const response = await axios.delete(`/projects/${id}`, projectService.getAuthConfig());
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    uploadFiles: (projectId, formData) => {
        return axios.post(`/projects/${projectId}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}; 