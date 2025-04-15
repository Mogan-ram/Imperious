// components/jobs/JobDetails.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLocationDot,
    faBriefcase,
    faClock,
    faMoneyBillWave,
    faCalendarAlt,
    faArrowLeft,
    faBuilding,
    faUser,
    faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { jobService } from '../../services/api/jobs';
import { useAuth } from '../../contexts/AuthContext';
import DOMPurify from 'dompurify';
import './JobDetails.css';
import Footer from '../layout/Footer/Footer';
const JobDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Check if user can edit the job (alumni or posted by the user)
    const canEdit = () => {
        if (!user || !job) return false;
        return (
            user.role === 'alumni' &&
            job.author &&
            job.author.email === user.email
        );
    };

    // Format deadline
    const formatDeadline = (dateString) => {
        if (!dateString) return 'Open until filled';
        const deadline = new Date(dateString);
        const now = new Date();

        if (deadline < now) {
            return 'Application closed';
        }

        return formatDate(dateString);
    };

    // Fetch job details
    const fetchJobDetails = React.useCallback(async () => {
        setLoading(true);
        try {
            const data = await jobService.getJobById(id);
            setJob(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching job details:', err);
            setError('Failed to load job details. Please try again later.');
            setLoading(false);
        }
    }, [id]);

    // Handle job deletion
    const handleDeleteJob = async () => {
        try {
            await jobService.deleteJob(id);
            navigate('/jobs', {
                state: { message: 'Job deleted successfully', variant: 'success' }
            });
        } catch (err) {
            console.error('Error deleting job:', err);
            setError('Failed to delete job. Please try again later.');
        }
    };

    useEffect(() => {
        fetchJobDetails();
    }, [fetchJobDetails]);

    return (
        <><Container className="job-details-container py-5">
            <Row className="mb-4">
                <Col>
                    <Link to="/jobs" className="back-link">
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Back to Job Listings
                    </Link>
                </Col>
            </Row>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : error ? (
                <Alert variant="danger">{error}</Alert>
            ) : job ? (
                <>
                    <Row>
                        <Col lg={8}>
                            <Card className="job-header-card mb-4">
                                <Card.Body>
                                    <div className="d-flex">
                                        <div className="company-logo me-4">
                                            <div className="company-logo-placeholder">
                                                {job.company ? job.company.charAt(0).toUpperCase() : 'J'}
                                            </div>
                                        </div>
                                        <div className="job-header-info">
                                            <h1 className="job-detail-title">{job.title}</h1>
                                            <h4 className="company-detail-name mb-3">{job.company}</h4>

                                            <div className="job-meta-details mb-3">
                                                <div className="job-meta-item">
                                                    <FontAwesomeIcon icon={faLocationDot} className="me-2" />
                                                    {job.location}
                                                </div>

                                                {job.job_type && job.job_type.map((type, index) => (
                                                    <div key={index} className="job-meta-item">
                                                        <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                                                        {type}
                                                    </div>
                                                ))}

                                                <div className="job-meta-item">
                                                    <FontAwesomeIcon icon={faClock} className="me-2" />
                                                    Posted on {formatDate(job.created_at)}
                                                </div>

                                                {job.deadline && (
                                                    <div className="job-meta-item">
                                                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                                        Apply by {formatDeadline(job.deadline)}
                                                    </div>
                                                )}
                                            </div>

                                            {(job.salary_min || job.salary_max) && (
                                                <div className="job-detail-salary mb-3">
                                                    <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />
                                                    {job.salary_min && job.salary_max ? (
                                                        <>₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}</>
                                                    ) : job.salary_min ? (
                                                        <>From ₹{job.salary_min.toLocaleString()}</>
                                                    ) : job.salary_max ? (
                                                        <>Up to ₹{job.salary_max.toLocaleString()}</>
                                                    ) : null}
                                                    {job.salary_period && <span className="salary-period"> / {job.salary_period}</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>

                            <Card className="job-description-card mb-4">
                                <Card.Body>
                                    <h3 className="section-title">Job Description</h3>
                                    <div
                                        className="job-description-content"
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.description) }}
                                    ></div>
                                </Card.Body>
                            </Card>

                            {job.requirements && (
                                <Card className="job-requirements-card mb-4">
                                    <Card.Body>
                                        <h3 className="section-title">Requirements</h3>
                                        <div
                                            className="job-requirements-content"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.requirements) }}
                                        ></div>
                                    </Card.Body>
                                </Card>
                            )}

                            {job.how_to_apply && (
                                <Card className="job-apply-card mb-4">
                                    <Card.Body>
                                        <h3 className="section-title">How to Apply</h3>
                                        <div
                                            className="job-apply-content"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(job.how_to_apply) }}
                                        ></div>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col lg={4}>
                            {/* Apply for Job Section */}
                            <Card className="job-apply-action-card mb-4">
                                <Card.Body>
                                    <h4 className="mb-3">Interested in this job?</h4>

                                    {job.deadline && new Date(job.deadline) < new Date() ? (
                                        <Alert variant="warning">
                                            Application deadline has passed.
                                        </Alert>
                                    ) : (
                                        <>
                                            {job.apply_link ? (
                                                <Button
                                                    href={job.apply_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    variant="primary"
                                                    size="lg"
                                                    className="w-100"
                                                >
                                                    Apply Now
                                                </Button>
                                            ) : (
                                                <p className="text-muted">
                                                    Please follow the application instructions in the "How to Apply" section.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Company Info */}
                            <Card className="company-info-card mb-4">
                                <Card.Body>
                                    <h4 className="mb-3">Company Information</h4>
                                    <p className="company-info-item">
                                        <FontAwesomeIcon icon={faBuilding} className="me-2" />
                                        {job.company}
                                    </p>
                                    <p className="company-info-item">
                                        <FontAwesomeIcon icon={faLocationDot} className="me-2" />
                                        {job.location}
                                    </p>
                                </Card.Body>
                            </Card>

                            {/* Job Posted By */}
                            {job.author && (
                                <Card className="job-author-card">
                                    <Card.Body>
                                        <h4 className="mb-3">Posted By</h4>
                                        <p className="author-info-item">
                                            <FontAwesomeIcon icon={faUser} className="me-2" />
                                            {job.author.name}
                                        </p>
                                        {job.author.dept && (
                                            <p className="author-info-item">
                                                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                                                {job.author.dept}
                                            </p>
                                        )}
                                        <p className="author-info-item">
                                            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                                            {job.author.email}
                                        </p>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Admin Controls - only visible to job author or staff */}
                            {canEdit() && (
                                <Card className="admin-controls-card mt-4">
                                    <Card.Body>
                                        <h4 className="mb-3">Admin Controls</h4>
                                        <div className="d-grid gap-2">
                                            <Link to={`/jobs/${job._id}/edit`} className="btn btn-warning">
                                                Edit Job
                                            </Link>
                                            {!showDeleteConfirm ? (
                                                <Button
                                                    variant="danger"
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                >
                                                    Delete Job
                                                </Button>
                                            ) : (
                                                <div className="confirm-delete-container mt-2">
                                                    <p className="text-danger mb-2">Are you sure you want to delete this job?</p>
                                                    <div className="d-flex gap-2">
                                                        <Button
                                                            variant="outline-secondary"
                                                            onClick={() => setShowDeleteConfirm(false)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            onClick={handleDeleteJob}
                                                        >
                                                            Confirm Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>
                    </Row>
                </>
            ) : (
                <Alert variant="warning">Job not found or has been removed.</Alert>
            )}
        </Container><><Footer /></></>
    );
};

export default JobDetails;