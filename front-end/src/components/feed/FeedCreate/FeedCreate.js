// src/components/feed/FeedCreate/FeedCreate.js
import React, { useState } from 'react';
import { feedService } from '../../../services/api/feed';
import { Form, Button } from 'react-bootstrap'; // Import Form and Button

const FeedCreate = ({ onFeedCreated }) => {
    const [content, setContent] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (event) => { // Add event parameter
        event.preventDefault(); // Prevent default form submission
        if (!content.trim()) return;
        try {
            const response = await feedService.createFeed({ content });
            onFeedCreated(response.data); // Assuming backend returns the new feed
            setContent("");
            setError(""); // Clear any previous errors
        } catch (error) {
            setError("Error posting feed. Please try again later.");
            console.error("Error posting feed", error);
        }
    };

    return (
        <div className="p-3 border-bottom">
            <div className="d-flex gap-3">
                <div className="rounded-circle bg-secondary" style={{ width: '40px', height: '40px' }}></div>
                <div className="flex-grow-1">
                    <Form onSubmit={handleSubmit}> {/* Wrap with Form component */}
                        <Form.Group>
                            <Form.Control
                                as="textarea"
                                className="border-0"
                                placeholder="What's happening?"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                rows="3"
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <div>
                                <Button variant="outline-primary" size="sm" className="rounded-circle me-2">
                                    <i className="bi bi-image"></i>
                                </Button>
                                <Button variant="outline-primary" size="sm" className="rounded-circle">
                                    <i className="bi bi-emoji-smile"></i>
                                </Button>
                            </div>
                            <Button type="submit" variant="primary" className="rounded-pill px-4">
                                Post
                            </Button>
                        </div>
                        {error && (
                            <div className="alert alert-danger mt-2" role="alert">
                                {error}
                            </div>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default FeedCreate;