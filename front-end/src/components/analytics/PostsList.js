// src/components/analytics/PostsList.js
import React, { useState, useEffect, useCallback } from 'react';
import { ListGroup, Spinner, Alert } from 'react-bootstrap'; // Import Bootstrap components
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const PostsList = ({ alumnusId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user, authToken } = useAuth();

    const fetchPosts = useCallback(async () => {
        if (!alumnusId) return; // Don't fetch if no alumnusId

        setLoading(true);
        setError(null);
        try {
            const data = await alumniApi.getAlumniPosts(alumnusId, authToken);
            setPosts(data);
        } catch (err) {
            setError('Failed to fetch posts.');
            toast.error("Failed to fetch posts.");
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    }, [alumnusId, authToken]); //  <--  CRUCIAL: Add alumnusId as a dependency

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    if (loading) {
        return <LoadingSpinner />;
    }


    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!posts || posts.length === 0) {
        return <p>No posts found for this alumnus.</p>;
    }

    return (
        <ListGroup>
            {posts.map((post) => (
                <ListGroup.Item key={post._id}>
                    <h5>{post.title}</h5>
                    <p>{post.content}</p>
                    {/*  Display other post details (date, etc.) */}
                </ListGroup.Item>
            ))}
        </ListGroup>
    );
};

export default PostsList;