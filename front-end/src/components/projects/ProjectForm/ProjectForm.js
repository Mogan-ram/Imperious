import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, ProgressBar } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaHistory } from 'react-icons/fa';
import { projectService } from '../../../services/api/projects';
import LoadingSpinner from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';

const ProjectForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState({
        title: '',
        abstract: '',
        techStack: [],
        githubLink: '',
        modules: [],
        progress: 0
    });

    const [files, setFiles] = useState({});
    const [moduleCount, setModuleCount] = useState(1);
    const [error, setError] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [previousProjects, setPreviousProjects] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            const fetchProject = async () => {
                setLoading(true);
                try {
                    const response = await projectService.getProjectById(id);
                    if (response.data) {
                        const projectData = response.data;
                        setProject({
                            title: projectData.title || '',
                            abstract: projectData.abstract || '',
                            techStack: projectData.tech_stack || [],
                            githubLink: projectData.github_link || '',
                            modules: projectData.modules || [],
                            progress: projectData.progress || 0
                        });
                    }
                } catch (error) {
                    toast.error('Failed to load project');
                } finally {
                    setLoading(false);
                }
            };

            fetchProject();
        }
        loadPreviousProjects(); // Load history when component mounts
    }, [id, isEditMode]);

    const loadPreviousProjects = async () => {
        setHistoryLoading(true);
        try {
            const response = await projectService.getProjects();
            console.log('Previous projects:', response.data); // Debug log
            setPreviousProjects(response.data || []);
        } catch (error) {
            console.error('Failed to load projects:', error);
            toast.error('Failed to load project history');
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleModuleChange = (index, field, value) => {
        const updatedModules = [...project.modules];
        if (!updatedModules[index]) {
            updatedModules[index] = { name: '', githubLink: '', files: [] };
        }
        updatedModules[index] = {
            ...updatedModules[index],
            [field]: value,
            status: files[index]?.length > 0 ? 'completed' : 'pending'
        };

        // Calculate overall progress
        const completedModules = updatedModules.filter(module => module.status === 'completed').length;
        const progress = (completedModules / moduleCount) * 100;

        setProject(prev => ({
            ...prev,
            modules: updatedModules,
            progress: progress
        }));
    };

    const handleFileChange = (moduleIndex, e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => ({
            ...prev,
            [moduleIndex]: selectedFiles
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isEditMode) {
                await projectService.updateProject(id, project);
                toast.success('Project updated successfully');
            } else {
                const projectData = {
                    ...project,
                    modules: project.modules.map(module => ({
                        name: module.name,
                        githubLink: module.githubLink,
                        status: 'pending'
                    }))
                };
                await projectService.createProject(projectData);
                toast.success('Project created successfully');
            }
            navigate('/projects');
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} project:`, error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} project`);
            setError(error.response?.data?.message || 'Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProject(prev => ({ ...prev, [name]: value }));
    };

    const getProgressVariant = (progress) => {
        if (progress < 25) return 'danger';
        if (progress < 50) return 'warning';
        if (progress < 75) return 'info';
        return 'success';
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{isEditMode ? 'Edit Project' : 'Create New Project'}</h2>
                <Button
                    variant="outline-secondary"
                    onClick={() => setShowHistory(!showHistory)}
                    className="d-flex align-items-center gap-2"
                >
                    <FaHistory /> Project History
                </Button>
            </div>

            {showHistory && (
                <Card className="mb-4">
                    <Card.Body>
                        <h5>Previous Projects</h5>
                        {historyLoading ? (
                            <LoadingSpinner />
                        ) : previousProjects.length > 0 ? (
                            <div className="list-group">
                                {previousProjects.map(project => (
                                    <div key={project._id} className="list-group-item">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h6>{project.title}</h6>
                                            <small className="text-muted">
                                                Created: {new Date(project.created_at).toLocaleDateString()}
                                            </small>
                                        </div>
                                        <ProgressBar
                                            now={project.progress || 0}
                                            label={`${Math.round(project.progress || 0)}%`}
                                            variant={getProgressVariant(project.progress || 0)}
                                            className="mb-2"
                                            style={{ height: '10px' }}
                                        />
                                        <small className="text-muted">
                                            {project.modules?.length || 0} modules
                                        </small>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">No previous projects found</p>
                        )}
                    </Card.Body>
                </Card>
            )}

            {isEditMode && (
                <Card className="mb-4">
                    <Card.Body>
                        <h6>Overall Progress</h6>
                        <ProgressBar
                            now={project.progress}
                            label={`${Math.round(project.progress)}%`}
                            variant={getProgressVariant(project.progress)}
                            className="mb-2"
                            style={{ height: '20px' }}
                        />
                    </Card.Body>
                </Card>
            )}

            {loading ? (
                <LoadingSpinner />
            ) : (
                <Card className="shadow-sm">
                    <Card.Header className="bg-primary text-white py-3">
                        <h4 className="mb-0">{isEditMode ? 'Edit' : 'Create'} Project</h4>
                    </Card.Header>
                    <Card.Body className="p-4">
                        <Form onSubmit={handleSubmit}>
                            <Row className="g-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Project Title</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="title"
                                            value={project.title}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Tech Stack</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="techStack"
                                            value={project.techStack.join(', ')}
                                            onChange={(e) => setProject(prev => ({ ...prev, techStack: e.target.value.split(',').map(t => t.trim()) }))}
                                            required
                                        />
                                    </Form.Group>
                                </Col>

                                <Col xs={12}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">GitHub Repository Link</Form.Label>
                                        <Form.Control
                                            type="url"
                                            name="githubLink"
                                            value={project.githubLink}
                                            onChange={handleChange}
                                        />
                                        <Form.Text className="text-muted">
                                            Optional: Add your project repository link
                                        </Form.Text>
                                    </Form.Group>
                                </Col>

                                <Col xs={12}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Abstract</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="abstract"
                                            value={project.abstract}
                                            onChange={handleChange}
                                            required
                                        />
                                    </Form.Group>
                                </Col>

                                <Col md={4}>
                                    <Form.Group>
                                        <Form.Label className="fw-semibold">Number of Modules</Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="1"
                                            value={moduleCount}
                                            onChange={e => setModuleCount(parseInt(e.target.value))}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="mt-4">
                                {[...Array(moduleCount)].map((_, index) => (
                                    <Card key={index} className="mb-3 border">
                                        <Card.Body>
                                            <Row className="g-3">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-semibold">
                                                            Module {index + 1} Name
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            name={`modules.${index}.name`}
                                                            placeholder={`Module ${index + 1} name`}
                                                            value={project.modules[index]?.name || ''}
                                                            onChange={(e) => handleModuleChange(index, 'name', e.target.value)}
                                                            required
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-semibold">
                                                            Module GitHub Link
                                                        </Form.Label>
                                                        <Form.Control
                                                            type="url"
                                                            name={`modules.${index}.githubLink`}
                                                            placeholder="https://github.com/..."
                                                            value={project.modules[index]?.githubLink || ''}
                                                            onChange={(e) => handleModuleChange(index, 'githubLink', e.target.value)}
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Optional: Specific GitHub link for this module
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                                <Col xs={12}>
                                                    <Form.Group>
                                                        <Form.Label className="fw-semibold">Files</Form.Label>
                                                        <Form.Control
                                                            type="file"
                                                            multiple
                                                            name={`modules.${index}.files`}
                                                            onChange={(e) => handleFileChange(index, e)}
                                                        />
                                                        <Form.Text className="text-muted">
                                                            Optional: You can upload files later to track progress
                                                        </Form.Text>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>

                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            <div className="d-grid">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={loading}
                                    size="lg"
                                >
                                    {loading ? 'Creating Project...' : 'Create Project'}
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default ProjectForm;