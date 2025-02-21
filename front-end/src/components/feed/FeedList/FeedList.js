import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from 'react-router-dom';
import FeedCreate from '../FeedCreate/FeedCreate';
import { Card, Button } from 'react-bootstrap';
import axios from '../../../services/axios';
import { toast } from 'react-toastify';

const FeedList = () => {
    const [feeds, setFeeds] = useState([]);
    const [error, setError] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        fetchFeeds();
    }, []);

    const fetchFeeds = async () => {
        try {
            const response = await axios.get('/feeds');
            setFeeds(response.data);
        } catch (error) {
            setError("Error fetching feeds. Please try again later.");
            console.error("Error fetching feeds", error);
        }
    };

    const handleNewFeed = (newFeed) => {
        setFeeds([newFeed, ...feeds]);  // Add new feed to the *beginning* of the list
    };


    const handleDelete = async (feedId) => {
        if (window.confirm('Are you sure you want to delete this feed?')) {
            try {
                await axios.delete(`/feeds/${feedId}`);
                // Update the state to remove the deleted feed
                setFeeds(prevFeeds => prevFeeds.filter(feed => feed._id !== feedId));
                toast.success("Feed successfully deleted!");
            } catch (error) {
                console.error('Error deleting feed:', error);
                toast.error('Failed to delete feed. Please try again.'); // Use toast for consistent error messages
            }
        }
    };



    return (
        <div className="container-fluid">
            <div className="row">
                {/* Left Sidebar */}
                <div className="col-lg-3 d-none d-lg-block">
                    <div className="position-fixed">
                        <div className="p-3">
                            <div className="d-flex flex-column gap-3">
                                <Link to="/feeds" className="text-decoration-none text-dark fw-bold">
                                    <i className="bi bi-house-door me-2"></i> Home
                                </Link>
                                <Link to="/profile" className="text-decoration-none text-dark">
                                    <i className="bi bi-person me-2"></i> Profile
                                </Link>
                                <Link to="/notifications" className="text-decoration-none text-dark">
                                    <i className="bi bi-bell me-2"></i> Notifications
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-12 col-lg-6 border-start border-end">
                    <FeedCreate onFeedCreated={handleNewFeed} />

                    {error && (
                        <div className="alert alert-danger m-3" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Feed Items */}
                    <div className="feeds">
                        {feeds.map((feed) => (
                            <Card key={feed._id} className="mb-3">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            {/* Use optional chaining here */}
                                            <Card.Title>{feed.author?.name || 'Unknown User'}</Card.Title>
                                            <Card.Text>{feed.content}</Card.Text>
                                            <small className="text-muted">
                                                {new Date(feed.timestamp).toLocaleString()}
                                            </small>
                                        </div>

                                        {/* Check if the current user is the author or staff */}
                                        {(user && (user.email === feed.author?.email || user.role === 'staff')) && (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(feed._id)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="col-lg-3 d-none d-lg-block">
                    <div className="position-fixed">
                        <div className="p-3">
                            <div className="bg-light rounded p-3 mb-3">
                                <h6 className="fw-bold mb-3">Who to follow</h6>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="rounded-circle bg-secondary me-2" style={{ width: '40px', height: '40px' }}></div>
                                    <div className="flex-grow-1">
                                        <p className="mb-0 fw-bold">{user?.name || 'User'}</p>
                                        <small className="text-muted">@{user?.email || 'user'}</small>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-light rounded p-3">
                                <h6 className="fw-bold mb-3">Trending</h6>
                                <div className="mb-3">
                                    <small className="text-muted">Trending in your area</small>
                                    <p className="fw-bold mb-0">#TrendingTopic</p>
                                    <small className="text-muted">10.5K Tweets</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedList;