import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './ProjectDashboard.css';

const ProjectDashboard = () => {
    return (
        <Container className="project-dashboard py-4">
            <h2 className="mb-4">Project Hub</h2>
            <Row>
                <Col md={6} lg={3} className="mb-4">
                    <Card as={Link} to="/projects/my-projects" className="dashboard-card">
                        <Card.Body>
                            <Card.Title>My Projects</Card.Title>
                            <Card.Text>Manage and track your ongoing projects</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3} className="mb-4">
                    <Card as={Link} to="/projects/create" className="dashboard-card">
                        <Card.Body>
                            <Card.Title>Create Project</Card.Title>
                            <Card.Text>Start a new project journey</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3} className="mb-4">
                    <Card as={Link} to="/projects/mentorship" className="dashboard-card">
                        <Card.Body>
                            <Card.Title>Seek Mentorship</Card.Title>
                            <Card.Text>Connect with alumni mentors</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3} className="mb-4">
                    <Card as={Link} to="/projects/collaborate" className="dashboard-card">
                        <Card.Body>
                            <Card.Title>Collaborations</Card.Title>
                            <Card.Text>Find or invite project collaborators</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectDashboard; 