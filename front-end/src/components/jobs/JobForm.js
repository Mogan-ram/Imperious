// components/jobs/JobForm.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobService } from '../../services/api/jobs';
import { useAuth } from '../../contexts/AuthContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './JobForm.css';

const JobForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEditMode = !!id;

    // Initial form state
    const initialFormState = {
        title: '',
        company: '',
        location: '',
        description: '',
        job_type: [],
        requirements: '',
        how_to_apply: '',
        apply_link: '',
        salary_min: '',
        salary_max: '',
        deadline: ''
    };

    // Form state
    const [formData, setFormData] = useState(initialFormState);
    const [validated, setValidated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loadingJob, setLoadingJob] = useState(isEditMode);

    // Available job types
    const jobTypes = [
        'Full-time',
        'Part-time',
        'Contract',
        'Freelance',
        'Internship',
        'Remote'
    ];

    // Handle text input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle number input changes
    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        // Allow empty value or convert to number
        const numValue = value === '' ? '' : Number(value);
        setFormData({
            ...formData,
            [name]: numValue
        });
    };

    // Handle rich text editor changes (description, requirements, how to apply)
    const handleEditorChange = (value, field) => {
        setFormData({
            ...formData,
            [field]: value
        });
    };

    // Handle checkbox changes (job types)
    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        let updatedJobTypes = [...formData.job_type];

        if (checked) {
            updatedJobTypes.push(value);
        } else {
            updatedJobTypes = updatedJobTypes.filter(type => type !== value);
        }

        setFormData({
            ...formData,
            job_type: updatedJobTypes
        });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const form = e.currentTarget;

        // Form validation
        if (!form.checkValidity()) {
            e.stopPropagation();
            setValidated(true);
            return;
        }

        // Additional validation
        if (formData.salary_min && formData.salary_max &&
            Number(formData.salary_min) > Number(formData.salary_max)) {
            setError('Minimum salary cannot be greater than maximum salary');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Format data for API
            const jobData = {
                ...formData,
                salary_min: formData.salary_min === '' ? null : Number(formData.salary_min),
                salary_max: formData.salary_max === '' ? null : Number(formData.salary_max)
            };

            if (isEditMode) {
                await jobService.updateJob(id, jobData);
                setSuccess('Job updated successfully');
            } else {
                const response = await jobService.createJob(jobData);
                setSuccess('Job created successfully');

                // Reset form after successful creation
                if (!isEditMode) {
                    setFormData(initialFormState);
                }
            }

            // Navigate back after short delay
            setTimeout(() => {
                navigate(isEditMode ? `/jobs/${id}` : '/jobs', {
                    state: {
                        message: isEditMode ? 'Job updated successfully' : 'Job created successfully',
                        variant: 'success'
                    }
                });
            }, 1500);
        } catch (err) {
            console.error('Error saving job:', err);
            setError('Failed to save job. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch job data for editing
    useEffect(() => {
        if (isEditMode) {
            const fetchJobData = async () => {
                try {
                    const data = await jobService.getJobById(id);

                    // Format data for form
                    setFormData({
                        title: data.title || '',
                        company: data.company || '',
                        location: data.location || '',
                        description: data.description || '',
                        job_type: data.job_type || [],
                        requirements: data.requirements || '',
                        how_to_apply: data.how_to_apply || '',
                        apply_link: data.apply_link || '',
                        salary_min: data.salary_min || '',
                        salary_max: data.salary_max || '',
                        deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 10) : ''
                    });

                    setLoadingJob(false);
                } catch (err) {
                    console.error('Error fetching job details:', err);
                    setError('Failed to load job details. Please try again later.');
                    setLoadingJob(false);
                }
            };

            fetchJobData();
        }
    }, [id, isEditMode]);

    // Check if user is authorized (alumni only)
    useEffect(() => {
        if (user && user.role !== 'alumni') {
            navigate('/jobs', {
                state: {
                    message: 'Only alumni can post or edit jobs',
                    variant: 'warning'
                }
            });
        }
    }, [user, navigate]);

    // Quill editor configuration
    const editorModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            ['clean']
        ],
    };

    return (
        <Container className="job-form-container py-5">
            <Row className="mb-4">
                <Col>
                    <h1 className="form-title">{isEditMode ? 'Edit Job Listing' : 'Post a New Job'}</h1>
                    <p className="form-subtitle">
                        {isEditMode
                            ? 'Update the details of your job listing below.'
                            : 'Fill out the form below to create a new job listing.'}
                    </p>
                </Col>
            </Row>

            {loadingJob ? (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : (
                <Row>
                    <Col>
                        <Card className="form-card">
                            <Card.Body>
                                {error && <Alert variant="danger">{error}</Alert>}
                                {success && <Alert variant="success">{success}</Alert>}

                                <Form noValidate validated={validated} onSubmit={handleSubmit}>
                                    <Row>
                                        <Col lg={8}>
                                            <Form.Group className="mb-4">
                                                <Form.Label>Job Title *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="e.g., Senior Software Engineer"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    Please provide a job title.
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col lg={4}>
                                            <Form.Group className="mb-4">
                                                <Form.Label>Company Name *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="e.g., Tech Solutions Inc."
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    Please provide a company name.
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col lg={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label>Location *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="e.g., New Delhi, India or Remote"
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                    Please provide a location.
                                                </Form.Control.Feedback>
                                            </Form.Group>
                                        </Col>

                                        <Col lg={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label>Application Deadline</Form.Label>
                                                <Form.Control
                                                    type="date"
                                                    name="deadline"
                                                    value={formData.deadline}
                                                    onChange={handleInputChange}
                                                    min={new Date().toISOString().slice(0, 10)}
                                                    placeholder="Leave blank if no deadline"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col lg={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label>Minimum Salary (₹)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="salary_min"
                                                    value={formData.salary_min}
                                                    onChange={handleNumberChange}
                                                    placeholder="e.g., 500000"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>

                                        <Col lg={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label>Maximum Salary (₹)</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="salary_max"
                                                    value={formData.salary_max}
                                                    onChange={handleNumberChange}
                                                    placeholder="e.g., 800000"
                                                    min="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Job Type *</Form.Label>
                                        <div className="job-type-checkboxes">
                                            {jobTypes.map(type => (
                                                <Form.Check
                                                    key={type}
                                                    type="checkbox"
                                                    id={`job-type-${type}`}
                                                    label={type}
                                                    value={type}
                                                    checked={formData.job_type.includes(type)}
                                                    onChange={handleCheckboxChange}
                                                    className="job-type-checkbox"
                                                />
                                            ))}
                                        </div>
                                        {validated && formData.job_type.length === 0 && (
                                            <div className="text-danger small mt-1">
                                                Please select at least one job type.
                                            </div>
                                        )}
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Job Description *</Form.Label>
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.description}
                                            onChange={(value) => handleEditorChange(value, 'description')}
                                            modules={editorModules}
                                            placeholder="Describe the job, responsibilities, and expectations..."
                                        />
                                        {validated && !formData.description && (
                                            <div className="text-danger small mt-1">
                                                Please provide a job description.
                                            </div>
                                        )}
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Requirements</Form.Label>
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.requirements}
                                            onChange={(value) => handleEditorChange(value, 'requirements')}
                                            modules={editorModules}
                                            placeholder="List qualifications, skills, experience required..."
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>How to Apply</Form.Label>
                                        <ReactQuill
                                            theme="snow"
                                            value={formData.how_to_apply}
                                            onChange={(value) => handleEditorChange(value, 'how_to_apply')}
                                            modules={editorModules}
                                            placeholder="Provide instructions on how to apply..."
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>Application Link</Form.Label>
                                        <Form.Control
                                            type="url"
                                            name="apply_link"
                                            value={formData.apply_link}
                                            onChange={handleInputChange}
                                            placeholder="e.g., https://company.com/apply"
                                        />
                                        <Form.Text className="text-muted">
                                            Direct URL where candidates can apply for this position.
                                        </Form.Text>
                                    </Form.Group>

                                    <div className="d-flex gap-2 mt-4">
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            size="lg"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        className="me-2"
                                                    />
                                                    {isEditMode ? 'Updating...' : 'Posting...'}
                                                </>
                                            ) : (
                                                isEditMode ? 'Update Job' : 'Post Job'
                                            )}
                                        </Button>
                                        <Link to="/jobs" className="btn btn-outline-secondary btn-lg">
                                            Cancel
                                        </Link>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default JobForm;