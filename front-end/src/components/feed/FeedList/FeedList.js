import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from 'react-router-dom';
import FeedCreate from '../FeedCreate/FeedCreate';
import FeedItem from '../FeedItem/FeedItem';
import { Card, Button, Badge, Spinner, Nav, Form, InputGroup, Alert } from 'react-bootstrap';
import axios from '../../../services/axios';
import { toast } from 'react-toastify';
import {
    FaHome, FaUser, FaEnvelope, FaBriefcase,
    FaCalendarAlt, FaGraduationCap, FaSearch,
    FaRss, FaChartBar, FaCode, FaLightbulb
} from 'react-icons/fa';
import './FeedList.css';
import Footer from '../../layout/Footer/Footer';

// Fetch trending topics from API
const fetchTrendingTopics = async (userDept) => {
    try {
        // In a real implementation, we would call an API to get trending topics by department
        return [
            { id: 1, name: `${userDept} Internships`, count: "250+ posts" },
            { id: 2, name: `${userDept} Events`, count: "120+ posts" },
            { id: 3, name: `${userDept} Workshop`, count: "85+ posts" },
            { id: 4, name: `${userDept} Career Guidance`, count: "65+ posts" },
        ];
    } catch (error) {
        console.error("Error fetching trending topics", error);
        return [];
    }
};

const fetchSuggestedConnections = async (userDept) => {
    try {
        // In a real implementation, this would call an API to get users from the same department
        // For now, mocking with placeholder data that shows department-specific suggestions
        return [
            {
                id: 1,
                name: "Tech Innovation Club",
                role: `${userDept} Group`,
                avatar: "/avatars/group1.jpg"
            },
            {
                id: 2,
                name: "Alumni Association",
                role: `${userDept} Alumni`,
                avatar: "/avatars/group2.jpg"
            },
            {
                id: 3,
                name: "Department Connect",
                role: `${userDept} Network`,
                avatar: "/avatars/group3.jpg"
            },
        ];
    } catch (error) {
        console.error("Error fetching suggested connections", error);
        return [];
    }
};

// Fetch upcoming events from API
const fetchUpcomingEvents = async (userDept) => {
    try {
        // Mock API call to get upcoming events filtered by department
        return [
            {
                id: 1,
                title: `${userDept} Recruitment Drive`,
                date: "May 15, 2025",
                attendees: 42,
                icon: "FaBriefcase"
            },
            {
                id: 2,
                title: `${userDept} Workshop: Latest Trends`,
                date: "May 22, 2025",
                attendees: 28,
                icon: "FaCode"
            }
        ];
    } catch (error) {
        console.error("Error fetching upcoming events", error);
        return [];
    }
};

