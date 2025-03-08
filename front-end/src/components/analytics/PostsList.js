// src/components/analytics/PostsList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Alert, Row, Col, Badge, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';

const PostsList = ({ alumnusId }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [alumnus, setAlumnus] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [postsPerPage] = useState(3);
    const { authToken } = useAuth();

    const fetchPosts = useCallback(async () => {
        if (!alumnusId) return; // Don't fetch if no alumnusId

        setLoading(true);
        setError(null);
        try {
            // First get the alumni data
            const alumniList = await alumniApi.getAlumniWillingness("", authToken);
            const currentAlumnus = alumniList.find(a => a.email === alumnusId);
            setAlumnus(currentAlumnus);

            // Get posts data
            const data = await alumniApi.getAlumniPosts(alumnusId, authToken);
            setPosts(data);
        } catch (err) {
            setError('Failed to fetch posts.');
            toast.error("Failed to fetch posts.");
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    }, [alumnusId, authToken]);

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
        return (
            <Card body>
                <p className="mb-0">No posts found for this alumnus.</p>
            </Card>
        );
    }

    // Format date if it exists
    const formatPostDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch (e) {
            return dateString;
        }
    };

    // Pagination logic
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(posts.length / postsPerPage);

    return (
        <div>
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title className="mb-4">
                        {alumnus ? (
                            <span>Posts by {alumnus.name}</span>
                        ) : (
                            <span>Posts List</span>
                        )}
                    </Card.Title>

                    <div>
                        {currentPosts.map((post) => (
                            <Card key={post._id} className="mb-4 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between mb-2">
                                        <h5 className="card-title mb-0">{post.title}</h5>
                                        <Badge bg={post.type === 'event' ? 'primary' : 'info'}>
                                            {post.type}
                                        </Badge>
                                    </div>

                                    <div className="mb-3 text-muted small">
                                        <span>Posted: {formatPostDate(post.created_at)}</span>
                                        {post.type === 'event' && post.event_date && (
                                            <span className="ms-3">
                                                Event Date: {formatPostDate(post.event_date)}
                                            </span>
                                        )}
                                        {post.location && (
                                            <span className="ms-3">
                                                Location: {post.location}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        {post.description}
                                    </div>

                                    {post.image_url && (
                                        <Row className="mt-3">
                                            <Col md={4}>
                                                <img
                                                    src={post.image_url}
                                                    alt={post.title}
                                                    className="img-fluid rounded"
                                                    style={{ maxHeight: '150px' }}
                                                />
                                            </Col>
                                        </Row>
                                    )}
                                </Card.Body>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.First
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                />
                                <Pagination.Prev
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                />

                                {[...Array(totalPages)].map((_, idx) => (
                                    <Pagination.Item
                                        key={idx + 1}
                                        active={idx + 1 === currentPage}
                                        onClick={() => setCurrentPage(idx + 1)}
                                    >
                                        {idx + 1}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Next
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                />
                                <Pagination.Last
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default PostsList;