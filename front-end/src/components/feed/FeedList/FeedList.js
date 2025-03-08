import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Link, useNavigate } from 'react-router-dom';
import FeedCreate from '../FeedCreate/FeedCreate';
import FeedItem from '../FeedItem/FeedItem';
import { Card, Button, Dropdown, Badge, Spinner, Nav, Form, InputGroup } from 'react-bootstrap';
import axios from '../../../services/axios';
import { toast } from 'react-toastify';
import {
    FaHome, FaUser, FaBell, FaEnvelope, FaBriefcase, FaUsers,
    FaCalendarAlt, FaGraduationCap, FaEllipsisH, FaHeart,
    FaRetweet, FaComment, FaShare, FaSearch, FaBookmark
} from 'react-icons/fa';
import './FeedList.css';

const FeedList = () => {
    const [feeds, setFeeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const { user } = useAuth();
    const navigate = useNavigate();

    // Sample trending topics
    const trendingTopics = [
        { id: 1, name: "Internship Opportunities", count: "250+ posts" },
        { id: 2, name: "Campus Events", count: "120+ posts" },
        { id: 3, name: "Technology Workshop", count: "85+ posts" },
        { id: 4, name: "Career Guidance", count: "65+ posts" },
    ];

    // Sample suggested connections
    const suggestedConnections = [
        { id: 1, name: "Tech Innovation Club", role: "Student Group", avatar: "TI" },
        { id: 2, name: "Alumni Association", role: "Organization", avatar: "AA" },
        { id: 3, name: "Career Development Center", role: "Department", avatar: "CD" },
    ];

    // Sample events
    const upcomingEvents = [
        {
            id: 1,
            title: "Campus Recruitment Drive",
            date: "May 15, 2025",
            attendees: 42
        },
        {
            id: 2,
            title: "Tech Workshop: AI Fundamentals",
            date: "May 22, 2025",
            attendees: 28
        }
    ];

    useEffect(() => {
        fetchFeeds();
    }, [activeTab]);

    const fetchFeeds = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/feeds');
            setFeeds(response.data);
            setLoading(false);
        } catch (error) {
            setError("Error fetching feeds. Please try again later.");
            console.error("Error fetching feeds", error);
            setLoading(false);
        }
    };

    const handleNewFeed = (newFeed) => {
        setFeeds([newFeed, ...feeds]);
        toast.success("Post published successfully!");
    };

    const handleDelete = async (feedId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await axios.delete(`/feeds/${feedId}`);
                setFeeds(prevFeeds => prevFeeds.filter(feed => feed._id !== feedId));
                toast.success("Post successfully deleted!");
            } catch (error) {
                console.error('Error deleting feed:', error);
                toast.error('Failed to delete post. Please try again.');
            }
        }
    };

    // For the like functionality (in a real app, this would call an API)
    const handleLike = (feedId) => {
        toast.info("Like functionality would be implemented here");
    };

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

    // Filter feeds based on active tab
    const getFilteredFeeds = () => {
        if (activeTab === "all") return feeds;

        // For demonstration purposes. In a real app, these would be implemented with backend filters.
        if (activeTab === "trending") return feeds.slice(0, 3); // Just show first 3 as "trending"
        if (activeTab === "following") return feeds.filter((_, index) => index % 2 === 0); // Just show every other feed

        return feeds;
    };

    return (
        <div className="feed-container">
            <div className="feed-wrapper">
                {/* Left Sidebar */}
                <div className="left-sidebar">
                    <div className="sidebar-content">
                        <div className="user-welcome mb-4">
                            <div className="user-avatar">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="user-info">
                                <h5 className="mb-0">{user?.name || 'User'}</h5>
                                <small className="text-muted">@{user?.email?.split('@')[0] || 'user'}</small>
                            </div>
                        </div>

                        <nav className="sidebar-nav">
                            <ul className="nav-list">
                                <li className="nav-item active">
                                    <Link to="/feeds" className="nav-link">
                                        <FaHome className="nav-icon" />
                                        <span>Home</span>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/profile" className="nav-link">
                                        <FaUser className="nav-icon" />
                                        <span>Profile</span>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/messages" className="nav-link">
                                        <FaEnvelope className="nav-icon" />
                                        <span>Messages</span>
                                        <Badge bg="primary" className="ms-auto">3</Badge>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/jobs" className="nav-link">
                                        <FaBriefcase className="nav-icon" />
                                        <span>Jobs</span>
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/events" className="nav-link">
                                        <FaCalendarAlt className="nav-icon" />
                                        <span>Events</span>
                                    </Link>
                                </li>
                                {user && user.role === 'alumni' && (
                                    <li className="nav-item">
                                        <Link to="/alumni/mentorship" className="nav-link">
                                            <FaGraduationCap className="nav-icon" />
                                            <span>Mentorship</span>
                                        </Link>
                                    </li>
                                )}
                                {user && user.role === 'student' && (
                                    <li className="nav-item">
                                        <Link to="/projects/mentorship" className="nav-link">
                                            <FaGraduationCap className="nav-icon" />
                                            <span>Find Mentors</span>
                                        </Link>
                                    </li>
                                )}
                                {user && user.role === 'staff' && (
                                    <li className="nav-item">
                                        <Link to="/analytics" className="nav-link">
                                            <FaUsers className="nav-icon" />
                                            <span>Analytics</span>
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </nav>

                        <div className="sidebar-cta">
                            <Card className="cta-card">
                                <Card.Body>
                                    <h5>Expand Your Network</h5>
                                    <p>Connect with alumni, discover projects, find mentors and more!</p>
                                    <Link to="/projects/collaborations" className="btn btn-primary btn-sm w-100">
                                        Explore Collaborations
                                    </Link>
                                </Card.Body>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="main-content">
                    <div className="content-header">
                        <h4 className="header-title">Community Feed</h4>
                        <div className="header-search">
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search posts..."
                                    className="bg-light border-start-0"
                                />
                            </InputGroup>
                        </div>
                    </div>

                    <div className="content-tabs">
                        <Nav variant="tabs" className="feed-tabs">
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === "all"}
                                    onClick={() => setActiveTab("all")}
                                >
                                    All Posts
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === "trending"}
                                    onClick={() => setActiveTab("trending")}
                                >
                                    Trending
                                </Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link
                                    active={activeTab === "following"}
                                    onClick={() => setActiveTab("following")}
                                >
                                    Following
                                </Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>

                    <div className="create-post-container">
                        <FeedCreate onFeedCreated={handleNewFeed} />
                    </div>

                    {error && (
                        <div className="alert alert-danger m-3" role="alert">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    ) : (
                        <div className="feeds-list">
                            {getFilteredFeeds().length > 0 ? (
                                getFilteredFeeds().map((feed) => (
                                    <FeedItem
                                        key={feed._id}
                                        feed={feed}
                                        onDelete={handleDelete}
                                        onLike={handleLike}
                                    />
                                ))
                            ) : (
                                <div className="text-center my-5">
                                    <p className="text-muted">No posts found.</p>
                                    <Button
                                        variant="primary"
                                        onClick={() => setActiveTab("all")}
                                    >
                                        View All Posts
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="right-sidebar">
                    <div className="sidebar-content">
                        {/* Trending Topics */}
                        <Card className="sidebar-card trending-card">
                            <Card.Header>
                                <h5 className="mb-0">Trending Topics</h5>
                            </Card.Header>
                            <Card.Body>
                                <ul className="trending-list">
                                    {trendingTopics.map(topic => (
                                        <li key={topic.id} className="trending-item">
                                            <Link to={`/search?q=${encodeURIComponent(topic.name)}`} className="trending-link">
                                                <h6 className="topic-name">#{topic.name}</h6>
                                                <span className="topic-count">{topic.count}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>

                        {/* Suggested Connections */}
                        <Card className="sidebar-card connections-card">
                            <Card.Header>
                                <h5 className="mb-0">Suggested Connections</h5>
                            </Card.Header>
                            <Card.Body>
                                <ul className="connections-list">
                                    {suggestedConnections.map(connection => (
                                        <li key={connection.id} className="connection-item">
                                            <div className="connection-avatar">
                                                {connection.avatar}
                                            </div>
                                            <div className="connection-info">
                                                <h6 className="connection-name">{connection.name}</h6>
                                                <span className="connection-role">{connection.role}</span>
                                            </div>
                                            <Button variant="primary" size="sm" className="connection-btn">
                                                Follow
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </Card.Body>
                        </Card>

                        {/* Upcoming Events */}
                        <Card className="sidebar-card events-card">
                            <Card.Header>
                                <h5 className="mb-0">Upcoming Events</h5>
                            </Card.Header>
                            <Card.Body>
                                <ul className="events-list">
                                    {upcomingEvents.map(event => (
                                        <li key={event.id} className="event-item">
                                            <div className="event-icon">
                                                <FaCalendarAlt />
                                            </div>
                                            <div className="event-info">
                                                <h6 className="event-title">{event.title}</h6>
                                                <span className="event-date">{event.date}</span>
                                                <span className="event-attendees">{event.attendees} attending</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="text-center mt-3">
                                    <Link to="/events" className="btn btn-outline-primary btn-sm">
                                        View All Events
                                    </Link>
                                </div>
                            </Card.Body>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedList;