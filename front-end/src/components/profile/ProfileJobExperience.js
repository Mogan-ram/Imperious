import React from "react";
import { Card, Row, Col, Button, ListGroup, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faPlus,
    faPen,
    faTrash,
    faMapMarkerAlt,
    faCalendarAlt,
    faBriefcase
} from '@fortawesome/free-solid-svg-icons';

// Current Job Position Card
const CurrentPositionCard = ({ jobProfile, isOwnProfile, onEditJobProfile, onAddJobProfile }) => (
    <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Current Position</h5>
            {isOwnProfile && jobProfile && (
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onEditJobProfile}
                >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                </Button>
            )}
        </Card.Header>
        <Card.Body>
            {jobProfile ? (
                <div>
                    <h4>{jobProfile.job_title}</h4>
                    <h5>{jobProfile.company}</h5>
                    {jobProfile.location && (
                        <p className="text-muted">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                            {jobProfile.location}
                        </p>
                    )}
                    <div className="date-range mb-3">
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                        {jobProfile.start_date ? new Date(jobProfile.start_date).toLocaleDateString() : 'N/A'}
                        {jobProfile.current ? (
                            ' - Present'
                        ) : (
                            jobProfile.end_date ? ` - ${new Date(jobProfile.end_date).toLocaleDateString()}` : ''
                        )}
                    </div>
                    {jobProfile.description && (
                        <div className="mb-3">
                            <h6>Description</h6>
                            <p>{jobProfile.description}</p>
                        </div>
                    )}
                    {jobProfile.skills && jobProfile.skills.length > 0 && (
                        <div className="mb-3">
                            <h6>Skills</h6>
                            <div className="skills-container">
                                {jobProfile.skills.map((skill, index) => (
                                    <Badge key={index} bg="info" className="skill-badge me-2 mb-2">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-5">
                    <p className="mb-3">
                        {isOwnProfile
                            ? "You haven't added your job profile yet."
                            : "This user hasn't added their job profile yet."}
                    </p>
                    {isOwnProfile && (
                        <Button
                            variant="primary"
                            onClick={onAddJobProfile}
                        >
                            <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                            Add Job Profile
                        </Button>
                    )}
                </div>
            )}
        </Card.Body>
    </Card>
);

// Job Experience Item
const ExperienceItem = ({
    experience,
    isOwnProfile,
    onEditJobExperience,
    onDeleteJobExperience
}) => (
    <ListGroup.Item className="px-0 py-3">
        <div className="d-flex justify-content-between">
            <div>
                <h5>{experience.job_title}</h5>
                <h6>{experience.company}</h6>
                {experience.location && (
                    <p className="text-muted mb-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                        {experience.location}
                    </p>
                )}
                <div className="date-range mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    {experience.start_date ? new Date(experience.start_date).toLocaleDateString() : 'N/A'}
                    {experience.current ? (
                        ' - Present'
                    ) : (
                        experience.end_date ? ` - ${new Date(experience.end_date).toLocaleDateString()}` : ''
                    )}
                </div>
                {experience.description && (
                    <p className="mt-2">{experience.description}</p>
                )}
                {experience.skills && experience.skills.length > 0 && (
                    <div className="mt-2">
                        {experience.skills.map((skill, skillIndex) => (
                            <Badge key={skillIndex} bg="secondary" className="me-1 mb-1">
                                {skill}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
            {isOwnProfile && (
                <div>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => onEditJobExperience(experience)}
                    >
                        <FontAwesomeIcon icon={faPen} />
                    </Button>
                    <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onDeleteJobExperience(experience._id)}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </Button>
                </div>
            )}
        </div>
    </ListGroup.Item>
);

// Work Experience Card
const WorkExperienceCard = ({
    jobProfile,
    isOwnProfile,
    onAddJobExperience,
    onEditJobExperience,
    onDeleteJobExperience
}) => (
    <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Work Experience</h5>
            {isOwnProfile && (
                <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={onAddJobExperience}
                >
                    <FontAwesomeIcon icon={faPlus} /> Add Experience
                </Button>
            )}
        </Card.Header>
        <Card.Body>
            {jobProfile && jobProfile.experiences && jobProfile.experiences.length > 0 ? (
                <ListGroup variant="flush">
                    {jobProfile.experiences.map((experience, index) => (
                        <ExperienceItem
                            key={index}
                            experience={experience}
                            isOwnProfile={isOwnProfile}
                            onEditJobExperience={onEditJobExperience}
                            onDeleteJobExperience={onDeleteJobExperience}
                        />
                    ))}
                </ListGroup>
            ) : (
                <Alert variant="info" className="text-center">
                    {isOwnProfile
                        ? "You haven't added any work experience yet."
                        : "This user hasn't added any work experience yet."}
                </Alert>
            )}
        </Card.Body>
    </Card>
);

// Main Job Experience Component
const ProfileJobExperience = ({
    jobProfile,
    isOwnProfile,
    onEditJobProfile,
    onAddJobProfile,
    onAddJobExperience,
    onEditJobExperience,
    onDeleteJobExperience
}) => {
    return (
        <Row>
            <Col>
                <CurrentPositionCard
                    jobProfile={jobProfile}
                    isOwnProfile={isOwnProfile}
                    onEditJobProfile={onEditJobProfile}
                    onAddJobProfile={onAddJobProfile}
                />

                <WorkExperienceCard
                    jobProfile={jobProfile}
                    isOwnProfile={isOwnProfile}
                    onAddJobExperience={onAddJobExperience}
                    onEditJobExperience={onEditJobExperience}
                    onDeleteJobExperience={onDeleteJobExperience}
                />
            </Col>
        </Row>
    );
};

export default ProfileJobExperience;