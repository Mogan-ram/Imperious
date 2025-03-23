// src/components/news-events/NewsEventForm/NewsEventForm.js
import React, { useState, useEffect } from "react";
import { Form, Button, Container, Card, Image, Row, Col } from 'react-bootstrap';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaLink } from 'react-icons/fa';

const NewsEventForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // Get ID from URL if editing
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        type: "news", // Default to "news"
        eventDate: "",
        eventTime: "",
        location: "",
        registerLink: "",
    });

    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // File Size Limit
    const MAX_FILE_SIZE_MB = 5; // 5MB limit
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    useEffect(() => {
        // Set type from URL parameter if present
        const searchParams = new URLSearchParams(location.search);
        const urlType = searchParams.get('type');
        if (urlType) {
            setFormData(prevData => ({
                ...prevData,
                type: urlType
            }));
        }

        // If ID is present, fetch the news/event data for editing
        if (id) {
            setIsEditing(true);
            fetchNewsEvent();
        }
    }, [location.search, id]);

    // Fetch news/event data for editing
    const fetchNewsEvent = async () => {
        try {
            setIsLoading(true);
            const response = await newsEventsService.getById(id);

            if (response && response.data) {
                const eventData = response.data;

                // Set form data
                setFormData({
                    title: eventData.title || "",
                    description: eventData.description || "",
                    type: eventData.type || "news",
                    eventDate: eventData.event_date ? eventData.event_date.split('T')[0] : "",
                    eventTime: eventData.event_time || "",
                    location: eventData.location || "",
                    registerLink: eventData.register_link || "",
                });

                // Set preview URL if image exists
                if (eventData.image_url) {
                    // Check if the URL already starts with http, if not add the base
                    const imageUrl = eventData.image_url.startsWith('http')
                        ? eventData.image_url
                        : `http://localhost:5000${eventData.image_url}`;

                    setPreviewUrl(imageUrl);
                    console.log("Set preview URL:", imageUrl);
                }
            }
        } catch (error) {
            console.error("Error fetching news/event:", error);
            toast.error("Failed to load news/event data");
        } finally {
            setIsLoading(false);
        }
    };

    // Check if user has permission to create news/events
    if (!user || !['staff', 'alumni'].includes(user.role?.toLowerCase())) {
        return (
            <Container className="py-5 text-center">
                <h4>Permission Denied</h4>
                <p>You do not have permission to {isEditing ? 'edit' : 'create'} news or events.</p>
                <Button variant="primary" onClick={() => navigate(-1)}>Go Back</Button>
            </Container>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.title || !formData.description) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Validate event-specific fields
        if (formData.type === "event" && (!formData.eventDate || !formData.location)) {
            toast.error("Please fill in all event details");
            return;
        }

        try {
            setIsLoading(true);

            if (isEditing) {
                // Handle edit
                const updateData = {
                    title: formData.title,
                    description: formData.description,
                    type: formData.type
                };

                // Add event-specific fields if applicable
                if (formData.type === "event") {
                    updateData.event_date = formData.eventDate;
                    updateData.event_time = formData.eventTime;
                    updateData.location = formData.location;
                    updateData.register_link = formData.registerLink;
                }

                // Send update request
                const response = await newsEventsService.update(id, updateData);

                if (response.status === 200) {
                    toast.success("News/Event updated successfully!");
                    navigate(`/${formData.type === 'news' ? 'news' : 'events'}`);
                }
            } else {
                // Handle create
                const formDataObj = new FormData();
                formDataObj.append("title", formData.title);
                formDataObj.append("description", formData.description);
                formDataObj.append("type", formData.type);

                if (formData.type === "event") {
                    formDataObj.append("event_date", formData.eventDate);
                    formDataObj.append("event_time", formData.eventTime);
                    formDataObj.append("location", formData.location);
                    formDataObj.append("register_link", formData.registerLink);
                }

                // Handle image
                if (image) {
                    if (image.size > MAX_FILE_SIZE_BYTES) {
                        toast.error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB`);
                        setIsLoading(false);
                        return;
                    }
                    formDataObj.append("image", image);
                }

                const response = await newsEventsService.create(formDataObj);

                if (response.status === 201) {
                    toast.success("News/Event created successfully!");
                    navigate(`/${formData.type === 'news' ? 'news' : 'events'}`);
                }
            }
        } catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'creating'} news/event:`, error);
            toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} news/event`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB`);
                e.target.value = null; // Clear the file input
                setImage(null);
                setPreviewUrl(null);  // Clear preview
                return;
            }
            setImage(file);
            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            }
            reader.readAsDataURL(file);
        } else {
            setImage(null);
            setPreviewUrl(null);
        }
    };

    return (
        <Container className="py-5">
            <Card style={{ maxWidth: "52rem" }} className="mx-auto shadow-sm">
                <Card.Body className="p-4">
                    <h4 className="mb-4">
                        {isEditing ? 'Edit' : 'Create New'} {formData.type === 'news' ? 'News' : 'Event'}
                    </h4>

                    {isLoading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading...</p>
                        </div>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Form.Select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    disabled={isEditing} // Cannot change type when editing
                                >
                                    <option value="news">News</option>
                                    <option value="event">Event</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter title"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Enter description"
                                    required
                                />
                            </Form.Group>

                            {/* Show these fields only for events */}
                            {formData.type === "event" && (
                                <>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>
                                                    <FaCalendarAlt className="me-2" />
                                                    Event Date
                                                </Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="eventDate"
                                                    value={formData.eventDate}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>
                                                    <FaClock className="me-2" />
                                                    Event Time
                                                </Form.Label>
                                                <Form.Control
                                                    type="time"
                                                    name="eventTime"
                                                    value={formData.eventTime}
                                                    onChange={handleInputChange}
                                                />
                                                <Form.Text className="text-muted">
                                                    Optional, but recommended
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FaMapMarkerAlt className="me-2" />
                                            Location
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            placeholder="Enter event location"
                                            required
                                        />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FaLink className="me-2" />
                                            Registration Link
                                        </Form.Label>
                                        <Form.Control
                                            type="url"
                                            name="registerLink"
                                            value={formData.registerLink}
                                            onChange={handleInputChange}
                                            placeholder="https://example.com/register"
                                        />
                                        <Form.Text className="text-muted">
                                            Optional: Provide a link where users can register for this event
                                        </Form.Text>
                                    </Form.Group>
                                </>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label>Upload Image (optional)</Form.Label>
                                <Form.Control
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    disabled={isEditing} // Disable image upload when editing
                                />
                                {isEditing && (
                                    <Form.Text className="text-muted">
                                        Image cannot be changed when editing.
                                    </Form.Text>
                                )}

                                {previewUrl && (
                                    <div className="mt-2 mb-3">
                                        <p className="mb-1">Image Preview:</p>
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fluid
                                            thumbnail
                                            style={{ maxWidth: '200px' }}
                                            onError={(e) => {
                                                console.log('Preview image error:', e);
                                                e.target.src = 'https://via.placeholder.com/200x200?text=Preview';
                                            }}
                                        />
                                    </div>
                                )}
                            </Form.Group>

                            <div className="d-flex justify-content-between">
                                <Button variant="secondary" onClick={() => navigate(-1)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {isEditing ? 'Updating...' : 'Submitting...'}
                                        </>
                                    ) : (
                                        isEditing ? 'Update' : 'Submit'
                                    )}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default NewsEventForm;