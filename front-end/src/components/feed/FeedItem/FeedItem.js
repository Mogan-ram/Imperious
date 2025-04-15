// src/components/feed/FeedItem/FeedItem.js
import React, { useState } from 'react';
import { Card, Dropdown, Button, Form, Modal } from 'react-bootstrap';
import {
    FaRegHeart, FaRegComment, FaShare, FaEllipsisH,
    FaBookmark, FaHeart, FaComment, FaRegPaperPlane,
    FaTrashAlt, FaEdit
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './FeedItem.css';

const FeedItem = ({ feed, onDelete, onLike, currentUser, onEdit }) => {
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editedContent, setEditedContent] = useState('');
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

    // Format date for better readability
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
        } else if (diffInMinutes < 24 * 60) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else if (diffInMinutes < 7 * 24 * 60) {
            const days = Math.floor(diffInMinutes / (24 * 60));
            return `${days} day${days === 1 ? '' : 's'} ago`;
        } else {
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
            return date.toLocaleDateString(undefined, options);
        }
    };

    // Check if user can edit/delete the post
    const canDelete = () => {
        if (!user) return false;
        return user.email === feed.author?.email || user.role === 'staff';
    };

    // Handle edit post
    const handleEdit = () => {
        setEditedContent(feed.content);
        setEditModalOpen(true);
    };

    // Handle save edited post
    const handleSaveEdit = () => {
        if (!editedContent.trim()) return;
        onEdit(feed._id, editedContent);
        setEditModalOpen(false);
    };

    // Handle comment submission
    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        // In a real app, this would call an API to save the comment
        // console.log('Comment submitted:', commentText);

        // Clear input after submission
        setCommentText('');
    };

    // Get like count
    const getLikeCount = () => {
        return feed.likesCount || 0;
    };

    // Get comment count
    const getCommentCount = () => {
        return feed.comments?.length || 0;
    };

    // Check if post is liked by current user
    const isLikedByUser = () => {
        return feed.isLiked || false;
    };

    return (
        <Card className="feed-item-card">
            <Card.Body>
                <div className="feed-header">
                    <div className="feed-author">
                        <Link to={`/profile/${feed.author?.email}`} className="author-link">
                            <div className="author-avatar" style={{
                                backgroundImage: getAvatarSrc(feed.author) ? `url(${getAvatarSrc(feed.author)})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}>
                                {!getAvatarSrc(feed.author) && getInitials(feed.author?.name)}
                            </div>
                        </Link>
                        <div className="author-info">
                            <Link to={`/profile/${feed.author?.email}`} className="author-name-link">
                                <h6 className="author-name">{feed.author?.name || 'Unknown User'}</h6>
                            </Link>
                            <small className="post-date">{formatDate(feed.timestamp)}</small>
                        </div>
                    </div>
                    <div className="feed-actions">
                        <Dropdown align="end">
                            <Dropdown.Toggle variant="link" id={`dropdown-${feed._id}`} className="dropdown-toggle-no-arrow">
                                <FaEllipsisH />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => onLike(feed._id)}>
                                    <FaBookmark className="me-2" /> Save Post
                                </Dropdown.Item>
                                <Dropdown.Item>
                                    <FaShare className="me-2" /> Share Post
                                </Dropdown.Item>
                                {canDelete() && (
                                    <>
                                        <Dropdown.Item
                                            onClick={() => handleEdit(feed._id)}
                                        >
                                            <FaEdit className="me-2" /> Edit Post
                                        </Dropdown.Item>
                                        <Dropdown.Item
                                            className="text-danger"
                                            onClick={() => onDelete(feed._id)}
                                        >
                                            <FaTrashAlt className="me-2" /> Delete Post
                                        </Dropdown.Item>
                                    </>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>

                <div className="feed-content">
                    <p className="content-text">{feed.content}</p>
                    {feed.edited && (
                        <small className="text-muted edit-indicator">
                            (Edited {feed.edited_at ? formatDate(feed.edited_at) : ''})
                        </small>
                    )}
                </div>

                <div className="feed-footer">
                    <div className="interaction-stats">
                        <span className="stats-item">
                            <FaHeart className={`stats-icon ${isLikedByUser() ? 'text-danger' : ''}`} />
                            {getLikeCount()} likes
                        </span>
                        <span className="stats-item" onClick={() => setShowComments(!showComments)}>
                            <FaComment className="stats-icon" />
                            {getCommentCount()} comments
                        </span>
                    </div>

                    <hr className="interaction-divider" />

                    <div className="interaction-buttons">
                        <Button
                            variant="link"
                            className={`interaction-btn ${isLikedByUser() ? 'liked' : ''}`}
                            onClick={() => onLike(feed._id)}
                        >
                            {isLikedByUser() ? <FaHeart className="me-1 text-danger" /> : <FaRegHeart className="me-1" />}
                            Like
                        </Button>
                        <Button
                            variant="link"
                            className="interaction-btn"
                            onClick={() => setShowComments(!showComments)}
                        >
                            <FaRegComment className="me-1" /> Comment
                        </Button>
                        <Button variant="link" className="interaction-btn">
                            <FaShare className="me-1" /> Share
                        </Button>
                    </div>

                    {showComments && (
                        <div className="comments-section mt-3">
                            <Form onSubmit={handleSubmitComment} className="comment-form mb-3">
                                <div className="d-flex">
                                    <div className="comment-avatar me-2" style={{
                                        backgroundImage: getAvatarSrc(currentUser) ? `url(${getAvatarSrc(currentUser)})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                        {!getAvatarSrc(currentUser) && getInitials(currentUser?.name)}
                                    </div>
                                    <div className="flex-grow-1 position-relative">
                                        <Form.Control
                                            type="text"
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            className="comment-input"
                                        />
                                        <Button
                                            variant="link"
                                            type="submit"
                                            className="comment-submit"
                                            disabled={!commentText.trim()}
                                        >
                                            <FaRegPaperPlane />
                                        </Button>
                                    </div>
                                </div>
                            </Form>

                            {/* Show existing comments or placeholder */}
                            {feed.comments && feed.comments.length > 0 ? (
                                <div className="comments-list">
                                    {feed.comments.map((comment, index) => (
                                        <div key={index} className="comment-item">
                                            <div className="comment-avatar" style={{
                                                backgroundImage: getAvatarSrc(comment.author) ? `url(${getAvatarSrc(comment.author)})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            }}>
                                                {!getAvatarSrc(comment.author) && getInitials(comment.author?.name)}
                                            </div>
                                            <div className="comment-content">
                                                <div className="comment-bubble">
                                                    <h6 className="comment-author">{comment.author?.name || 'Unknown'}</h6>
                                                    <p className="comment-text">{comment.text}</p>
                                                </div>
                                                <div className="comment-actions">
                                                    <small className="comment-date">{formatDate(comment.timestamp)}</small>
                                                    <button className="comment-reply-btn">Reply</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-comments text-center py-2">
                                    <p className="text-muted mb-0">Be the first to comment on this post!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card.Body>

            {/* Edit Post Modal */}
            <Modal show={editModalOpen} onHide={() => setEditModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Control
                                as="textarea"
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                rows={5}
                                className="edit-post-textarea"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSaveEdit}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default FeedItem;