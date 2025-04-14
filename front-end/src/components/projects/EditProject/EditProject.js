import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
import { projectService } from '../../../services/api/projects';
import { toast } from 'react-toastify';

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState({
        title: '',
        abstract: '',
        techStack: [],
        githubLink: '',
        modules: []
    });
    const [loading, setLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProject = async () => {
            setLoading(true);
            try {
                const response = await projectService.getProjectById(id);
                console.log(response.data);
                const projectData = response.data || {};
                if (!response.data) {
                    throw new Error('No project data received');
                }
                setProject({
                    title: projectData.title || '',
                    abstract: projectData.abstract || '',
                    techStack: Array.isArray(projectData.techStack)
                        ? projectData.techStack
                        : projectData.tech_stack || [],
                    githubLink: projectData.githubLink || projectData.github_link || '',
                    modules: projectData.modules || []
                });
                console.log('project state after fetching:', projectData);
            } catch (error) {
                console.error('Failed to load project:', error);
                toast.error('Failed to load project');
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [id]);

    const validateForm = () => {
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
        if (project.techStack.length === 0) {
            setError('At least one technology is required');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSaveLoading(true);
        try {
            // Send updated project data to the backend.
            await projectService.updateProject(id, project);
            toast.success('Project updated successfully');
            navigate('/projects');
        } catch (error) {
            console.error('Failed to update project:', error);
            toast.error('Failed to update project');
            setError(error.response?.data?.message || 'Failed to update project');
        } finally {
            setSaveLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProject((prev) => ({ ...prev, [name]: value }));
    };

    const handleTechStackChange = (e) => {
        const techs = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
        setProject((prev) => ({ ...prev, techStack: techs }));
    };

    if (loading) {
        return (
            <Container className="py-4 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading project details...</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Edit Project</h2>

            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="text"
                        name="title"
                        value={project.title}
                        onChange={handleChange}
                        required
                        placeholder="Enter project title"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Abstract <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        name="abstract"
                        value={project.abstract}
                        onChange={handleChange}
                        required
                        placeholder="Provide a brief description of your project"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>GitHub Link <span className="text-danger">*</span></Form.Label>
                    <InputGroup>
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

                <Form.Group className="mb-3">
                    <Form.Label>Tech Stack <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="text"
                        name="techStack"
                        value={Array.isArray(project.techStack) ? project.techStack.join(', ') : ''}
                        onChange={handleTechStackChange}
                        placeholder="React, Node.js, MongoDB (comma separated)"
                        required
                    />
                    <Form.Text className="text-muted">
                        Add technologies used in your project, separated by commas
                    </Form.Text>
                </Form.Group>

                <div className="d-flex justify-content-between mt-4">
                    <Button variant="secondary" onClick={() => navigate('/projects')}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        disabled={saveLoading}
                    >
                        {saveLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Updating...
                            </>
                        ) : 'Update Project'}
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default EditProject;