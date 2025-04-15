// src/components/news-events/NewsList/NewsList.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { FaCalendarAlt, FaUser, FaPlus, FaEdit, FaTrash, FaBookOpen } from 'react-icons/fa';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import Pagination from 'react-bootstrap/Pagination';
import { toast } from 'react-toastify';
import './NewsListStyles.css';
import Footer from '../../layout/Footer/Footer';

const NewsList = () => {
    const [allNews, setAllNews] = useState([]);
    const [trendingNews, setTrendingNews] = useState([]);
    const [recommendedNews, setRecommendedNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchNews();
    }, [page, user]);

    const fetchNews = async () => {
        try {
            setLoading(true);
            const response = await newsEventsService.getAll(page, 'news');

            if (response.data && response.data.items) {
                // All news for main content
                setAllNews(response.data.items);
                setTotalPages(response.data.pages);

                // Sort by created_at for trending (newest first)
                const sorted = [...response.data.items].sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                );

                // Take first 5 for trending
                setTrendingNews(sorted.slice(0, 5));

                // Filter recommended news based on user's department if logged in
                if (user && user.dept) {
                    const deptNews = response.data.items.filter(
                        item => item.author && item.author.dept === user.dept
                    );
                    setRecommendedNews(deptNews.slice(0, 5));
                } else {
                    // If no user or no department, just use random 5 news items
                    const shuffled = [...response.data.items].sort(() => 0.5 - Math.random());
                    setRecommendedNews(shuffled.slice(0, 5));
                }
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            toast.error('Failed to load news');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo(0, 0);
    };

    // Check if user can edit or delete a news item
    const canEdit = (newsItem) => {
        if (!user) return false;

        // Only the author can edit
        return user._id === newsItem.author_id;
    };

    const canDelete = (newsItem) => {
        if (!user) return false;

        const userRole = user.role.toLowerCase();
        const authorId = newsItem.author_id;

        // Staff can delete their own news and alumni news
        if (userRole === 'staff') {
            if (user._id === authorId) return true;

            // If the news was created by an alumni, staff can delete it
            const authorRole = newsItem.author?.role?.toLowerCase();
            return authorRole === 'alumni';
        }

        // Alumni can only delete their own news
        if (userRole === 'alumni') {
            return user._id === authorId;
        }

        return false;
    };

    const handleEdit = (newsId) => {
        navigate(`/news-events/${newsId}/edit`);
    };

    const handleDelete = async (newsId) => {
        if (window.confirm('Are you sure you want to delete this news item?')) {
            try {
                setLoading(true);
                await newsEventsService.delete(newsId);

                // Update all news lists after deletion
                const updatedAllNews = allNews.filter(item => item._id !== newsId);
                setAllNews(updatedAllNews);

                const updatedTrendingNews = trendingNews.filter(item => item._id !== newsId);
                setTrendingNews(updatedTrendingNews);

                const updatedRecommendedNews = recommendedNews.filter(item => item._id !== newsId);
                setRecommendedNews(updatedRecommendedNews);

                toast.success('News deleted successfully');
            } catch (error) {
                console.error('Error deleting news:', error);
                toast.error('Failed to delete news');
            } finally {
                setLoading(false);
            }
        }
    };

    // Navigate to the detailed article view
    const handleReadFullArticle = (newsId) => {
        navigate(`/news/${newsId}`);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!allNews || allNews.length === 0) {
        return (
            <Container className="py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>News</h2>
                    {user && ['staff', 'alumni'].includes(user.role?.toLowerCase()) && (
                        <Link to="/news-events/create?type=news" className="btn btn-primary">
                            <FaPlus className="me-2" /> Create News
                        </Link>
                    )}
                </div>
                <div className="alert alert-info text-center p-5">
                    <h4>No news articles found</h4>
                    <p>Be the first to create a news article!</p>
                </div>
            </Container>
        );
    }

    // Function to get appropriate badge color based on department
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

    return (
        <><div className="news-page">
            <Container fluid className="py-4">
                {/* News Header with Create Button */}
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <h2 className="news-main-heading">Latest News</h2>
                            {user && ['staff', 'alumni'].includes(user.role?.toLowerCase()) && (
                                <Link to="/news-events/create?type=news" className="btn btn-primary">
                                    <FaPlus className="me-2" /> Create News
                                </Link>
                            )}
                        </div>
                    </Col>
                </Row>

                <Row>
                    {/* Left Column - Trending News */}
                    <Col lg={3} md={4} className="mb-4">
                        <div className="trending-news-section">
                            <h4 className="section-title">
                                <span>Trending News</span>
                            </h4>
                            <div className="trending-news-list">
                                {trendingNews.map((item, index) => (
                                    <div key={item._id || index} className="trending-news-item">
                                        <div className="trending-thumbnail placeholder-thumbnail">
                                            <span>{index + 1}</span>
                                        </div>
                                        <div className="trending-content">
                                            <h6 className="trending-title">{item.title}</h6>
                                            <div className="trending-meta">
                                                <small>
                                                    <FaCalendarAlt className="me-1" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </small>
                                            </div>
                                            <Button
                                                variant="link"
                                                className="p-0 read-more-link"
                                                onClick={() => handleReadFullArticle(item._id)}
                                            >
                                                Read article →
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>

                    {/* Center Column - Main News Content */}
                    <Col lg={6} md={8} className="mb-4">
                        <div className="main-news-section">
                            {/* Feature the first news item */}
                            {allNews.length > 0 && (
                                <div className="featured-news mb-4">
                                    <Card className="featured-news-card">
                                        <div className="featured-placeholder">
                                            <span>Featured News</span>
                                        </div>
                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    {allNews[0].author && allNews[0].author.dept && (
                                                        <Badge bg={getDeptBadgeColor(allNews[0].author.dept)} className="me-2">
                                                            {allNews[0].author.dept}
                                                        </Badge>
                                                    )}
                                                    {allNews[0].author && allNews[0].author.role && (
                                                        <Badge bg={getRoleBadgeColor(allNews[0].author.role)}>
                                                            {allNews[0].author.role}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="news-actions">
                                                    {canEdit(allNews[0]) && (
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => handleEdit(allNews[0]._id)}
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                    )}
                                                    {canDelete(allNews[0]) && (
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(allNews[0]._id)}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <Card.Title className="featured-title">{allNews[0].title}</Card.Title>
                                            <Card.Text className="featured-excerpt">
                                                {allNews[0].description.substring(0, 150)}
                                                {allNews[0].description.length > 150 ? '...' : ''}
                                            </Card.Text>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="featured-meta">
                                                    <span>
                                                        <FaUser className="me-1" />
                                                        {allNews[0].author ? allNews[0].author.name : 'Unknown'}
                                                    </span>
                                                    <span>
                                                        <FaCalendarAlt className="me-1" />
                                                        {new Date(allNews[0].created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    className="read-full-btn"
                                                    onClick={() => handleReadFullArticle(allNews[0]._id)}
                                                >
                                                    <FaBookOpen className="me-2" /> Read Full Article
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}

                            {/* Other news items in a grid */}
                            <Row className="news-grid">
                                {allNews.slice(1).map((item) => (
                                    <Col md={6} key={item._id} className="mb-4">
                                        <Card className="news-card h-100">
                                            <div className="news-card-placeholder">
                                                <span>News</span>
                                            </div>
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        {item.author && item.author.dept && (
                                                            <Badge bg={getDeptBadgeColor(item.author.dept)} className="me-1">
                                                                {item.author.dept}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="news-actions">
                                                        {canEdit(item) && (
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                className="me-1 btn-sm"
                                                                onClick={() => handleEdit(item._id)}
                                                            >
                                                                <FaEdit />
                                                            </Button>
                                                        )}
                                                        {canDelete(item) && (
                                                            <Button
                                                                variant="outline-danger"
                                                                size="sm"
                                                                className="btn-sm"
                                                                onClick={() => handleDelete(item._id)}
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <Card.Title className="news-title">{item.title}</Card.Title>
                                                <Card.Text className="news-excerpt">
                                                    {item.description.substring(0, 100)}
                                                    {item.description.length > 100 ? '...' : ''}
                                                </Card.Text>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div className="news-meta d-flex align-items-center">
                                                        <small>
                                                            <FaCalendarAlt className="me-1" />
                                                            {new Date(item.created_at).toLocaleDateString()}
                                                        </small>
                                                        <small className="ms-2">
                                                            <FaUser className="me-1" />
                                                            {item.author ? item.author.name : 'Unknown'}
                                                        </small>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="w-100 mt-3"
                                                    onClick={() => handleReadFullArticle(item._id)}
                                                >
                                                    <FaBookOpen className="me-1" /> Read Full Article
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <Pagination>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <Pagination.Item
                                                key={i + 1}
                                                active={i + 1 === page}
                                                onClick={() => handlePageChange(i + 1)}
                                            >
                                                {i + 1}
                                            </Pagination.Item>
                                        ))}
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    </Col>

                    {/* Right Column - Recommended News */}
                    <Col lg={3} className="d-none d-lg-block mb-4">
                        <div className="recommended-news-section">
                            <h4 className="section-title">
                                <span>Recommended For You</span>
                            </h4>
                            <div className="recommended-news-list">
                                {recommendedNews.map((item, index) => (
                                    <div key={item._id || index} className="recommended-news-item">
                                        <div className="recommended-thumbnail placeholder-thumbnail">
                                            <span>{index + 1}</span>
                                        </div>
                                        <div className="recommended-content">
                                            <h6 className="recommended-title">{item.title}</h6>
                                            <div className="recommended-meta">
                                                <small>
                                                    <FaUser className="me-1" />
                                                    {item.author ? item.author.name : 'Unknown'}
                                                </small>
                                            </div>
                                            <Button
                                                variant="link"
                                                className="p-0 read-more-link"
                                                onClick={() => handleReadFullArticle(item._id)}
                                            >
                                                Read article →
                                            </Button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div><Footer /></>
    );
};

export default NewsList;