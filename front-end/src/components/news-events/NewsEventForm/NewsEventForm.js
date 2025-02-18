import React, { useState } from "react";
import {
    MDBBtn,
    MDBCard,
    MDBCardBody,
    MDBContainer,
    MDBTextArea,
    MDBInput,
} from "mdb-react-ui-kit";
import { useNavigate } from 'react-router-dom';
import axios from '../../../services/axios';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

const NewsEventForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("news");
    const [image, setImage] = useState(null);
    const [eventDate, setEventDate] = useState("");
    const [location, setLocation] = useState("");

    // Add debug log
    console.log('Current user:', user);

    // Check if user has permission to create news/events
    if (!user || !['staff', 'alumni'].includes(user.role?.toLowerCase())) {
        console.log('Permission denied:', {
            user: user,
            role: user?.role,
            hasPermission: user?.role && ['staff', 'alumni'].includes(user.role.toLowerCase())
        });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

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

        if (image) {
            formData.append("image", image);
        }

        try {
            const response = await axios.post("/news-events", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            });

            if (response.status === 201) {
                toast.success("News/Event created successfully!");
                navigate(`/news-events?type=${type}`);
            }
        } catch (error) {
            console.error("Error creating news/event:", error);
            toast.error(error.response?.data?.message || "Failed to create news/event");
        }
    };

    return (
        <MDBContainer className="py-5">
            <MDBCard style={{ maxWidth: "42rem" }}>
                <MDBCardBody>
                    <h4 className="mb-4">Create New {type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Type</label>
                            <select
                                className="form-select"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="news">News</option>
                                <option value="event">Event</option>
                            </select>
                        </div>
                        <MDBInput
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="mb-3"
                        />
                        <MDBTextArea
                            label="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            required
                            className="mb-3"
                        />

                        {/* Show these fields only for events */}
                        {type === "event" && (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Event Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Enter event location"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div className="mb-3">
                            <label className="form-label">Upload Image (optional)</label>
                            <input
                                type="file"
                                className="form-control"
                                onChange={(e) => setImage(e.target.files[0])}
                                accept="image/*"
                            />
                        </div>
                        <MDBBtn type="submit" color="primary">
                            Submit
                        </MDBBtn>
                    </form>
                </MDBCardBody>
            </MDBCard>
        </MDBContainer>
    );
};

export default NewsEventForm;