import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { connectionService } from '../services/api/connection';
import { useAuth } from './AuthContext';

const ConnectionsContext = createContext();

export const ConnectionsProvider = ({ children }) => {
    const { user } = useAuth();
    const [connections, setConnections] = useState([]);
    const [connectionRequests, setConnectionRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user's connections
    const fetchConnections = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            const data = await connectionService.getConnections();
            setConnections(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching connections:', err);
            setError('Failed to load connections. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Fetch connection requests
    const fetchConnectionRequests = useCallback(async () => {
        if (!user) return;

        try {
            const data = await connectionService.getConnectionRequests();
            setConnectionRequests(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching connection requests:', err);
            setError('Failed to load connection requests. Please try again later.');
        }
    }, [user]);

    // Send a connection request
    const sendConnectionRequest = async (userId) => {
        try {
            await connectionService.sendConnectionRequest(userId);
            return true;
        } catch (err) {
            console.error('Error sending connection request:', err);
            setError('Failed to send connection request. Please try again later.');
            return false;
        }
    };

    // Respond to a connection request
    const respondToConnectionRequest = async (requestId, status) => {
        try {
            await connectionService.respondToRequest(requestId, status);
            // Update the connection requests list
            await fetchConnectionRequests();
            // If accepted, also update connections
            if (status === 'accepted') {
                await fetchConnections();
            }
            return true;
        } catch (err) {
            console.error('Error responding to connection request:', err);
            setError('Failed to respond to connection request. Please try again later.');
            return false;
        }
    };

    // Remove a connection
    const removeConnection = async (connectionId) => {
        try {
            await connectionService.removeConnection(connectionId);
            // Update connections after removal
            await fetchConnections();
            return true;
        } catch (err) {
            console.error('Error removing connection:', err);
            setError('Failed to remove connection. Please try again later.');
            return false;
        }
    };

    // Check connection status with another user
    const checkConnectionStatus = async (userId) => {
        try {
            return await connectionService.getConnectionStatus(userId);
        } catch (err) {
            console.error('Error checking connection status:', err);
            setError('Failed to check connection status. Please try again later.');
            return { status: 'error' };
        }
    };

    // Initialize connections and requests when user is authenticated
    useEffect(() => {
        if (user) {
            fetchConnections();
            fetchConnectionRequests();
        } else {
            setConnections([]);
            setConnectionRequests([]);
            setLoading(false);
        }
    }, [user, fetchConnections, fetchConnectionRequests]);

    const value = {
        connections,
        connectionRequests,
        loading,
        error,
        fetchConnections,
        fetchConnectionRequests,
        sendConnectionRequest,
        respondToConnectionRequest,
        removeConnection,
        checkConnectionStatus
    };

    return (
        <ConnectionsContext.Provider value={value}>
            {children}
        </ConnectionsContext.Provider>
    );
};

export const useConnections = () => {
    return useContext(ConnectionsContext);
};

export default ConnectionsContext;