// src/components/Jobs/JobForm.js
import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Card, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService } from '../../services/api/jobs';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const JobForm = () => {
    const { id } = useParams(); // Get job ID from URL if editing
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [jobData, setJobData] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        salary_min: '', // Use empty string for number inputs
        salary_max: '',
        job_type: [], // Use an array for multiple selections
        requirements: '', // Now a STRING
        how_to_apply: '',
        deadline: '',
        apply_link: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchJob = async () => {
            if (id) {
                setLoading(true);
                try {
                    const response = await jobService.getJobById(id);
                    // Ensure job_type is an array, even if stored as a string
                    const fetchedJobData = {
                        ...response,
                        job_type: Array.isArray(response.job_type) ? response.job_type : [response.job_type].filter(Boolean),
                        // requirements remains a string
                    };
                    setJobData(fetchedJobData);
                } catch (error) {
                    toast.error("Failed to fetch job details.");
                    navigate("/jobs"); // Redirect if job not found or error
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchJob();
    }, [id, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "job_type") {
            const options = e.target.options;
            const selectedValues = [];
            for (let i = 0; i < options.length; i++) {
                if (options[i].selected) {
                    selectedValues.push(options[i].value);
                }
            }
            setJobData(prevData => ({ ...prevData, [name]: selectedValues }));
        } else {
            // For all other fields, update directly
            setJobData(prevData => ({ ...prevData, [name]: value }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation (add more as needed)
        if (!jobData.title || !jobData.company || !jobData.location || !jobData.description || jobData.job_type.length === 0 || !jobData.requirements || !jobData.how_to_apply) {
            setError("Please fill in all required fields.");
            setLoading(false); // Ensure loading is set to false
            return;
        }


        try {
            // Ensure job_type is an array before sending
            const dataToSend = {
                ...jobData,
            };

            if (id) {
                await jobService.updateJob(id, dataToSend);
                toast.success('Job updated successfully!');
            } else {
                await jobService.createJob(dataToSend);
                toast.success('Job created successfully!');
            }
            navigate('/jobs');
        } catch (error) {
            console.error("Error submitting job:", error);
            setError(error.response?.data?.message || `Failed to ${id ? 'update' : 'create'} job.  Please try again.`);
            toast.error(error.response?.data?.message || `Failed to ${id ? 'update' : 'create'} job`);

        } finally {
            setLoading(false);
        }
    };


    if (!user || (user.role.toLowerCase() !== 'alumni' && user.role.toLowerCase() !== 'staff')) {
        return <Container className="py-4"><p>You do not have permission to access this page.</p></Container>;
    }

    if (loading) {
        return <Container className="py-4">Loading...</Container>; // Or a loading spinner
    }


    return (
        <Container className="py-4">
            <Card>
                <Card.Body>
                    <Card.Title>{id ? 'Edit Job' : 'Create Job'}</Card.Title>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Job Title</Form.Label>
                            <Form.Control
                                type="text"
                                name="title"
                                value={jobData.title}
                                onChange={handleChange}
                                required
                                placeholder="Enter job title"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Company</Form.Label>
                            <Form.Control
                                type="text"
                                name="company"
                                value={jobData.company}
                                onChange={handleChange}
                                required
                                placeholder="Enter company name"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="location"
                                        value={jobData.location}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter job location"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Job Type</Form.Label>
                                    <Form.Control
                                        as="select"
                                        multiple
                                        name="job_type"
                                        value={jobData.job_type}
                                        onChange={handleChange}
                                    >
                                        <option value="" disabled>Select Job Type</option>
                                        <option value="Full-time">Full-time</option>
                                        <option value="Part-time">Part-time</option>
                                        <option value="Internship">Internship</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Freelance">Freelance</option>
                                        <option value="Temporary">Temporary</option>
                                    </Form.Control>
                                    <Form.Text className="text-muted">
                                        Hold down the Ctrl (or Command on Mac) key to select multiple options.
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Salary</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="salary_min"
                                        value={jobData.salary_min}
                                        onChange={handleChange}
                                        placeholder="e.g., 50000"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Salary</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="salary_max"
                                        value={jobData.salary_max}
                                        onChange={handleChange}
                                        placeholder="e.g., 75000"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={jobData.description}
                                onChange={handleChange}
                                required
                                placeholder="Enter job description"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Requirements</Form.Label>
                            <Form.Control
                                as="textarea" // Use textarea
                                rows={3}
                                name="requirements"
                                value={jobData.requirements} // Directly use the string value
                                onChange={handleChange}
                                placeholder="Enter job requirements"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>How to Apply</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="how_to_apply"
                                value={jobData.how_to_apply}
                                onChange={handleChange}
                                placeholder="Enter application instructions (Email, Link, etc.)"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Apply Link (optional)</Form.Label>
                            <Form.Control
                                type="url"
                                name="apply_link"
                                value={jobData.apply_link}
                                onChange={handleChange}
                                placeholder="https://example.com/apply"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Deadline</Form.Label>
                            <Form.Control
                                type="date"
                                name="deadline"
                                value={jobData.deadline}
                                onChange={handleChange}
                            />
                        </Form.Group>



                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? (id ? 'Updating...' : 'Creating...') : (id ? 'Update Job' : 'Create Job')}
                        </Button>
                        {error && <p className="text-danger mt-2">{error}</p>}
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default JobForm;