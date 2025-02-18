import React, { useState, useEffect, useCallback } from 'react';
import { Card, Pagination, Button } from 'react-bootstrap';
import { useLocation, Link } from 'react-router-dom';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';

const NewsEventList = () => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Get type from URL parameters
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type') || 'news';

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const response = await newsEventsService.getAll(page, type);
            setItems(response.data.items);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching news/events:', error);
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

    const renderItem = (item) => {
        const canDelete = user && (
            ['staff', 'alumni'].includes(user.role.toLowerCase()) ||
            user._id === item.author_id
        );

        const handleDelete = async () => {
            if (window.confirm('Are you sure you want to delete this item?')) {
                try {
                    await newsEventsService.delete(item._id);
                    fetchItems(); // Refresh the list
                } catch (error) {
                    console.error('Error deleting item:', error);
                    alert('Failed to delete item');
                }
            }
        };

        if (type === 'event') {
            return (
                <Card className="mb-3">
                    {item.image_path && (
                        <Card.Img variant="top" src={item.image_path} />
                    )}
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <Card.Title>{item.title}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">Event</Card.Subtitle>
                                <Card.Text>{item.description}</Card.Text>
                                <div className="event-details">
                                    <p><strong>Date:</strong> {item.event_date ? new Date(item.event_date).toLocaleDateString() : 'Date not specified'}</p>
                                    <p><strong>Location:</strong> {item.location || 'Location not specified'}</p>
                                </div>
                            </div>
                            {canDelete && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            );
        }

        return (
            <Card className="mb-3">
                {item.image_path && (
                    <Card.Img variant="top" src={item.image_path} />
                )}
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                        <div>
                            <Card.Title>{item.title}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">News</Card.Subtitle>
                            <Card.Text>{item.description}</Card.Text>
                            <small className="text-muted">
                                Posted on: {new Date(item.created_at).toLocaleDateString()}
                            </small>
                        </div>
                        {canDelete && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                </Card.Body>
            </Card>
        );
    };

    // Add debug logging
    useEffect(() => {
        console.log('Current items:', items);
    }, [items]);

    if (loading) {
        return <div className="text-center p-5">Loading...</div>;
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{type === 'news' ? 'News' : 'Events'}</h2>
                {user && ['staff', 'alumni'].includes(user.role.toLowerCase()) && (
                    <Link to="/news-events/create" className="btn btn-primary">
                        Create {type === 'news' ? 'News' : 'Event'}
                    </Link>
                )}
            </div>
            {items.length === 0 ? (
                <div className="text-center">No items found</div>
            ) : (
                <>
                    <div className="row g-4">
                        {items.map((item) => (
                            <div key={item._id} className="col-12">
                                {renderItem(item)}
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
                </>
            )}
        </div>
    );
};

export default NewsEventList;