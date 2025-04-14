import React, { useState, useEffect, useCallback } from 'react';
import { Container, Form, Button, Card, Row, Col, ProgressBar, Alert, Badge, ListGroup, InputGroup, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaArrowRight, FaCheck, FaPlus, FaTimes, FaGithub, FaCode, FaSave } from 'react-icons/fa';
import { projectService } from '../../../services/api/projects';
import LoadingSpinner from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';
import '../ProjectStyles.css';

const ProjectForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [project, setProject] = useState({
        title: '',
        abstract: '',
        techStack: [],
        githubLink: '',
        modules: [{ name: '', description: '', githubLink: '', status: 'pending' }],
        progress: 0
    });

    const [techInput, setTechInput] = useState('');
    const [moduleCount, setModuleCount] = useState(1);
    const [error, setError] = useState('');
    const [formTouched, setFormTouched] = useState(false);
    const isEditMode = !!id;

    useEffect(() => {
        if (isEditMode) {
            const fetchProject = async () => {
                setLoading(true);
                try {
                    const response = await projectService.getProjectById(id);
                    if (response.data) {
                        const projectData = response.data;

                        // Ensure project has the right structure
                        setProject({
                            title: projectData.title || '',
                            abstract: projectData.abstract || '',
                            techStack: projectData.techStack || projectData.tech_stack || [],
                            githubLink: projectData.githubLink || projectData.github_link || '',
                            modules: projectData.modules && projectData.modules.length > 0
                                ? projectData.modules
                                : [{ name: '', description: '', githubLink: '', status: 'pending' }],
                            progress: projectData.progress || 0
                        });

                        setModuleCount(projectData.modules ? projectData.modules.length : 1);
                    }
                } catch (error) {
                    toast.error('Failed to load project');
                } finally {
                    setLoading(false);
                }
            };

            fetchProject();
        }
    }, [id, isEditMode]);

    const updateProgress = useCallback(() => {
        if (!project.modules || project.modules.length === 0) return 0;

        const completedModules = project.modules.filter(m => m.status === 'completed').length;
        return Math.round((completedModules / project.modules.length) * 100);
    }, [project.modules]);

    useEffect(() => {
        if (formTouched) {
            const progress = updateProgress();
            setProject(prev => ({ ...prev, progress }));
        }
    }, [project.modules, formTouched, updateProgress]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProject(prev => ({ ...prev, [name]: value }));
        setFormTouched(true);
    };

    const handleAddTech = () => {
        if (techInput.trim()) {
            setProject(prev => ({
                ...prev,
                techStack: [...prev.techStack, techInput.trim()]
            }));
            setTechInput('');
            setFormTouched(true);
        }
    };

    const handleRemoveTech = (index) => {
        setProject(prev => ({
            ...prev,
            techStack: prev.techStack.filter((_, i) => i !== index)
        }));
        setFormTouched(true);
    };

    const handleModuleChange = (index, field, value) => {
        const updatedModules = [...project.modules];

        if (!updatedModules[index]) {
            updatedModules[index] = { name: '', description: '', githubLink: '', status: 'pending' };
        }

        updatedModules[index] = {
            ...updatedModules[index],
            [field]: value
        };

        setProject(prev => ({
            ...prev,
            modules: updatedModules
        }));

        setFormTouched(true);
    };

    const handleAddModule = () => {
        setProject(prev => ({
            ...prev,
            modules: [
                ...prev.modules,
                { name: '', description: '', githubLink: '', status: 'pending' }
            ]
        }));
        setModuleCount(prev => prev + 1);
        setFormTouched(true);
    };

    const handleRemoveModule = (index) => {
        if (project.modules.length <= 1) {
            toast.warning("You must have at least one module");
            return;
        }

        setProject(prev => ({
            ...prev,
            modules: prev.modules.filter((_, i) => i !== index)
        }));
        setModuleCount(prev => prev - 1);
        setFormTouched(true);
    };

    const handleModuleStatus = (index, status) => {
        const updatedModules = [...project.modules];
        updatedModules[index].status = status;

        setProject(prev => ({
            ...prev,
            modules: updatedModules
        }));

        setFormTouched(true);
    };

    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                if (!project.title.trim()) {
                    setError('Project title is required');
                    return false;
                }
                if (!project.abstract.trim()) {
                    setError('Project abstract is required');
                    return false;
                }
                if (!project.githubLink.trim()) {
                    setError('GitHub repository link is required');
                    return false;
                }
                break;
            case 2:
                if (project.techStack.length === 0) {
                    setError('At least one technology is required');
                    return false;
                }
                break;
            case 3:
                const invalidModule = project.modules.findIndex(m => !m.name.trim());
                if (invalidModule !== -1) {
                    setError(`Module ${invalidModule + 1} name is required`);
                    return false;
                }
                break;
            default:
                break;
        }

        setError('');
        return true;
    };

    const handleNextStep = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSave = async (final = false) => {
        if (final && !validateCurrentStep()) {
            return;
        }

        setSaveLoading(true);
        try {
            const projectData = {
                ...project,
                modules: project.modules.map(module => ({
                    name: module.name,
                    description: module.description || '',
                    githubLink: module.githubLink || '',
                    status: module.status || 'pending'
                }))
            };

            if (isEditMode) {
                await projectService.updateProject(id, projectData);
                toast.success('Project updated successfully');
            } else {
                await projectService.createProject(projectData);
                toast.success('Project created successfully');
            }

            if (final) {
                navigate('/projects');
            }
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} project:`, error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} project`);
            setError(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} project`);
        } finally {
            setSaveLoading(false);
        }
    };

    const renderStepIndicator = () => {
        return (
            <div className="step-indicator mb-4">
                <div className="d-flex justify-content-between position-relative">
                    <div className="progress" style={{ height: '2px', position: 'absolute', top: '15px', width: '100%', zIndex: 0 }}>
                        <div
                            className="progress-bar"
                            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                        ></div>
                    </div>

                    {[1, 2, 3, 4].map(step => (
                        <div
                            key={step}
                            className={`step-circle d-flex flex-column align-items-center position-relative ${step <= currentStep ? 'active' : ''}`}
                            style={{ zIndex: 1 }}
                        >
                            <div
                                className={`rounded-circle d-flex align-items-center justify-content-center ${step < currentStep ? 'bg-success' : step === currentStep ? 'bg-primary' : 'bg-light'}`}
                                style={{ width: '30px', height: '30px', border: step > currentStep ? '1px solid #dee2e6' : 'none' }}
                            >
                                {step < currentStep ? (
                                    <FaCheck className="text-white" size={14} />
                                ) : (
                                    <span className={`${step === currentStep ? 'text-white' : 'text-muted'}`}>{step}</span>
                                )}
                            </div>
                            <span
                                className={`mt-2 small ${step <= currentStep ? 'text-dark fw-bold' : 'text-muted'}`}
                                style={{ width: '80px', textAlign: 'center' }}
                            >
                                {step === 1 ? 'Basics' :
                                    step === 2 ? 'Technologies' :
                                        step === 3 ? 'Modules' : 'Review'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Container className="py-4 animated-container">
            <h2 className="mb-4">{isEditMode ? 'Edit Project' : 'Create New Project'}</h2>

            {renderStepIndicator()}

            <Card className="shadow-sm">
                <Card.Body className="p-4">
                    {error && (
                        <Alert variant="danger" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {currentStep === 1 && (
                        <div className="animated-section">
                            <h4 className="mb-4">Project Basics</h4>
                            <Form>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Project Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        value={project.title}
                                        onChange={handleChange}
                                        placeholder="Enter project title"
                                        className="form-control-lg"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Abstract</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        name="abstract"
                                        value={project.abstract}
                                        onChange={handleChange}
                                        placeholder="Provide a brief description of your project"
                                        className="form-control-lg"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">GitHub Repository Link <span className="text-danger">*</span></Form.Label>
                                    <InputGroup className="mb-3">
                                        <InputGroup.Text id="github-addon" className="bg-white">
                                            <FaGithub />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type="url"
                                            name="githubLink"
                                            value={project.githubLink}
                                            onChange={handleChange}
                                            placeholder="https://github.com/username/repo"
                                            aria-describedby="github-addon"
                                            required
                                        />
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Project repository link is required
                                    </Form.Text>
                                </Form.Group>
                            </Form>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="animated-section">
                            <h4 className="mb-4">Project Technologies</h4>
                            <Form>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold">Tech Stack</Form.Label>
                                    <InputGroup className="mb-3">
                                        <Form.Control
                                            type="text"
                                            value={techInput}
                                            onChange={(e) => setTechInput(e.target.value)}
                                            placeholder="Add a technology (e.g., React)"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTech())}
                                        />
                                        <Button
                                            variant="primary"
                                            onClick={handleAddTech}
                                            disabled={!techInput.trim()}
                                        >
                                            <FaPlus /> Add
                                        </Button>
                                    </InputGroup>
                                    <Form.Text className="text-muted">
                                        Add all technologies used in your project
                                    </Form.Text>
                                </Form.Group>

                                <div className="mb-4">
                                    {project.techStack.length > 0 ? (
                                        <div className="d-flex flex-wrap gap-2">
                                            {project.techStack.map((tech, idx) => (
                                                <Badge
                                                    key={idx}
                                                    bg="primary"
                                                    className="p-2 d-flex align-items-center tech-badge"
                                                >
                                                    {tech}
                                                    <Button
                                                        variant="link"
                                                        className="p-0 ms-2 text-white"
                                                        onClick={() => handleRemoveTech(idx)}
                                                        style={{ fontSize: '10px' }}
                                                    >
                                                        <FaTimes />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <Alert variant="info">
                                            No technologies added yet. Add at least one technology to proceed.
                                        </Alert>
                                    )}
                                </div>
                            </Form>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="animated-section">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="mb-0">Project Modules</h4>
                                <Button
                                    variant="outline-primary"
                                    onClick={handleAddModule}
                                    className="d-flex align-items-center"
                                >
                                    <FaPlus className="me-1" /> Add Module
                                </Button>
                            </div>

                            <div className="modules-container">
                                {project.modules.map((module, index) => (
                                    <Card key={index} className="mb-3 module-form-card">
                                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">Module {index + 1}</h5>
                                            <div className="d-flex gap-2">
                                                <Button
                                                    variant={module.status === 'completed' ? 'success' : 'outline-success'}
                                                    size="sm"
                                                    onClick={() => handleModuleStatus(index, 'completed')}
                                                    title="Mark as completed"
                                                >
                                                    <FaCheck />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveModule(index)}
                                                    disabled={project.modules.length <= 1}
                                                    title="Remove module"
                                                >
                                                    <FaTimes />
                                                </Button>
                                            </div>
                                        </Card.Header>
                                        <Card.Body>
                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold">Module Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={module.name || ''}
                                                    onChange={(e) => handleModuleChange(index, 'name', e.target.value)}
                                                    placeholder="Enter module name"
                                                    required
                                                />
                                            </Form.Group>

                                            <Form.Group className="mb-3">
                                                <Form.Label className="fw-bold">Description (Optional)</Form.Label>
                                                <Form.Control
                                                    as="textarea"
                                                    rows={2}
                                                    value={module.description || ''}
                                                    onChange={(e) => handleModuleChange(index, 'description', e.target.value)}
                                                    placeholder="Describe this module"
                                                />
                                            </Form.Group>

                                            <Form.Group>
                                                <Form.Label className="fw-bold">GitHub Link (Optional)</Form.Label>
                                                <InputGroup>
                                                    <InputGroup.Text className="bg-white">
                                                        <FaGithub />
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        type="url"
                                                        value={module.githubLink || ''}
                                                        onChange={(e) => handleModuleChange(index, 'githubLink', e.target.value)}
                                                        placeholder="GitHub link for this specific module"
                                                    />
                                                </InputGroup>
                                            </Form.Group>
                                        </Card.Body>
                                        <Card.Footer className="bg-white">
                                            <Badge
                                                bg={module.status === 'completed' ? 'success' : 'secondary'}
                                            >
                                                {module.status === 'completed' ? 'Completed' : 'Pending'}
                                            </Badge>
                                        </Card.Footer>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="animated-section">
                            <h4 className="mb-4">Review Project</h4>

                            <Card className="mb-4">
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">Project Details</h5>
                                </Card.Header>
                                <Card.Body>
                                    <Row>
                                        <Col md={6}>
                                            <p><strong>Title:</strong> {project.title}</p>
                                            <p><strong>Abstract:</strong> {project.abstract}</p>
                                            <p>
                                                <strong>GitHub:</strong>{' '}
                                                <a href={project.githubLink} target="_blank" rel="noopener noreferrer">
                                                    {project.githubLink}
                                                </a>
                                            </p>
                                        </Col>
                                        <Col md={6}>
                                            <p><strong>Technologies:</strong></p>
                                            <div className="d-flex flex-wrap gap-2 mb-3">
                                                {project.techStack.map((tech, idx) => (
                                                    <Badge key={idx} bg="primary" className="p-2">
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <p><strong>Modules:</strong> {project.modules.length}</p>
                                            <p>
                                                <strong>Progress:</strong>{' '}
                                                <span className="ms-2">
                                                    <Badge bg={
                                                        project.progress === 100 ? 'success' :
                                                            project.progress > 50 ? 'primary' :
                                                                project.progress > 0 ? 'warning' : 'secondary'
                                                    }>
                                                        {project.progress}%
                                                    </Badge>
                                                </span>
                                            </p>
                                        </Col>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Header className="bg-white">
                                    <h5 className="mb-0">Project Modules</h5>
                                </Card.Header>
                                <ListGroup variant="flush">
                                    {project.modules.map((module, index) => (
                                        <ListGroup.Item key={index}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <h6>{module.name}</h6>
                                                    {module.description && <p className="text-muted mb-2">{module.description}</p>}
                                                    <Badge
                                                        bg={module.status === 'completed' ? 'success' : 'secondary'}
                                                    >
                                                        {module.status === 'completed' ? 'Completed' : 'Pending'}
                                                    </Badge>
                                                </div>

                                                {module.githubLink && (
                                                    <a
                                                        href={module.githubLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-outline-dark"
                                                    >
                                                        <FaGithub className="me-1" /> GitHub
                                                    </a>
                                                )}
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            </Card>
                        </div>
                    )}
                </Card.Body>

                <Card.Footer className="bg-white d-flex justify-content-between align-items-center">
                    <div>
                        {currentStep > 1 && (
                            <Button
                                variant="outline-secondary"
                                onClick={handlePrevStep}
                                className="d-flex align-items-center"
                            >
                                <FaArrowLeft className="me-1" /> Previous
                            </Button>
                        )}
                    </div>

                    <div className="d-flex gap-2">
                        <Button
                            variant="outline-danger"
                            onClick={() => navigate('/projects')}
                        >
                            Cancel
                        </Button>

                        {currentStep < 4 ? (
                            <Button
                                variant="primary"
                                onClick={handleNextStep}
                                className="d-flex align-items-center"
                            >
                                Next <FaArrowRight className="ms-1" />
                            </Button>
                        ) : (
                            <Button
                                variant="success"
                                onClick={() => handleSave(true)}
                                className="d-flex align-items-center"
                                disabled={saveLoading}
                            >
                                <FaCheck className="me-1" /> Finish
                                {saveLoading && <Spinner animation="border" size="sm" className="ms-2" />}
                            </Button>
                        )}
                    </div>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default ProjectForm;