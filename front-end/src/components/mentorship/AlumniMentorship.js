import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Card, Button, Badge, Row, Col, Alert } from 'react-bootstrap';
import { mentorshipService } from '../../services/api/mentorship';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const AlumniMentorship = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
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

    useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            await loadRequests();
            setLoading(false);
        };
        fetchData();
    }, [loadRequests]);

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

    // Filter for pending requests not ignored by current user
    const pendingRequests = requests.filter(request =>
        request.status === 'pending' &&
        (!request.ignored_by || !request.ignored_by.includes(user.email))
    );

    // Filter for accepted requests where user is the mentor
    const acceptedRequests = requests.filter(request =>
        request.status === 'accepted' &&
        (request.mentor_id === user.email || request.mentor_id === user._id)
    );

    // Filter for ignored requests
    const ignoredRequests = requests.filter(request =>
        request.ignored_by && request.ignored_by.includes(user.email)
    );

    return (
        <Container className="py-4">
            <h2 className="mb-4">Alumni Mentorship</h2>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">

                {/* Incoming Requests Tab */}
                <Tab eventKey="requests" title={`Incoming Requests (${pendingRequests.length})`}>
                    {pendingRequests.length > 0 ? (
                        <Row xs={1} md={2} className="g-4">
                            {pendingRequests.map((request) => (
                                <Col key={request._id}>
                                    <Card className="h-100 shadow-sm">
                                        <Card.Header className="d-flex justify-content-between align-items-center">
                                            <Badge bg={getStatusBadgeClass(request.status)}>
                                                {request.status}
                                            </Badge>
                                            <small className="text-muted">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </small>
                                        </Card.Header>
                                        <Card.Body>
                                            <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                            <Card.Subtitle className="mb-3 text-muted">
                                                From: {request.student ? `${request.student.name} (${request.student.dept})` : 'Unknown Student'}
                                            </Card.Subtitle>
                                            <Card.Text>
                                                <strong>Message:</strong> {request.message}
                                            </Card.Text>
                                            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                                                <Button
                                                    variant="success"
                                                    onClick={() => handleStatusUpdate(request._id, 'accepted')}
                                                >
                                                    Accept
                                                </Button>
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => handleIgnore(request._id)}
                                                >
                                                    Ignore
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Alert variant="info">
                            No incoming mentorship requests found. When students request your mentorship, they'll appear here.
                        </Alert>
                    )}
                </Tab>

                {/* Accepted Requests Tab */}
                <Tab eventKey="accepted" title={`Accepted Requests (${acceptedRequests.length})`}>
                    {acceptedRequests.length > 0 ? (
                        <Row xs={1} md={2} className="g-4">
                            {acceptedRequests.map((request) => (
                                <Col key={request._id}>
                                    <Card className="h-100 shadow-sm">
                                        <Card.Header className="d-flex justify-content-between align-items-center">
                                            <Badge bg={getStatusBadgeClass(request.status)}>
                                                {request.status}
                                            </Badge>
                                            <small className="text-muted">
                                                Accepted on: {new Date(request.updated_at || request.created_at).toLocaleDateString()}
                                            </small>
                                        </Card.Header>
                                        <Card.Body>
                                            <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                            <Card.Subtitle className="mb-3 text-muted">
                                                Student: {request.student ? `${request.student.name} (${request.student.dept})` : 'Unknown Student'}
                                            </Card.Subtitle>
                                            <Card.Text>
                                                <strong>Message:</strong> {request.message}
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Alert variant="info">
                            You haven't accepted any mentorship requests yet. Accepted requests will be shown here.
                        </Alert>
                    )}
                </Tab>

                {/* Ignored Requests Tab */}
                <Tab eventKey="ignored" title={`Ignored Requests (${ignoredRequests.length})`}>
                    {ignoredRequests.length > 0 ? (
                        <Row xs={1} md={2} className="g-4">
                            {ignoredRequests.map((request) => (
                                <Col key={request._id}>
                                    <Card className="h-100 shadow-sm border-light">
                                        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                                            <Badge bg={getStatusBadgeClass(request.status)}>
                                                {request.status}
                                            </Badge>
                                            <small className="text-muted">
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </small>
                                        </Card.Header>
                                        <Card.Body className="text-muted">
                                            <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                            <Card.Subtitle className="mb-3">
                                                From: {request.student ? `${request.student.name} (${request.student.dept})` : 'Unknown Student'}
                                            </Card.Subtitle>
                                            <Card.Text>
                                                <strong>Message:</strong> {request.message}
                                            </Card.Text>
                                            {request.status === 'pending' && (
                                                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(request._id, 'accepted')}
                                                    >
                                                        Reconsider & Accept
                                                    </Button>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Alert variant="info">
                            No ignored requests found. Requests you ignore will appear here.
                        </Alert>
                    )}
                </Tab>

                {/* Explore Projects Tab - COMMENTED OUT 
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
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <p>No projects available for mentorship.</p>
                    )}
                </Tab>
                */}
            </Tabs>
        </Container>
    );
};

export default AlumniMentorship;