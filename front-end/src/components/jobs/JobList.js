// src/components/Jobs/JobList.js

import React, { useState, useEffect, useCallback } from "react";
import { Link } from 'react-router-dom';
import { jobService } from '../../services/api/jobs';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import JobCard from "./JobCard"; // Import JobCard
import { toast } from 'react-toastify';
import { Form, Row, Col, Pagination, InputGroup, Button } from 'react-bootstrap'; // Import Bootstrap components
import './joblist.css';


const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');  // State for search term
    const [filterLocation, setFilterLocation] = useState(''); //state for location
    const [filterJobType, setFilterJobType] = useState('');//state for job type
    const [sortBy, setSortBy] = useState('created_at'); // Sort by creation date by default
    const [sortOrder, setSortOrder] = useState(-1); // Sort Newest by default

    const { user } = useAuth(); // Get the user from AuthContext
    const jobsPerPage = 10;  // Number of jobs per page

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await jobService.getAllJobs(
                currentPage,
                jobsPerPage,
                searchQuery,
                filterLocation,
                filterJobType,
                sortBy,
                sortOrder
            );
            setJobs(response.jobs);
            setTotalPages(response.pages);

        } catch (error) {
            console.error('Error fetching jobs', error);
            toast.error('Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    }, [currentPage, jobsPerPage, searchQuery, filterLocation, filterJobType, sortBy, sortOrder]); // Dependencies of fetchJobs

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);  // fetchJobs is now a dependency

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to the first page when searching
    }
    const handleLocationChange = (e) => {
        setFilterLocation(e.target.value)
        setCurrentPage(1);
    }
    const handleJobTypeChange = (e) => {
        setFilterJobType(e.target.value)
        setCurrentPage(1);
    }
    const handleSortByChange = (e) => {
        setSortBy(e.target.value);
    }
    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value)
    }

    if (loading) {
        return (
            <LoadingSpinner />
        )
    }

    return (
        <div className="container py-4">
            <h1 className="mb-4">Job Listings</h1>

            {/* Search and Filter Form */}
            <div className="mb-4">
                <Row>
                    <Col md={4} className="mb-3">
                        <Form.Label visuallyHidden>Search</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by title, company, or keywords..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className='form-control'
                        />
                    </Col>
                    <Col md={3} className="mb-3">
                        <Form.Label visuallyHidden>Location</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Filter by location"
                            value={filterLocation}
                            onChange={handleLocationChange}
                            className='form-control'
                        />
                    </Col>
                    <Col md={3} className='mb-3'>
                        <Form.Label visuallyHidden>Job Type</Form.Label>
                        <Form.Select value={filterJobType} onChange={handleJobTypeChange} className='form-select'>
                            <option value="">All Job Types</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Internship">Internship</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Temporary">Temporary</option>
                        </Form.Select>
                    </Col>

                    <Col md={2} className='mb-3'>
                        <Form.Label visuallyHidden>Sort By</Form.Label>
                        <Form.Select value={sortBy} onChange={handleSortByChange} className='form-select'>
                            <option value="created_at">Date</option>
                            <option value="title">Title</option>
                            <option value="company">Company</option>
                            <option value='salary_min'>Minimum salary</option>
                            <option value='salary_max'>Maximum salary</option>
                        </Form.Select>
                    </Col>
                    <Col md={2} className='mb-3'>
                        <Form.Label visuallyHidden>Order</Form.Label>
                        <Form.Select value={sortOrder} onChange={handleSortOrderChange} className='form-select'>
                            <option value="-1">Descending</option>
                            <option value="1">Ascending</option>
                        </Form.Select>
                    </Col>
                </Row>

            </div>


            {/* "Post a Job" Button (only for alumni) */}
            {user?.role === "alumni" && (
                <Link to="/jobs/create" className="btn btn-primary mb-3">
                    Post a Job
                </Link>
            )}

            <Row>
                {/* Filter Sidebar (Left Column) */}
                {/* <Col md={3} className="d-none d-md-block">
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Filters</Card.Title>
                           {/* Add your filter controls here (e.g., checkboxes, dropdowns)
                        </Card.Body>
                    </Card>
                </Col> */}

                {/* Job Listings (Right Column) */}
                <Col md={12}>
                    {jobs.length > 0 ? (
                        <>

                            {jobs.map((job) => (<JobCard key={job._id} job={job} />))}

                        </>) : (<p>No jobs found.</p>)
                    }
                </Col>
            </Row>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                        {[...Array(totalPages)].map((_, idx) => (
                            <Pagination.Item
                                key={idx + 1}
                                active={idx + 1 === currentPage}
                                onClick={() => handlePageChange(idx + 1)}
                            >
                                {idx + 1}
                            </Pagination.Item>
                        ))}
                    </Pagination>
                </div>
            )}
        </div>
    );
};

export default JobList;