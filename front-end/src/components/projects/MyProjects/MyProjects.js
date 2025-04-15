import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Row, Col, Badge, Button, Form, InputGroup, Dropdown, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaGithub, FaPlus, FaSearch, FaFilter, FaSort, FaEye, FaUsers } from 'react-icons/fa';
import { projectService } from '../../../services/api/projects';
import LoadingSpinner from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';

import '../ProjectStyles.css';

const TechBadge = ({ tech }) => {
    // Generate a consistent color based on the tech name
    const colors = ['primary', 'success', 'danger', 'warning', 'info'];
    const index = Math.abs(tech.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;

    return (
        <Badge bg={colors[index]} className="tech-badge">
            {tech}
        </Badge>
    );
};

const ProjectCard = ({ project, onEdit, onDelete, onView }) => {
    const getStatusColor = (progress) => {
        if (progress === 100) return 'success';
        if (progress > 50) return 'primary';
        if (progress > 0) return 'warning';
        return 'secondary';
    };

    const getStatusText = (progress) => {
        if (progress === 100) return 'Completed';
        if (progress > 50) return 'In Progress';
        if (progress > 0) return 'Started';
        return 'Not Started';
    };

    return (
        <Card className="project-card">
            <Card.Body className="d-flex flex-column">
                <div className="d-flex justify-content-between mb-3">
                    <h5 className="card-title fw-bold">{project.title || 'Untitled Project'}</h5>
                    <div className="status-badge">
                        <span className={`status-indicator status-${getStatusText(project.progress || 0).toLowerCase().replace(' ', '-')}`}></span>
                        <span className="text-muted small">{getStatusText(project.progress || 0)}</span>
                    </div>
                </div>

                <Card.Text className="text-muted mb-3 flex-grow-1">
                    {project.abstract ?
                        project.abstract.length > 120 ?
                            `${project.abstract.substring(0, 120)}...` :
                            project.abstract
                        : 'No abstract available'}
                </Card.Text>

                <div className="mb-3">
                    {(project.techStack || project.tech_stack || []).map((tech, index) => (
                        <TechBadge key={`tech-${index}`} tech={tech} />
                    ))}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">
                        Progress: {project.progress || 0}%
                    </small>
                    <small className="text-muted">
                        {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'Unknown date'}
                    </small>
                </div>

                <div className="progress mb-3">
                    <div
                        className="progress-bar bg-gradient"
                        style={{
                            width: `${project.progress || 0}%`,
                            backgroundColor: getStatusColor(project.progress || 0) === 'success' ? '#2ecc71' :
                                getStatusColor(project.progress || 0) === 'primary' ? '#3498db' :
                                    getStatusColor(project.progress || 0) === 'warning' ? '#f39c12' : '#95a5a6'
                        }}
                        data-progress={project.progress || 0}
                    ></div>
                </div>

                {project.collaborators && project.collaborators.length > 0 && (
                    <div className="team-preview mb-3">
                        <div className="d-flex align-items-center">
                            <FaUsers className="me-2 text-muted" />
                            <span className="text-muted">
                                {project.collaborators.length} Collaborator{project.collaborators.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                )}

                <div className="button-group d-flex gap-2">
                    <Button variant="outline-primary" size="sm" className="flex-grow-1" onClick={() => onView(project._id)}>
                        <FaEye className="me-1" /> View
                    </Button>
                    <Button variant="outline-success" size="sm" className="flex-grow-1" onClick={() => onEdit(project._id)}>
                        <FaEdit className="me-1" /> Edit
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => onDelete(project._id)}>
                        <FaTrash />
                    </Button>
                </div>

                {project.githubLink && (
                    <a href={project.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-dark btn-sm mt-2 w-100"
                    >
                        <FaGithub className="me-1" />
                        View on GitHub
                    </a>
                )}
            </Card.Body>
        </Card>
    );
};

const MyProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTech, setFilterTech] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [activeView, setActiveView] = useState('grid'); // 'grid' or 'list'
    const projectsPerPage = 6;
    const navigate = useNavigate();

    const techStackOptions = useMemo(() => {
        const techSet = new Set();
        projects.forEach(project => {
            const techArray = project.techStack || project.tech_stack || [];
            techArray.forEach(tech => techSet.add(tech));
        });
        return Array.from(techSet).sort();
    }, [projects]);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const response = await projectService.getProjects();
                // console.log('Projects response:', response);

                if (Array.isArray(response)) {
                    setProjects(response);
                } else if (response?.data && Array.isArray(response.data)) {
                    setProjects(response.data);
                } else {
                    console.error('Invalid projects data format:', response);
                    toast.error('Invalid data format received');
                    setProjects([]);
                }
            } catch (error) {
                console.error('Failed to load projects:', error);
                toast.error('Failed to load projects');
                setProjects([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();

        // Add page entrance animation
        document.querySelector('.animated-container')?.classList.add('fade-in');
    }, []);

    const handleDelete = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await projectService.deleteProject(projectId);
                const updatedProjects = projects.filter(project => project._id !== projectId);
                setProjects(updatedProjects);
                toast.success('Project deleted successfully');
            } catch (error) {
                console.error('Failed to delete project:', error);
                toast.error('Failed to delete project');
            }
        }
    };

    const handleEdit = (projectId) => {
        navigate(`/projects/${projectId}/edit`);
    };

    const handleView = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    const filteredAndSortedProjects = useMemo(() => {
        const filtered = projects.filter(project => {
            const matchesSearch = (project.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (project.abstract || '').toLowerCase().includes(searchTerm.toLowerCase());

            const techStack = project.techStack || project.tech_stack || [];
            const matchesTech = !filterTech || techStack.some(tech =>
                (tech || '').toLowerCase().includes(filterTech.toLowerCase())
            );

            return matchesSearch && matchesTech;
        });

        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'oldest':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'name':
                    return (a.title || '').localeCompare(b.title || '');
                case 'progress':
                    return (b.progress || 0) - (a.progress || 0);
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
        <Container className="py-4 animated-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">My Projects</h2>
                    <p className="text-muted">
                        Manage and track your {projects.length} project{projects.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => navigate('/projects/create')}
                    className="btn-project d-flex align-items-center gap-2"
                >
                    <FaPlus /> Create New Project
                </Button>
            </div>

            <Card className="mb-4 search-filter-section">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={5}>
                            <InputGroup>
                                <InputGroup.Text className="bg-white border-end-0">
                                    <FaSearch className="text-muted" />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search projects..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="border-start-0"
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={filterTech}
                                onChange={(e) => setFilterTech(e.target.value)}
                                className="h-100"
                            >
                                <option value="">All Technologies</option>
                                {techStackOptions.map((tech, idx) => (
                                    <option key={idx} value={tech}>{tech}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Dropdown>
                                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                                    <FaSort className="me-1" /> {sortBy === 'newest' ? 'Newest' :
                                        sortBy === 'oldest' ? 'Oldest' :
                                            sortBy === 'name' ? 'Name' : 'Progress'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => setSortBy('newest')} active={sortBy === 'newest'}>Newest First</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setSortBy('oldest')} active={sortBy === 'oldest'}>Oldest First</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setSortBy('name')} active={sortBy === 'name'}>Name</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setSortBy('progress')} active={sortBy === 'progress'}>Progress</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                        <Col md={2}>
                            <div className="btn-group w-100">
                                <Button
                                    variant={activeView === 'grid' ? 'primary' : 'outline-primary'}
                                    onClick={() => setActiveView('grid')}
                                >
                                    <i className="bi bi-grid"></i>
                                </Button>
                                <Button
                                    variant={activeView === 'list' ? 'primary' : 'outline-primary'}
                                    onClick={() => setActiveView('list')}
                                >
                                    <i className="bi bi-list"></i>
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {currentProjects.length > 0 ? (
                <>
                    <Row xs={1} md={activeView === 'grid' ? 2 : 1} lg={activeView === 'grid' ? 3 : 1} className="g-4 animated-section">
                        {currentProjects.map((project) => (
                            <Col key={project._id}>
                                <ProjectCard
                                    project={project}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onView={handleView}
                                />
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
                                {Array.from({ length: totalPages }, (_, i) => {
                                    // Show first, last, current, and adjacent pages
                                    if (i === 0 || i === totalPages - 1 ||
                                        Math.abs(i + 1 - currentPage) <= 1) {
                                        return (
                                            <Pagination.Item
                                                key={i + 1}
                                                active={currentPage === i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                            >
                                                {i + 1}
                                            </Pagination.Item>
                                        );
                                    } else if (Math.abs(i + 1 - currentPage) === 2) {
                                        return <Pagination.Ellipsis key={`ellipsis-${i}`} />;
                                    }
                                    return null;
                                }).filter(Boolean)}
                                <Pagination.Next
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-5 animated-section">
                    <div className="mb-4">
                        <img src="/no-projects.svg" alt="No projects" style={{ maxWidth: '200px', opacity: '0.6' }} />
                    </div>
                    <h4 className="text-muted mb-3">No projects found</h4>
                    <p className="text-muted mb-4">
                        {projects.length === 0 ?
                            "You haven't created any projects yet." :
                            "No projects match your current filters."}
                    </p>
                    {projects.length === 0 && (
                        <Button
                            variant="primary"
                            onClick={() => navigate('/projects/create')}
                            className="btn-project"
                        >
                            <FaPlus className="me-2" /> Create Your First Project
                        </Button>
                    )}
                    {projects.length > 0 && (
                        <Button
                            variant="outline-primary"
                            onClick={() => {
                                setSearchTerm('');
                                setFilterTech('');
                                setSortBy('newest');
                            }}
                            className="btn-project"
                        >
                            <FaFilter className="me-2" /> Clear Filters
                        </Button>
                    )}
                </div>
            )}
        </Container>
    );
};

export default MyProjects;