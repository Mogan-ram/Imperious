import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Card, Form, Button, Alert } from 'react-bootstrap';
import { projectService } from '../../../services/api/projects';
import { mentorshipService } from '../../../services/api/mentorship';
import { toast } from 'react-toastify';

const MentorshipRequest = () => {
    const [activeTab, setActiveTab] = useState('request');
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [message, setMessage] = useState('');
    const [requests, setRequests] = useState([]);
    const [showMentorDetails, setShowMentorDetails] = useState(null);

    useEffect(() => {
        loadProjects();
        loadRequests();
    }, []);

    const loadProjects = async () => {
        try {
            const response = await projectService.getProjects();
            setProjects(response.data || []);
        } catch (error) {
            toast.error('Failed to load projects');
            setProjects([]);
        }
    };

    const loadRequests = async () => {
        try {
            const response = await mentorshipService.getRequests();
            console.log('Requests response:', response.data); // Debug log
            if (Array.isArray(response.data)) {
                setRequests(response.data);
            } else {
                console.error('Invalid response format:', response.data);
                setRequests([]);
            }
        } catch (error) {
            console.error('Error loading requests:', error);
            toast.error('Failed to load requests');
            setRequests([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await mentorshipService.createRequest({
                project_id: selectedProject,
                message
            });
            console.log('Request created:', response.data); // Debug log
            toast.success('Mentorship request sent successfully');
            setMessage('');
            setSelectedProject('');
            await loadRequests(); // Make sure we await the refresh
        } catch (error) {
            console.error('Error creating request:', error); // Debug log
            toast.error('Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-warning text-dark';
            case 'accepted':
                return 'bg-success text-white';
            case 'rejected':
                return 'bg-danger text-white';
            default:
                return 'bg-secondary text-white';
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Mentorship Requests</h2>
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="request" title="Send Request">
                    <Card>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Select Project</Form.Label>
                                    <Form.Select
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        required
                                    >
                                        <option value="">Choose a project...</option>
                                        {Array.isArray(projects) && projects.map((project) => (
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

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-100"
                                >
                                    {loading ? 'Sending...' : 'Send Request'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="status" title="Request Status">
                    {Array.isArray(requests) && requests.length > 0 ? (
                        requests.map((request) => (
                            <Card key={request._id} className="mb-3 shadow-sm">
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <Card.Title className="mb-2">
                                                {request.project ? request.project.title : 'Project Not Found'}
                                            </Card.Title>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                <small className="text-muted">
                                                    Sent: {new Date(request.created_at).toLocaleString()}
                                                </small>
                                            </div>
                                            {request.message && (
                                                <Card.Text className="text-muted mb-3">
                                                    <strong>Your Message:</strong> {request.message}
                                                </Card.Text>
                                            )}
                                        </div>
                                        {request.mentor && (
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => setShowMentorDetails(request._id)}
                                            >
                                                View Mentor
                                            </Button>
                                        )}
                                    </div>

                                    {showMentorDetails === request._id && request.mentor && (
                                        <Alert variant="success" className="mt-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6>Mentor Details</h6>
                                                    <p className="mb-1">
                                                        <strong>Name:</strong> {request.mentor.name}
                                                    </p>
                                                    <p className="mb-1">
                                                        <strong>Email:</strong> {request.mentor.email}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Department:</strong> {request.mentor.dept}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => setShowMentorDetails(null)}
                                                >
                                                    Close
                                                </Button>
                                            </div>
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-5">
                            <h5 className="text-muted mb-3">No mentorship requests found</h5>
                            <Button
                                variant="primary"
                                onClick={() => setActiveTab('request')}
                            >
                                Create a new request
                            </Button>
                        </div>
                    )}
                </Tab>
            </Tabs>
        </Container>
    );
};

export default MentorshipRequest; 