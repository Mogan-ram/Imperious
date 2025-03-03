// src/components/analytics/MenteesList.js
import React, { useState, useEffect, useCallback } from 'react';
import { ListGroup, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const MenteesList = ({ alumnusId }) => {
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user, authToken } = useAuth();

    const fetchMentees = useCallback(async () => {
        if (!alumnusId) return; // Don't fetch if no alumnusId

        setLoading(true);
        setError(null);
        try {
            const data = await alumniApi.getAlumniMentees(alumnusId, authToken);
            setMentees(data);
        } catch (err) {
            setError('Failed to fetch mentees.');
            toast.error('Failed to fetch mentees.');
            console.error("Error fetching mentees:", err);
        } finally {
            setLoading(false);
        }
    }, [alumnusId, authToken]);  //  <--  CRUCIAL:  Add alumnusId as a dependency

    useEffect(() => {
        fetchMentees();
    }, [fetchMentees]); // Use useCallback

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!mentees || mentees.length === 0) {
        return <p>No mentees found for this alumnus.</p>;
    }

    return (
        <ListGroup>
            {mentees.map((mentee) => (
                <ListGroup.Item key={mentee._id}>
                    {mentee.name} ({mentee.email}) - {mentee.status}
                    {/* Add more mentee details as needed */}
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
};

export default MenteesList;