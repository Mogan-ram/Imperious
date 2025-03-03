import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Card, Form, Button, Badge } from 'react-bootstrap';
import { projectService } from '../../services/api/projects';
import { mentorshipService } from '../../services/api/mentorship';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const MentorshipRequest = () => {
    const [activeTab, setActiveTab] = useState('request'); // 'request', 'status', or 'mentor'
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [message, setMessage] = useState('');
    const [requests, setRequests] = useState([]); // For BOTH incoming and outgoing
    const [acceptedRequests, setAcceptedRequests] = useState([]); // Accepted requests for mentor tab
    const { user } = useAuth();

    const loadProjects = useCallback(async () => {
        try {
            const response = await projectService.getProjects();
            const filteredProjects = response.data.filter(project => project.created_by !== user.email);
            setProjects(filteredProjects);
        } catch (error) {
            toast.error('Failed to load projects');
            setProjects([]);
        }
    }, [user.email]);

    const loadRequests = useCallback(async () => {
        try {
            const response = await mentorshipService.getRequests();
            if (Array.isArray(response.data)) {
                setRequests(response.data);
                // Filter accepted requests for the mentor tab
                const accepted = response.data.filter(request => request.status === 'accepted');
                setAcceptedRequests(accepted);
            } else {
                console.error("Invalid data format for requests:", response.data);
                toast.error("Received invalid data format for requests.");
                setRequests([]);
                setAcceptedRequests([]);
            }
        } catch (error) {
            console.error("Error loading requests:", error);
            toast.error("Failed to load requests");
            setRequests([]);
            setAcceptedRequests([]);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        loadProjects();
        loadRequests();
        setLoading(false);
    }, [loadProjects, loadRequests, activeTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await mentorshipService.createRequest({
                project_id: selectedProject,
                message
            });
            toast.success('Mentorship request sent successfully!');
            setMessage('');
            setSelectedProject('');
            loadRequests();
        } catch (error) {
            console.error("Error sending request:", error);
            toast.error('Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'warning text-dark';
            case 'accepted':
                return 'success text-white';
            case 'rejected':
                return 'danger text-white';
            default:
                return 'secondary text-white';
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Mentorship</h2>
            <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
                <Tab eventKey="request" title="Request Mentorship">
                    <Card>
                        <Card.Body>
                            <Card.Title>Request Mentorship for a Project</Card.Title>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Select Project</Form.Label>
                                    <Form.Select
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        required
                                    >
                                        <option value="">Choose a project...</option>
                                        {projects.map((project) => (
                                            <option key={project._id} value={project._id}>
                                                {project.title}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Message to Mentor</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Explain why you're seeking mentorship..."
                                        required
                                    />
                                </Form.Group>
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Request'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="status" title="Request Status">
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">Outgoing Requests</h5>
                            {requests.length > 0 ? (
                                requests.map(request => (
                                    <Card key={request._id} className="mb-3">
                                        <Card.Body>
                                            <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">
                                                Status: <Badge className={getStatusBadgeClass(request.status)} style={{ textTransform: 'capitalize' }}>{request.status}</Badge>
                                            </Card.Subtitle>
                                            <Card.Text>
                                                Message: {request.message}
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                ))
                            ) : (
                                <p>No outgoing mentorship requests found.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="mentor" title="Mentor">
                    <Card>
                        <Card.Body>
                            <h5 className="mb-3">Mentorship Requests Accepted</h5>
                            {acceptedRequests.length > 0 ? (
                                acceptedRequests.map(request => (
                                    <Card key={request._id} className="mb-3">
                                        <Card.Body>
                                            <Card.Title>{request.project?.title || 'Project Not Found'}</Card.Title>
                                            <Card.Subtitle className="mb-2 text-muted">
                                                Mentor: {request.mentor_name || 'Mentor Not Found'}
                                            </Card.Subtitle>
                                            <Card.Text>
                                                Message: {request.message}
                                            </Card.Text>
                                        </Card.Body>
                                    </Card>
                                ))
                            ) : (
                                <p>No accepted mentorship requests found.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default MentorshipRequest;
