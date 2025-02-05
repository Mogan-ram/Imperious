import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaRegComment, FaRetweet, FaRegHeart, FaShare } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Feed = () => {
    const [feeds, setFeeds] = useState([]);
    const [newFeed, setNewFeed] = useState("");
    const [error, setError] = useState("");
    const { user } = useAuth();

    useEffect(() => {
        fetchFeeds();
    }, []);

    const fetchFeeds = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get("http://localhost:5000/feeds", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setFeeds(response.data);
        } catch (error) {
            setError("Error fetching feeds. Please try again later.");
            console.error("Error fetching feeds", error);
        }
    };

    const handlePostFeed = async () => {
        if (!newFeed.trim()) return;
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                "http://localhost:5000/feeds",
                { content: newFeed },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setFeeds([response.data, ...feeds]);
            setNewFeed("");
        } catch (error) {
            setError("Error posting feed. Please try again later.");
            console.error("Error posting feed", error);
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
                                <a href="#" className="text-decoration-none text-dark fw-bold">
                                    <i className="bi bi-house-door me-2"></i> Home
                                </a>
                                <a href="#" className="text-decoration-none text-dark">
                                    <i className="bi bi-person me-2"></i> Profile
                                </a>
                                <a href="#" className="text-decoration-none text-dark">
                                    <i className="bi bi-bell me-2"></i> Notifications
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-12 col-lg-6 border-start border-end">
                    <div className="p-3 border-bottom">
                        <div className="d-flex gap-3">
                            <div className="rounded-circle bg-secondary" style={{ width: '40px', height: '40px' }}></div>
                            <div className="flex-grow-1">
                                <textarea
                                    className="form-control border-0"
                                    placeholder="What's happening?"
                                    value={newFeed}
                                    onChange={(e) => setNewFeed(e.target.value)}
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
                                        onClick={handlePostFeed}
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger m-3" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Feed Items */}
                    <div className="feeds">
                        {feeds.map((feed) => (
                            <div key={feed._id} className="p-3 border-bottom">
                                <div className="d-flex gap-3">
                                    <div className="rounded-circle bg-secondary" style={{ width: '40px', height: '40px' }}></div>
                                    <div>
                                        <div className="fw-bold">{feed.author.name}</div>
                                        <div className="text-muted">@{feed.author.email}</div>
                                        <p className="mt-2">{feed.content}</p>
                                        <div className="d-flex gap-4 text-muted">
                                            <button className="btn btn-sm">
                                                <FaRegComment className="me-2" />
                                                0
                                            </button>
                                            <button className="btn btn-sm">
                                                <FaRetweet className="me-2" />
                                                0
                                            </button>
                                            <button className="btn btn-sm">
                                                <FaRegHeart className="me-2" />
                                                0
                                            </button>
                                            <button className="btn btn-sm">
                                                <FaShare />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
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

export default Feed;
