import React, { useState } from 'react';
import { feedService } from '../../../services/api/feed';

const FeedCreate = ({ onFeedCreated }) => {
    const [content, setContent] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!content.trim()) return;
        try {
            const response = await feedService.createFeed({ content });
            onFeedCreated(response.data);
            setContent("");
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
                    <textarea
                        className="form-control border-0"
                        placeholder="What's happening?"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="3"
                    ></textarea>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <button className="btn btn-outline-primary btn-sm rounded-circle me-2">
                                <i className="bi bi-image"></i>
                            </button>
                            <button className="btn btn-outline-primary btn-sm rounded-circle">
                                <i className="bi bi-emoji-smile"></i>
                            </button>
                        </div>
                        <button
                            className="btn btn-primary rounded-pill px-4"
                            onClick={handleSubmit}
                        >
                            Post
                        </button>
                    </div>
                    {error && (
                        <div className="alert alert-danger mt-2" role="alert">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedCreate;