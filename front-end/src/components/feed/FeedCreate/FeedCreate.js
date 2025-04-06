// src/components/feed/FeedCreate/FeedCreate.js
import React, { useState } from 'react';
import { feedService } from '../../../services/api/feed';
import { Form, Button, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { FaSmile, FaPaperPlane } from 'react-icons/fa';
import './FeedCreate.css';

const FeedCreate = ({ onFeedCreated }) => {
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Avatar handling
    const getAvatarSrc = (userData) => {
        if (userData?.photo_url) {
            return userData.photo_url;
        }
        return null;
    };

    // Get initials for avatar fallback
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Content validation
        if (!content.trim()) return;

        setLoading(true);
        try {
            // Prepare data for posting
            let postData = { content };

            const response = await feedService.createFeed(postData);

            // Enrich the feed with author info before passing it back
            const enrichedFeed = {
                ...response.data,
                author: {
                    name: user?.name,
                    email: user?.email,
                    photo_url: user?.photo_url
                },
                timestamp: new Date().toISOString()
            };

            onFeedCreated(enrichedFeed);

            // Reset form
            setContent("");
            setError("");
        } catch (error) {
            setError("Error posting feed. Please try again later.");
            console.error("Error posting feed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="create-feed-card">
            <Card.Body>
                <Form onSubmit={handleSubmit}>
                    <div className="post-author">
                        <div className="author-avatar" style={{
                            backgroundImage: getAvatarSrc(user) ? `url(${getAvatarSrc(user)})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}>
                            {!getAvatarSrc(user) && getInitials(user?.name)}
                        </div>
                        <div className="author-info">
                            <h6 className="mb-0">{user?.name || 'User'}</h6>
                            <small className="text-muted">@{user?.email?.split('@')[0] || 'user'}</small>
                        </div>
                    </div>

                    <Form.Group className="mt-3">
                        <Form.Control
                            as="textarea"
                            className="create-post-textarea"
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="3"
                        />
                    </Form.Group>

                    {error && (
                        <div className="alert alert-danger mt-2" role="alert">
                            {error}
                        </div>
                    )}

                    <Row className="post-actions mt-3">
                        <Col>
                            <div className="post-attachments">
                                <Button variant="link" className="attachment-btn">
                                    <FaSmile />
                                </Button>
                            </div>
                        </Col>
                        <Col className="text-end">
                            <Button
                                type="submit"
                                variant="primary"
                                className="post-submit-btn"
                                disabled={!content.trim() || loading}
                            >
                                {loading ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Posting...
                                    </>
                                ) : (
                                    <>Post</>
                                )}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default FeedCreate;