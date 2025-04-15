import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Card, Row, Col, Button, Badge, Alert,
    Spinner, Tabs, Tab, ProgressBar,
} from 'react-bootstrap';
import {
    FaGithub, FaUserCircle, FaEnvelope, FaArrowLeft, FaUsers,
    FaCalendarAlt, FaEdit, FaTasks, FaUserAlt
} from 'react-icons/fa';
import { projectService } from '../../../services/api/projects';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './ProjectDetail.css';

const ProjectDetail = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            try {
                const response = await projectService.getProjectById(id);
                console.log("Project data:", response);

                // Handle different response formats
                // Case 1: If response is the project object directly
                if (response && (response.title || response._id)) {
                    setProject(response);
                }
                // Case 2: If response has a data property (common in axios responses)
                else if (response && response.data) {
                    setProject(response.data);
                }
                // Case 3: If no valid project data found
                else {
                    setError('Project not found');
                }
            } catch (err) {
                console.error('Error fetching project:', err);
                setError(`Failed to load project details: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProjectDetails();
        } else {
            setError('No project ID provided');
            setLoading(false);
        }
    }, [id]);

    const handleMessageClick = (recipient) => {
        if (recipient.email) {
            navigate('/messages', { state: { recipientEmail: recipient.email } });
        } else {
            toast.error("Cannot start conversation - user email is missing");
        }
    };

    const handleViewProfile = (userId) => {
        if (userId) {
            navigate(`/profile/${userId}`);
        } else {
            toast.error("Cannot view profile - user ID is missing");
        }
    };

    const getStatusBadge = (progress) => {
        if (!progress && progress !== 0) return <Badge bg="secondary">Unknown</Badge>;

        if (progress === 100) return <Badge bg="success">Completed</Badge>;
        if (progress > 50) return <Badge bg="primary">In Progress</Badge>;
        if (progress > 0) return <Badge bg="warning">Started</Badge>;
        return <Badge bg="secondary">Not Started</Badge>;
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" className="text-primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-3">Loading project details...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={() => navigate(-1)}>
                            Go Back
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    if (!project) {
        return (
            <Container className="py-5">
                <Alert variant="warning">
                    <Alert.Heading>Project Not Found</Alert.Heading>
                    <p>We couldn't find the project you're looking for.</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-primary" onClick={() => navigate(-1)}>
                            Go Back
                        </Button>
                    </div>
                </Alert>
            </Container>
        );
    }

    // Normalize data structure to account for different property names
    const techStack = project.techStack || project.tech_stack || [];
    const projectCreator = project.creator || {};

    // Determine if current user is creator, collaborator, or mentor
    const isCreator = user && (
        project.created_by === user._id ||
        project.created_by === user.email ||
        (projectCreator._id && projectCreator._id === user._id)
    );

    // const isCollaborator = user && project.collaborators &&
    //     project.collaborators.some(c =>
    //         c.id === user._id ||
    //         c.id === user.email ||
    //         c.email === user.email
    //     );

    // const isMentor = user && user.role === 'alumni';

    return (
        <Container className="py-4 project-detail">
            <Button
                variant="outline-secondary"
                className="mb-3"
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft className="me-2" /> Back
            </Button>

            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <h2 className="mb-2">{project.title}</h2>
                        <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                            {getStatusBadge(project.progress)}

                            {techStack.map((tech, index) => (
                                <Badge key={index} bg="info" className="tech-badge">{tech}</Badge>
                            ))}

                            {project.created_at && (
                                <div className="ms-2 text-muted small">
                                    <FaCalendarAlt className="me-1" />
                                    Created: {new Date(project.created_at).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>

                    {isCreator && (
                        <Button
                            variant="outline-primary"
                            onClick={() => navigate(`/projects/${id}/edit`)}
                            className="btn-project"
                        >
                            <FaEdit className="me-2" /> Edit Project
                        </Button>
                    )}

                    {project.githubLink && (
                        <Button
                            variant="outline-dark"
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-project ms-2"
                        >
                            <FaGithub className="me-2" /> GitHub Repository
                        </Button>
                    )}
                </div>
            </div>

            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
            >
                <Tab eventKey="overview" title="Overview">
                    <Row>
                        <Col md={8}>
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">Project Details</h5>
                                </Card.Header>
                                <Card.Body>
                                    <h6>Abstract</h6>
                                    <p>{project.abstract || 'No abstract provided.'}</p>

                                    {project.progress !== undefined && (
                                        <>
                                            <h6 className="mt-4">Progress</h6>
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="flex-grow-1 me-3">
                                                    <ProgressBar
                                                        now={project.progress}
                                                        variant={
                                                            project.progress === 100 ? 'success' :
                                                                project.progress > 50 ? 'primary' :
                                                                    project.progress > 0 ? 'warning' : 'secondary'
                                                        }
                                                        style={{ height: '12px' }}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <span className="fw-bold">{project.progress}%</span>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-between text-muted small">
                                                <span>Not Started</span>
                                                <span>In Progress</span>
                                                <span>Completed</span>
                                            </div>
                                        </>
                                    )}

                                    {project.description && (
                                        <>
                                            <h6 className="mt-4">Description</h6>
                                            <p>{project.description}</p>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">Project Lead</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="d-flex justify-content-center align-items-center me-3 rounded-circle bg-primary text-white"
                                            style={{ width: '48px', height: '48px' }}
                                        >
                                            {projectCreator.name ? projectCreator.name.charAt(0).toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <h6 className="mb-1">{projectCreator.name || "Unknown"}</h6>
                                            <div className="text-muted small">
                                                {projectCreator.dept || ""}
                                            </div>
                                        </div>
                                    </div>

                                    {user && projectCreator && projectCreator._id && projectCreator._id !== user._id && (
                                        <div className="d-flex mt-3 justify-content-between">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="w-100 me-2"
                                                onClick={() => handleViewProfile(projectCreator._id)}
                                            >
                                                <FaUserCircle className="me-1" /> View Profile
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="w-100"
                                                onClick={() => handleMessageClick(projectCreator)}
                                            >
                                                <FaEnvelope className="me-1" /> Message
                                            </Button>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card className="shadow-sm mb-4">
                                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Project Stats</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col xs={6}>
                                            <div className="stats-card text-center mb-3">
                                                <div className="mb-2">
                                                    <FaUsers size={24} className="text-primary" />
                                                </div>
                                                <div className="fs-4 fw-bold">
                                                    {((project.collaborators || []).length + 1)}
                                                </div>
                                                <div className="text-muted small">Team Members</div>
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <div className="stats-card text-center mb-3">
                                                <div className="mb-2">
                                                    <FaTasks size={24} className="text-primary" />
                                                </div>
                                                <div className="fs-4 fw-bold">
                                                    {(project.modules || []).length}
                                                </div>
                                                <div className="text-muted small">Modules</div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Tab>

                <Tab eventKey="modules" title="Modules">
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Project Modules</h5>
                        </Card.Header>
                        <Card.Body>
                            {project.modules && project.modules.length > 0 ? (
                                <div>
                                    {project.modules.map((module, index) => (
                                        <div
                                            key={index}
                                            className="card mb-3 shadow-sm"
                                        >
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <h5>{module.name || `Module ${index + 1}`}</h5>
                                                        <div className="mb-2">
                                                            <Badge
                                                                bg={
                                                                    module.status === 'completed' ? 'success' :
                                                                        module.status === 'in-progress' ? 'primary' : 'secondary'
                                                                }
                                                            >
                                                                {module.status || 'Not Started'}
                                                            </Badge>
                                                        </div>
                                                        {module.description && <p className="text-muted mb-0">{module.description}</p>}
                                                    </div>

                                                    {module.githubLink && (
                                                        <a
                                                            href={module.githubLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn btn-sm btn-outline-dark"
                                                        >
                                                            <FaGithub className="me-1" /> Code
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Alert variant="info">No modules defined for this project.</Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="team" title="Team">
                    <Card className="shadow-sm mb-4">
                        <Card.Header className="bg-white">
                            <h5 className="mb-0">Project Team</h5>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex align-items-center p-3 border-bottom">
                                <div
                                    className="d-flex justify-content-center align-items-center me-3 rounded-circle bg-primary text-white"
                                    style={{ width: '48px', height: '48px' }}
                                >
                                    {projectCreator.name ? projectCreator.name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div className="flex-grow-1">
                                    <h6 className="mb-1">{projectCreator.name || "Unknown"}</h6>
                                    <div className="text-muted small">{projectCreator.dept || ""}</div>
                                    <Badge bg="primary" className="mt-1">Project Lead</Badge>
                                </div>

                                {user && projectCreator && projectCreator._id && projectCreator._id !== user._id && (
                                    <div className="d-flex">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => handleViewProfile(projectCreator._id)}
                                        >
                                            <FaUserAlt />
                                        </Button>
                                        <Button
                                            variant="outline-info"
                                            size="sm"
                                            onClick={() => handleMessageClick(projectCreator)}
                                        >
                                            <FaEnvelope />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {project.collaborators && project.collaborators.length > 0 ? (
                                <div>
                                    {project.collaborators.map((collab, index) => (
                                        <div key={collab.id || `collab-${index}`} className="d-flex align-items-center p-3 border-bottom">
                                            <div
                                                className="d-flex justify-content-center align-items-center me-3 rounded-circle bg-info text-white"
                                                style={{ width: '48px', height: '48px' }}
                                            >
                                                {collab.name ? collab.name.charAt(0).toUpperCase() : "C"}
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1">{collab.name || 'Unknown'}</h6>
                                                <div className="text-muted small">{collab.dept || 'Unknown'}</div>
                                                <Badge bg="info" className="mt-1">Collaborator</Badge>
                                            </div>

                                            {user && collab.id && collab.id !== user._id && (
                                                <div className="d-flex">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => handleViewProfile(collab.id)}
                                                    >
                                                        <FaUserAlt />
                                                    </Button>
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        onClick={() => handleMessageClick(collab)}
                                                    >
                                                        <FaEnvelope />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3 text-muted">
                                    No collaborators for this project yet.
                                </div>
                            )}

                            {project.mentor_id && (
                                <div className="mt-4">
                                    <h6 className="mb-3">Project Mentor</h6>
                                    <div className="d-flex align-items-center p-3 border rounded">
                                        <div
                                            className="d-flex justify-content-center align-items-center me-3 rounded-circle bg-warning text-white"
                                            style={{ width: '48px', height: '48px' }}
                                        >
                                            M
                                        </div>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">Project Mentor</h6>
                                            <Badge bg="warning" className="mt-1">Mentor</Badge>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default ProjectDetail;