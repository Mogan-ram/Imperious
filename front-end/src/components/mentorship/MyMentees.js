import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Card, Row, Col, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { mentorshipService } from '../../services/api/mentorship';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaEnvelope, FaUserCircle, FaEye } from 'react-icons/fa';
// import { useAuth } from '../../contexts/AuthContext';

const MyMentees = () => {
    const [loading, setLoading] = useState(true);
    const [menteesData, setMenteesData] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    // const { user } = useAuth();

    // Use a ref to track if we've tried the fallback to avoid loops
    const triedFallback = useRef(false);

    // Load mentees data from API
    // In MyMentees.js, update the loadData function:

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            console.log("Fetching mentees data from primary endpoint");
            const response = await mentorshipService.getMentees();
            console.log("Mentees API response:", response);

            // Check if we have project_groups in the response
            if (response && response.project_groups && Array.isArray(response.project_groups)) {
                console.log("Found project_groups data:", response.project_groups);
                setMenteesData(response.project_groups);
            }
            // Check if we have just an array
            else if (Array.isArray(response) && response.length > 0) {
                console.log("Found array data:", response);
                setMenteesData(response);
            }
            // Try to find mentees data in another format
            else if (response && response.mentees && Array.isArray(response.mentees)) {
                // Group mentees by project
                const projectMap = {};

                response.mentees.forEach(mentee => {
                    if (mentee.project) {
                        const projectId = mentee.project._id;

                        if (!projectMap[projectId]) {
                            projectMap[projectId] = {
                                _id: projectId,
                                title: mentee.project.title,
                                students: []
                            };
                        }

                        projectMap[projectId].students.push({
                            id: mentee._id,
                            name: mentee.name,
                            dept: mentee.dept,
                            batch: mentee.batch || 'N/A',
                            email: mentee.email,
                            role: 'Mentee'
                        });
                    }
                });

                const transformedData = Object.values(projectMap);
                console.log("Created project_groups from mentees:", transformedData);
                setMenteesData(transformedData);
            } else {
                console.log("No mentees data found in the expected format:", response);

                // Fallback logic (your existing fallback code)
                if (!triedFallback.current) {
                    triedFallback.current = true;
                    // Your existing fallback logic
                    // ...rest of your fallback code...
                }
            }
        } catch (error) {
            console.error("Error loading mentees data:", error);
            setError("Failed to load mentees data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

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