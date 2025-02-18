import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button } from 'react-bootstrap';
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

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await projectService.getProjectById(id);
                setProject(response.data);
            } catch (error) {
                console.error('Failed to load project:', error);
                toast.error('Failed to load project');
            }
        };

        fetchProject();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await projectService.updateProject(id, project);
            toast.success('Project updated successfully');
            navigate('/projects');
        } catch (error) {
            console.error('Failed to update project:', error);
            toast.error('Failed to update project');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProject(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Container className="py-4">
            <h2>Edit Project</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                        type="text"
                        name="title"
                        value={project.title}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Abstract</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="abstract"
                        value={project.abstract}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Tech Stack</Form.Label>
                    <Form.Control
                        type="text"
                        name="techStack"
                        value={project.techStack.join(', ')}
                        onChange={(e) => setProject(prev => ({ ...prev, techStack: e.target.value.split(',').map(t => t.trim()) }))}
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>GitHub Link</Form.Label>
                    <Form.Control
                        type="url"
                        name="githubLink"
                        value={project.githubLink}
                        onChange={handleChange}
                    />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Update Project
                </Button>
            </Form>
        </Container>
    );
};

export default EditProject; 