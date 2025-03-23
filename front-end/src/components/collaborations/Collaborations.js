import React, { useState, useEffect, useCallback } from 'react';
import { Container, Tabs, Tab, Card, Button, Form, Row, Col, Badge, Modal, Nav } from 'react-bootstrap';
import { collaborationService } from '../../services/api/collaborations';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { FaCheck, FaTimes, FaEnvelope, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Collaborations.css';

const StatusCard = ({ request }) => {
    const [showDetails, setShowDetails] = useState(false);

    // Defensive check for required properties
    if (!request || !request.project) {
        return null;
    }

    return (
        <Card className="mb-3 request-card">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                    <div
                        className="flex-grow-1"
                        onClick={() => setShowDetails(!showDetails)}
                        style={{ cursor: 'pointer' }}
                    >
                        <Card.Title>{request.project.title || 'Untitled Project'}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                            To: {request.project.owner_name || 'Unknown'} ({request.project.owner_dept || 'Unknown'})
                        </Card.Subtitle>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <Badge bg={
                                request.status === 'pending' ? 'warning' :
                                    request.status === 'accepted' ? 'success' : 'danger'
                            }>
                                {request.status || 'Unknown'}
                            </Badge>
                            <small className="text-muted">
                                Sent: {request.created_at ? new Date(request.created_at).toLocaleString() : 'Unknown date'}
                            </small>
                        </div>
                        <Card.Text>{request.message || 'No message'}</Card.Text>
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-3 project-details">
                        <h6 className="mb-3">Project Details</h6>
                        <p><strong>Abstract:</strong> {request.project.abstract || 'No abstract available'}</p>

                        <div className="mb-3">
                            <strong>Technologies:</strong>
                            <div className="d-flex gap-2 mt-2">
                                {(request.project.tech_stack || []).map((tech, index) => (
                                    <Badge
                                        key={`tech-${index}`}
                                        bg="secondary"
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {tech}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

const CollaboratedProjectCard = ({ project, onViewProject }) => {
    const [showDetails, setShowDetails] = useState(false);

    // Defensive check for required properties
    if (!project) {
        return null;
    }

    // Ensure owner exists and has required properties
    const owner = project.owner || {};
    const ownerName = owner.name || 'Unknown';
    const ownerDept = owner.dept || '';

    // Ensure collaborators is an array
    const collaborators = Array.isArray(project.collaborators) ? project.collaborators : [];

    // Ensure tech_stack is an array - checking both tech_stack and techStack fields
    const techStack = Array.isArray(project.tech_stack) ? project.tech_stack :
        (Array.isArray(project.techStack) ? project.techStack : []);

    return (
        <Card className="mb-3 project-card">
            <Card.Body>
                <div
                    className="d-flex justify-content-between align-items-start"
                    onClick={() => setShowDetails(!showDetails)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="flex-grow-1">
                        <Card.Title>{project.title || 'Untitled Project'}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                            Owner: {ownerName} ({ownerDept})
                        </Card.Subtitle>
                        <Card.Text>{project.abstract || 'No description available'}</Card.Text>

                        <div className="d-flex gap-2 mb-3">
                            {techStack.map((tech, index) => (
                                <Badge
                                    key={`tech-${index}`}
                                    bg="secondary"
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {tech}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <Button
                        variant="outline-primary"
                        size="sm"
                        title="View Project"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewProject(project._id);
                        }}
                    >
                        <FaEye />
                    </Button>
                </div>

                {showDetails && (
                    <div className="mt-3 project-details">
                        <div className="mb-3">
                            <strong>Collaborators:</strong>
                            {collaborators.length > 0 ? (
                                <ul className="list-unstyled mt-2">
                                    {collaborators.map((collab, index) => (
                                        <li key={collab.id || `collab-${index}`} className="mb-1">
                                            {collab.name || 'Unknown'} ({collab.dept || 'Unknown'})
                                            <small className="text-muted ms-2">
                                                Joined: {collab.joined_at ? new Date(collab.joined_at).toLocaleDateString() : 'Unknown date'}
                                            </small>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-2">No collaborators found</p>
                            )}
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

const RequestCard = ({ request, onStatusUpdate, onMessageSent, onViewProject }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [showMessageModal, setShowMessageModal] = useState(false);

    // Defensive check for required properties
    if (!request || !request.project || !request.student) {
        return null;
    }

    const cardStyle = {
        backgroundColor: request.status === 'rejected' ? '#fff5f5' : 'white',
        transition: 'background-color 0.3s ease'
    };

    const handleMessageSubmit = async () => {
        if (!messageText.trim()) {
            toast.warning('Please enter a message');
            return;
        }

        try {
            await collaborationService.sendMessage(request._id, messageText);
            toast.success('Message sent successfully');
            setMessageText('');
            setShowMessageModal(false);
            if (onMessageSent) onMessageSent();
        } catch (error) {
            console.error('Failed to send message:', error);
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
                            <Card.Title>{request.project.title || 'Untitled Project'}</Card.Title>
                            <Card.Subtitle className="mb-2 text-muted">
                                From: {request.student.name || 'Unknown'} ({request.student.dept || 'Unknown'})
                            </Card.Subtitle>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                <Badge bg={
                                    request.status === 'pending' ? 'warning' :
                                        request.status === 'accepted' ? 'success' : 'danger'
                                }>
                                    {request.status || 'Unknown'}
                                </Badge>
                                <small className="text-muted">
                                    Sent: {request.created_at ? new Date(request.created_at).toLocaleString() : 'Unknown date'}
                                </small>
                            </div>
                            <Card.Text>{request.message || 'No message'}</Card.Text>
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMessageModal(true);
                                }}
                            >
                                <FaEnvelope />
                            </Button>
                            <Button
                                variant="outline-info"
                                size="sm"
                                title="View Project"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewProject(request.project._id);
                                }}
                            >
                                <FaEye />
                            </Button>
                        </div>
                    </div>

                    {showDetails && (
                        <div className="mt-3 project-details">
                            <h6 className="mb-3">Project Details</h6>
                            <p><strong>Abstract:</strong> {request.project.abstract || 'No abstract available'}</p>

                            <div className="mb-3">
                                <strong>Technologies:</strong>
                                <div className="d-flex gap-2 mt-2">
                                    {(request.project.tech_stack || []).map((tech, index) => (
                                        <Badge key={`tech-${index}`} bg="secondary">{tech}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showMessageModal} onHide={() => setShowMessageModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Send Message to {request.student.name || 'Student'}</Modal.Title>
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
                    <Button variant="primary" onClick={handleMessageSubmit} disabled={!messageText.trim()}>
                        Send Message
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

const Collaborations = () => {
    const [activeTab, setActiveTab] = useState('explore');
    const [activeRequestsTab, setActiveRequestsTab] = useState('received'); // New state for nested tabs
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [collaboratedProjects, setCollaboratedProjects] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [filters, setFilters] = useState({ dept: '', tech: '' });
    const [availableDepts, setAvailableDepts] = useState([]);
    const [availableTech, setAvailableTech] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab, activeRequestsTab, filters]);

    // Updated loadData function// Part of Collaborations.js (the loadData function with enhanced debugging)
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'explore':
                    console.log('Explore tab active, filters:', filters);
                    const exploreResponse = await collaborationService.exploreProjects(filters);
                    console.log('Explore response type:', typeof exploreResponse);
                    console.log('Explore response:', exploreResponse);

                    // Handle different response structures
                    const exploreData = Array.isArray(exploreResponse) ? exploreResponse :
                        exploreResponse?.data && Array.isArray(exploreResponse.data) ?
                            exploreResponse.data : [];

                    console.log('Processed explore data:', exploreData);
                    setProjects(exploreData);

                    // Extract unique departments and technologies for filters
                    const departments = new Set();
                    const technologies = new Set();

                    exploreData.forEach(project => {
                        // Add department from creator
                        if (project.creator && project.creator.dept) {
                            departments.add(project.creator.dept);
                        }

                        // Add technologies from tech_stack or techStack
                        const techList = project.tech_stack || project.techStack || [];
                        techList.forEach(tech => technologies.add(tech));
                    });

                    setAvailableDepts(Array.from(departments).sort());
                    setAvailableTech(Array.from(technologies).sort());
                    break;

                case 'collaborated':
                    console.log('Collaborated tab active');
                    const collabResponse = await collaborationService.getCollaboratedProjects();
                    console.log('Collaborated response type:', typeof collabResponse);
                    console.log('Collaborated response:', collabResponse);

                    // Much more detailed handling for collaborated projects
                    let collabData = [];

                    // Case 1: Response is direct array
                    if (Array.isArray(collabResponse)) {
                        console.log('Response is direct array');
                        collabData = collabResponse;
                    }
                    // Case 2: Response has data property with array
                    else if (collabResponse?.data && Array.isArray(collabResponse.data)) {
                        console.log('Response has data property with array');
                        collabData = collabResponse.data;
                    }
                    // Case 3: Response has projects property with array 
                    else if (collabResponse?.projects && Array.isArray(collabResponse.projects)) {
                        console.log('Response has projects property with array');
                        collabData = collabResponse.projects;
                    }
                    // Case 4: For any other object response, try to extract known properties
                    else if (typeof collabResponse === 'object' && collabResponse !== null) {
                        console.log('Response is object, extracting properties');
                        // Check for any property that might be an array of projects
                        for (const key in collabResponse) {
                            if (Array.isArray(collabResponse[key]) &&
                                collabResponse[key].length > 0 &&
                                collabResponse[key][0].title) {
                                console.log(`Found possible projects array in '${key}' property`);
                                collabData = collabResponse[key];
                                break;
                            }
                        }
                    }

                    console.log('Final processed collaborated projects:', collabData);

                    // Extra check - if we find projects with collaboration flag
                    if (collabData.length === 0 && Array.isArray(exploreData)) {
                        console.log('No collaborated projects found, checking for collaboration flags in explore data');
                        collabData = exploreData.filter(project =>
                            project.isCollaborator === true ||
                            (project.collaborators && project.collaborators.some(c =>
                                c.id === user._id || c.email === user.email
                            ))
                        );
                        console.log('Projects filtered by collaboration flags:', collabData);
                    }

                    setCollaboratedProjects(collabData);
                    break;

                case 'requests':
                    // Handle nested tabs
                    if (activeRequestsTab === 'received') {
                        console.log('Received requests tab active');
                        const requestsResponse = await collaborationService.getRequests();
                        console.log('Received requests response:', requestsResponse);

                        const requestsData = Array.isArray(requestsResponse) ? requestsResponse :
                            requestsResponse?.data && Array.isArray(requestsResponse.data) ?
                                requestsResponse.data : [];

                        console.log('Processed received requests:', requestsData);
                        setReceivedRequests(requestsData);
                    } else {
                        console.log('Sent requests tab active');
                        const statusResponse = await collaborationService.getOutgoingRequests();
                        console.log('Sent requests response:', statusResponse);

                        const statusData = Array.isArray(statusResponse) ? statusResponse :
                            statusResponse?.data && Array.isArray(statusResponse.data) ?
                                statusResponse.data : [];

                        console.log('Processed sent requests:', statusData);
                        setSentRequests(statusData);
                    }
                    break;

                default:
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${activeTab} data:`, error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [activeTab, activeRequestsTab, filters, user]);

    const handleRequestCollaboration = async (projectId) => {
        try {
            await collaborationService.createRequest({
                project_id: projectId,
                message: "I would like to collaborate on your project."
            });
            toast.success('Collaboration request sent');
            loadData();
            // Automatically switch to the requests tab and sent subtab
            setActiveTab('requests');
            setActiveRequestsTab('sent');
        } catch (error) {
            console.error('Failed to send request:', error);
            toast.error('Failed to send request');
        }
    };

    const handleStatusUpdate = async (requestId, status) => {
        try {
            await collaborationService.updateRequest(requestId, status);
            toast.success(`Request ${status}`);
            loadData();
            // If accepting a request, also refresh collaborated projects
            if (status === 'accepted') {
                // Explicitly reload the collaborated projects tab data
                const collabResponse = await collaborationService.getCollaboratedProjects();
                console.log('Updated collaborated response after accept:', collabResponse);
                const collabData = Array.isArray(collabResponse) ? collabResponse :
                    collabResponse?.data && Array.isArray(collabResponse.data) ?
                        collabResponse.data : [];
                setCollaboratedProjects(collabData);
            }
        } catch (error) {
            console.error('Failed to update request:', error);
            toast.error('Failed to update request');
        }
    };

    const handleViewProject = (projectId) => {
        if (projectId) {
            navigate(`/projects/${projectId}`);
        } else {
            toast.error("Cannot view project - project ID is missing");
        }
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
                                                {availableDepts.map(dept => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
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
                                                {availableTech.map(tech => (
                                                    <option key={tech} value={tech}>{tech}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>

                            {loading ? (
                                <LoadingSpinner />
                            ) : projects.length > 0 ? (
                                <Row xs={1} md={2} lg={3} className="g-4">
                                    {projects.map((project, index) => (
                                        <Col key={project._id || `project-${index}`}>
                                            <Card className="h-100 shadow-sm">
                                                <Card.Body className="d-flex flex-column">
                                                    <div className="mb-3">
                                                        <Card.Title className="text-primary">
                                                            {project.title || 'Untitled Project'}
                                                        </Card.Title>
                                                        <Card.Subtitle className="mb-2 text-muted">
                                                            By: {project.creator?.name || 'Unknown'} ({project.creator?.dept || 'Unknown'})
                                                        </Card.Subtitle>
                                                        <Card.Text className="flex-grow-1">
                                                            {project.abstract || 'No description available'}
                                                        </Card.Text>
                                                    </div>
                                                    <div className="mt-auto">
                                                        <div className="d-flex flex-wrap gap-2 mb-3">
                                                            {(project.tech_stack || project.techStack || []).map((tech, idx) => (
                                                                <Badge key={`${tech}-${idx}`} bg="info" pill>
                                                                    {tech}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                        <div className="d-flex gap-2">
                                                            <Button
                                                                variant="primary"
                                                                onClick={() => handleRequestCollaboration(project._id)}
                                                                className="w-100"
                                                            >
                                                                Request Collaboration
                                                            </Button>
                                                            <Button
                                                                variant="outline-info"
                                                                onClick={() => handleViewProject(project._id)}
                                                            >
                                                                <FaEye />
                                                            </Button>
                                                        </div>
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
                                collaboratedProjects.map((project, index) => (
                                    <CollaboratedProjectCard
                                        key={project._id || `collab-project-${index}`}
                                        project={project}
                                        onViewProject={handleViewProject}
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
                            <Nav variant="tabs" className="mb-3" activeKey={activeRequestsTab} onSelect={setActiveRequestsTab}>
                                <Nav.Item>
                                    <Nav.Link eventKey="received">Received</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="sent">Sent</Nav.Link>
                                </Nav.Item>
                            </Nav>

                            {loading ? (
                                <LoadingSpinner />
                            ) : activeRequestsTab === 'received' ? (
                                receivedRequests.length > 0 ? (
                                    receivedRequests.map((request, index) => (
                                        <RequestCard
                                            key={request._id || `request-${index}`}
                                            request={request}
                                            onStatusUpdate={handleStatusUpdate}
                                            onMessageSent={loadData}
                                            onViewProject={handleViewProject}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-5">
                                        <h5 className="text-muted">No incoming collaboration requests</h5>
                                        <p className="text-muted">You'll see requests here when someone wants to collaborate on your projects</p>
                                    </div>
                                )
                            ) : sentRequests.length > 0 ? (
                                sentRequests.map((request, index) => (
                                    <StatusCard
                                        key={request._id || `status-${index}`}
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