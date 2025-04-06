import React, { useState } from "react";
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

// Edit Profile Modal
export const EditProfileModal = ({
    show,
    onHide,
    editForm,
    setEditForm,
    onSubmit,
    userRole
}) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Edit Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={onSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Department</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editForm.dept}
                                    onChange={(e) => setEditForm({ ...editForm, dept: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        {userRole !== 'staff' && (
                            <>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Register Number</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.regno}
                                            onChange={(e) => setEditForm({ ...editForm, regno: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Batch</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={editForm.batch}
                                            onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                                        />
                                    </Form.Group>
                                </Col>
                            </>
                        )}
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Biography</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            placeholder="Tell us about yourself..."
                        />
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>LinkedIn Profile</Form.Label>
                                <Form.Control
                                    type="url"
                                    value={editForm.linkedin}
                                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/in/yourusername"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>GitHub Profile</Form.Label>
                                <Form.Control
                                    type="url"
                                    value={editForm.github}
                                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                                    placeholder="https://github.com/yourusername"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Skills (comma-separated)</Form.Label>
                        <Form.Control
                            type="text"
                            value={editForm.skills}
                            onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                            placeholder="Java, Python, React, etc."
                        />
                        <Form.Text className="text-muted">
                            Enter your skills separated by commas
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-4">
                        <Button
                            variant="secondary"
                            onClick={onHide}
                            className="me-2"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

// Avatar Selection Modal
export const AvatarSelectionModal = ({
    show,
    onHide,
    selectedAvatar,
    setSelectedAvatar,
    userRole,
    userGender,
    onAvatarSelect
}) => {
    const [gender, setGender] = useState(userGender || 'male');

    // Define avatar options based on user role and gender
    const getAvatarOptions = () => {
        if (userRole === 'student') {
            return gender === 'female'
                ? [
                    { id: 'girl_stu_1', src: '/img/girl_stu_1.jpg', alt: 'Female Student 1' },
                    { id: 'girl_stu_2', src: '/img/girl_stu_2.jpg', alt: 'Female Student 2' },
                    { id: 'girl_stu_3', src: '/img/girl_stu_3.jpg', alt: 'Female Student 3' },
                    { id: 'girl_stu_4', src: '/img/girl_stu_4.jpg', alt: 'Female Student 4' }
                ]
                : [
                    { id: 'stu_1', src: '/img/stu_1.jpg', alt: 'Male Student 1' },
                    { id: 'stu_2', src: '/img/stu_2.jpg', alt: 'Male Student 2' },
                    { id: 'stu_3', src: '/img/stu_3.jpg', alt: 'Male Student 3' },
                    { id: 'stu_4', src: '/img/stu_4.jpg', alt: 'Male Student 4' }
                ];
        } else if (userRole === 'alumni') {
            return gender === 'female'
                ? [
                    { id: 'alum_fem_1', src: '/img/alum_fem_1.jpg', alt: 'Female Alumni 1' },
                    { id: 'alum_fem_2', src: '/img/alum_fem_2.jpg', alt: 'Female Alumni 2' },
                    { id: 'alum_fem_3', src: '/img/alum_fem_3.jpg', alt: 'Female Alumni 3' }
                ]
                : [
                    { id: 'alum_1', src: '/img/alum_1.jpg', alt: 'Male Alumni 1' },
                    { id: 'alum_2', src: '/img/alum_2.jpg', alt: 'Male Alumni 2' },
                    { id: 'alum_3', src: '/img/alum_3.jpg', alt: 'Male Alumni 3' }
                ];
        } else {
            // Admin/Staff
            return [
                { id: 'admin', src: '/img/admin.jpg', alt: 'Admin' }
            ];
        }
    };

    // Add default avatar option
    const avatarOptions = [
        { id: 'default', src: '/img/default.jpg', alt: 'Default Avatar' },
        ...getAvatarOptions()
    ];

    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
            size="lg"
        >
            <Modal.Header closeButton>
                <Modal.Title>Choose Your Avatar</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center mb-4">
                    <p>Select an avatar to use as your profile picture.</p>
                </div>

                <Row className="mb-3 justify-content-center">
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Gender (for avatar options)</Form.Label>
                            <Form.Select
                                value={gender}
                                onChange={(e) => {
                                    setGender(e.target.value);
                                    setSelectedAvatar('default'); // Reset selection when gender changes
                                }}
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                <div className="d-flex flex-wrap justify-content-center gap-4 mb-4">
                    {avatarOptions.map((avatar) => (
                        <div
                            key={avatar.id}
                            className={`avatar-option position-relative ${selectedAvatar === avatar.id ? 'selected' : ''}`}
                            onClick={() => setSelectedAvatar(avatar.id)}
                            style={{
                                cursor: 'pointer',
                                border: selectedAvatar === avatar.id ? '3px solid #4e73df' : '3px solid transparent',
                                borderRadius: '8px',
                                padding: '3px'
                            }}
                        >
                            <img
                                src={avatar.src}
                                alt={avatar.alt}
                                className="img-thumbnail"
                                style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                            {selectedAvatar === avatar.id && (
                                <div
                                    className="position-absolute"
                                    style={{
                                        top: '5px',
                                        right: '5px',
                                        background: '#4e73df',
                                        borderRadius: '50%',
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faCheck} />
                                </div>
                            )}
                            <div className="text-center mt-1">
                                <small>{avatar.alt}</small>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="d-flex justify-content-end mt-4">
                    <Button
                        variant="secondary"
                        onClick={onHide}
                        className="me-2"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => {
                            onAvatarSelect(selectedAvatar);
                        }}
                    >
                        Save Avatar
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    );
};

// Job Profile Modal
export const JobProfileModal = ({
    show,
    onHide,
    jobProfileForm,
    setJobProfileForm,
    onSubmit,
    isEditing
}) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>{isEditing ? 'Edit Job Profile' : 'Add Job Profile'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={onSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Company</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={jobProfileForm.company}
                                    onChange={(e) => setJobProfileForm({ ...jobProfileForm, company: e.target.value })}
                                    required
                                    placeholder="Company name"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Job Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={jobProfileForm.job_title}
                                    onChange={(e) => setJobProfileForm({ ...jobProfileForm, job_title: e.target.value })}
                                    required
                                    placeholder="Your job title"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            type="text"
                            value={jobProfileForm.location}
                            onChange={(e) => setJobProfileForm({ ...jobProfileForm, location: e.target.value })}
                            placeholder="City, Country"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Industry</Form.Label>
                        <Form.Control
                            type="text"
                            value={jobProfileForm.industry}
                            onChange={(e) => setJobProfileForm({ ...jobProfileForm, industry: e.target.value })}
                            placeholder="e.g., Information Technology, Education, Finance"
                        />
                    </Form.Group>

                    <Row>
                        <Col md={5}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={jobProfileForm.start_date}
                                    onChange={(e) => setJobProfileForm({ ...jobProfileForm, start_date: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3 d-flex align-items-center h-100">
                                <Form.Check
                                    type="checkbox"
                                    id="current-position"
                                    label="Current"
                                    checked={jobProfileForm.current}
                                    onChange={(e) => setJobProfileForm({
                                        ...jobProfileForm,
                                        current: e.target.checked,
                                        end_date: e.target.checked ? '' : jobProfileForm.end_date
                                    })}
                                    className="mt-4"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={5}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={jobProfileForm.end_date}
                                    onChange={(e) => setJobProfileForm({ ...jobProfileForm, end_date: e.target.value })}
                                    disabled={jobProfileForm.current}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={jobProfileForm.description}
                            onChange={(e) => setJobProfileForm({ ...jobProfileForm, description: e.target.value })}
                            placeholder="Describe your role and responsibilities"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Skills (comma-separated)</Form.Label>
                        <Form.Control
                            type="text"
                            value={jobProfileForm.skills}
                            onChange={(e) => setJobProfileForm({ ...jobProfileForm, skills: e.target.value })}
                            placeholder="Project Management, Python, Data Analysis, etc."
                        />
                        <Form.Text className="text-muted">
                            Enter skills related to this position, separated by commas
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-4">
                        <Button
                            variant="secondary"
                            onClick={onHide}
                            className="me-2"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEditing ? 'Update Profile' : 'Create Profile'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

// Job Experience Modal
export const JobExperienceModal = ({
    show,
    onHide,
    jobExperienceForm,
    setJobExperienceForm,
    onSubmit,
    isEditing
}) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            size="lg"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    {isEditing ? 'Edit Work Experience' : 'Add Work Experience'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={onSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Company</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={jobExperienceForm.company}
                                    onChange={(e) => setJobExperienceForm({ ...jobExperienceForm, company: e.target.value })}
                                    required
                                    placeholder="Company name"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Job Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={jobExperienceForm.job_title}
                                    onChange={(e) => setJobExperienceForm({ ...jobExperienceForm, job_title: e.target.value })}
                                    required
                                    placeholder="Your job title"
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            type="text"
                            value={jobExperienceForm.location}
                            onChange={(e) => setJobExperienceForm({ ...jobExperienceForm, location: e.target.value })}
                            placeholder="City, Country"
                        />
                    </Form.Group>

                    <Row>
                        <Col md={5}>
                            <Form.Group className="mb-3">
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={jobExperienceForm.start_date}
                                    onChange={(e) => setJobExperienceForm({ ...jobExperienceForm, start_date: e.target.value })}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3 d-flex align-items-center h-100">
                                <Form.Check
                                    type="checkbox"
                                    id="current-experience"
                                    label="Current"
                                    checked={jobExperienceForm.current}
                                    onChange={(e) => setJobExperienceForm({
                                        ...jobExperienceForm,
                                        current: e.target.checked,
                                        end_date: e.target.checked ? '' : jobExperienceForm.end_date
                                    })}
                                    className="mt-4"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={5}>
                            <Form.Group className="mb-3">
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={jobExperienceForm.end_date}
                                    onChange={(e) => setJobExperienceForm({ ...jobExperienceForm, end_date: e.target.value })}
                                    disabled={jobExperienceForm.current}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={jobExperienceForm.description}
                            onChange={(e) => setJobExperienceForm({ ...jobExperienceForm, description: e.target.value })}
                            placeholder="Describe your role and responsibilities"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Skills (comma-separated)</Form.Label>
                        <Form.Control
                            type="text"
                            value={jobExperienceForm.skills}
                            onChange={(e) => setJobExperienceForm({ ...jobExperienceForm, skills: e.target.value })}
                            placeholder="Project Management, Python, Data Analysis, etc."
                        />
                        <Form.Text className="text-muted">
                            Enter skills related to this position, separated by commas
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-4">
                        <Button
                            variant="secondary"
                            onClick={onHide}
                            className="me-2"
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {isEditing ? 'Update Experience' : 'Add Experience'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};