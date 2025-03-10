import React from "react";
import { Modal, Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBriefcase } from '@fortawesome/free-solid-svg-icons';

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

// Photo Upload Modal
export const PhotoUploadModal = ({
    show,
    onHide,
    photoPreview,
    currentPhoto,
    onPhotoChange,
    onPhotoUpload,
    uploading
}) => {
    return (
        <Modal
            show={show}
            onHide={onHide}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Update Profile Photo</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="text-center mb-3">
                    {photoPreview ? (
                        <img
                            src={photoPreview}
                            alt="Preview"
                            className="img-thumbnail"
                            style={{ maxHeight: '200px' }}
                        />
                    ) : (
                        <img
                            src={currentPhoto || "https://via.placeholder.com/150"}
                            alt="Current"
                            className="img-thumbnail"
                            style={{ maxHeight: '200px' }}
                        />
                    )}
                </div>

                <Form.Group controlId="profilePhoto" className="mb-3">
                    <Form.Label>Choose a new photo</Form.Label>
                    <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={onPhotoChange}
                    />
                    <Form.Text className="text-muted">
                        Maximum file size: 2MB. Recommended dimensions: 500x500 pixels.
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
                    <Button
                        variant="primary"
                        onClick={onPhotoUpload}
                        disabled={!photoPreview || uploading}
                    >
                        {uploading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Uploading...
                            </>
                        ) : (
                            'Upload Photo'
                        )}
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