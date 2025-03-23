// src/components/analytics/PostsList.js
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Alert, Row, Col, Badge, Pagination, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { format } from 'date-fns';
import { FaCalendarAlt, FaMapMarkerAlt, FaNewspaper, FaCalendarCheck } from 'react-icons/fa';

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
            console.log("Fetching posts for:", alumnusId);

            // First get the alumni data to display the alumnus name
            const alumniList = await alumniApi.getAlumniWillingness("", authToken);
            const currentAlumnus = alumniList.find(a => a.email === alumnusId);
            setAlumnus(currentAlumnus);

            // Get posts data
            const postsData = await alumniApi.getAlumniPosts(alumnusId, authToken);
            console.log("Received posts data:", postsData);

            // Ensure we have an array of posts
            if (Array.isArray(postsData)) {
                setPosts(postsData);
            } else if (postsData && postsData.posts) {
                // If it has a posts property that's an array
                setPosts(postsData.posts);
            } else if (postsData && typeof postsData === 'object') {
                // If it's a single post object, convert to array
                setPosts([postsData]);
            } else {
                // Default to empty array
                setPosts([]);
                console.warn("Posts data is not in expected format:", postsData);
            }
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError('Failed to fetch posts. ' + (err.message || ''));
            toast.error("Failed to fetch posts.");
        } finally {
            setLoading(false);
        }
    }, [alumnusId, authToken]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    // Format date if it exists
    const formatPostDate = (dateString) => {
        if (!dateString) return '';
        try {
            // First check if it's already a string in a readable format
            if (typeof dateString === 'string' && dateString.includes('/')) {
                return dateString;
            }

            // Otherwise try to parse as date
            return format(new Date(dateString), 'MMM d, yyyy');
        } catch (e) {
            console.warn("Date formatting error:", e);
            return dateString;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    // No posts message
    const renderNoPostsMessage = () => (
        <Alert variant="info">
            <h5>No posts found</h5>
            <p>This alumnus hasn't posted any news or events yet. Check back later for updates.</p>
        </Alert>
    );

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

                    {!posts || posts.length === 0 ? (
                        renderNoPostsMessage()
                    ) : (
                        <div>
                            {currentPosts.map((post, index) => (
                                <Card key={post._id || `post-${index}`} className="mb-4 shadow-sm">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-2">
                                            <h5 className="card-title mb-0">{post.title}</h5>
                                            <Badge bg={post.type === 'event' ? 'primary' : 'info'}>
                                                {post.type === 'event' ? (
                                                    <><FaCalendarCheck className="me-1" /> Event</>
                                                ) : (
                                                    <><FaNewspaper className="me-1" /> News</>
                                                )}
                                            </Badge>
                                        </div>

                                        <div className="mb-3 text-muted small">
                                            <span><FaCalendarAlt className="me-1" /> Posted: {formatPostDate(post.created_at)}</span>
                                            {post.type === 'event' && post.event_date && (
                                                <span className="ms-3">
                                                    <FaCalendarCheck className="me-1" /> Event Date: {formatPostDate(post.event_date)}
                                                </span>
                                            )}
                                            {post.location && (
                                                <span className="ms-3">
                                                    <FaMapMarkerAlt className="me-1" /> Location: {post.location}
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

                            {/* Posts summary */}
                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <div>
                                    <Badge bg="primary" className="me-2">
                                        Total Posts: {posts.length}
                                    </Badge>
                                    <Badge bg="info" className="me-2">
                                        News: {posts.filter(p => p.type !== 'event').length}
                                    </Badge>
                                    <Badge bg="success">
                                        Events: {posts.filter(p => p.type === 'event').length}
                                    </Badge>
                                </div>

                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={fetchPosts}
                                >
                                    Refresh Posts
                                </Button>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default PostsList;