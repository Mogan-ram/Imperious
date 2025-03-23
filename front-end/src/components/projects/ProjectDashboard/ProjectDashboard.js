import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaFolderOpen, FaPlus, FaHandshake, FaUsers, FaChartLine, FaCode, FaProjectDiagram } from 'react-icons/fa';
import '../ProjectStyles.css';


const DashboardCard = ({ icon, title, description, link, color }) => {
    const IconComponent = icon;

    return (
        <Card as={Link} to={link} className="project-card h-100 text-decoration-none">
            <Card.Body className="d-flex flex-column text-center p-4">
                <div
                    className={`icon-circle mb-3 mx-auto d-flex align-items-center justify-content-center bg-${color}-subtle text-${color}`}
                    style={{ width: '80px', height: '80px', borderRadius: '50%' }}
                >
                    <IconComponent size={32} />
                </div>
                <Card.Title as="h4" className="mb-3">{title}</Card.Title>
                <Card.Text className="text-muted flex-grow-1">{description}</Card.Text>
                <div className="mt-3">
                    <Button variant={`outline-${color}`} className="w-100">
                        Explore
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

const ProjectDashboard = () => {
    const dashboardCards = [
        {
            icon: FaFolderOpen,
            title: 'My Projects',
            description: 'View and manage your ongoing projects and track their progress',
            link: '/projects/my-projects',
            color: 'primary'
        },
        {
            icon: FaPlus,
            title: 'Create Project',
            description: 'Start a new project journey with detailed planning and structure',
            link: '/projects/create',
            color: 'success'
        },
        {
            icon: FaHandshake,
            title: 'Seek Mentorship',
            description: 'Connect with experienced alumni mentors for guidance on your projects',
            link: '/projects/mentorship',
            color: 'info'
        },
        {
            icon: FaUsers,
            title: 'Collaborations',
            description: 'Find project partners or join existing projects as a collaborator',
            link: '/projects/collaborations',
            color: 'warning'
        }
    ];

    return (
        <Container className="py-5 animated-container">
            <div className="text-center mb-5">
                <div className="d-inline-block p-3 rounded-circle bg-light mb-4">
                    <FaProjectDiagram size={48} className="text-primary" />
                </div>
                <h1 className="fw-bold mb-3">Project Hub</h1>
                <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                    Create, manage, and collaborate on projects. Connect with mentors and showcase your work.
                </p>
            </div>

            <Row xs={1} md={2} xl={4} className="g-4 mb-5 animated-section">
                {dashboardCards.map((card, index) => (
                    <Col key={index}>
                        <DashboardCard {...card} />
                    </Col>
                ))}
            </Row>

            <Card className="shadow-sm mb-5 animated-section">
                <Card.Body className="p-4">
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h3>Looking for project ideas?</h3>
                            <p className="mb-md-0">
                                Explore our collection of project ideas from industry experts and academic mentors.
                                Find inspiration for your next project or get guidance on how to approach technical challenges.
                            </p>
                        </Col>
                        <Col md={4} className="text-md-end">
                            <Button variant="primary" className="btn-project">
                                <FaChartLine className="me-2" /> Explore Ideas
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row className="g-4 animated-section">
                <Col md={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h4 className="mb-0">Recent Activity</h4>
                        </Card.Header>
                        <Card.Body>
                            <div className="timeline">
                                <div className="timeline-item">
                                    <div className="timeline-marker bg-success"></div>
                                    <div className="timeline-content">
                                        <p className="mb-0"><strong>Project created:</strong> Mobile App Development</p>
                                        <p className="text-muted small mb-0">2 days ago</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker bg-primary"></div>
                                    <div className="timeline-content">
                                        <p className="mb-0"><strong>Module updated:</strong> Authentication System</p>
                                        <p className="text-muted small mb-0">5 days ago</p>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker bg-info"></div>
                                    <div className="timeline-content">
                                        <p className="mb-0"><strong>Mentorship requested:</strong> Web Security</p>
                                        <p className="text-muted small mb-0">1 week ago</p>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm h-100">
                        <Card.Header className="bg-white py-3">
                            <h4 className="mb-0">Resources</h4>
                        </Card.Header>
                        <Card.Body>
                            <ul className="list-unstyled">
                                <li className="p-3 border-bottom">
                                    <div className="d-flex">
                                        <div className="me-3">
                                            <FaCode size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h5 className="mb-1">Project Documentation Templates</h5>
                                            <p className="text-muted mb-0">Standard templates for documenting your projects properly</p>
                                        </div>
                                    </div>
                                </li>
                                <li className="p-3 border-bottom">
                                    <div className="d-flex">
                                        <div className="me-3">
                                            <FaChartLine size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h5 className="mb-1">Project Management Guidelines</h5>
                                            <p className="text-muted mb-0">Best practices for managing technical projects</p>
                                        </div>
                                    </div>
                                </li>
                                <li className="p-3">
                                    <div className="d-flex">
                                        <div className="me-3">
                                            <FaUsers size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h5 className="mb-1">Collaboration Tools</h5>
                                            <p className="text-muted mb-0">Recommended tools for effective team collaboration</p>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectDashboard;