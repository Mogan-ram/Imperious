// src/components/news-events/NewsEventForm/NewsEventForm.js
import React, { useState, useEffect } from "react";
import { Form, Button, Container, Card, Image } from 'react-bootstrap'; // Import Image
import { useNavigate, useLocation } from 'react-router-dom';
import { newsEventsService } from '../../../services/api/news-events';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

const NewsEventForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("news"); // Default to "news"
    const [image, setImage] = useState(null);
    const [eventDate, setEventDate] = useState("");
    const [location, setLocation] = useState("");
    const locationSearch = useLocation();

    // Preview state and function
    const [previewUrl, setPreviewUrl] = useState(null);

    //File Size Limit
    const MAX_FILE_SIZE_MB = 5; // 5MB limit
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;


    useEffect(() => {
        const searchParams = new URLSearchParams(locationSearch.search);
        const urlType = searchParams.get('type');
        if (urlType) {
            setType(urlType);  // Set type from URL parameter
        }
    }, [locationSearch.search]); // Update type when URL changes


    // Check if user has permission to create news/events
    if (!user || !['staff', 'alumni'].includes(user.role?.toLowerCase())) {
        console.log('Permission denied:', { user: user, role: user?.role });
        return null; // Or a "Permission Denied" message , or redirect.
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Debug logging
        console.log("User attempting to create:", {
            role: user?.role,
            type: type,
            hasImage: !!image
        });

        // Validate required fields
        if (!title || !description || !type) {
            toast.error("Please fill in all required fields");
            return;
        }

        // Validate event-specific fields
        if (type === "event" && (!eventDate || !location)) {
            toast.error("Please fill in all event details");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("type", type);

        if (type === "event") {
            formData.append("event_date", eventDate);
            formData.append("location", location);
        }

        // Handle image, checking for size before appending
        if (image) {
            if (image.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB`);
                return;
            }
            formData.append("image", image);
        }

        // Debug log what's being sent
        console.log("FormData contents:");
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[0] === 'image' ? 'File data' : pair[1]));
        }

        try {
            const response = await newsEventsService.create(formData);
            console.log("Success response:", response);

            if (response.status === 201) {
                toast.success("News/Event created successfully!");
                navigate(`/${type === 'news' ? 'news' : 'events'}`);
            }
        } catch (error) {
            console.error("Error creating news/event:", error);
            console.error("Response data:", error.response?.data);
            toast.error(error.response?.data?.message || "Failed to create news/event");
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
            <Card style={{ maxWidth: "42rem" }}>
                <Card.Body>
                    <h4 className="mb-4">Create New {type === 'news' ? 'News' : 'Event'}</h4>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                disabled
                            >
                                <option value="news">News</option>
                                <option value="event">Event</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </Form.Group>

                        {/* Show these fields only for events */}
                        {type === "event" && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Event Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter event location"
                                        required
                                    />
                                </Form.Group>
                            </>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Upload Image (optional)</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                            {previewUrl && (
                                <Image src={previewUrl} alt="Preview" fluid thumbnail className="mt-2" style={{ maxWidth: '200px' }} />
                            )}
                        </Form.Group>

                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default NewsEventForm;