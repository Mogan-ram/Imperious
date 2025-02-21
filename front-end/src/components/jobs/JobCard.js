//src/components/Jobs/JobCard.js
import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaExternalLinkAlt } from 'react-icons/fa';
import './JobCard.css'; // Import the CSS file


const JobCard = ({ job }) => {
    return (
        <Card className="job-card">
            <Card.Body>
                <Card.Title>
                    <Link to={`/jobs/${job._id}`} className="job-title">
                        {job.title}
                    </Link>
                </Card.Title>
                <Card.Subtitle className="job-company">{job.company}</Card.Subtitle>
                <Card.Text className="job-location">Location: {job.location}</Card.Text>
                {job.salary_min && (
                    <Card.Text>
                        Salary: ${job.salary_min}
                        {job.salary_max && ` - $${job.salary_max}`}
                    </Card.Text>
                )}
                <div className="job-type-badges">
                    {job.job_type && job.job_type.map((type, index) => (
                        <Badge key={index} pill bg="primary" className="me-1">
                            {type}
                        </Badge>
                    ))}
                </div>

                <div className="mt-3">

                    <Link to={`/jobs/${job._id}`} className="btn btn-primary btn-sm me-2">
                        View Details
                    </Link>

                    {/* Conditionally render the Apply button */}
                    {job.apply_link && (
                        <a href={job.apply_link} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                            Apply <FaExternalLinkAlt />
                        </a>
                    )}
                </div>
            </Card.Body>
            {job.deadline && (
                <Card.Footer>
                    <small className="text-muted">
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </small>
                </Card.Footer>
            )}
        </Card>
    );
};

export default JobCard;