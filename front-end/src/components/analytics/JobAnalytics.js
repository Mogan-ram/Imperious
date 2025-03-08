// components/analytics/JobAnalytics.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBriefcase,
    faBuilding,
    faLocationDot,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { jobService } from '../../services/api/jobs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './JobAnalytics.css';

const JobAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [jobStats, setJobStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        jobsByType: [],
        jobsByLocation: [],
        recentJobs: []
    });

    // Process jobs data to get analytics
    const processJobsData = (jobs) => {
        // Calculate current date for active jobs
        const currentDate = new Date();

        // Count active jobs (no deadline or deadline in future)
        const activeJobs = jobs.filter(job =>
            !job.deadline || new Date(job.deadline) > currentDate
        );

        // Group jobs by type
        const jobTypeCount = {};
        jobs.forEach(job => {
            if (job.job_type && job.job_type.length) {
                job.job_type.forEach(type => {
                    jobTypeCount[type] = (jobTypeCount[type] || 0) + 1;
                });
            }
        });

        const jobsByType = Object.entries(jobTypeCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Group jobs by location
        const locationCount = {};
        jobs.forEach(job => {
            if (job.location) {
                locationCount[job.location] = (locationCount[job.location] || 0) + 1;
            }
        });

        const jobsByLocation = Object.entries(locationCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 locations

        // Recent jobs (last 5)
        const recentJobs = [...jobs]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        return {
            totalJobs: jobs.length,
            activeJobs: activeJobs.length,
            jobsByType,
            jobsByLocation,
            recentJobs
        };
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Fetch jobs data
    useEffect(() => {
        const fetchJobsData = async () => {
            try {
                setLoading(true);
                // Get all jobs (no pagination for analytics)
                const result = await jobService.getAllJobs(1, 1000);
                if (result && result.jobs) {
                    const stats = processJobsData(result.jobs);
                    setJobStats(stats);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching job stats:', err);
                setError('Failed to load job statistics');
                setLoading(false);
            }
        };

        fetchJobsData();
    }, []);

    // Render loading state
    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading job statistics...</p>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <Alert variant="danger" className="my-3">
                {error}
            </Alert>
        );
    }

    return (
        <div className="job-analytics">
            <h2 className="analytics-section-title mb-4">
                <FontAwesomeIcon icon={faChartLine} className="me-2" />
                Job Portal Analytics
            </h2>

            {/* Summary Cards */}
            <Row className="job-summary-cards mb-4">
                <Col md={6} lg={3} className="mb-3">
                    <Card className="summary-card total-jobs">
                        <Card.Body>
                            <div className="summary-icon">
                                <FontAwesomeIcon icon={faBriefcase} />
                            </div>
                            <div className="summary-data">
                                <h3>{jobStats.totalJobs}</h3>
                                <p className="summary-label">Total Jobs</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3} className="mb-3">
                    <Card className="summary-card active-jobs">
                        <Card.Body>
                            <div className="summary-icon">
                                <FontAwesomeIcon icon={faBriefcase} />
                            </div>
                            <div className="summary-data">
                                <h3>{jobStats.activeJobs}</h3>
                                <p className="summary-label">Active Jobs</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3} className="mb-3">
                    <Card className="summary-card job-types">
                        <Card.Body>
                            <div className="summary-icon">
                                <FontAwesomeIcon icon={faBriefcase} />
                            </div>
                            <div className="summary-data">
                                <h3>{jobStats.jobsByType.length}</h3>
                                <p className="summary-label">Job Types</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={6} lg={3} className="mb-3">
                    <Card className="summary-card job-locations">
                        <Card.Body>
                            <div className="summary-icon">
                                <FontAwesomeIcon icon={faLocationDot} />
                            </div>
                            <div className="summary-data">
                                <h3>{jobStats.jobsByLocation.length}</h3>
                                <p className="summary-label">Job Locations</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                {/* Job Types Chart */}
                <Col lg={6} className="mb-4">
                    <Card className="chart-card">
                        <Card.Header>
                            <h4>
                                <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                                Jobs by Type
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            {jobStats.jobsByType.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={jobStats.jobsByType}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Jobs" fill="#4299e1" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-muted">No job type data available</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                {/* Job Locations Chart */}
                <Col lg={6} className="mb-4">
                    <Card className="chart-card">
                        <Card.Header>
                            <h4>
                                <FontAwesomeIcon icon={faLocationDot} className="me-2" />
                                Top Job Locations
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            {jobStats.jobsByLocation.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={jobStats.jobsByLocation}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Jobs" fill="#48bb78" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-center text-muted">No location data available</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Recent Jobs Table */}
            <Row>
                <Col>
                    <Card className="recent-jobs-card">
                        <Card.Header>
                            <h4>
                                <FontAwesomeIcon icon={faBuilding} className="me-2" />
                                Recently Posted Jobs
                            </h4>
                        </Card.Header>
                        <Card.Body>
                            {jobStats.recentJobs.length > 0 ? (
                                <Table responsive hover>
                                    <thead>
                                        <tr>
                                            <th>Job Title</th>
                                            <th>Company</th>
                                            <th>Location</th>
                                            <th>Type</th>
                                            <th>Posted On</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobStats.recentJobs.map(job => (
                                            <tr key={job._id}>
                                                <td>{job.title}</td>
                                                <td>{job.company}</td>
                                                <td>{job.location}</td>
                                                <td>
                                                    {job.job_type && job.job_type.map((type, idx) => (
                                                        <span key={idx} className="job-type-badge">
                                                            {type}{idx < job.job_type.length - 1 ? ', ' : ''}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td>{formatDate(job.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <p className="text-center text-muted">No recent jobs available</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default JobAnalytics;