import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Card, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { collaborationService } from '../../services/api/collaborations';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { FaCheck, FaTimes, FaEnvelope } from 'react-icons/fa';

const StatusCard = ({ request }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <Card className="mb-3 request-card">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <div
                        className="flex-grow-1"
                        onClick={() => setShowDetails(!showDetails)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Card.Title>{request.project.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                            To: {request.project.owner_name} ({request.project.owner_dept})
                        </Card.Subtitle>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Badge bg={
                                request.status === 'pending' ? 'warning' :
                                    request.status === 'accepted' ? 'success' : 'danger'
                            }>
                                {request.status}
                            </Badge>
                            <small className="text-muted">
                                Sent: {new Date(request.created_at).toLocaleString()}
                            </small>
                        </div>
                        <Card.Text>{request.message}</Card.Text>
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-3 project-details">
                        <h6 className="mb-3">Project Details</h6>
                        <p><strong>Abstract:</strong> {request.project.abstract}</p>

                        <div className="mb-3">
                            <strong>Technologies:</strong>
                            <div className="d-flex gap-2 mt-2">
                                {request.project.tech_stack.map(tech => (
                                    <Badge key={tech} bg="secondary">{tech}</Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

const CollaboratedProjectCard = ({ project }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <Card className="mb-3 project-card">
            <Card.Body>
                <div
                    className="d-flex justify-content-between align-items-start"
                    onClick={() => setShowDetails(!showDetails)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="flex-grow-1">
                        <Card.Title>{project.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                            Owner: {project.owner.name} ({project.owner.dept})
                        </Card.Subtitle>
                        <Card.Text>{project.abstract}</Card.Text>

                        <div className="d-flex gap-2 mb-3">
                            {project.tech_stack.map(tech => (
                                <Badge key={tech} bg="secondary">{tech}</Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-3 project-details">
                        <div className="mb-3">
                            <strong>Collaborators:</strong>
                            <ul className="list-unstyled mt-2">
                                {project.collaborators.map(collab => (
                                    <li key={collab.id} className="mb-1">
                                        {collab.name} ({collab.dept})
                                        <small className="text-muted ms-2">
                                            Joined: {new Date(collab.joined_at).toLocaleDateString()}
                                        </small>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

const Collaborations = () => {
    const [activeTab, setActiveTab] = useState('explore');
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [collaboratedProjects, setCollaboratedProjects] = useState([]);
    const [requests, setRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [filters, setFilters] = useState({ dept: '', tech: '' });
    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, [activeTab, filters]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'explore':
                    const exploreResponse = await collaborationService.exploreProjects(filters);
                    setProjects(exploreResponse.data || []);
                    break;
                case 'collaborated':
                    const collabResponse = await collaborationService.getCollaboratedProjects();
                    setCollaboratedProjects(collabResponse.data || []);
                    break;
                case 'requests':
                    const requestsResponse = await collaborationService.getRequests();
                    setRequests(requestsResponse.data || []);
                    break;
                case 'status':
                    const statusResponse = await collaborationService.getOutgoingRequests();
                    setOutgoingRequests(statusResponse.data || []);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [activeTab, filters]);

    const handleRequestCollaboration = async (projectId) => {
        try {
            await collaborationService.createRequest({
                project_id: projectId,
                message: "I would like to collaborate on your project."
            });
            toast.success('Collaboration request sent');
            loadData();
        } catch (error) {
            toast.error('Failed to send request');
        }
    };

    const handleStatusUpdate = async (requestId, status) => {
        try {
            await collaborationService.updateRequest(requestId, status);
            toast.success(`Request ${status}`);
            loadData();
        } catch (error) {
            toast.error('Failed to update request');
        }
    };

    const RequestCard = ({ request, onStatusUpdate, onMessageSent }) => {
        const [showDetails, setShowDetails] = useState(false);
        const [messageText, setMessageText] = useState('');
        const [showMessageModal, setShowMessageModal] = useState(false);

        const cardStyle = {
            backgroundColor: request.status === 'rejected' ? '#fff5f5' : 'white',
            transition: 'background-color 0.3s ease'
        };

        const handleMessageSubmit = async () => {
            try {
                await collaborationService.sendMessage(request._id, messageText);
                toast.success('Message sent successfully');
                setMessageText('');
                setShowMessageModal(false);
                if (onMessageSent) onMessageSent();
            } catch (error) {
                toast.error('Failed to send message');
            }
        };

        return (
            <>
                <Card className="mb-3 request-card" style={cardStyle}>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                            <div
                                className="flex-grow-1"
                                onClick={() => setShowDetails(!showDetails)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card.Title>{request.project.title}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">
                                    From: {request.student.name} ({request.student.dept})
                                </Card.Subtitle>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <Badge bg={
                                        request.status === 'pending' ? 'warning' :
                                            request.status === 'accepted' ? 'success' : 'danger'
                                    }>
                                        {request.status}
                                    </Badge>
                                    <small className="text-muted">
                                        Sent: {new Date(request.created_at).toLocaleString()}
                                    </small>
                                </div>
                                <Card.Text>{request.message}</Card.Text>
                            </div>
                            <div className="d-flex gap-2">
                                {request.status === 'pending' && (
                                    <>
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            title="Accept Request"
                                            onClick={() => onStatusUpdate(request._id, 'accepted')}
                                        >
                                            <FaCheck />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            title="Reject Request"
                                            onClick={() => onStatusUpdate(request._id, 'rejected')}
                                        >
                                            <FaTimes />
                                        </Button>
                                    </>
                                )}
                                {request.status === 'rejected' && (
                                    <Button
                                        variant="outline-success"
                                        size="sm"
                                        title="Accept Request"
                                        onClick={() => onStatusUpdate(request._id, 'accepted')}
                                    >
                                        <FaCheck />
                                    </Button>
                                )}
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    title="Send Message"
                                    onClick={() => setShowMessageModal(true)}
                                >
                                    <FaEnvelope />
                                </Button>
                            </div>
                        </div>

                        {showDetails && (
                            <div className="mt-3 project-details">
                                <h6 className="mb-3">Project Details</h6>
                                <p><strong>Abstract:</strong> {request.project.abstract}</p>

                                <div className="mb-3">
                                    <strong>Technologies:</strong>
                                    <div className="d-flex gap-2 mt-2">
                                        {request.project.tech_stack.map(tech => (
                                            <Badge key={tech} bg="secondary">{tech}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Send Message to {request.student.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group>
                            <Form.Label>Message</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                placeholder="Type your message here..."
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowMessageModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleMessageSubmit}>
                            Send Message
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
        );
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Project Collaborations</h2>
            <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
                <Tab eventKey="explore" title="Explore">
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <Form className="mb-4">
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Department</Form.Label>
                                            <Form.Select
                                                value={filters.dept}
                                                onChange={(e) => setFilters({ ...filters, dept: e.target.value })}
                                                className="form-select-lg"
                                            >
                                                <option value="">All Departments</option>
                                                <option value="CSE">CSE</option>
                                                <option value="ECE">ECE</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Technology</Form.Label>
                                            <Form.Select
                                                value={filters.tech}
                                                onChange={(e) => setFilters({ ...filters, tech: e.target.value })}
                                                className="form-select-lg"
                                            >
                                                <option value="">All Technologies</option>
                                                <option value="React">React</option>
                                                <option value="Python">Python</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>

                            {loading ? (
                                <LoadingSpinner />
                            ) : projects.length > 0 ? (
                                <Row xs={1} md={2} lg={3} className="g-4">
                                    {projects.map(project => (
                                        <Col key={project._id}>
                                            <Card className="h-100 shadow-sm">
                                                <Card.Body className="d-flex flex-column">
                                                    <div className="mb-3">
                                                        <Card.Title className="text-primary">
                                                            {project.title}
                                                        </Card.Title>
                                                        <Card.Subtitle className="mb-2 text-muted">
                                                            By: {project.creator?.name} ({project.creator?.dept})
                                                        </Card.Subtitle>
                                                        <Card.Text className="flex-grow-1">
                                                            {project.abstract}
                                                        </Card.Text>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                                            {project.tech_stack?.map(tech => (
                                                                <Badge key={tech} bg="info" pill>
                                                                    {tech}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => handleRequestCollaboration(project._id)}
                                                            className="w-100"
                                                        >
                                                            Request Collaboration
                                                        </Button>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <div className="text-center py-5">
                                    <h5 className="text-muted">No projects found</h5>
                                    <p className="text-muted">Try adjusting your filters</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="collaborated" title="Collaborated">
                    <Card className="mb-4">
                        <Card.Body>
                            {loading ? (
                                <LoadingSpinner />
                            ) : collaboratedProjects.length > 0 ? (
                                collaboratedProjects.map(project => (
                                    <CollaboratedProjectCard
                                        key={project._id}
                                        project={project}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <h5 className="text-muted">No collaborated projects</h5>
                                    <p className="text-muted">Projects you collaborate on will appear here</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="requests" title="Requests">
                    <Card className="mb-4">
                        <Card.Body>
                            {loading ? (
                                <LoadingSpinner />
                            ) : requests.length > 0 ? (
                                requests.map(request => (
                                    <RequestCard
                                        key={request._id}
                                        request={request}
                                        onStatusUpdate={handleStatusUpdate}
                                        onMessageSent={loadData}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <h5 className="text-muted">No incoming collaboration requests</h5>
                                    <p className="text-muted">You'll see requests here when someone wants to collaborate on your projects</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="status" title="Status">
                    <Card className="mb-4">
                        <Card.Body>
                            {loading ? (
                                <LoadingSpinner />
                            ) : outgoingRequests.length > 0 ? (
                                outgoingRequests.map(request => (
                                    <StatusCard
                                        key={request._id}
                                        request={request}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-5">
                                    <h5 className="text-muted">No outgoing requests</h5>
                                    <p className="text-muted">Your collaboration requests will appear here</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default Collaborations;