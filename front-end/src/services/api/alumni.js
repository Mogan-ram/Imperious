// src/services/api/alumni.js
import axios from './axios'; // Import your configured axios instance

export const getAlumniWillingness = async (willingnessFilter, authToken) => {
    const url = `/alumni/willingness?willingness=${willingnessFilter}`;
    // Now we don't need that try and catch here.
    return axios.get(url, { headers: { Authorization: `Bearer ${authToken}` } })
        .then(response => response.data); // Directly return data
};

export const getAlumniMentees = async (alumnusId, authToken) => {
    const url = `/alumni/${alumnusId}/mentees`;
    return axios.get(url, { headers: { Authorization: `Bearer ${authToken}` } })
        .then(response => response.data); // Directly return data
};

export const getAlumniPosts = async (alumnusId, authToken) => {
    const url = `/alumni/${alumnusId}/posts`;
    return axios.get(url, { headers: { Authorization: `Bearer ${authToken}` } })
        .then(response => response.data); // Directly return data

};

//added export function to get all users.
export const getAllUsers = async (filters, authToken) => {
    const url = `/analytics/users?${filters}`;
    return axios.get(url, { headers: { Authorization: `Bearer ${authToken}` } })
        .then(response => response.data); // Directly return data
};