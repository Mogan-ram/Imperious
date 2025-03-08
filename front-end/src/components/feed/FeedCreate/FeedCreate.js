// src/components/feed/FeedCreate/FeedCreate.js
import React, { useState } from 'react';
import { feedService } from '../../../services/api/feed';
import { Form, Button, Spinner, Card, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { FaImage, FaSmile, FaVideo, FaLink, FaPaperPlane } from 'react-icons/fa';
import './FeedCreate.css';

const FeedCreate = ({ onFeedCreated }) => {
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("text");
    const { user } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            const response = await feedService.createFeed({ content });
            onFeedCreated(response.data); // Assuming backend returns the new feed
            setContent("");
            setError(""); // Clear any previous errors
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
                <div className="post-tabs">
                    <div
                        className={`post-tab ${activeTab === 'text' ? 'active' : ''}`}
                        onClick={() => setActiveTab('text')}
                    >
                        <FaPaperPlane className="tab-icon" />
                        <span className="tab-label">Text Post</span>
                    </div>
                    <div
                        className={`post-tab ${activeTab === 'photo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('photo')}
                    >
                        <FaImage className="tab-icon" />
                        <span className="tab-label">Photo</span>
                    </div>
                    <div
                        className={`post-tab ${activeTab === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveTab('video')}
                    >
                        <FaVideo className="tab-icon" />
                        <span className="tab-label">Video</span>
                    </div>
                    <div
                        className={`post-tab ${activeTab === 'link' ? 'active' : ''}`}
                        onClick={() => setActiveTab('link')}
                    >
                        <FaLink className="tab-icon" />
                        <span className="tab-label">Link</span>
                    </div>
                </div>

                <Form onSubmit={handleSubmit}>
                    <div className="post-author">
                        <div className="author-avatar">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
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
                            placeholder={
                                activeTab === 'text' ? "What's on your mind?" :
                                    activeTab === 'photo' ? "Add a caption to your photo..." :
                                        activeTab === 'video' ? "Add a caption to your video..." :
                                            "Add a description to your link..."
                            }
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows="3"
                        />
                    </Form.Group>

                    {activeTab === 'photo' && (
                        <div className="upload-placeholder mt-3">
                            <FaImage className="upload-icon" />
                            <p className="upload-text">Click to upload a photo</p>
                        </div>
                    )}

                    {activeTab === 'video' && (
                        <div className="upload-placeholder mt-3">
                            <FaVideo className="upload-icon" />
                            <p className="upload-text">Click to upload a video</p>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <Form.Group className="mt-3">
                            <Form.Control
                                type="url"
                                placeholder="Paste your link here"
                                className="link-input"
                            />
                        </Form.Group>
                    )}

                    {error && (
                        <div className="alert alert-danger mt-2" role="alert">
                            {error}
                        </div>
                    )}

                    <Row className="post-actions mt-3">
                        <Col>
                            <div className="post-attachments">
                                <Button variant="link" className="attachment-btn">
                                    <FaImage />
                                </Button>
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
                                ) : 'Post'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default FeedCreate;