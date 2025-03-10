import React from "react";
import { Row, Col, Card, Badge, ListGroup, Button, Alert } from 'react-bootstrap';

// Student Mentorship Section
const StudentMentorshipSection = ({ mentorshipData, isOwnProfile }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">{isOwnProfile ? 'My Mentorship Requests' : 'Mentorship Requests'}</h5>
        </Card.Header>
        <Card.Body>
            {mentorshipData.length > 0 ? (
                <ListGroup>
                    {mentorshipData.map((request, index) => (
                        <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 className="mb-1">
                                    Project: {request.project?.title || 'Unknown Project'}
                                </h6>
                                <p className="mb-1 text-muted">
                                    Status:
                                    <Badge
                                        bg={
                                            request.status === 'accepted' ? 'success' :
                                                request.status === 'rejected' ? 'danger' : 'warning'
                                        }
                                        className="ms-2"
                                    >
                                        {request.status}
                                    </Badge>
                                </p>
                                <small>Requested on: {new Date(request.created_at).toLocaleDateString()}</small>
                            </div>
                            {isOwnProfile && request.status === 'accepted' && (
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    href={`/messages?to=${request.mentor_id}`}
                                >
                                    Message Mentor
                                </Button>
                            )}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : (
                <Alert variant="info">
                    {isOwnProfile ? (
                        <>
                            You haven't requested any mentorships yet.
                            <Button
                                variant="link"
                                href="/projects/mentorship"
                                className="p-0 ms-2"
                            >
                                Find a mentor
                            </Button>
                        </>
                    ) : (
                        "This user hasn't requested any mentorships yet."
                    )}
                </Alert>
            )}
        </Card.Body>
    </Card>
);

// Alumni Mentorship Section
const AlumniMentorshipSection = ({ mentorshipData, isOwnProfile }) => (
    <Card className="mb-4">
        <Card.Header>
            <h5 className="mb-0">{isOwnProfile ? 'My Mentees' : 'Mentees'}</h5>
        </Card.Header>
        <Card.Body>
            {mentorshipData.length > 0 ? (
                <ListGroup>
                    {mentorshipData.map((project, index) => (
                        <ListGroup.Item key={index}>
                            <h6 className="mb-1">Project: {project.title}</h6>
                            <p className="mb-0">Students:</p>
                            <ListGroup className="mb-3">
                                {project.students.map((student, sIndex) => (
                                    <ListGroup.Item key={sIndex} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span>{student.name} ({student.role})</span>
                                            <br />
                                            <small className="text-muted">{student.dept}, Batch {student.batch}</small>
                                        </div>
                                        {isOwnProfile && (
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                href={`/messages?to=${student.email}`}
                                            >
                                                Message
                                            </Button>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            ) : (
                <Alert variant="info">
                    {isOwnProfile ? (
                        <>
                            You're not mentoring any students yet.
                            <Button
                                variant="link"
                                href="/alumni/mentorship"
                                className="p-0 ms-2"
                            >
                                View mentorship requests
                            </Button>
                        </>
                    ) : (
                        "This user isn't mentoring any students yet."
                    )}
                </Alert>
            )}
        </Card.Body>
    </Card>
);

// Main Mentorship Component
const ProfileMentorship = ({ mentorshipData, userRole, isOwnProfile }) => {
    return (
        <Row>
            <Col>
                {userRole === 'student' ? (
                    <StudentMentorshipSection
                        mentorshipData={mentorshipData}
                        isOwnProfile={isOwnProfile}
                    />
                ) : (
                    <AlumniMentorshipSection
                        mentorshipData={mentorshipData}
                        isOwnProfile={isOwnProfile}
                    />
                )}
            </Col>
        </Row>
    );
};

export default ProfileMentorship;