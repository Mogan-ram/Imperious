import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, ListGroup, Badge, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../../services/api/projects';
import { mentorshipService } from '../../services/api/mentorship';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { FaEnvelope } from 'react-icons/fa';

const MentorshipRequest = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [existingRequests, setExistingRequests] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [activeTab, setActiveTab] = useState('request');
    const navigate = useNavigate();


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch user's projects
                const projectsResponse = await projectService.getProjects();
                console.log('Projects response:', projectsResponse);

                // Ensure we have an array of projects
                const projectsData = Array.isArray(projectsResponse) ? projectsResponse :
                    (projectsResponse?.data && Array.isArray(projectsResponse.data)) ?
                        projectsResponse.data : [];

                setProjects(projectsData);

                // Fetch existing mentorship requests
                const requestsResponse = await mentorshipService.getRequests();
                console.log('Requests response:', requestsResponse);

                // Ensure we have an array of requests
                const requestsData = Array.isArray(requestsResponse) ? requestsResponse :
                    (requestsResponse?.data && Array.isArray(requestsResponse.data)) ?
                        requestsResponse.data : [];

                setExistingRequests(requestsData);

                // Fetch available mentors
                const mentorsResponse = await mentorshipService.getMentors();
                console.log('Mentors response:', mentorsResponse);

                // Ensure we have an array of mentors
                const mentorsData = Array.isArray(mentorsResponse) ? mentorsResponse :
                    (mentorsResponse?.data && Array.isArray(mentorsResponse.data)) ?
                        mentorsResponse.data : [];

                setMentors(mentorsData);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load data');
                // Set default values
                setProjects([]);
                setExistingRequests([]);
                setMentors([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProject) {
            toast.error('Please select a project');
            return;
        }

        setSubmitting(true);
        try {
            // const response = await mentorshipService.createRequest({
            //     project_id: selectedProject,
            //     message: message.trim() || 'I would like to request mentorship for this project.'
            // });

            toast.success('Mentorship request submitted successfully');

            // Refresh the requests
            const requestsResponse = await mentorshipService.getRequests();
            const requestsData = Array.isArray(requestsResponse) ? requestsResponse :
                (requestsResponse?.data && Array.isArray(requestsResponse.data)) ?
                    requestsResponse.data : [];
            setExistingRequests(requestsData);

            // Reset form
            setSelectedProject('');
            setMessage('');

            // Switch to status tab
            setActiveTab('status');
        } catch (error) {
            console.error('Error submitting request:', error);
            toast.error('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'accepted':
                return <Badge bg="success">Accepted</Badge>;
            case 'rejected':
                return <Badge bg="danger">Rejected</Badge>;
            default:
                return <Badge bg="warning">Pending</Badge>;
        }
    };

    const renderProjectOptions = () => {
        // Filter out projects that already have pending or accepted requests
        const pendingOrAcceptedProjects = existingRequests
            .filter(req => req.status === 'pending' || req.status === 'accepted')
            .map(req => req.project?._id);

        const availableProjects = projects.filter(project =>
            !pendingOrAcceptedProjects.includes(project._id));

        if (availableProjects.length === 0) {
            return (
                <option disabled value="">
                    No eligible projects found
                </option>
            );
        }

        return [
            <option key="select" value="">
                Select a project
            </option>,
            ...availableProjects.map(project => (
                <option key={project._id} value={project._id}>
                    {project.title || 'Untitled Project'}
                </option>
            ))
        ];
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Seek Mentorship</h2>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="request" title="Request Mentorship">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <Row>
                                <Col md={8}>
                                    <Form onSubmit={handleSubmit}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Select Project</Form.Label>
                                            <Form.Select
                                                value={selectedProject}
                                                onChange={(e) => setSelectedProject(e.target.value)}
                                                required
                                            >
                                                {renderProjectOptions()}
                                            </Form.Select>
                                            <Form.Text className="text-muted">
                                                Only projects without existing mentorship requests are shown.
                                            </Form.Text>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Message to Potential Mentors</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                placeholder="Describe what kind of mentorship you're looking for..."
                                            />
                                        </Form.Group>

                                        <div className="d-grid">
                                            <Button
                                                variant="primary"
                                                type="submit"
                                                disabled={submitting || !selectedProject}
                                            >
                                                {submitting ? 'Submitting...' : 'Submit Request'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Col>

                                <Col md={4}>
                                    <Card className="h-100">
                                        <Card.Header className="bg-secondary text-white">
                                            <h5 className="mb-0">Available Mentors</h5>
                                        </Card.Header>
                                        <Card.Body>
                                            {mentors.length > 0 ? (
                                                <ListGroup variant="flush">
                                                    {mentors.map((mentor, index) => (
                                                        <ListGroup.Item key={mentor._id || `mentor-${index}`} className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <div className="fw-bold">{mentor.name || 'Unknown'}</div>
                                                                <div>Department: {mentor.dept || 'Unknown'}</div>
                                                                {mentor.willingness && mentor.willingness.length > 0 && (
                                                                    <div className="mt-1">
                                                                        <small className="text-muted">Willing to help with: </small>
                                                                        <div className="d-flex gap-1 flex-wrap mt-1">
                                                                            {mentor.willingness.map((item, idx) => (
                                                                                <Badge key={idx} bg="info" pill>{item}</Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </ListGroup.Item>
                                                    ))}
                                                </ListGroup>
                                            ) : (
                                                <p className="text-center py-3 text-muted">No mentors available at this time.</p>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="status" title={`Request Status (${existingRequests.length})`}>
                    <Card className="shadow-sm">
                        <Card.Body>
                            {existingRequests.length > 0 ? (
                                <ListGroup variant="flush">
                                    {existingRequests.map((request, index) => (
                                        <ListGroup.Item key={request._id || `request-${index}`}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h5>{request.project?.title || 'Unknown Project'}</h5>
                                                    <p className="text-muted mb-1">
                                                        Sent: {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown date'}
                                                    </p>
                                                    {request.mentor ? (
                                                        <div className="mb-1">
                                                            <p className="mb-1">
                                                                Mentor: {request.mentor.name || 'Unknown'} ({request.mentor.dept || 'Unknown'})
                                                            </p>
                                                            {/* Add message button for accepted requests */}
                                                            {request.status === 'accepted' && (
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    onClick={() => navigate('/messages', {
                                                                        state: { recipientEmail: request.mentor.email }
                                                                    })}
                                                                >
                                                                    <FaEnvelope className="me-1" /> Message Mentor
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="mb-1">Mentor: Not assigned yet</p>
                                                    )}
                                                    <p>{request.message || 'No message'}</p>
                                                </div>
                                                <div>
                                                    {getStatusBadge(request.status)}
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <p className="text-center py-3 text-muted">You haven't made any mentorship requests yet.</p>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="help" title="Mentorship Guidelines">
                    <Card className="shadow-sm">
                        <Card.Body>
                            <h4>How Mentorship Works</h4>
                            <p>
                                Our mentorship program connects you with alumni who can provide guidance,
                                feedback, and support for your projects. Here's how it works:
                            </p>

                            <h5>Step 1: Select a Project</h5>
                            <p>
                                Choose one of your projects that you'd like to receive mentorship for.
                                Make sure your project has a clear description and goals.
                            </p>

                            <h5>Step 2: Submit a Request</h5>
                            <p>
                                Write a message explaining what kind of mentorship you're looking for.
                                Be specific about challenges you're facing or areas where you need guidance.
                            </p>

                            <h5>Step 3: Wait for a Response</h5>
                            <p>
                                Alumni mentors will review your request and decide if they can help.
                                You'll receive a notification when someone accepts your request.
                            </p>

                            <h5>Step 4: Collaborate</h5>
                            <p>
                                Once a mentor accepts your request, you can message them directly to
                                discuss your project and set up meetings or check-ins.
                            </p>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default MentorshipRequest;