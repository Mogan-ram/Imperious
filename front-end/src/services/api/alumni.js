// src/services/api/alumni.js
import axios from '../axios';

export const getAlumniWillingness = async (willingnessFilter, authToken) => {
    try {
        const url = `/alumni/willingness?willingness=${willingnessFilter}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log("Alumni willingness response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching alumni willingness:", error);
        throw error;
    }
};

export const getAlumniMentees = async (alumnusId, authToken) => {
    try {
        if (!alumnusId) {
            throw new Error("Alumnus ID is required");
        }

        const url = `/alumni/${alumnusId}/mentees`;
        console.log("Fetching mentees from URL:", url);

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log("Alumni mentees response:", response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching mentees for ${alumnusId}:`, error);
        throw error;
    }
};

export const getAlumniPosts = async (alumnusId, authToken) => {
    try {
        if (!alumnusId) {
            throw new Error("Alumnus ID is required");
        }

        const url = `/alumni/${alumnusId}/posts`;
        console.log("Fetching posts from URL:", url);

        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        console.log("Alumni posts response:", response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching posts for ${alumnusId}:`, error);
        throw error;
    }
};

// Get all alumni users with optional filtering
export const getAllAlumni = async (filters = {}, authToken) => {
    try {
        // Convert filters object to query string
        const queryParams = new URLSearchParams();
        if (filters.dept) queryParams.append('dept', filters.dept);
        if (filters.batch) queryParams.append('batch', filters.batch);
        if (filters.willingness) queryParams.append('willingness', filters.willingness);

        const url = `/analytics/users?role=alumni&${queryParams.toString()}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });

        return response.data.users || [];
    } catch (error) {
        console.error("Error fetching all alumni:", error);
        throw error;
    }
};

// Added function to get all users
export const getAllUsers = async (filters, authToken) => {
    try {
        const url = `/analytics/users?${filters}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};