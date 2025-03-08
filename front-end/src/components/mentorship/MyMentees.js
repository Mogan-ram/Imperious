import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Row, Col, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { mentorshipService } from '../../services/api/mentorship';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaEnvelope, FaUserCircle, FaEye } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const MyMentees = () => {
    const [loading, setLoading] = useState(true);
    const [menteesData, setMenteesData] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Use a ref to track if we've tried the fallback to avoid loops
    const triedFallback = useRef(false);

    // Load mentees data from API
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // First try to get data from the main endpoint
            console.log("Fetching mentees data from primary endpoint");
            const data = await mentorshipService.getMentees();

            // Check if we got valid array data
            if (Array.isArray(data) && data.length > 0) {
                console.log("Successfully loaded mentees data:", data);
                setMenteesData(data);
                triedFallback.current = false; // Reset in case we succeed in the future
                setLoading(false);
                return;
            }

            console.log("Primary endpoint returned empty data, checking for fallback");

            // If we haven't tried the fallback yet and got no data, try the fallback
            if (!triedFallback.current) {
                triedFallback.current = true; // Mark that we've tried the fallback

                // Get all mentorship requests and filter for accepted ones
                const response = await mentorshipService.getRequests();

                if (response && response.data && Array.isArray(response.data)) {
                    console.log("Retrieved all mentorship requests:", response.data.length);

                    // Filter for accepted requests where this user is the mentor
                    const accepted = response.data.filter(request =>
                        request.status === 'accepted' &&
                        (request.mentor_id === user.email || request.mentor_id === user._id)
                    );

                    console.log("Filtered accepted requests:", accepted.length);

                    if (accepted.length > 0) {
                        // Group by project
                        const projectMap = {};

                        accepted.forEach(request => {
                            if (request.project) {
                                const projectId = request.project._id;

                                if (!projectMap[projectId]) {
                                    projectMap[projectId] = {
                                        _id: projectId,
                                        title: request.project.title,
                                        students: []
                                    };
                                }

                                if (request.student) {
                                    projectMap[projectId].students.push({
                                        id: request.student._id,
                                        name: request.student.name,
                                        dept: request.student.dept,
                                        batch: request.student.batch || 'N/A',
                                        email: request.student.email,
                                        role: 'Lead'
                                    });
                                }
                            }
                        });

                        const transformedData = Object.values(projectMap);
                        console.log("Created mentee data from requests:", transformedData);
                        setMenteesData(transformedData);
                    } else {
                        console.log("No accepted requests found");
                        setMenteesData([]);
                    }
                } else {
                    console.log("Failed to get mentorship requests data");
                    setMenteesData([]);
                }
            }
        } catch (error) {
            console.error("Error loading mentees data:", error);
            setError("Failed to load mentees data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Load data when component mounts
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle clicking the message button
    const handleMessageClick = (student) => {
        if (student.email) {
            navigate('/messages', { state: { recipientEmail: student.email } });
        } else {
            toast.error("Cannot start conversation - student email is missing");
        }
    };

    // Handle clicking the view profile button
    const handleViewProfile = (student) => {
        if (student.id) {
            navigate(`/profile/${student.id}`);
        } else {
            toast.error("Cannot view profile - student ID is missing");
        }
    };

    // Handle clicking the view project button
    const handleViewProject = (projectId) => {
        if (projectId) {
            navigate(`/projects/${projectId}`);
        } else {
            toast.error("Cannot view project - project ID is missing");
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <Container className="py-4">
                <h2 className="mb-4">My Mentees</h2>
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button
                            variant="outline-danger"
                            onClick={() => {
                                triedFallback.current = false; // Reset so we can try fallback again
                                loadData();
                            }}
                        >
                            Retry
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">My Mentees</h2>

            {menteesData.length === 0 ? (
                <Alert variant="info">
                    <Alert.Heading>No mentees yet</Alert.Heading>
                    <p>
                        You haven't accepted any mentorship requests yet. When you accept requests to mentor students,
                        they will appear here.
                    </p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button
                            variant="outline-primary"
                            onClick={() => navigate('/alumni/mentorship')}
                        >
                            View Mentorship Requests
                        </Button>
                    </div>
                </Alert>
            ) : (
                <Row xs={1} md={2} lg={1} className="g-4">
                    {menteesData.map((project) => (
                        <Col key={project._id}>
                            <Card className="shadow-sm">
                                <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">{project.title}</h5>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleViewProject(project._id)}
                                    >
                                        <FaEye className="me-2" /> View Project
                                    </Button>
                                </Card.Header>
                                <Card.Body>
                                    <ListGroup variant="flush">
                                        {project.students.map((student) => (
                                            <ListGroup.Item
                                                key={student.id}
                                                className="py-3 px-0 border-bottom"
                                            >
                                                <Row className="align-items-center">
                                                    <Col xs={12} md={6}>
                                                        <div className="d-flex align-items-center">
                                                            <div
                                                                className="bg-light rounded-circle d-flex justify-content-center align-items-center me-3"
                                                                style={{ width: '50px', height: '50px' }}
                                                            >
                                                                <FaUserCircle size={30} className="text-secondary" />
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{student.name}</h6>
                                                                <div className="text-muted small">
                                                                    {student.dept} • Batch {student.batch}
                                                                </div>
                                                                <Badge
                                                                    bg={student.role === 'Lead' ? 'primary' : 'secondary'}
                                                                    className="mt-1"
                                                                >
                                                                    {student.role}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    <Col xs={12} md={6} className="mt-3 mt-md-0 text-md-end">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => handleViewProfile(student)}
                                                        >
                                                            <FaUserCircle className="me-1" /> View Profile
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleMessageClick(student)}
                                                        >
                                                            <FaEnvelope className="me-1" /> Message
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default MyMentees;