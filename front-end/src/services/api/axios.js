import axios from 'axios';

const instance = axios.create({
    baseURL: 'https://imperious-back-end.onrender.com',

    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refresh_token = localStorage.getItem('refresh_token');
                if (!refresh_token) {
                    throw new Error('No refresh token');
                }

                const response = await instance.post('/refresh-token', {}, {
                    headers: {
                        'Authorization': `Bearer ${refresh_token}`
                    }
                });

                const { access_token } = response.data;
                localStorage.setItem('access_token', access_token);

                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return instance(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/signin';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;