const FeedList = () => {
    const [feeds, setFeeds] = useState([]);
    const [trendingTopics, setTrendingTopics] = useState([]);
    const [suggestedConnections, setSuggestedConnections] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const { user } = useAuth();

    // Avatar fallback function
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

    // Fetch feeds
    const fetchFeeds = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/feeds');
            setFeeds(response.data);
            setError("");
        } catch (error) {
            setError("Error fetching feeds. Please try again later.");
            console.error("Error fetching feeds", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load sidebar data
    const loadSidebarData = useCallback(async () => {
        try {
            // Get user's department for filtered content
            const userDept = user?.dept || 'General';

            const [topics, connections, events] = await Promise.all([
                fetchTrendingTopics(userDept),
                fetchSuggestedConnections(userDept),
                fetchUpcomingEvents(userDept)
            ]);

            setTrendingTopics(topics);
            setSuggestedConnections(connections);
            setUpcomingEvents(events);
        } catch (error) {
            console.error("Error loading sidebar data", error);
        }
    }, [user?.dept]);

    useEffect(() => {
        fetchFeeds();
        loadSidebarData();
    }, [fetchFeeds, loadSidebarData, activeTab]);

    const handleNewFeed = (newFeed) => {
        // Ensure the new feed has correct author information
        const enrichedFeed = {
            ...newFeed,
            author: {
                name: user?.name || 'Unknown',
                email: user?.email || 'unknown@example.com',
                photo_url: user?.photo_url || null
            },
            timestamp: new Date().toISOString()
        };

        setFeeds([enrichedFeed, ...feeds]);
        toast.success("Post published successfully!");
    };

    const handleEdit = async (feedId, newContent) => {
        try {
            // In a real app, this would call an API
            // For now, update the feeds state directly
            const updatedFeeds = feeds.map(feed => {
                if (feed._id === feedId) {
                    return {
                        ...feed,
                        content: newContent,
                        edited: true,
                        edited_at: new Date().toISOString()
                    };
                }
                return feed;
            });

            setFeeds(updatedFeeds);
            toast.success("Post updated successfully!");
        } catch (error) {
            console.error('Error updating feed:', error);
            toast.error('Failed to update post. Please try again.');
        }
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
        // Mock implementation
        const updatedFeeds = feeds.map(feed => {
            if (feed._id === feedId) {
                const isLiked = feed.isLiked || false;
                const likesCount = feed.likesCount || 0;

                return {
                    ...feed,
                    isLiked: !isLiked,
                    likesCount: isLiked ? likesCount - 1 : likesCount + 1
                };
            }
            return feed;
        });

        setFeeds(updatedFeeds);
        toast.info("Like status updated");
    };

    // Filter feeds based on active tab and search term
    const getFilteredFeeds = () => {
        let filtered = feeds;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(feed =>
                feed.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                feed.author?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply tab filters
        if (activeTab === "all") return filtered;

        // For demonstration purposes. In a real app, these would be implemented with backend filters.
        if (activeTab === "trending") return filtered.slice(0, 3); // Just show first 3 as "trending"
        if (activeTab === "following") return filtered.filter((_, index) => index % 2 === 0); // Every other feed

        return filtered;
    };

    // Get icon component for event
    const getEventIcon = (iconName) => {
        switch (iconName) {
            case 'FaBriefcase':
                return <FaBriefcase />;
            case 'FaCode':
                return <FaCode />;
            default:
                return <FaCalendarAlt />;
        }
    };

    const filteredFeeds = getFilteredFeeds();

    return (
        <><div className="feed-container">
            <div className="feed-wrapper">
                {/* Left Sidebar */}
                <div className="left-sidebar">
                    <div className="sidebar-content">
                        <div className="user-welcome mb-4">
                            <div className="user-avatar" style={{
                                backgroundImage: getAvatarSrc(user) ? `url(${getAvatarSrc(user)})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}>
                                {!getAvatarSrc(user) && getInitials(user?.name)}
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
                                    <Link to="/news" className="nav-link">
                                        <FaRss className="nav-icon" />
                                        <span>News</span>
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
                                            <FaChartBar className="nav-icon" />
                                            <span>Analytics</span>
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        </nav>

                        <div className="sidebar-cta">
                            <Card className="cta-card">
                                <Card.Body>
                                    <h5><FaLightbulb className="me-2" /> Expand Your Network</h5>
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
                        <div className="header-title-wrapper">
                            <h4 className="header-title">Community Feed</h4>
                            <p className="text-muted mb-0">Connect, share, and grow with the community</p>
                        </div>
                        <div className="header-search">
                            <InputGroup>
                                <InputGroup.Text className="bg-light border-end-0">
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search posts..."
                                    className="bg-light border-start-0"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)} />
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
                        <Alert variant="danger" className="my-3">
                            {error}
                        </Alert>
                    )}

                    {searchTerm && filteredFeeds.length === 0 && !loading && (
                        <Alert variant="info" className="my-3">
                            No posts match your search for "{searchTerm}"
                        </Alert>
                    )}

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner animation="border" role="status" variant="primary">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <p className="mt-2 text-muted">Loading posts...</p>
                        </div>
                    ) : (
                        <div className="feeds-list">
                            {filteredFeeds.length > 0 ? (
                                filteredFeeds.map((feed) => (
                                    <FeedItem
                                        key={feed._id}
                                        feed={feed}
                                        onDelete={handleDelete}
                                        onLike={handleLike}
                                        onEdit={handleEdit}
                                        currentUser={user} />
                                ))
                            ) : (
                                <div className="text-center my-5">
                                    <div className="empty-feed-icon mb-3">
                                        <FaRss size={40} className="text-muted" />
                                    </div>
                                    <h5 className="text-muted">No posts found</h5>
                                    <p className="text-muted mb-4">Be the first to share something with the community!</p>
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

                {/* Right Sidebar - Now with Real-time Data */}
                <div className="right-sidebar">
                    <div className="sidebar-content">
                        {/* Trending Topics */}
                        <Card className="sidebar-card trending-card">
                            <Card.Header>
                                <h5 className="mb-0">Trending Topics</h5>
                            </Card.Header>
                            <Card.Body>
                                {trendingTopics.length > 0 ? (
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
                                ) : (
                                    <div className="text-center py-3">
                                        <p className="text-muted mb-0">No trending topics yet</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Suggested Connections */}
                        <Card className="sidebar-card connections-card">
                            <Card.Header>
                                <h5 className="mb-0">Suggested Connections</h5>
                            </Card.Header>
                            <Card.Body>
                                {suggestedConnections.length > 0 ? (
                                    <ul className="connections-list">
                                        {suggestedConnections.map(connection => (
                                            <li key={connection.id} className="connection-item">
                                                <div className="connection-avatar" style={{
                                                    backgroundImage: `url(${connection.avatar})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center'
                                                }}>
                                                    {!connection.avatar && connection.name.charAt(0).toUpperCase()}
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
                                ) : (
                                    <div className="text-center py-3">
                                        <p className="text-muted mb-0">No suggestions available</p>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>

                        {/* Upcoming Events */}
                        <Card className="sidebar-card events-card">
                            <Card.Header>
                                <h5 className="mb-0">Upcoming Events</h5>
                            </Card.Header>
                            <Card.Body>
                                {upcomingEvents.length > 0 ? (
                                    <ul className="events-list">
                                        {upcomingEvents.map(event => (
                                            <li key={event.id} className="event-item">
                                                <div className="event-icon">
                                                    {getEventIcon(event.icon)}
                                                </div>
                                                <div className="event-info">
                                                    <h6 className="event-title">{event.title}</h6>
                                                    <span className="event-date">{event.date}</span>
                                                    <span className="event-attendees">{event.attendees} attending</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-3">
                                        <p className="text-muted mb-0">No upcoming events</p>
                                    </div>
                                )}
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
            <>
                <Footer />
            </>
        </>
    );
};

export default FeedList;