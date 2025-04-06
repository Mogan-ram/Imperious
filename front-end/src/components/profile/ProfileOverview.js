import React from "react";
import { Card, Row, Col, ListGroup, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faIdCard,
    faCalendarAlt,
    faBriefcase,
    faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';

// Personal Information Section
const PersonalInfoCard = ({ profileData }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">Personal Information</h5>
        </Card.Header>
        <Card.Body>
            <ListGroup variant="flush">
                <ListGroup.Item>
                    <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                    Email: {profileData.email}
                </ListGroup.Item>
                {profileData.regno && (
                    <ListGroup.Item>
                        <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                        Reg. No: {profileData.regno}
                    </ListGroup.Item>
                )}
                {profileData.batch && (
                    <ListGroup.Item>
                        <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                        Batch: {profileData.batch}
                    </ListGroup.Item>
                )}
                {profileData.staff_id && (
                    <ListGroup.Item>
                        <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                        Staff ID: {profileData.staff_id}
                    </ListGroup.Item>
                )}
            </ListGroup>
        </Card.Body>
    </Card>
);

// Skills Card
const SkillsCard = ({ skills }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">Skills & Expertise</h5>
        </Card.Header>
        <Card.Body>
            {skills && skills.length > 0 ? (
                <div className="skills-container">
                    {skills.map((skill, index) => (
                        <Badge key={index} bg="info" className="skill-badge me-2 mb-2">
                            {skill}
                        </Badge>
                    ))}
                </div>
            ) : (
                <p className="text-muted">No skills added yet</p>
            )}
        </Card.Body>
    </Card>
);

// Social Links Card
const SocialLinksCard = ({ linkedin, github }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">Social Profiles</h5>
        </Card.Header>
        <Card.Body>
            <ListGroup variant="flush">
                {linkedin ? (
                    <ListGroup.Item>
                        <a href={linkedin} target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-linkedin me-2"></i> LinkedIn
                        </a>
                    </ListGroup.Item>
                ) : null}
                {github ? (
                    <ListGroup.Item>
                        <a href={github} target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-github me-2"></i> GitHub
                        </a>
                    </ListGroup.Item>
                ) : null}
                {!linkedin && !github && (
                    <p className="text-muted">No social profiles added</p>
                )}
            </ListGroup>
        </Card.Body>
    </Card>
);

// Bio Card
const BioCard = ({ bio }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">Bio</h5>
        </Card.Header>
        <Card.Body>
            {bio ? (
                <p>{bio}</p>
            ) : (
                <p className="text-muted">No bio added yet</p>
            )}
        </Card.Body>
    </Card>
);

// Role-Specific Section for Alumni
// Role-Specific Section for Alumni
const AlumniOverviewCard = ({ jobProfile, mentorshipData, onJobProfileClick }) => {
    // Check if mentorshipData is an object with mentees or project_groups property
    const mentees = Array.isArray(mentorshipData)
        ? mentorshipData
        : (mentorshipData?.mentees || mentorshipData?.project_groups || []);

    // Get the count of mentees
    const menteesCount = Array.isArray(mentorshipData)
        ? mentorshipData.length
        : (mentorshipData?.mentees_count || mentorshipData?.mentees?.length || 0);

    // Get the number of unique projects
    const uniqueProjects = Array.isArray(mentorshipData)
        ? Array.from(new Set(mentorshipData.map(m => m._id))).length
        : (mentorshipData?.project_groups?.length || 0);

    return (
        <Card className="mb-4">
            <Card.Header>
                <h5 className="mb-0">Mentorship Activity</h5>
            </Card.Header>
            <Card.Body>
                <p><strong>Current Mentees:</strong> {menteesCount}</p>
                <p><strong>Projects Supervised:</strong> {uniqueProjects}</p>

                {jobProfile ? (
                    <div className="mt-3">
                        <h6>Current Position</h6>
                        <p className="mb-1">
                            <strong>{jobProfile.job_title}</strong> at {jobProfile.company}
                        </p>
                        {jobProfile.location && (
                            <p className="mb-1 text-muted">
                                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-1" />
                                {jobProfile.location}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="mt-3">
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={onJobProfileClick}
                        >
                            <FontAwesomeIcon icon={faBriefcase} className="me-1" />
                            Add Job Profile
                        </Button>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

// Role-Specific Section for Students
const StudentOverviewCard = ({ projects, mentorshipData }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">Academic Progress</h5>
        </Card.Header>
        <Card.Body>
            <p><strong>Projects Completed:</strong> {projects.length}</p>
            <p><strong>Active Mentorships:</strong> {
                mentorshipData.filter(item => item.status === 'accepted').length
            }</p>
            <p><strong>Pending Requests:</strong> {
                mentorshipData.filter(item => item.status === 'pending').length
            }</p>
        </Card.Body>
    </Card>
);

// Role-Specific Section for Staff
const StaffOverviewCard = ({ connections, dept }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">Department Summary</h5>
        </Card.Header>
        <Card.Body>
            <p><strong>Department:</strong> {dept}</p>
            <p><strong>Students:</strong> {connections.departmentStudents || 0}</p>
            <p><strong>Alumni:</strong> {connections.departmentAlumni || 0}</p>
            <p className="mt-3">
                <Button variant="outline-primary" href="/analytics">
                    View Full Analytics
                </Button>
            </p>
        </Card.Body>
    </Card>
);

// Main Overview Component
const ProfileOverview = ({
    profileData,
    connections,
    projects,
    mentorshipData,
    jobProfile,
    isOwnProfile,
    onJobProfileClick,
    renderConnectionStats
}) => {
    const userRole = profileData.role?.toLowerCase() || 'student';

    return (
        <Row>
            <Col md={4}>
                <PersonalInfoCard profileData={profileData} />
                <SkillsCard skills={profileData.skills || []} />
                <SocialLinksCard
                    linkedin={profileData.linkedin}
                    github={profileData.github}
                />
            </Col>
            <Col md={8}>
                <BioCard bio={profileData.bio} />
                {renderConnectionStats && renderConnectionStats()}

                {/* Role-specific overview content */}
                {userRole === 'student' && (
                    <StudentOverviewCard
                        projects={projects}
                        mentorshipData={mentorshipData}
                    />
                )}

                {userRole === 'alumni' && (
                    <AlumniOverviewCard
                        jobProfile={jobProfile}
                        mentorshipData={mentorshipData}
                        onJobProfileClick={isOwnProfile ? onJobProfileClick : null}
                    />
                )}

                {(userRole === 'staff' || userRole === 'admin') && (
                    <StaffOverviewCard
                        connections={connections}
                        dept={profileData.dept}
                    />
                )}
            </Col>
        </Row>
    );
};

export default ProfileOverview;