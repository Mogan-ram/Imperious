// src/components/news-events/NewsList/NewsList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button } from 'react-bootstrap';
import { FaCalendarAlt, FaUser, FaPlus } from 'react-icons/fa';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import Pagination from 'react-bootstrap/Pagination';
// import './NewsListStyles.css';
import { toast } from 'react-toastify';
import './NewsListStyles.css';

const NewsList = () => {
    const [allNews, setAllNews] = useState([]);
    const [trendingNews, setTrendingNews] = useState([]);
    const [recommendedNews, setRecommendedNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user } = useAuth();

    useEffect(() => {
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

        fetchNews();
    }, [page, user]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo(0, 0);
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

    return (
        <div className="news-page">
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
                                        {item.image_url ? (
                                            <div className="trending-thumbnail">
                                                <img
                                                    src={`http://localhost:5000${item.image_url}`}
                                                    alt={item.title}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/100x70?text=News';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="trending-thumbnail placeholder-thumbnail">
                                                <span>{index + 1}</span>
                                            </div>
                                        )}
                                        <div className="trending-content">
                                            <h6 className="trending-title">{item.title}</h6>
                                            <div className="trending-meta">
                                                <small>
                                                    <FaCalendarAlt className="me-1" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </small>
                                            </div>
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
                                        {allNews[0].image_url ? (
                                            <div className="featured-img-container">
                                                <Card.Img
                                                    variant="top"
                                                    src={`http://localhost:5000${allNews[0].image_url}`}
                                                    className="featured-img"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/800x400?text=Featured+News';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="featured-placeholder">
                                                <span>Featured News</span>
                                            </div>
                                        )}
                                        <Card.Body>
                                            {allNews[0].author && allNews[0].author.dept && (
                                                <Badge bg={getDeptBadgeColor(allNews[0].author.dept)} className="mb-2">
                                                    {allNews[0].author.dept}
                                                </Badge>
                                            )}
                                            <Card.Title className="featured-title">{allNews[0].title}</Card.Title>
                                            <Card.Text className="featured-excerpt">
                                                {allNews[0].description.substring(0, 150)}
                                                {allNews[0].description.length > 150 ? '...' : ''}
                                            </Card.Text>
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
                                        </Card.Body>
                                    </Card>
                                </div>
                            )}

                            {/* Other news items in a grid */}
                            <Row className="news-grid">
                                {allNews.slice(1).map((item) => (
                                    <Col md={6} key={item._id} className="mb-4">
                                        <Card className="news-card h-100">
                                            {item.image_url ? (
                                                <Card.Img
                                                    variant="top"
                                                    src={`http://localhost:5000${item.image_url}`}
                                                    className="news-card-img"
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/400x200?text=News';
                                                    }}
                                                />
                                            ) : (
                                                <div className="news-card-placeholder">
                                                    <span>News</span>
                                                </div>
                                            )}
                                            <Card.Body>
                                                {item.author && item.author.dept && (
                                                    <Badge bg={getDeptBadgeColor(item.author.dept)} className="mb-2">
                                                        {item.author.dept}
                                                    </Badge>
                                                )}
                                                <Card.Title className="news-title">{item.title}</Card.Title>
                                                <Card.Text className="news-excerpt">
                                                    {item.description.substring(0, 100)}
                                                    {item.description.length > 100 ? '...' : ''}
                                                </Card.Text>
                                                <div className="news-meta">
                                                    <small>
                                                        <FaCalendarAlt className="me-1" />
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </small>
                                                </div>
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
                                        {item.image_url ? (
                                            <div className="recommended-thumbnail">
                                                <img
                                                    src={`http://localhost:5000${item.image_url}`}
                                                    alt={item.title}
                                                    onError={(e) => {
                                                        e.target.src = 'https://via.placeholder.com/100x70?text=News';
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="recommended-thumbnail placeholder-thumbnail">
                                                <span>{index + 1}</span>
                                            </div>
                                        )}
                                        <div className="recommended-content">
                                            <h6 className="recommended-title">{item.title}</h6>
                                            <div className="recommended-meta">
                                                <small>
                                                    <FaUser className="me-1" />
                                                    {item.author ? item.author.name : 'Unknown'}
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default NewsList;