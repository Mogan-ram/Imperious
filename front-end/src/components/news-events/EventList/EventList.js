// src/components/news-events/EventList/EventList.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Button, Badge } from 'react-bootstrap';
import {
    FaMapMarkerAlt,
    FaClock,
    FaPlus,
    FaUser,
    FaEdit,
    FaTrash,
    FaExternalLinkAlt
} from 'react-icons/fa';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';
import './EventListStyles.css';
import Footer from '../../layout/Footer/Footer';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);
    const { user } = useAuth();
    const navigate = useNavigate();

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
        fetchEvents();
    }, []);

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

    // Check if user can edit or delete an event
    const canEdit = (event) => {
        if (!user) return false;

        // Only the author can edit
        return user._id === event.author_id;
    };

    const canDelete = (event) => {
        if (!user) return false;

        const userRole = user.role.toLowerCase();
        const authorId = event.author_id;

        // Staff can delete their own events and alumni events
        if (userRole === 'staff') {
            if (user._id === authorId) return true;

            // If the event was created by an alumni, staff can delete it
            const authorRole = event.author?.role?.toLowerCase();
            return authorRole === 'alumni';
        }

        // Alumni can only delete their own events
        if (userRole === 'alumni') {
            return user._id === authorId;
        }

        return false;
    };

    const handleEdit = (eventId) => {
        navigate(`/news-events/${eventId}/edit`);
    };

    const handleDelete = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                setLoading(true);
                await newsEventsService.delete(eventId);

                // Remove the deleted event from state
                setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));

                toast.success('Event deleted successfully');
            } catch (error) {
                console.error('Error deleting event:', error);
                toast.error('Failed to delete event');
            } finally {
                setLoading(false);
            }
        }
    };

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
        <><div className="events-page">
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
                                // Format the time
                                let formattedTime = 'Time not specified';

                                // Try to get time from event_time field first
                                if (event.event_time) {
                                    formattedTime = event.event_time;
                                }

                                // If not available, try to extract from event_date
                                else if (event.event_date) {
                                    const eventDateTime = new Date(event.event_date);
                                    const hours = eventDateTime.getHours();
                                    const minutes = eventDateTime.getMinutes();
                                    if (hours !== 0 || minutes !== 0) { // Only use if time is not 00:00
                                        formattedTime = `${hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours)}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
                                    }
                                }

                                // Get author role for badge
                                const authorRole = event.author?.role?.toLowerCase() || '';
                                const badgeVariant = authorRole === 'staff' ? 'primary' :
                                    authorRole === 'alumni' ? 'success' : 'secondary';

                                return (
                                    <div className="event-item" key={event._id || index}>
                                        <div className="event-time">
                                            <span className="time">{formattedTime}</span>
                                        </div>

                                        <div className="event-content">
                                            <div className="event-card">
                                                <div className="event-details">
                                                    <div className="d-flex justify-content-between align-items-start">
                                                        <h4 className="event-title">{event.title}</h4>
                                                        <div className="event-actions">
                                                            {canEdit(event) && (
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="me-2"
                                                                    onClick={() => handleEdit(event._id)}
                                                                >
                                                                    <FaEdit />
                                                                </Button>
                                                            )}
                                                            {canDelete(event) && (
                                                                <Button
                                                                    variant="outline-danger"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(event._id)}
                                                                >
                                                                    <FaTrash />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="event-meta">
                                                        <div className="meta-item">
                                                            <FaUser className="meta-icon" />
                                                            <span>
                                                                {event.author ? event.author.name : 'Unknown'}
                                                                {event.author?.role && (
                                                                    <Badge pill bg={badgeVariant} className="ms-2">
                                                                        {event.author.role}
                                                                    </Badge>
                                                                )}
                                                            </span>
                                                        </div>

                                                        <div className="meta-item">
                                                            <FaMapMarkerAlt className="meta-icon" />
                                                            <span>{event.location || 'Location not specified'}</span>
                                                        </div>

                                                        <div className="meta-item">
                                                            <FaClock className="meta-icon" />
                                                            <span>{formattedTime}</span>
                                                        </div>

                                                        {event.register_link && (
                                                            <div className="meta-item">
                                                                <FaExternalLinkAlt className="meta-icon" />
                                                                <a
                                                                    href={event.register_link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="registration-link"
                                                                >
                                                                    Register
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <p className="event-description">
                                                        {event.description}
                                                    </p>

                                                    {event.register_link && (
                                                        <div className="text-end mt-2">
                                                            <a
                                                                href={event.register_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-primary"
                                                            >
                                                                <FaExternalLinkAlt className="me-1" /> Register Now
                                                            </a>
                                                        </div>
                                                    )}
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
        </div><Footer /></>
    );
};

export default EventList;