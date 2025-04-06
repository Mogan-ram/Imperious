// src/components/news-events/NewsDetail/NewsDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Badge, Button, Spinner } from 'react-bootstrap';
import {
    FaCalendarAlt, FaUser, FaClock, FaArrowLeft, FaEdit,
    FaTrash, FaShareAlt, FaBookOpen, FaQuoteLeft, FaQuoteRight
} from 'react-icons/fa';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../NewsDetail/NewsDetailStyle.css'

const NewsDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [relatedArticles, setRelatedArticles] = useState([]);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                setLoading(true);
                const response = await newsEventsService.getById(id);

                if (response && response.data) {
                    setArticle(response.data);
                    // Set page title to article title
                    document.title = `${response.data.title} | Imperious`;

                    // Also fetch some related articles (based on same department)
                    fetchRelatedArticles(response.data);
                } else {
                    setError('Article not found');
                }
            } catch (error) {
                console.error('Error fetching article:', error);
                setError('Failed to load article');
            } finally {
                setLoading(false);
            }
        };

        fetchArticle();

        // Clean up on unmount
        return () => {
            document.title = 'Imperious'; // Reset title
        };
    }, [id]);

    // Function to fetch related articles based on department or author
    const fetchRelatedArticles = async (currentArticle) => {
        try {
            const response = await newsEventsService.getAll(1, 'news');

            if (response.data && response.data.items) {
                // Filter out the current article
                const filteredArticles = response.data.items.filter(item => item._id !== currentArticle._id);

                // First try to get articles from the same department
                let related = [];
                if (currentArticle.author && currentArticle.author.dept) {
                    related = filteredArticles.filter(
                        item => item.author && item.author.dept === currentArticle.author.dept
                    );
                }

                // If not enough related articles by department, add some from the same author
                if (related.length < 3 && currentArticle.author && currentArticle.author._id) {
                    const authorArticles = filteredArticles.filter(
                        item => item.author && item.author._id === currentArticle.author._id &&
                            !related.find(r => r._id === item._id)
                    );
                    related = [...related, ...authorArticles];
                }

                // If still not enough, add recent articles
                if (related.length < 3) {
                    const recentArticles = filteredArticles
                        .filter(item => !related.find(r => r._id === item._id))
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                    related = [...related, ...recentArticles];
                }

                // Take just the first 3
                setRelatedArticles(related.slice(0, 3));
            }
        } catch (error) {
            console.error('Error fetching related articles:', error);
        }
    };

    // Check if user can edit or delete the article
    const canEdit = () => {
        if (!user || !article) return false;
        return user._id === article.author_id;
    };

    const canDelete = () => {
        if (!user || !article) return false;

        const userRole = user.role.toLowerCase();
        const authorId = article.author_id;

        // Staff can delete their own news and alumni news
        if (userRole === 'staff') {
            if (user._id === authorId) return true;

            // If the article was created by an alumni, staff can delete it
            const authorRole = article.author?.role?.toLowerCase();
            return authorRole === 'alumni';
        }

        // Alumni can only delete their own news
        if (userRole === 'alumni') {
            return user._id === authorId;
        }

        return false;
    };

    const handleEdit = () => {
        navigate(`/news-events/${id}/edit`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this article?')) {
            try {
                setDeleteLoading(true);
                await newsEventsService.delete(id);
                toast.success('Article deleted successfully');
                navigate('/news');
            } catch (error) {
                console.error('Error deleting article:', error);
                toast.error('Failed to delete article');
            } finally {
                setDeleteLoading(false);
            }
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.description.substring(0, 100) + '...',
                url: window.location.href,
            })
                .then(() => console.log('Shared successfully'))
                .catch((error) => console.log('Error sharing:', error));
        } else {
            // Fallback for browsers that don't support navigator.share
            const tempInput = document.createElement('input');
            document.body.appendChild(tempInput);
            tempInput.value = window.location.href;
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            toast.success('URL copied to clipboard');
        }
    };

    // Format the timestamp
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format reading time (approx. 200 words per minute)
    const calculateReadingTime = (text) => {
        const words = text.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    // Helper to get badge color based on department
    const getDeptBadgeColor = (dept) => {
        const deptColors = {
            'CSE': 'primary',
            'IT': 'info',
            'ECE': 'success',
            'EEE': 'warning',
            'MECH': 'danger',
            'CIVIL': 'secondary'
        };
        return deptColors[dept] || 'dark';
    };

    // Function to get appropriate badge color based on role
    const getRoleBadgeColor = (role) => {
        if (!role) return 'secondary';

        switch (role.toLowerCase()) {
            case 'staff':
                return 'primary';
            case 'alumni':
                return 'success';
            case 'student':
                return 'info';
            default:
                return 'secondary';
        }
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" className="mb-3">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p>Loading article...</p>
            </Container>
        );
    }

    if (error || !article) {
        return (
            <Container className="py-5">
                <div className="alert alert-danger">
                    <h4 className="alert-heading">Article Not Found</h4>
                    <p>{error || 'Unable to load the requested article.'}</p>
                    <hr />
                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                        <Link to="/news" className="btn btn-outline-primary">
                            <FaArrowLeft className="me-2" /> Back to News
                        </Link>
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <div className="news-detail-page">
            {/* Article Header */}
            <div className="article-header py-4">
                <Container>
                    <div className="article-navigation mb-4">
                        <Link to="/news" className="back-link">
                            <FaArrowLeft className="me-2" /> Back to News
                        </Link>
                    </div>

                    <div className="article-header-content">
                        {/* Badges for Department & Role */}
                        <div className="article-badges mb-3">
                            {article.author && article.author.dept && (
                                <Badge bg={getDeptBadgeColor(article.author.dept)} className="me-2">
                                    {article.author.dept}
                                </Badge>
                            )}
                            {article.author && article.author.role && (
                                <Badge bg={getRoleBadgeColor(article.author.role)}>
                                    {article.author.role}
                                </Badge>
                            )}
                        </div>

                        {/* Article Title */}
                        <h1 className="article-title">{article.title}</h1>

                        {/* Article Meta */}
                        <div className="article-meta">
                            <div className="author-info d-flex align-items-center">
                                <div className="author-avatar">
                                    <div className="author-avatar-placeholder">
                                        {article.author?.name ? article.author.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                </div>
                                <div className="author-details ms-2">
                                    <p className="author-name mb-0">
                                        {article.author ? article.author.name : 'Unknown Author'}
                                    </p>
                                    <div className="article-date-info d-flex align-items-center">
                                        <span className="me-3">
                                            <FaCalendarAlt className="me-1 text-secondary" />
                                            <small>{formatDate(article.created_at)}</small>
                                        </span>
                                        <span>
                                            <FaClock className="me-1 text-secondary" />
                                            <small>{calculateReadingTime(article.description)}</small>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Article Actions */}
                            <div className="article-actions">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    className="me-2"
                                    onClick={handleShare}
                                >
                                    <FaShareAlt className="me-1" /> Share
                                </Button>
                                {canEdit() && (
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="me-2"
                                        onClick={handleEdit}
                                    >
                                        <FaEdit className="me-1" /> Edit
                                    </Button>
                                )}
                                {canDelete() && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={handleDelete}
                                        disabled={deleteLoading}
                                    >
                                        {deleteLoading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-1" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <FaTrash className="me-1" /> Delete
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </Container>
            </div>

            {/* Article Content */}
            <Container className="py-4">
                <Row>
                    <Col lg={8} className="article-main-content">
                        <div className="article-featured-image placeholder-image mb-4">
                            <div className="placeholder-content">
                                <FaBookOpen className="me-2" /> {article.title}
                            </div>
                        </div>

                        <div className="article-content">
                            {/* First paragraph with quote styling */}
                            {article.description.split('\n\n')[0] && (
                                <p className="lead">
                                    <FaQuoteLeft className="me-2 text-primary opacity-50" size={20} />
                                    {article.description.split('\n\n')[0]}
                                    <FaQuoteRight className="ms-2 text-primary opacity-50" size={20} />
                                </p>
                            )}

                            {/* Format the remaining description with paragraphs */}
                            {article.description.split('\n\n').slice(1).map((paragraph, index) => (
                                <p key={index}>
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        {/* Article footer */}
                        <div className="article-footer mt-5 pt-4 border-top">
                            <div className="d-flex justify-content-between align-items-center">
                                <div className="author-bio">
                                    <p className="mb-0">
                                        <strong>About the author:</strong> {article.author?.name || 'Unknown Author'}
                                        {article.author?.dept && ` from ${article.author.dept} department`}
                                    </p>
                                </div>
                                <div className="article-share">
                                    <Button
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={handleShare}
                                    >
                                        <FaShareAlt className="me-1" /> Share this article
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {/* Sidebar */}
                    <Col lg={4} className="article-sidebar">
                        <div className="sidebar-section mb-4">
                            <h4 className="sidebar-title">Author</h4>
                            <div className="author-card d-flex align-items-center p-3 bg-light rounded">
                                <div className="large-author-avatar">
                                    <div className="author-avatar-placeholder">
                                        {article.author?.name ? article.author.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                </div>
                                <div className="ms-3">
                                    <h5 className="mb-1">{article.author ? article.author.name : 'Unknown Author'}</h5>
                                    {article.author?.dept && (
                                        <p className="mb-0 text-muted">{article.author.dept} Department</p>
                                    )}
                                    {article.author?.role && (
                                        <Badge bg={getRoleBadgeColor(article.author.role)} className="mt-1">
                                            {article.author.role}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {relatedArticles.length > 0 && (
                            <div className="sidebar-section">
                                <h4 className="sidebar-title">Related Articles</h4>
                                <div className="related-articles">
                                    {relatedArticles.map((related) => (
                                        <div key={related._id} className="related-article-item mb-3">
                                            <Link to={`/news/${related._id}`} className="related-article-link">
                                                <div className="related-article-placeholder">
                                                    <span className="placeholder-text">News</span>
                                                </div>
                                                <div className="related-article-content">
                                                    <h5 className="related-article-title">{related.title}</h5>
                                                    <div className="related-article-meta">
                                                        <small className="text-muted">
                                                            <FaUser className="me-1" />
                                                            {related.author?.name || 'Unknown'}
                                                        </small>
                                                        <small className="text-muted ms-2">
                                                            <FaCalendarAlt className="me-1" />
                                                            {formatDate(related.created_at)}
                                                        </small>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default NewsDetail;