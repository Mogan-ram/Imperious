import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { mentorshipService } from '../../services/api/mentorship';
import { projectService } from '../../services/api/projects';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const AlumniMentorship = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [exploreProjects, setExploreProjects] = useState([]);
    const { user } = useAuth();

    const loadRequests = useCallback(async () => {
        try {
            const response = await mentorshipService.getRequests();
            console.log("Requests response:", response.data); // Keep this for debugging
            if (Array.isArray(response.data)) {
                setRequests(response.data);
            } else {
                console.error("Invalid data format for mentor requests:", response.data);
                toast.error("Received invalid data format for requests.");
                setRequests([]);
            }
        } catch (error) {
            console.error("Error loading mentorship requests:", error);
            toast.error("Failed to load mentorship requests.");
            setRequests([]);
        }
    }, []);

    const loadExploreProjects = useCallback(async () => {
        try {
            const response = await projectService.getProjects();
            if (Array.isArray(response.data)) {
                setExploreProjects(response.data);
            } else {
                console.error("Invalid data format for projects:", response.data);
                toast.error("Received invalid data format for projects.");
                setExploreProjects([]);
            }
        } catch (error) {
            console.error("Error loading projects for exploration:", error);
            toast.error("Failed to load projects for exploration.");
            setExploreProjects([]);
        }
    }, []);


    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            if (activeTab === 'requests' || activeTab === 'accepted' || activeTab === 'ignored') {
                await loadRequests();  // Always load requests for these tabs
            } else if (activeTab === 'explore') {
                await loadExploreProjects();
            }
            setLoading(false);
        }
        fetchData();

    }, [activeTab, loadRequests, loadExploreProjects]); // Correct dependencies


    const handleStatusUpdate = async (requestId, status) => {
        try {
            await mentorshipService.updateRequest(requestId, status);
            toast.success(`Request ${status}`);
            loadRequests(); // Refresh requests
        } catch (error) {
            console.error(`Error updating request:`, error);
            toast.error(`Failed to ${status} request`);
        }
    };

    const handleIgnore = async (requestId) => {
        try {
            await mentorshipService.ignoreRequest(requestId);
            toast.success("Request ignored.");
            loadRequests(); // Refresh requests
        } catch (error) {
            console.error("Error ignoring request:", error);
            toast.error("Failed to ignore request.");
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending': return 'bg-warning text-dark';
            case 'accepted': return 'bg-success text-white';
            case 'rejected': return 'bg-danger text-white';
            default: return 'bg-secondary text-white';
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Alumni Mentorship</h2>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">

                {/* Incoming Requests (Pending and NOT ignored) */}
                <Tab eventKey="requests" title="Incoming Requests">
                    {requests.filter(request => request.status === 'pending' && (!request.ignored_by || !request.ignored_by.includes(user.email))).length > 0 ? (
                        requests.filter(request => request.status === 'pending' && (!request.ignored_by || !request.ignored_by.includes(user.email)))
                            .map((request) => (
                                <Card key={request._id} className="mb-3">
                                    {/* ... (rest of the card content for pending requests - as you had it before, but with correct filtering) */}
                                    <Card.Body>
                                        <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            From: {request.student ? `${request.student.name} (${request.student.dept})` : 'Unknown Student'}
                                        </Card.Subtitle>
                                        <Card.Text>
                                            Message: {request.message}
                                        </Card.Text>
                                        <Badge bg={getStatusBadgeClass(request.status)}>  {/* Corrected Badge */}
                                            {request.status}
                                        </Badge>
                                        {request.status === 'pending' && (
                                            <div className="mt-2">
                                                <Button
                                                    variant="success"
                                                    onClick={() => handleStatusUpdate(request._id, 'accepted')}
                                                    className="me-2"
                                                >
                                                    Accept
                                                </Button>
                                                <Button variant="secondary" onClick={() => handleIgnore(request._id)}>
                                                    Ignore
                                                </Button>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            ))
                    ) : (
                        <p>No incoming mentorship requests found.</p>
                    )}
                </Tab>

                {/* Accepted Requests */}
                <Tab eventKey="accepted" title="Accepted Requests">
                    {requests.filter(request => request.status === 'accepted' && request.mentor_id === user.email).length > 0 ? (
                        requests.filter(request => request.status === 'accepted' && request.mentor_id === user.email)
                            .map((request) => (
                                <Card key={request._id} className="mb-3">
                                    <Card.Body>
                                        <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            From: {request.student ? `${request.student.name} (${request.student.dept})` : 'Unknown Student'}
                                        </Card.Subtitle>
                                        <Card.Text>
                                            Message: {request.message}
                                        </Card.Text>
                                        <Badge bg={getStatusBadgeClass(request.status)}>
                                            {request.status}
                                        </Badge>
                                    </Card.Body>
                                </Card>
                            ))
                    ) : (
                        <p>No accepted mentorship requests found.</p>
                    )}
                </Tab>

                {/* Ignored Requests */}
                <Tab eventKey="ignored" title="Ignored Requests">
                    {requests.filter(request => request.ignored_by && request.ignored_by.includes(user.email)).length > 0 ? (
                        requests.filter(request => request.ignored_by && request.ignored_by.includes(user.email))
                            .map((request) => (
                                <Card key={request._id} className="mb-3">
                                    <Card.Body>
                                        <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            From: {request.student ? `${request.student.name} (${request.student.dept})` : 'Unknown Student'}
                                        </Card.Subtitle>
                                        <Card.Text>
                                            Message: {request.message}
                                        </Card.Text>
                                        <Badge bg={getStatusBadgeClass(request.status)}>
                                            {request.status}
                                        </Badge>
                                    </Card.Body>
                                </Card>
                            ))
                    ) : (
                        <p>No ignored mentorship requests found.</p>
                    )}
                </Tab>

                <Tab eventKey="explore" title="Explore Projects">
                    {exploreProjects.length > 0 ? (
                        <Row xs={1} md={2} lg={3} className="g-4">
                            {exploreProjects.map((project) => (
                                <Col key={project._id}>
                                    <Card className="h-100">
                                        <Card.Body>
                                            <Card.Title>{project.title}</Card.Title>
                                            <Card.Subtitle className='mb-2 text-muted'>
                                                By: {project.created_by}
                                            </Card.Subtitle>
                                            <Card.Text>
                                                {project.abstract.substring(0, 100)}...
                                            </Card.Text>
                                            <Card.Text>
                                                Tech Stack: {Array.isArray(project.techStack) ? project.techStack.join(', ') : ''}
                                            </Card.Text>

                                            {project.githubLink && (
                                                <Card.Link href={project.githubLink} target="_blank" rel="noopener noreferrer">
                                                    GitHub Repository
                                                </Card.Link>
                                            )}


                                            {/* Add more project details as needed */}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <p>No projects available for mentorship.</p>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default AlumniMentorship;