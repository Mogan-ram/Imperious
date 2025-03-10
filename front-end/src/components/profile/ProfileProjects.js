import React from "react";
import { Row, Col, Card, Badge, Alert, Button, ProgressBar } from 'react-bootstrap';

const ProjectCard = ({ project }) => {
    return (
        <Card className="h-100 project-card">
            <Card.Body>
                <Card.Title>{project.title}</Card.Title>
                <Badge bg="info" className="me-2 mb-3">
                    Progress: {project.progress || 0}%
                </Badge>
                <ProgressBar
                    now={project.progress || 0}
                    variant={
                        project.progress >= 75 ? "success" :
                            project.progress >= 40 ? "info" : "warning"
                    }
                    className="mb-3"
                />
                <Card.Text className="text-truncate-3">
                    {project.abstract}
                </Card.Text>
                <div className="tech-stack mt-2">
                    {project.tech_stack && project.tech_stack.map((tech, techIndex) => (
                        <Badge key={techIndex} bg="secondary" className="me-1 mb-1">
                            {tech}
                        </Badge>
                    ))}
                </div>
            </Card.Body>
            <Card.Footer>
                <Button
                    variant="outline-primary"
                    size="sm"
                    href={`/projects/${project._id}`}
                >
                    View Details
                </Button>
                {project.github_link && (
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        href={project.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ms-2"
                    >
                        <i className="fab fa-github"></i> GitHub
                    </Button>
                )}
            </Card.Footer>
        </Card>
    );
};

const ProfileProjects = ({ projects, isOwnProfile }) => {
    return (
        <Row>
            {projects.length > 0 ? (
                projects.map((project, index) => (
                    <Col md={6} lg={4} key={index} className="mb-4">
                        <ProjectCard project={project} />
                    </Col>
                ))
            ) : (
                <Col>
                    <Alert variant="info">
                        {isOwnProfile ? (
                            <>
                                You don't have any projects yet.
                                <Button
                                    variant="link"
                                    href="/projects/create"
                                    className="p-0 ms-2"
                                >
                                    Create your first project
                                </Button>
                            </>
                        ) : (
                            "This user doesn't have any projects yet."
                        )}
                    </Alert>
                </Col>
            )}
        </Row>
    );
};

export default ProfileProjects;