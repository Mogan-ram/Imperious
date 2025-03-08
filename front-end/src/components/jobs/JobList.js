// components/jobs/JobList.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, InputGroup, Button, Badge, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faLocationDot, faBriefcase, faSortAmountDown, faSortAmountUp, faClock } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jobService } from '../../services/api/jobs';
import { useAuth } from '../../contexts/AuthContext';
import './joblist.css';

const JobList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    // State variables
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalJobs, setTotalJobs] = useState(0);
    const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page')) || 1);
    const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
    const [locationFilter, setLocationFilter] = useState(queryParams.get('location') || '');
    const [jobTypeFilter, setJobTypeFilter] = useState(queryParams.get('jobType') || '');
    const [sortBy, setSortBy] = useState(queryParams.get('sortBy') || 'created_at');
    const [sortOrder, setSortOrder] = useState(queryParams.get('sortOrder') || '-1');
    const [showFilters, setShowFilters] = useState(false);

    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Calculate days ago
    const getDaysAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        return `${diffDays} days ago`;
    };

    // Truncate text function
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Load jobs from API
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const result = await jobService.getAllJobs(
                currentPage,
                10,
                searchTerm,
                locationFilter,
                jobTypeFilter,
                sortBy,
                sortOrder
            );
            setJobs(result.jobs);
            setTotalJobs(result.total);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError('Failed to load jobs. Please try again later.');
            setLoading(false);
        }
    };

    // Update URL with current filters
    const updateUrlParams = () => {
        const params = new URLSearchParams();
        if (currentPage > 1) params.set('page', currentPage);
        if (searchTerm) params.set('search', searchTerm);
        if (locationFilter) params.set('location', locationFilter);
        if (jobTypeFilter) params.set('jobType', jobTypeFilter);
        if (sortBy !== 'created_at') params.set('sortBy', sortBy);
        if (sortOrder !== '-1') params.set('sortOrder', sortOrder);

        navigate({
            pathname: location.pathname,
            search: params.toString()
        }, { replace: true });
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchJobs();
    };

    // Reset filters
    const resetFilters = () => {
        setSearchTerm('');
        setLocationFilter('');
        setJobTypeFilter('');
        setSortBy('created_at');
        setSortOrder('-1');
        setCurrentPage(1);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Toggle filter visibility
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    // Effect to fetch jobs on initial load or when filters change
    useEffect(() => {
        fetchJobs();
        updateUrlParams();
    }, [currentPage, jobTypeFilter, sortBy, sortOrder]);

    return (
        <Container className="job-list-container py-5">
            <Row className="mb-4">
                <Col>
                    <h1 className="job-list-title">Find Your Next Opportunity</h1>
                    <p className="job-list-subtitle">Browse our latest job listings and start your career journey today.</p>
                </Col>
            </Row>

            <Row className="mb-4">
                <Col>
                    <Card className="search-card">
                        <Card.Body>
                            <Form onSubmit={handleSearch}>
                                <Row>
                                    <Col lg={6} md={12} className="mb-3 mb-lg-0">
                                        <InputGroup>
                                            <InputGroup.Text><FontAwesomeIcon icon={faSearch} /></InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Search jobs by title, company, or skills"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col lg={4} md={8} className="mb-3 mb-lg-0">
                                        <InputGroup>
                                            <InputGroup.Text><FontAwesomeIcon icon={faLocationDot} /></InputGroup.Text>
                                            <Form.Control
                                                type="text"
                                                placeholder="Filter by location"
                                                value={locationFilter}
                                                onChange={(e) => setLocationFilter(e.target.value)}
                                            />
                                        </InputGroup>
                                    </Col>
                                    <Col lg={2} md={4}>
                                        <div className="d-flex">
                                            <Button variant="primary" type="submit" className="flex-grow-1 me-2">
                                                Search
                                            </Button>
                                            <Button variant="outline-secondary" onClick={toggleFilters}>
                                                <FontAwesomeIcon icon={faFilter} />
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>

                                {showFilters && (
                                    <Row className="mt-3">
                                        <Col md={4} className="mb-3 mb-md-0">
                                            <Form.Group>
                                                <Form.Label>Job Type</Form.Label>
                                                <Form.Select
                                                    value={jobTypeFilter}
                                                    onChange={(e) => setJobTypeFilter(e.target.value)}
                                                >
                                                    <option value="">All Types</option>
                                                    <option value="Full-time">Full-time</option>
                                                    <option value="Part-time">Part-time</option>
                                                    <option value="Contract">Contract</option>
                                                    <option value="Freelance">Freelance</option>
                                                    <option value="Internship">Internship</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4} className="mb-3 mb-md-0">
                                            <Form.Group>
                                                <Form.Label>Sort By</Form.Label>
                                                <Form.Select
                                                    value={sortBy}
                                                    onChange={(e) => setSortBy(e.target.value)}
                                                >
                                                    <option value="created_at">Date Posted</option>
                                                    <option value="title">Job Title</option>
                                                    <option value="company">Company</option>
                                                    <option value="salary_min">Salary</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={4}>
                                            <Form.Group>
                                                <Form.Label>Sort Order</Form.Label>
                                                <Button
                                                    variant={sortOrder === '-1' ? 'primary' : 'outline-primary'}
                                                    className="me-2"
                                                    onClick={() => setSortOrder('-1')}
                                                >
                                                    <FontAwesomeIcon icon={faSortAmountDown} />
                                                </Button>
                                                <Button
                                                    variant={sortOrder === '1' ? 'primary' : 'outline-primary'}
                                                    onClick={() => setSortOrder('1')}
                                                >
                                                    <FontAwesomeIcon icon={faSortAmountUp} />
                                                </Button>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                )}

                                {showFilters && (
                                    <Row className="mt-3">
                                        <Col>
                                            <Button variant="link" onClick={resetFilters}>Reset Filters</Button>
                                        </Col>
                                    </Row>
                                )}
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {loading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            ) : error ? (
                <div className="text-center py-5">
                    <p className="text-danger">{error}</p>
                    <Button variant="primary" onClick={fetchJobs}>Try Again</Button>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-5">
                    <h3>No jobs found</h3>
                    <p>Try adjusting your search criteria or check back later for new opportunities.</p>
                    {(searchTerm || locationFilter || jobTypeFilter) && (
                        <Button variant="link" onClick={resetFilters}>Clear filters</Button>
                    )}
                </div>
            ) : (
                <>
                    <Row className="mb-3">
                        <Col>
                            <p className="job-count">{totalJobs} jobs found</p>
                        </Col>
                    </Row>

                    <Row>
                        <Col>
                            {jobs.map(job => (
                                <Card key={job._id} className="job-card mb-3">
                                    <Card.Body>
                                        <Row>
                                            <Col md={8}>
                                                <div className="d-flex">
                                                    <div className="company-logo me-3">
                                                        {/* Replace with company logo */}
                                                        <div className="company-logo-placeholder">
                                                            {job.company ? job.company.charAt(0).toUpperCase() : 'J'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Link to={`/jobs/${job._id}`} className="job-title-link">
                                                            <h3 className="job-title">{job.title}</h3>
                                                        </Link>
                                                        <h5 className="company-name">{job.company}</h5>
                                                        <div className="job-details">
                                                            <span className="job-location">
                                                                <FontAwesomeIcon icon={faLocationDot} className="me-2" />
                                                                {job.location}
                                                            </span>
                                                            {job.job_type && job.job_type.map((type, index) => (
                                                                <Badge key={index} bg="light" text="dark" className="ms-2 job-type-badge">
                                                                    <FontAwesomeIcon icon={faBriefcase} className="me-1" />
                                                                    {type}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4} className="text-md-end mt-3 mt-md-0">
                                                <div className="job-salary">
                                                    {job.salary_min && job.salary_max ? (
                                                        <>₹{job.salary_min.toLocaleString()} - ₹{job.salary_max.toLocaleString()}</>
                                                    ) : job.salary_min ? (
                                                        <>From ₹{job.salary_min.toLocaleString()}</>
                                                    ) : null}
                                                </div>
                                                <div className="job-posted-date text-muted">
                                                    <FontAwesomeIcon icon={faClock} className="me-1" />
                                                    {getDaysAgo(job.created_at)}
                                                </div>
                                                <Link to={`/jobs/${job._id}`} className="btn btn-outline-primary mt-2">
                                                    View Details
                                                </Link>
                                            </Col>
                                        </Row>
                                        <Row className="mt-3">
                                            <Col>
                                                <p className="job-description">
                                                    {truncateText(job.description, 200)}
                                                </p>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))}
                        </Col>
                    </Row>

                    {/* Pagination */}
                    {totalJobs > 10 && (
                        <Row className="mt-4">
                            <Col className="d-flex justify-content-center">
                                <div className="pagination-container">
                                    <Button
                                        variant="outline-primary"
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                    >
                                        Previous
                                    </Button>

                                    {Array.from({ length: Math.ceil(totalJobs / 10) }, (_, i) => (
                                        <Button
                                            key={i}
                                            variant={currentPage === i + 1 ? "primary" : "outline-primary"}
                                            onClick={() => handlePageChange(i + 1)}
                                            className="mx-1"
                                        >
                                            {i + 1}
                                        </Button>
                                    )).slice(
                                        Math.max(0, currentPage - 3),
                                        Math.min(Math.ceil(totalJobs / 10), currentPage + 2)
                                    )}

                                    <Button
                                        variant="outline-primary"
                                        disabled={currentPage === Math.ceil(totalJobs / 10)}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    )}

                    {/* Create Job Button for Alumni Users */}
                    {user && user.role === 'alumni' && (
                        <Row className="mt-4">
                            <Col className="text-center">
                                <Link to="/jobs/create" className="btn btn-success">
                                    Post a New Job
                                </Link>
                            </Col>
                        </Row>
                    )}
                </>
            )}
        </Container>
    );
};

export default JobList;