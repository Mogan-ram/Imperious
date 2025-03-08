import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Badge, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { FaGithub, FaUserCircle, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
// import { projectService } from '../../services/api/projects';
// import { projectService } from '../../services/api/projects';
import { projectService } from '../../../services/api/projects';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './ProjectDetail.css';

const ProjectDetail = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjectDetails = async () => {
            setLoading(true);
            try {
                const response = await projectService.getProjectById(id);

                if (response && response.data) {
                    setProject(response.data);
                } else {
                    setError('Project not found');
                }
            } catch (err) {
                console.error('Error fetching project:', err);
                setError('Failed to load project details');
            } finally {
                setLoading(false);
            }
        };

        fetchProjectDetails();
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
            // Since your Profile component doesn't support URL parameters yet,
            // we'll navigate to a placeholder route and you can implement it later
            navigate(`/profile/${userId}`);
            toast.info("Profile viewing for other users will be implemented in a future update");
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
                <Spinner animation="border" role="status">
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

    // Determine if current user is creator, collaborator, or mentor
    const isCreator = project.created_by === user._id || project.created_by === user.email;
    const isCollaborator = project.collaborators &&
        project.collaborators.some(c => c.id === user._id || c.id === user.email);

    // This is a simplification - you might want to determine mentor status differently
    const isMentor = user.role === 'alumni';

    return (
        <Container className="py-4 project-detail">
            <Button
                variant="outline-secondary"
                className="mb-3"
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft className="me-2" /> Back
            </Button>

            <Card className="shadow-sm mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center bg-light">
                    <div>
                        <h2 className="mb-0">{project.title}</h2>
                        <div className="d-flex mt-2">
                            {getStatusBadge(project.progress)}

                            {project.techStack && project.techStack.map((tech, index) => (
                                <Badge
                                    key={index}
                                    bg="secondary"
                                    className="ms-2"
                                >
                                    {tech}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {project.githubLink && (
                        <Button
                            variant="outline-dark"
                            href={project.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FaGithub className="me-2" /> GitHub Repository
                        </Button>
                    )}
                </Card.Header>

                <Card.Body>
                    <h5>Abstract</h5>
                    <Card.Text className="mb-4">{project.abstract}</Card.Text>

                    {project.progress !== undefined && (
                        <div className="mb-4">
                            <h5>Progress</h5>
                            <div className="progress" style={{ height: '25px' }}>
                                <div
                                    className={`progress-bar bg-${project.progress === 100 ? 'success' :
                                        project.progress > 50 ? 'primary' :
                                            project.progress > 0 ? 'warning' : 'secondary'}`}
                                    role="progressbar"
                                    style={{ width: `${project.progress}%` }}
                                    aria-valuenow={project.progress}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                >
                                    {project.progress}%
                                </div>
                            </div>
                        </div>
                    )}

                    <h5>Modules</h5>
                    {project.modules && project.modules.length > 0 ? (
                        <ListGroup className="mb-4">
                            {project.modules.map((module, index) => (
                                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>{module.name}</strong>
                                        {module.githubLink && (
                                            <a
                                                href={module.githubLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ms-2 text-decoration-none"
                                            >
                                                <FaGithub /> GitHub
                                            </a>
                                        )}
                                    </div>
                                    <Badge
                                        bg={module.status === 'completed' ? 'success' : 'secondary'}
                                    >
                                        {module.status || 'Pending'}
                                    </Badge>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    ) : (
                        <Alert variant="info">No modules defined for this project.</Alert>
                    )}
                </Card.Body>
            </Card>

            <Card className="shadow-sm">
                <Card.Header className="bg-light">
                    <h4 className="mb-0">Team</h4>
                </Card.Header>
                <Card.Body>
                    <Row xs={1} md={2} className="g-4">
                        {/* Project Lead */}
                        <Col>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-primary text-white">Project Lead</Card.Header>
                                <Card.Body>
                                    <div className="d-flex align-items-center">
                                        <div
                                            className="bg-light rounded-circle d-flex justify-content-center align-items-center me-3"
                                            style={{ width: '50px', height: '50px' }}
                                        >
                                            <FaUserCircle size={30} className="text-secondary" />
                                        </div>
                                        <div>
                                            <h6 className="mb-0">{project.creator ? project.creator.name : "Unknown"}</h6>
                                            <div className="text-muted small">
                                                {project.creator ? project.creator.dept : ""}
                                            </div>
                                        </div>
                                    </div>

                                    {project.creator && project.creator._id !== user._id && (
                                        <div className="d-flex mt-3 justify-content-end">
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handleViewProfile(project.creator._id)}
                                            >
                                                <FaUserCircle className="me-1" /> Profile
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleMessageClick(project.creator)}
                                            >
                                                <FaEnvelope className="me-1" /> Message
                                            </Button>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Collaborators */}
                        <Col>
                            <Card className="h-100 border-0 shadow-sm">
                                <Card.Header className="bg-secondary text-white">Collaborators</Card.Header>
                                <Card.Body>
                                    {project.collaborators && project.collaborators.length > 0 ? (
                                        <ListGroup variant="flush">
                                            {project.collaborators.map((collab, index) => (
                                                <ListGroup.Item key={index} className="px-0 py-2 border-bottom">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center">
                                                            <div
                                                                className="bg-light rounded-circle d-flex justify-content-center align-items-center me-3"
                                                                style={{ width: '40px', height: '40px' }}
                                                            >
                                                                <FaUserCircle size={24} className="text-secondary" />
                                                            </div>
                                                            <div>
                                                                <h6 className="mb-0">{collab.name}</h6>
                                                                <div className="text-muted small">{collab.dept}</div>
                                                            </div>
                                                        </div>

                                                        {collab.id !== user._id && (
                                                            <div>
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    className="me-1"
                                                                    onClick={() => handleViewProfile(collab.id)}
                                                                >
                                                                    <FaUserCircle />
                                                                </Button>
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => handleMessageClick(collab)}
                                                                >
                                                                    <FaEnvelope />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <div className="text-center py-3 text-muted">
                                            No collaborators for this project yet.
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Conditionally render buttons based on user role */}
            {isCreator && (
                <div className="mt-4 d-flex justify-content-center">
                    <Button
                        variant="primary"
                        className="me-2"
                        onClick={() => navigate(`/projects/${id}/edit`)}
                    >
                        Edit Project
                    </Button>
                </div>
            )}
        </Container>
    );
};

export default ProjectDetail;