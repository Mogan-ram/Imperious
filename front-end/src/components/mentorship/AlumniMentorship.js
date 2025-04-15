import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, ListGroup, Badge, Button, Tabs, Tab } from 'react-bootstrap';
import { mentorshipService } from '../../services/api/mentorship';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { FaCheck, FaEye, FaBan } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Footer from '../layout/Footer/Footer';

const AlumniMentorship = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await mentorshipService.getRequests();
            // console.log('Mentorship requests response:', response);

            // Ensure we have an array of requests
            const requestsData = Array.isArray(response) ? response :
                (response?.data && Array.isArray(response.data)) ?
                    response.data : [];

            setRequests(requestsData);
        } catch (error) {
            console.error('Failed to load mentorship requests:', error);
            toast.error('Failed to load mentorship requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (requestId) => {
        try {
            await mentorshipService.updateRequest(requestId, 'accepted');
            toast.success('Request accepted');
            fetchRequests();
        } catch (error) {
            console.error('Failed to accept request:', error);
            toast.error('Failed to accept request');
        }
    };

    const handleIgnore = async (requestId) => {
        try {
            await mentorshipService.ignoreRequest(requestId);
            toast.success('Request ignored');
            fetchRequests();
        } catch (error) {
            console.error('Failed to ignore request:', error);
            toast.error('Failed to ignore request');
        }
    };

    // Check if a request should be shown in pending list
    const shouldShowInPending = (request) => {
        // Don't show if this mentor has ignored the request
        if (request.ignored_by && request.ignored_by.includes(user.email)) {
            return false;
        }

        // Don't show if the request has been accepted by any mentor
        if (request.status === 'accepted') {
            return false;
        }

        // Show only pending requests
        return request.status === 'pending';
    };

    // Check if a request should be shown in accepted list
    const shouldShowInAccepted = (request) => {
        // Only show if this specific mentor accepted it
        return request.status === 'accepted' && request.mentor_id === user._id;
    };

    // Check if a request should be shown in ignored list
    const shouldShowInIgnored = (request) => {
        // Only show in ignored list if this mentor has ignored it AND it's still pending
        return request.status === 'pending' &&
            request.ignored_by &&
            request.ignored_by.includes(user.email);
    };

    // Filter requests for each tab
    const pendingRequests = requests.filter(request => shouldShowInPending(request));
    const acceptedRequests = requests.filter(request => shouldShowInAccepted(request));
    const ignoredRequests = requests.filter(request => shouldShowInIgnored(request));

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <><Container className="py-4">
            <h2 className="mb-4">Mentorship Requests</h2>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="pending" title={`Pending Requests (${pendingRequests.length})`}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map((request, index) => (
                                    <Card key={request._id || `pending-${index}`} className="mb-3 border-0 shadow-sm">
                                        <Card.Body>
                                            <Row>
                                                <Col md={8}>
                                                    <Card.Title>
                                                        {request.project?.title || 'Unknown Project'}
                                                    </Card.Title>
                                                    <Card.Subtitle className="mb-2 text-muted">
                                                        From: {request.student?.name || 'Unknown Student'} ({request.student?.dept || 'Unknown'})
                                                    </Card.Subtitle>
                                                    <Card.Text>
                                                        {request.message || 'No message provided'}
                                                    </Card.Text>

                                                    <div className="mt-3">
                                                        <h6>Project Details:</h6>
                                                        <p className="mb-1">
                                                            <strong>Abstract:</strong> {request.project?.abstract || 'No abstract available'}
                                                        </p>

                                                        {request.project?.tech_stack && request.project.tech_stack.length > 0 && (
                                                            <div className="mb-3">
                                                                <strong>Technologies:</strong>
                                                                <div className="d-flex flex-wrap gap-2 mt-1">
                                                                    {request.project.tech_stack.map((tech, idx) => (
                                                                        <Badge key={idx} bg="secondary">{tech}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Col>
                                                <Col md={4} className="d-flex flex-column justify-content-between">
                                                    <div className="text-muted mb-3">
                                                        Requested: {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown date'}
                                                    </div>

                                                    <div className="d-flex flex-column gap-2">
                                                        <Button
                                                            variant="success"
                                                            className="d-flex align-items-center justify-content-center gap-2"
                                                            onClick={() => handleAccept(request._id)}
                                                        >
                                                            <FaCheck /> Accept
                                                        </Button>
                                                        <Button
                                                            variant="secondary"
                                                            className="d-flex align-items-center justify-content-center gap-2"
                                                            onClick={() => handleIgnore(request._id)}
                                                        >
                                                            <FaBan /> Ignore
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            className="d-flex align-items-center justify-content-center gap-2"
                                                            onClick={() => navigate(`/projects/${request.project?._id}`)}
                                                        >
                                                            <FaEye /> View Project
                                                        </Button>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-center py-3 text-muted">No pending mentorship requests at this time.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="accepted" title={`My Accepted Requests (${acceptedRequests.length})`}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            {acceptedRequests.length > 0 ? (
                                <ListGroup variant="flush">
                                    {acceptedRequests.map((request, index) => (
                                        <ListGroup.Item key={request._id || `accepted-${index}`} className="border-bottom py-3">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h5>{request.project?.title || 'Unknown Project'}</h5>
                                                    <p className="text-muted mb-1">
                                                        From: {request.student?.name || 'Unknown Student'} ({request.student?.dept || 'Unknown'})
                                                    </p>
                                                    <p className="mb-1">
                                                        Status: {' '}
                                                        <Badge bg={'success'}>
                                                            Accepted
                                                        </Badge>
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => navigate(`/projects/${request.project?._id}`)}
                                                >
                                                    <FaEye /> View Project
                                                </Button>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p className="text-center py-3 text-muted">You haven't accepted any requests yet.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="ignored" title={`Ignored Requests (${ignoredRequests.length})`}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            {ignoredRequests.length > 0 ? (
                                <ListGroup variant="flush">
                                    {ignoredRequests.map((request, index) => (
                                        <ListGroup.Item key={request._id || `ignored-${index}`} className="border-bottom py-3">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h5>{request.project?.title || 'Unknown Project'}</h5>
                                                    <p className="text-muted mb-1">
                                                        From: {request.student?.name || 'Unknown Student'} ({request.student?.dept || 'Unknown'})
                                                    </p>
                                                    <p className="mb-1">
                                                        Status: {' '}
                                                        <Badge bg="secondary">
                                                            Ignored
                                                        </Badge>
                                                    </p>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleAccept(request._id)}
                                                    >
                                                        <FaCheck /> Accept
                                                    </Button>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => navigate(`/projects/${request.project?._id}`)}
                                                    >
                                                        <FaEye /> View Project
                                                    </Button>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p className="text-center py-3 text-muted">You haven't ignored any requests yet.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container><Footer /></>
    );
};

export default AlumniMentorship;