// src/components/feed/FeedItem/FeedItem.js
import React from 'react';
import { Card, Dropdown, Button } from 'react-bootstrap';
import {
    FaRegHeart, FaRegComment, FaShare, FaEllipsisH,
    FaBookmark, FaHeart, FaComment
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import './FeedItem.css';

const FeedItem = ({ feed, onDelete, onLike }) => {
    const { user } = useAuth();

    // Format date for better readability
    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Check if user can delete the post
    const canDelete = () => {
        if (!user) return false;
        return user.email === feed.author?.email || user.role === 'staff';
    };

    return (
        <Card className="feed-item-card">
            <Card.Body>
                <div className="feed-header">
                    <div className="feed-author">
                        <div className="author-avatar">
                            {feed.author?.name ? feed.author.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="author-info">
                            <h6 className="author-name">{feed.author?.name || 'Unknown User'}</h6>
                            <small className="post-date">{formatDate(feed.timestamp)}</small>
                        </div>
                    </div>
                    <div className="feed-actions">
                        <Dropdown align="end">
                            <Dropdown.Toggle variant="link" id={`dropdown-${feed._id}`} className="no-arrow">
                                <FaEllipsisH />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => onLike(feed._id)}>
                                    <FaBookmark className="me-2" /> Save Post
                                </Dropdown.Item>
                                {canDelete() && (
                                    <Dropdown.Item
                                        className="text-danger"
                                        onClick={() => onDelete(feed._id)}
                                    >
                                        Delete
                                    </Dropdown.Item>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                <div className="feed-content">
                    <p className="content-text">{feed.content}</p>
                </div>

                <div className="feed-footer">
                    <div className="interaction-buttons">
                        <Button
                            variant="link"
                            className="interaction-btn"
                            onClick={() => onLike(feed._id)}
                        >
                            <FaRegHeart className="me-1" /> Like
                        </Button>
                        <Button variant="link" className="interaction-btn">
                            <FaRegComment className="me-1" /> Comment
                        </Button>
                        <Button variant="link" className="interaction-btn">
                            <FaShare className="me-1" /> Share
                        </Button>
                    </div>

                    <div className="interaction-stats">
                        <span className="stats-item">
                            <FaHeart className="stats-icon" /> 0
                        </span>
                        <span className="stats-item">
                            <FaComment className="stats-icon" /> 0
                        </span>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

export default FeedItem;