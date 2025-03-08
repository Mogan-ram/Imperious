// src/components/analytics/MenteesList.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Table, Badge, Alert, Button, Row, Col,
    Tabs, Tab, ProgressBar, Dropdown, Modal
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import {
    FaComments, FaEnvelope, FaExternalLinkAlt, FaGithub,
    FaCalendarAlt, FaClipboardList, FaChartLine, FaUser, FaCogs
} from 'react-icons/fa';
import messagingService from '../../services/api/messaging';
import { Line } from 'react-chartjs-2';

const MenteesList = ({ alumnusId }) => {
    const [mentees, setMentees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [alumnus, setAlumnus] = useState(null);
    const [activeTab, setActiveTab] = useState('list');
    const [selectedMentee, setSelectedMentee] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const { user, authToken } = useAuth();
    const navigate = useNavigate();

    const fetchMentees = useCallback(async () => {
        if (!alumnusId) return; // Don't fetch if no alumnusId

        setLoading(true);
        setError(null);
        try {
            // First get the alumni data
            const alumniList = await alumniApi.getAlumniWillingness("", authToken);
            const currentAlumnus = alumniList.find(a => a.email === alumnusId);
            setAlumnus(currentAlumnus);

            // Get mentees data
            const data = await alumniApi.getAlumniMentees(alumnusId, authToken);
            setMentees(data);
        } catch (err) {
            setError('Failed to fetch mentees.');
            toast.error('Failed to fetch mentees.');
            console.error("Error fetching mentees:", err);
        } finally {
            setLoading(false);
        }
    }, [alumnusId, authToken]);

    useEffect(() => {
        fetchMentees();
    }, [fetchMentees]);

    // Initialize conversation with mentee
    const startConversation = async (menteeEmail) => {
        try {
            // First search for the mentee user
            const searchResult = await messagingService.searchUsers(menteeEmail);

            if (searchResult && searchResult.length > 0) {
                const menteeUser = searchResult.find(u => u.email === menteeEmail);

                if (menteeUser) {
                    // Create a conversation with this mentee
                    await messagingService.createConversation([menteeEmail, user.email]);
                    toast.success(`Conversation started with ${menteeUser.name}`);

                    // Navigate to messages page
                    navigate('/messages');
                }
            } else {
                toast.error("Could not find mentee user details");
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    // View project details
    const viewProject = (project) => {
        if (project && project._id) {
            navigate(`/projects/${project._id}`);
        } else {
            toast.warning("Project details not available");
        }
    };

    // Open project modal
    const openProjectModal = (mentee) => {
        setSelectedMentee(mentee);
        setShowProjectModal(true);
    };

    // View profile
    const viewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!mentees || mentees.length === 0) {
        return (
            <Card body>
                <p className="mb-0">No mentees found for this alumnus.</p>
            </Card>
        );
    }

    // Calculate statistics
    const totalMentees = mentees.length;
    const activeMentees = mentees.filter(m => m.status === 'active').length;
    const completedProjects = mentees.filter(m => m.project && m.project.progress === 100).length;
    const inProgressProjects = mentees.filter(m => m.project && m.project.progress < 100 && m.project.progress > 0).length;

    // Prepare data for progress chart
    const progressData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Mentee Progress',
                data: [30, 45, 60, 70, 85, 92],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Prepare data for activity chart
    const activityData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [
            {
                label: 'Mentorship Sessions',
                data: [2, 3, 2, 4, 3, 5],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Code Reviews',
                data: [1, 2, 3, 2, 4, 3],
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    return (
        <div>
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                id="mentees-tabs"
                className="mb-3"
            >
                <Tab eventKey="list" title="Mentees List">
                    <Card>
                        <Card.Body>
                            <Card.Title className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    {alumnus ? (
                                        <span>Mentees of {alumnus.name}</span>
                                    ) : (
                                        <span>Mentee List</span>
                                    )}
                                </div>
                                <div>
                                    <Badge bg="primary" className="me-2">Total: {totalMentees}</Badge>
                                    <Badge bg="success" className="me-2">Active: {activeMentees}</Badge>
                                    <Badge bg="info">Completed Projects: {completedProjects}</Badge>
                                </div>
                            </Card.Title>

                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Department</th>
                                        <th>Project</th>
                                        <th>Progress</th>
                                        <th>Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mentees.map((mentee, index) => (
                                        <tr key={mentee._id || index}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar-circle me-2 bg-primary">
                                                        {mentee.name?.charAt(0).toUpperCase() || 'M'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{mentee.name}</div>
                                                        <small className="text-muted">{mentee.email}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{mentee.dept}</td>
                                            <td>
                                                {mentee.project ? (
                                                    <div>
                                                        <div className="fw-bold">{mentee.project.title}</div>
                                                        <small className="text-muted">{mentee.project.techStack?.join(', ')}</small>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">No project</span>
                                                )}
                                            </td>
                                            <td>
                                                {mentee.project ? (
                                                    <div>
                                                        <ProgressBar
                                                            now={mentee.project.progress || 0}
                                                            label={`${mentee.project.progress || 0}%`}
                                                            variant={
                                                                mentee.project.progress >= 75 ? 'success' :
                                                                    mentee.project.progress >= 50 ? 'info' :
                                                                        mentee.project.progress >= 25 ? 'warning' :
                                                                            'danger'
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">N/A</span>
                                                )}
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    mentee.status === 'active' ? 'success' :
                                                        mentee.status === 'pending' ? 'warning' :
                                                            'secondary'
                                                }>
                                                    {mentee.status || 'Active'}
                                                </Badge>
                                            </td>
                                            <td className="text-center">
                                                <Dropdown>
                                                    <Dropdown.Toggle variant="primary" size="sm" id={`dropdown-${index}`}>
                                                        Actions
                                                    </Dropdown.Toggle>
                                                    <Dropdown.Menu>
                                                        <Dropdown.Item onClick={() => startConversation(mentee.email)}>
                                                            <FaComments className="me-2" /> Message
                                                        </Dropdown.Item>
                                                        <Dropdown.Item href={`mailto:${mentee.email}`}>
                                                            <FaEnvelope className="me-2" /> Email
                                                        </Dropdown.Item>
                                                        <Dropdown.Item onClick={() => viewProfile(mentee._id)}>
                                                            <FaUser className="me-2" /> View Profile
                                                        </Dropdown.Item>
                                                        {mentee.project && (
                                                            <>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item onClick={() => openProjectModal(mentee)}>
                                                                    <FaClipboardList className="me-2" /> Project Details
                                                                </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => viewProject(mentee.project)}>
                                                                    <FaExternalLinkAlt className="me-2" /> Go to Project
                                                                </Dropdown.Item>
                                                            </>
                                                        )}
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="stats" title="Mentorship Statistics">
                    <Card>
                        <Card.Body>
                            <Card.Title>Mentorship Statistics</Card.Title>

                            <Row className="mb-4">
                                <Col md={4}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h1 className="display-4">{totalMentees}</h1>
                                            <p className="text-muted">Total Mentees</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h1 className="display-4">{completedProjects}</h1>
                                            <p className="text-muted">Completed Projects</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={4}>
                                    <Card className="text-center">
                                        <Card.Body>
                                            <h1 className="display-4">{inProgressProjects}</h1>
                                            <p className="text-muted">In-Progress Projects</p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Card className="mb-4">
                                        <Card.Body>
                                            <Card.Title>Overall Progress</Card.Title>
                                            <div style={{ height: '300px' }}>
                                                <Line
                                                    data={progressData}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                max: 100,
                                                                title: {
                                                                    display: true,
                                                                    text: 'Progress (%)'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card className="mb-4">
                                        <Card.Body>
                                            <Card.Title>Mentorship Activity</Card.Title>
                                            <div style={{ height: '300px' }}>
                                                <Line
                                                    data={activityData}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                title: {
                                                                    display: true,
                                                                    text: 'Count'
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Project Modal */}
            <Modal
                show={showProjectModal}
                onHide={() => setShowProjectModal(false)}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedMentee?.project?.title || 'Project Details'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedMentee && selectedMentee.project ? (
                        <div>
                            <Row className="mb-4">
                                <Col md={8}>
                                    <h5>Abstract</h5>
                                    <p>{selectedMentee.project.abstract || 'No abstract available'}</p>
                                </Col>
                                <Col md={4}>
                                    <div className="project-meta">
                                        <div className="d-flex justify-content-between mb-2">
                                            <strong>Progress:</strong>
                                            <span>{selectedMentee.project.progress || 0}%</span>
                                        </div>
                                        <ProgressBar
                                            now={selectedMentee.project.progress || 0}
                                            variant={
                                                selectedMentee.project.progress >= 75 ? 'success' :
                                                    selectedMentee.project.progress >= 50 ? 'info' :
                                                        selectedMentee.project.progress >= 25 ? 'warning' :
                                                            'danger'
                                            }
                                            className="mb-3"
                                        />

                                        <div className="mb-2">
                                            <strong>Student:</strong> {selectedMentee.name}
                                        </div>

                                        <div className="mb-2">
                                            <strong>Department:</strong> {selectedMentee.dept}
                                        </div>

                                        <div className="mb-2">
                                            <strong>Batch:</strong> {selectedMentee.batch || 'N/A'}
                                        </div>

                                        {selectedMentee.project.githubLink && (
                                            <div className="mb-2">
                                                <strong>GitHub:</strong> <a href={selectedMentee.project.githubLink} target="_blank" rel="noopener noreferrer">{selectedMentee.project.githubLink}</a>
                                            </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>

                            <hr />

                            <h5 className="mb-3">Technologies</h5>
                            <div className="mb-4">
                                {selectedMentee.project.techStack && selectedMentee.project.techStack.length > 0 ? (
                                    <div>
                                        {selectedMentee.project.techStack.map((tech, index) => (
                                            <Badge
                                                bg="primary"
                                                className="me-2 mb-2"
                                                key={index}
                                                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
                                            >
                                                {tech}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">No technologies specified</p>
                                )}
                            </div>

                            <h5 className="mb-3">Modules</h5>
                            {selectedMentee.project.modules && selectedMentee.project.modules.length > 0 ? (
                                <div className="project-modules">
                                    {selectedMentee.project.modules.map((module, index) => (
                                        <Card key={index} className="mb-3">
                                            <Card.Body>
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">{module.name}</h6>
                                                    <Badge bg={
                                                        module.status === 'completed' ? 'success' :
                                                            module.status === 'in-progress' ? 'warning' :
                                                                'secondary'
                                                    }>
                                                        {module.status || 'Not Started'}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted small mt-2 mb-0">{module.description}</p>
                                            </Card.Body>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No modules specified</p>
                            )}
                        </div>
                    ) : (
                        <p>No project details available</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {selectedMentee && selectedMentee.project && (
                        <Button
                            variant="primary"
                            onClick={() => viewProject(selectedMentee.project)}
                        >
                            <FaExternalLinkAlt className="me-2" /> Go to Project
                        </Button>
                    )}
                    <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Custom CSS */}
            <style jsx="true">{`
                .avatar-circle {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                }
            `}</style>
        </div>
    );
};

export default MenteesList;