import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a proper loading component
    }

    if (!user) {
        return <Navigate to="/signin" />;
    }

    return children;
};

export default ProtectedRoute; 