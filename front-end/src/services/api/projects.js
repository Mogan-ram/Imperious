import axios from '../axios';

export const projectService = {
    createProject: async (formData) => {
        try {
            const response = await axios.post('/projects', formData);
            return response.data;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    },

    getProjects: async () => {
        try {
            const response = await axios.get('/projects');
            console.log('Projects API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    },

    getProjectById: async (id) => {
        try {
            const response = await axios.get(`/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    },

    updateProject: async (id, data) => {
        try {
            const response = await axios.put(`/projects/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    },

    deleteProject: async (id) => {
        try {
            const response = await axios.delete(`/projects/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    },

    uploadFiles: async (projectId, formData) => {
        try {
            const response = await axios.post(`/projects/${projectId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    }
};