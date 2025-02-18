import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const setTokens = (access_token, refresh_token) => {
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
    };

    const clearTokens = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    };

    useEffect(() => {
        const initAuth = async () => {
            const access_token = localStorage.getItem('access_token');
            if (access_token) {
                try {
                    const response = await authService.getProfile();
                    setUser(response.data);
                } catch (error) {
                    console.error('Token validation failed:', error);
                    clearTokens();
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [navigate]);

    const signup = async (userData) => {
        try {
            const response = await authService.signup(userData);
            return response;
        } catch (error) {
            console.error('Signup error in context:', error);
            throw error;
        }
    };

    const login = async (credentials) => {
        try {
            const response = await authService.login(credentials);
            const { access_token, refresh_token, user } = response.data;

            if (access_token && refresh_token && user) {
                setTokens(access_token, refresh_token);
                setUser(user);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        clearTokens();
        setUser(null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const value = {
        user,
        signup,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 