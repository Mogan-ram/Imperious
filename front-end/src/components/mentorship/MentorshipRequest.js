import React, { useState, useEffect, useCallback } from 'react'; // useCallback
import { Container, Tabs, Tab, Card, Form, Button, Badge } from 'react-bootstrap';
import { projectService } from '../../services/api/projects';
import { mentorshipService } from '../../services/api/mentorship';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const MentorshipRequest = () => {
    const [activeTab, setActiveTab] = useState('request'); // 'request' or 'status'
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [message, setMessage] = useState('');
    const [requests, setRequests] = useState([]); // For BOTH incoming and outgoing
    const { user } = useAuth();

    const loadProjects = useCallback(async () => {
        try {
            const response = await projectService.getProjects();
            // Filter projects to show only those *not* created by the current user.
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
            console.log('Requests response:', response.data); // Debug log
            if (Array.isArray(response.data)) {
                setRequests(response.data);
            } else {
                console.error("Invalid data format for requests:", response.data);
                toast.error("Received invalid data format for requests.");
                setRequests([]); // Set to empty array on error
            }

        } catch (error) {
            console.error("Error loading requests:", error);
            toast.error("Failed to load requests");
            setRequests([]);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        // Load data based on the active tab.  We load BOTH on initial load.
        loadProjects();
        loadRequests();
        setLoading(false)

    }, [loadProjects, loadRequests, activeTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await mentorshipService.createRequest({
                project_id: selectedProject,
                message
            });
            console.log('Request created:', response.data); // Debug log
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
                className="mb-3"
            >

                {/* Request Tab (for Students) */}

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


                {/* Status Tab (for Students) */}

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
                                                Status: <Badge bg={getStatusBadgeClass(request.status)}>{request.status}</Badge>
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
            </Tabs>
        </Container>
    );
};

export default MentorshipRequest;