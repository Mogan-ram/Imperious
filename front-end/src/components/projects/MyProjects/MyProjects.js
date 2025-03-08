import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, Button, ProgressBar, Form, InputGroup, Dropdown, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaGithub, FaPlus, FaSearch, FaFilter, FaSort } from 'react-icons/fa';
import { projectService } from '../../../services/api/projects';
import LoadingSpinner from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useMemo } from 'react';

const MyProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTech, setFilterTech] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 6;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const response = await projectService.getProjects();
                console.log('Projects response:', response);

                if (response.data && Array.isArray(response.data)) {
                    setProjects(response.data);
                } else {
                    console.error('Invalid projects data format:', response);
                    toast.error('Invalid data format received');
                }
            } catch (error) {
                console.error('Failed to load projects:', error);
                toast.error('Failed to load projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleDelete = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectService.deleteProject(projectId);
                const response = await projectService.getProjects();
                setProjects(response.data);
                toast.success('Project deleted successfully');
            } catch (error) {
                console.error('Failed to delete project:', error);
                toast.error('Failed to delete project');
            }
        }
    };

    const handleEdit = async (projectId) => {
        navigate(`/projects/${projectId}/edit`);
    };

    const getStatusColor = (progress) => {
        if (progress === 100) return 'success';
        if (progress > 50) return 'primary';
        if (progress > 0) return 'warning';
        return 'secondary';
    };


    const filteredAndSortedProjects = useMemo(() => {
        // First filter the projects
        const filtered = (projects || []).filter(project => {
            const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.abstract.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTech = !filterTech || (project.techStack || []).some(tech =>
                tech.toLowerCase().includes(filterTech.toLowerCase())
            );
            return matchesSearch && matchesTech;
        });
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'name':
                    return a.title.localeCompare(b.title);
                case 'progress':
                    return b.progress - a.progress;
                default:
                    return 0;
            }
        });
    }, [projects, searchTerm, filterTech, sortBy]);


    // Pagination
    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = filteredAndSortedProjects.slice(indexOfFirstProject, indexOfLastProject);
    const totalPages = Math.ceil(filteredAndSortedProjects.length / projectsPerPage);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Container className="py-4">


            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center gap-3">
                    <h4 className="mb-0">My Projects</h4>
                    <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                            <FaSort className="me-1" /> Sort by
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item onClick={() => setSortBy('newest')}>Newest First</Dropdown.Item>
                            <Dropdown.Item onClick={() => setSortBy('oldest')}>Oldest First</Dropdown.Item>
                            <Dropdown.Item onClick={() => setSortBy('name')}>Name</Dropdown.Item>
                            <Dropdown.Item onClick={() => setSortBy('progress')}>Progress</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/projects/create')}
                    className="d-flex align-items-center gap-2"
                >
                    <FaPlus /> Create New Project
                </Button>
            </div>

            <Card className="mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaFilter />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Filter by tech stack..."
                                    value={filterTech}
                                    onChange={(e) => setFilterTech(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row xs={1} md={2} lg={3} className="g-4">
                {currentProjects.map((project) => (
                    <Col key={project._id}>
                        <Card className="h-100 shadow-sm">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <Card.Title>{project.title}</Card.Title>
                                        <Badge bg={getStatusColor(project.progress)} className="mb-2">
                                            {project.progress === 100 ? 'Completed' :
                                                project.progress > 50 ? 'In Progress' :
                                                    project.progress > 0 ? 'Started' : 'Not Started'}
                                        </Badge>
                                        <p><b>Collaborators:</b></p>
                                        {project.collaborators && project.collaborators.length > 0 ? (
                                            <ul>
                                                {project.collaborators.map((collaborator) => (
                                                    <li key={collaborator.id}>
                                                        {collaborator.name} ({collaborator.dept})
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>No collaborators added yet.</p>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEdit(project._id)}
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDelete(project._id)}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                </div>
                                <Card.Text className="text-muted small mt-2">
                                    {project.abstract.substring(0, 100)}...
                                </Card.Text>
                                <div className="mt-3">
                                    {project.techStack.map((tech, index) => (
                                        <Badge
                                            key={index}
                                            bg="secondary"
                                            className="me-1"
                                        >
                                            {tech}
                                        </Badge>
                                    ))}
                                </div>
                                {project.githubLink && (
                                    <a
                                        href={project.githubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-outline-dark btn-sm mt-3"
                                    >
                                        <FaGithub className="me-1" />
                                        View on GitHub
                                    </a>
                                )}
                            </Card.Body>
                            <Card.Footer>
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small className="text-muted">
                                        Progress: {project.progress}%
                                    </small>
                                    <small className="text-muted">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </small>
                                </div>
                                <ProgressBar
                                    now={project.progress}
                                    variant={getStatusColor(project.progress)}
                                    className="mt-1"
                                    style={{ height: '4px' }}
                                />
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>


            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        <Pagination.Prev
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        />
                        {[...Array(totalPages)].map((_, idx) => (
                            <Pagination.Item
                                key={idx + 1}
                                active={currentPage === idx + 1}
                                onClick={() => setCurrentPage(idx + 1)}
                            >
                                {idx + 1}
                            </Pagination.Item>
                        ))}
                        <Pagination.Next
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        />
                    </Pagination>
                </div>
            )}

            {filteredAndSortedProjects.length === 0 && (
                <div className="text-center py-5">
                    <h5 className="text-muted">No projects found</h5>
                </div>
            )}
        </Container>
    );
};

export default MyProjects; 