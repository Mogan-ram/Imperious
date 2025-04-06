import React, { useState, useEffect, useCallback } from 'react';
import { Card, Pagination, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaTrash } from 'react-icons/fa';
import Footer from '../../layout/Footer/Footer';

const NewsEventList = ({ type }) => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const response = await newsEventsService.getAll(page, type);
            setItems(response.data.items);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching news/events:', error);
            toast.error("Failed to fetch News/Events");
        } finally {
            setLoading(false);
        }
    }, [page, type]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await newsEventsService.delete(id);
                setItems(prevItems => prevItems.filter(item => item._id !== id)); // Correctly remove the item
                toast.success("News/Event deleted successfully");
            } catch (error) {
                console.error('Error deleting news/event:', error);
                toast.error('Failed to delete the item.');
            }
        }
    };
    const canDelete = (item) => {
        if (!user) return false;
        const userRole = user.role.toLowerCase();

        if (userRole === 'staff') {
            // Only the creating staff member can delete
            return user._id === item.author_id;
        } else if (userRole === 'alumni') {
            //Alumni can only delete there created news
            return user._id === item.author_id;
        }
        return false;
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!items || items.length === 0) {
        return (
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>{type === 'news' ? 'News' : 'Events'}</h2>
                    {user && ['staff', 'alumni'].includes(user.role?.toLowerCase()) && (
                        <Link to={`/news-events/create?type=${type}`} className="btn btn-primary">
                            Create {type === 'news' ? 'News' : 'Event'}
                        </Link>
                    )}
                </div>
                <div className="alert alert-info text-center p-5">
                    <h4>No {type} found</h4>
                    <p>Be the first to create {type === 'news' ? 'a news item' : 'an event'}!</p>
                </div>
            </div>
        );
    }
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'staff':
                return 'primary'; // Blue
            case 'alumni':
                return 'success'; // Green
            case 'student':
                return 'info';    // Light blue
            default:
                return 'secondary'; // Gray
        }
    };


    return (
        <><div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{type === 'news' ? 'News' : 'Events'}</h2>
                {user && ['staff', 'alumni'].includes(user.role.toLowerCase()) && (
                    <Link to={`/news-events/create?type=${type}`} className="btn btn-primary">
                        Create {type === 'news' ? 'News' : 'Event'}
                    </Link>
                )}
            </div>
            <div className="row g-4">
                {items.map((item) => (
                    <div key={item._id} className="col-12">
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>{item.title}</Card.Title>
                                {/* Always show News/Event based on item.type */}
                                <Card.Subtitle className="mb-2 text-muted">{item.type === "news" ? "News" : "Event"}</Card.Subtitle>
                                <Card.Text>{item.description}</Card.Text>
                                {/* Display author information */}
                                <p>
                                    <strong>Posted by:</strong> {item.author ? item.author.name : 'Unknown'}
                                    {item.author && item.author.role && (
                                        <Badge pill bg={getRoleBadgeVariant(item.author.role)} className="ms-2">
                                            {item.author.role}
                                        </Badge>
                                    )}

                                    {item.author && item.author.dept && `, Department: ${item.author.dept}`}
                                    {item.author && item.author.batch && `, Batch: ${item.author.batch}`}
                                    {item.author && item.author.staff_id && `, Staff ID: ${item.author.staff_id}`}
                                </p>

                                {item.type === "event" ? (
                                    <div className="event-details">
                                        <p><strong>Date:</strong> {item.event_date ? new Date(item.event_date).toLocaleDateString() : 'Date not specified'}</p>
                                        <p><strong>Location:</strong> {item.location || 'Location not specified'}</p>
                                    </div>
                                ) : (
                                    <small className="text-muted">
                                        Posted on: {new Date(item.created_at).toLocaleDateString()}
                                    </small>
                                )}
                            </Card.Body>
                            <Card.Footer className='d-flex justify-content-end'>
                                {canDelete(item) && (
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDelete(item._id)}
                                        className="ms-auto"
                                    >
                                        <FaTrash />
                                    </Button>
                                )}
                            </Card.Footer>
                        </Card>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        {[...Array(totalPages)].map((_, idx) => (
                            <Pagination.Item
                                key={idx + 1}
                                active={idx + 1 === page}
                                onClick={() => handlePageChange(idx + 1)}
                            >
                                {idx + 1}
                            </Pagination.Item>
                        ))}
                    </Pagination>
                </div>
            )}
        </div><Footer /></>
    );
};

export default NewsEventList;