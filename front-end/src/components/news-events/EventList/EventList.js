// src/components/news-events/EventList/EventList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Nav, Button } from 'react-bootstrap';
import { FaMapMarkerAlt, FaClock, FaPlus, FaUser } from 'react-icons/fa';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';
import './EventListStyles.css';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const { user } = useAuth();

    // Group events by date
    const getGroupedEvents = () => {
        // Sort events by date
        const sortedEvents = [...events].sort((a, b) => {
            return new Date(a.event_date) - new Date(b.event_date);
        });

        // Group by date
        const grouped = {};
        sortedEvents.forEach(event => {
            const dateObj = new Date(event.event_date);
            const dateStr = dateObj.toISOString().split('T')[0]; // Get only the date part

            if (!grouped[dateStr]) {
                grouped[dateStr] = [];
            }

            grouped[dateStr].push(event);
        });

        // Convert to array format for easier rendering
        return Object.keys(grouped).map(date => ({
            date,
            displayDate: new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }),
            events: grouped[date]
        }));
    };

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await newsEventsService.getAll(1, 'event');

                if (response.data && response.data.items) {
                    setEvents(response.data.items);
                }
            } catch (err) {
                console.error('Error fetching events:', err);
                setError('Failed to load events');
                toast.error('Failed to load events');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <Container className="py-5">
                <div className="alert alert-danger">{error}</div>
            </Container>
        );
    }

    if (!events || events.length === 0) {
        return (
            <Container className="py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Upcoming Events</h2>
                    {user && ['staff', 'alumni'].includes(user.role?.toLowerCase()) && (
                        <Link to="/news-events/create?type=event" className="btn btn-primary">
                            <FaPlus className="me-2" /> Create Event
                        </Link>
                    )}
                </div>
                <div className="alert alert-info text-center p-5">
                    <h4>No events scheduled</h4>
                    <p>Be the first to create an event!</p>
                </div>
            </Container>
        );
    }

    const groupedEvents = getGroupedEvents();

    return (
        <div className="events-page">
            <div className="event-header">
                <Container>
                    <Row className="align-items-center">
                        <Col>
                            <h1 className="event-title">Upcoming Events</h1>
                            <p className="event-subtitle">Check out our schedule of exciting events</p>
                        </Col>
                        <Col xs="auto">
                            {user && ['staff', 'alumni'].includes(user.role?.toLowerCase()) && (
                                <Link to="/news-events/create?type=event" className="btn btn-primary btn-lg">
                                    <FaPlus className="me-2" /> Create Event
                                </Link>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>

            <Container className="event-container py-5">
                {/* Date Navigation Tabs */}
                <Nav variant="tabs" className="event-date-tabs mb-4">
                    {groupedEvents.map((group, index) => (
                        <Nav.Item key={group.date}>
                            <Nav.Link
                                className={activeTab === index ? 'active' : ''}
                                onClick={() => setActiveTab(index)}
                            >
                                {new Date(group.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </Nav.Link>
                        </Nav.Item>
                    ))}
                </Nav>

                {groupedEvents.length > 0 && (
                    <div className="event-schedule">
                        <h3 className="event-day-title">{groupedEvents[activeTab].displayDate}</h3>

                        <div className="event-timeline">
                            {groupedEvents[activeTab].events.map((event, index) => {
                                // Extract hour and minutes for display
                                const eventTime = new Date(event.event_date);
                                const hours = eventTime.getHours();
                                const minutes = eventTime.getMinutes();
                                const formattedTime = `${hours > 12 ? hours - 12 : hours}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

                                return (
                                    <div className="event-item" key={event._id || index}>
                                        <div className="event-time">
                                            <span className="time">{formattedTime}</span>
                                        </div>

                                        <div className="event-content">
                                            <div className="event-card">
                                                {event.image_url && (
                                                    <div className="event-image">
                                                        <img
                                                            src={`http://localhost:5000${event.image_url}`}
                                                            alt={event.title}
                                                            onError={(e) => {
                                                                e.target.src = 'https://via.placeholder.com/100x100?text=Event';
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                <div className="event-details">
                                                    <h4 className="event-title">{event.title}</h4>

                                                    <div className="event-meta">
                                                        <div className="meta-item">
                                                            <FaUser className="meta-icon" />
                                                            <span>{event.author ? event.author.name : 'Unknown'}</span>
                                                        </div>

                                                        <div className="meta-item">
                                                            <FaMapMarkerAlt className="meta-icon" />
                                                            <span>{event.location || 'Location not specified'}</span>
                                                        </div>

                                                        <div className="meta-item">
                                                            <FaClock className="meta-icon" />
                                                            <span>{formattedTime}</span>
                                                        </div>
                                                    </div>

                                                    <p className="event-description">
                                                        {event.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Container>
        </div>
    );
};

export default EventList;