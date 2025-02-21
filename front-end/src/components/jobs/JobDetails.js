// src/components/Jobs/JobDetails.js
import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../../services/api/jobs';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import './JobDetails.css';
import { FaExternalLinkAlt, FaTrash, FaEdit } from 'react-icons/fa';

const JobDetails = () => {
    const { id } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                const response = await jobService.getJobById(id);
                setJob(response);
            } catch (error) {
                console.error('Error fetching job details:', error);
                setError('Failed to load job details.');
                toast.error('Failed to load job details.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();
    }, [id]);

    const handleApply = () => {
        if (job.apply_link) {
            window.open(job.apply_link, '_blank', 'noopener,noreferrer'); // Good practice!
        } else {
            toast.info("Application details are provided in how to apply section.");
        }
    };
    const handleEdit = () => {
        navigate(`/jobs/${id}/edit`);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await jobService.deleteJob(id);
                toast.success('Job deleted successfully!');
                navigate('/jobs'); // Redirect to job list
            } catch (error) {
                console.error('Error deleting job:', error);
                toast.error('Failed to delete job.');
            }
        }
    };
    const canEditOrDelete = () => {
        return user && job && (user.role === 'alumni' || user.role === 'staff') && user._id === job.posted_by;
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <Container className="py-4"><p>{error}</p></Container>;
    }

    if (!job) {
        return <Container className="py-4"><p>Job not found.</p></Container>;
    }
    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'staff':
                return 'primary'; // Blue
            case 'alumni':
                return 'success'; // Green
            case 'student':
                return 'info';    // Light blue
            default:
                return 'secondary'; // Gray
        }
    };

    return (
        <Container className="py-4">
            <Card className="job-details-card">
                <Card.Body>
                    <Card.Title>{job.title}</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                        {job.company} - {job.location}
                    </Card.Subtitle>
                    <div className='mb-2'>
                        {job.job_type &&
                            job.job_type.map((type, index) => (
                                <Badge key={index} pill bg="primary" className="me-1">
                                    {type}
                                </Badge>
                            ))}
                    </div>
                    {job.salary_min && (
                        <Card.Text>
                            <strong>Salary:</strong> ${job.salary_min}
                            {job.salary_max && ` - $${job.salary_max}`}
                        </Card.Text>
                    )}
                    <Card.Text>
                        <strong>Description:</strong>
                        <div dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, "<br />") }} />
                    </Card.Text>
                    <Card.Text>
                        <strong>Requirements:</strong>
                        {/* Display requirements as it is */}
                        <div dangerouslySetInnerHTML={{ __html: job.requirements.replace(/\n/g, "<br />") }} />
                    </Card.Text>
                    <Card.Text>
                        <strong>How to Apply:</strong>
                        <div dangerouslySetInnerHTML={{ __html: job.how_to_apply.replace(/\n/g, "<br />") }} />
                    </Card.Text>
                    {job.deadline && (
                        <Card.Text>
                            <strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
                        </Card.Text>
                    )}

                    {/* Display Posted by with Author's Name */}
                    {job.author && (
                        <Card.Text>
                            <strong>Posted by:</strong> {job.author.name}
                            {/* Display role as a badge */}
                            {job.author.role && (
                                <Badge pill bg={getRoleBadgeVariant(job.author.role)} className="ms-2">
                                    {job.author.role}
                                </Badge>
                            )}
                        </Card.Text>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                        {/* Apply Button (only if apply_link exists)*/}
                        {job.apply_link && (
                            <Button variant="success" onClick={handleApply}>
                                Apply <FaExternalLinkAlt className='ms-1' />
                            </Button>
                        )}

                        {/* Edit and Delete buttons - only visible to authorized users */}
                        {canEditOrDelete() && (
                            <>
                                <Button variant="outline-primary" onClick={handleEdit} size="sm">
                                    <FaEdit />
                                </Button>
                                <Button variant="outline-danger" onClick={handleDelete} size="sm">
                                    <FaTrash />
                                </Button>
                            </>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default JobDetails;