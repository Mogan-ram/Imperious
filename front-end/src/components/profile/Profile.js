import React, { useEffect, useState, useCallback } from "react";
import {
    Card,
    Container,
    Row,
    Col,
    Button,
    Form,
    Spinner,
    Alert,
    Tabs,
    Tab,
    Modal,
    Badge,
    ListGroup,
    ProgressBar,
    InputGroup,
    Dropdown
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUser,
    faEnvelope,
    faBuilding,
    faGraduationCap,
    faIdCard,
    faCalendarAlt,
    faEdit,
    faChalkboardTeacher,
    faBriefcase,
    faProjectDiagram,
    faUserGraduate,
    faUsers,
    faUpload,
    faLink,
    faPlus,
    faTrash,
    faPen,
    faHandshake,
    faBell,
    faCheckCircle,
    faTimesCircle,
    faMapMarkerAlt,
    faIndustry,
    faCalendarPlus,
    faCalendarMinus
} from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/api/profile';
import { mentorshipService } from '../../services/api/mentorship';
import { projectService } from '../../services/api/projects';
import { connectionService } from '../../services/api/connections';
import { jobProfileService } from '../../services/api/jobProfile';
import './Profile.css';

const Profile = () => {
    // State management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [connections, setConnections] = useState({});
    const [connectionRequests, setConnectionRequests] = useState([]);
    const [projects, setProjects] = useState([]);
    const [mentorshipData, setMentorshipData] = useState([]);
    const [jobProfile, setJobProfile] = useState(null);
    const [userConnections, setUserConnections] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [showRequestsDropdown, setShowRequestsDropdown] = useState(false);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showJobProfileModal, setShowJobProfileModal] = useState(false);
    const [showJobExperienceModal, setShowJobExperienceModal] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Form states
    const [editForm, setEditForm] = useState({
        name: '',
        dept: '',
        regno: '',
        batch: '',
        bio: '',
        linkedin: '',
        github: '',
        skills: ''
    });

    const [jobProfileForm, setJobProfileForm] = useState({
        company: '',
        job_title: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        description: '',
        industry: '',
        skills: []
    });

    const [jobExperienceForm, setJobExperienceForm] = useState({
        company: '',
        job_title: '',
        location: '',
        start_date: '',
        end_date: '',
        current: false,
        description: '',
        skills: []
    });

    const [selectedExperienceId, setSelectedExperienceId] = useState(null);

    const { user } = useAuth();

    // Fetch connection requests
    const fetchConnectionRequests = useCallback(async () => {
        if (!user) return;

        try {
            const requests = await connectionService.getConnectionRequests();
            setConnectionRequests(requests);
        } catch (error) {
            console.error('Error fetching connection requests:', error);
        }
    }, [user]);

    // Fetch user connections
    const fetchUserConnections = useCallback(async () => {
        if (!user) return;

        try {
            const connections = await connectionService.getConnections();
            setUserConnections(connections);
        } catch (error) {
            console.error('Error fetching user connections:', error);
        }
    }, [user]);

    // Fetch connection stats
    const fetchConnections = useCallback(async () => {
        if (!user?._id) return;

        try {
            const response = await profileService.getConnections(user._id);
            setConnections(response.data || {});
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    }, [user]);

    // Fetch user projects
    const fetchProjects = useCallback(async () => {
        if (!user) return;

        try {
            const response = await projectService.getProjects();
            setProjects(response.data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    }, [user]);

    // Fetch mentorship data based on user role
    const fetchMentorshipData = useCallback(async () => {
        if (!user) return;

        try {
            if (user.role === 'alumni') {
                const response = await mentorshipService.getMentees();
                setMentorshipData(response || []);
            } else if (user.role === 'student') {
                const response = await mentorshipService.getRequests();
                setMentorshipData(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching mentorship data:', error);
        }
    }, [user]);

    // Fetch job profile for alumni
    const fetchJobProfile = useCallback(async () => {
        if (!user || user.role !== 'alumni') return;

        try {
            const profile = await jobProfileService.getJobProfile();
            setJobProfile(profile);
        } catch (error) {
            console.error('Error fetching job profile:', error);
        }
    }, [user]);

    // Initialize all data on component mount
    useEffect(() => {
        const fetchAllData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const data = await profileService.getProfile();
                setProfileData(data);

                // Initialize edit form with current data
                setEditForm({
                    name: data.name || '',
                    dept: data.dept || '',
                    regno: data.regno || '',
                    batch: data.batch || '',
                    bio: data.bio || '',
                    linkedin: data.linkedin || '',
                    github: data.github || '',
                    skills: data.skills ? data.skills.join(', ') : ''
                });

                // Fetch additional data in parallel
                await Promise.all([
                    fetchConnections(),
                    fetchConnectionRequests(),
                    fetchUserConnections(),
                    fetchProjects(),
                    fetchMentorshipData(),
                    fetchJobProfile()
                ]);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        setIsOwnProfile(true); // Set to true for own profile
        fetchAllData();
    }, [user, fetchConnections, fetchConnectionRequests, fetchUserConnections, fetchProjects, fetchMentorshipData, fetchJobProfile]);

    // Handle form submission for profile editing
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        // Process skills from comma-separated string to array
        const formData = {
            ...editForm,
            skills: editForm.skills ? editForm.skills.split(',').map(skill => skill.trim()) : []
        };

        try {
            await profileService.updateProfile(formData);
            setShowEditModal(false);

            // Refresh profile data
            const updatedData = await profileService.getProfile();
            setProfileData(updatedData);
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile. Please try again.');
        }
    };

    // Handle profile photo upload
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoUpload = async () => {
        if (!photoFile) return;

        try {
            const formData = new FormData();
            formData.append('photo', photoFile);
            await profileService.uploadPhoto(formData);

            // Refresh profile data
            const updatedData = await profileService.getProfile();
            setProfileData(updatedData);
            setShowPhotoModal(false);
            setPhotoFile(null);
            setPhotoPreview(null);
        } catch (error) {
            console.error('Error uploading photo:', error);
            setError('Failed to upload photo. Please try again.');
        }
    };

    // Handle connection request response
    const handleConnectionResponse = async (requestId, status) => {
        try {
            await connectionService.respondToRequest(requestId, status);
            // Refresh connection requests
            fetchConnectionRequests();
            // If accepted, also refresh user connections
            if (status === 'accepted') {
                fetchUserConnections();
            }
        } catch (error) {
            console.error('Error responding to connection request:', error);
            setError('Failed to process connection request. Please try again.');
        }
    };

    // Handle sending a connection request
    const handleSendConnectionRequest = async (toUserId) => {
        try {
            await connectionService.sendConnectionRequest(toUserId);
            alert('Connection request sent successfully!');
        } catch (error) {
            console.error('Error sending connection request:', error);
            setError('Failed to send connection request. Please try again.');
        }
    };

    // Handle job profile form submission
    const handleJobProfileSubmit = async (e) => {
        e.preventDefault();

        // Process skills from string to array if needed
        const formData = {
            ...jobProfileForm,
            skills: typeof jobProfileForm.skills === 'string'
                ? jobProfileForm.skills.split(',').map(skill => skill.trim())
                : jobProfileForm.skills
        };

        try {
            if (jobProfile) {
                await jobProfileService.updateJobProfile(formData);
            } else {
                await jobProfileService.createJobProfile(formData);
            }

            setShowJobProfileModal(false);

            // Refresh job profile data
            const updatedProfile = await jobProfileService.getJobProfile();
            setJobProfile(updatedProfile);
        } catch (error) {
            console.error('Error updating job profile:', error);
            setError('Failed to update job profile. Please try again.');
        }
    };

    // Handle job experience form submission
    const handleJobExperienceSubmit = async (e) => {
        e.preventDefault();

        // Process skills from string to array if needed
        const formData = {
            ...jobExperienceForm,
            skills: typeof jobExperienceForm.skills === 'string'
                ? jobExperienceForm.skills.split(',').map(skill => skill.trim())
                : jobExperienceForm.skills
        };

        try {
            if (selectedExperienceId) {
                // Update existing experience
                await jobProfileService.updateJobExperience(selectedExperienceId, formData);
            } else {
                // Add new experience
                await jobProfileService.addJobExperience(formData);
            }

            setShowJobExperienceModal(false);

            // Reset form
            setJobExperienceForm({
                company: '',
                job_title: '',
                location: '',
                start_date: '',
                end_date: '',
                current: false,
                description: '',
                skills: []
            });
            setSelectedExperienceId(null);

            // Refresh job profile data
            const updatedProfile = await jobProfileService.getJobProfile();
            setJobProfile(updatedProfile);
        } catch (error) {
            console.error('Error updating job experience:', error);
            setError('Failed to update job experience. Please try again.');
        }
    };

    // Handle deleting a job experience
    const handleDeleteJobExperience = async (experienceId) => {
        if (window.confirm('Are you sure you want to delete this experience?')) {
            try {
                await jobProfileService.deleteJobExperience(experienceId);

                // Refresh job profile data
                const updatedProfile = await jobProfileService.getJobProfile();
                setJobProfile(updatedProfile);
            } catch (error) {
                console.error('Error deleting job experience:', error);
                setError('Failed to delete job experience. Please try again.');
            }
        }
    };

    // Edit existing job experience
    const handleEditJobExperience = (experience) => {
        setJobExperienceForm({
            company: experience.company || '',
            job_title: experience.job_title || '',
            location: experience.location || '',
            start_date: experience.start_date || '',
            end_date: experience.end_date || '',
            current: experience.current || false,
            description: experience.description || '',
            skills: Array.isArray(experience.skills) ? experience.skills.join(', ') : ''
        });
        setSelectedExperienceId(experience._id);
        setShowJobExperienceModal(true);
    };

    // Loading and error states
    if (loading) return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading...</span>
            </Spinner>
        </div>
    );

    if (error) return (
        <Container className="py-5">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );

    if (!user || !profileData) return (
        <Container className="py-5">
            <Alert variant="warning">No profile data found. Please complete your profile.</Alert>
        </Container>
    );

    // Combine user and profile data
    const displayData = { ...user, ...profileData };
    const userRole = user.role?.toLowerCase() || 'student';

    // Helper function to render connection stats based on user role
    const renderConnectionStats = () => {
        return (
            <Card className="mb-4 connection-stats-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Connections</h5>
                    {isOwnProfile && (
                        <div className="position-relative">
                            <Button
                                variant="link"
                                className="p-0 text-decoration-none"
                                onClick={() => setShowRequestsDropdown(!showRequestsDropdown)}
                            >
                                <FontAwesomeIcon icon={faBell} />
                                {connectionRequests.length > 0 && (
                                    <Badge bg="danger" pill className="notification-badge">
                                        {connectionRequests.length}
                                    </Badge>
                                )}
                            </Button>

                            {showRequestsDropdown && connectionRequests.length > 0 && (
                                <div className="connection-requests-dropdown">
                                    <Card>
                                        <Card.Header className="py-2">
                                            <small className="fw-bold">Connection Requests</small>
                                        </Card.Header>
                                        <ListGroup variant="flush">
                                            {connectionRequests.map((request, index) => (
                                                <ListGroup.Item key={index} className="p-2">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="fw-bold">{request.from_user.name}</div>
                                                            <small className="text-muted">{request.from_user.role} • {request.from_user.dept}</small>
                                                        </div>
                                                        <div>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                className="me-1"
                                                                onClick={() => handleConnectionResponse(request._id, 'accepted')}
                                                            >
                                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleConnectionResponse(request._id, 'rejected')}
                                                            >
                                                                <FontAwesomeIcon icon={faTimesCircle} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </Card>
                                </div>
                            )}
                        </div>
                    )}
                </Card.Header>
                <Card.Body>
                    <Row className="text-center">
                        {userRole === 'student' && (
                            <>
                                <Col>
                                    <h2>{connections.students || 0}</h2>
                                    <p className="text-muted">Student Connections</p>
                                </Col>
                                <Col>
                                    <h2>{connections.alumni || 0}</h2>
                                    <p className="text-muted">Alumni Connections</p>
                                </Col>
                            </>
                        )}

                        {userRole === 'alumni' && (
                            <>
                                <Col>
                                    <h2>{connections.total || 0}</h2>
                                    <p className="text-muted">Total Connections</p>
                                </Col>
                                <Col>
                                    <h2>{connections.students || 0}</h2>
                                    <p className="text-muted">Student Connections</p>
                                </Col>
                                <Col>
                                    <h2>{mentorshipData.length || 0}</h2>
                                    <p className="text-muted">Mentees</p>
                                </Col>
                            </>
                        )}

                        {userRole === 'staff' && (
                            <>
                                <Col>
                                    <h2>{connections.departmentStudents || 0}</h2>
                                    <p className="text-muted">Department Students</p>
                                </Col>
                                <Col>
                                    <h2>{connections.departmentAlumni || 0}</h2>
                                    <p className="text-muted">Department Alumni</p>
                                </Col>
                            </>
                        )}
                    </Row>

                    {userConnections.length > 0 && (
                        <div className="mt-3">
                            <h6 className="mb-2">Recent Connections</h6>
                            <ListGroup variant="flush">
                                {userConnections.slice(0, 3).map((connection, index) => (
                                    <ListGroup.Item key={index} className="px-0 py-2 border-0">
                                        <div className="d-flex align-items-center">
                                            <div className="connection-avatar me-2">
                                                <img
                                                    src={connection.user.photo_url || "https://via.placeholder.com/40"}
                                                    alt={connection.user.name}
                                                    className="rounded-circle"
                                                    width="40"
                                                    height="40"
                                                />
                                            </div>
                                            <div>
                                                <div className="fw-bold">{connection.user.name}</div>
                                                <small className="text-muted">{connection.user.role} • {connection.user.dept}</small>
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                            {userConnections.length > 3 && (
                                <div className="text-center mt-2">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-decoration-none"
                                        onClick={() => setActiveTab('connections')}
                                    >
                                        View All Connections
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    };

    return (
        <Container fluid className="profile-container py-5">
            <Row className="justify-content-center">
                <Col lg={10}>
                    <Card className="shadow profile-card">
                        {/* Profile Header */}
                        <div className="profile-header">
                            <div className="profile-cover-img"></div>
                            <div className="profile-user-info">
                                <div className="profile-avatar-container">
                                    <img
                                        src={profileData.photo_url || "https://via.placeholder.com/150"}
                                        alt={displayData.name}
                                        className="profile-avatar"
                                    />
                                    {isOwnProfile && (
                                        <button
                                            className="photo-edit-button"
                                            onClick={() => setShowPhotoModal(true)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    )}
                                </div>
                                <div className="profile-user-details">
                                    <h2>{displayData.name}</h2>
                                    <p className="profile-role">
                                        <Badge bg="primary" className="role-badge">
                                            {userRole === 'student' && <FontAwesomeIcon icon={faUserGraduate} />}
                                            {userRole === 'alumni' && <FontAwesomeIcon icon={faGraduationCap} />}
                                            {userRole === 'staff' && <FontAwesomeIcon icon={faChalkboardTeacher} />}
                                            {' ' + userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                                        </Badge>
                                        <Badge bg="secondary" className="ms-2 dept-badge">
                                            <FontAwesomeIcon icon={faBuilding} /> {displayData.dept}
                                        </Badge>
                                    </p>
                                    <div className="mt-3">
                                        {isOwnProfile ? (
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() => setShowEditModal(true)}
                                            >
                                                <FontAwesomeIcon icon={faEdit} /> Edit Profile
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleSendConnectionRequest(displayData._id)}
                                                >
                                                    <FontAwesomeIcon icon={faHandshake} /> Connect
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    href={`/messages?to=${displayData.email}`}
                                                >
                                                    <FontAwesomeIcon icon={faEnvelope} /> Message
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Profile Content */}
                        <Card.Body className="profile-body">
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="mb-4 profile-tabs"
                            >
                                {/* Overview Tab */}
                                <Tab eventKey="overview" title="Overview">
                                    <Row>
                                        <Col md={4}>
                                            <Card className="mb-4">
                                                <Card.Header>
                                                    <h5 className="mb-0">Personal Information</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <ListGroup variant="flush">
                                                        <ListGroup.Item>
                                                            <FontAwesomeIcon icon={faEnvelope} className="me-2 text-primary" />
                                                            Email: {displayData.email}
                                                        </ListGroup.Item>
                                                        {displayData.regno && (
                                                            <ListGroup.Item>
                                                                <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                                                                Reg. No: {displayData.regno}
                                                            </ListGroup.Item>
                                                        )}
                                                        {displayData.batch && (
                                                            <ListGroup.Item>
                                                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                                                                Batch: {displayData.batch}
                                                            </ListGroup.Item>
                                                        )}
                                                        {displayData.staff_id && (
                                                            <ListGroup.Item>
                                                                <FontAwesomeIcon icon={faIdCard} className="me-2 text-primary" />
                                                                Staff ID: {displayData.staff_id}
                                                            </ListGroup.Item>
                                                        )}
                                                    </ListGroup>
                                                </Card.Body>
                                            </Card>

                                            <Card className="mb-4">
                                                <Card.Header>
                                                    <h5 className="mb-0">Skills & Expertise</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {displayData.skills && displayData.skills.length > 0 ? (
                                                        <div className="skills-container">
                                                            {displayData.skills.map((skill, index) => (
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

                                            {/* Social Links */}
                                            <Card className="mb-4">
                                                <Card.Header>
                                                    <h5 className="mb-0">Social Profiles</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    <ListGroup variant="flush">
                                                        {displayData.linkedin ? (
                                                            <ListGroup.Item>
                                                                <a href={displayData.linkedin} target="_blank" rel="noopener noreferrer">
                                                                    <i className="fab fa-linkedin me-2"></i> LinkedIn
                                                                </a>
                                                            </ListGroup.Item>
                                                        ) : null}
                                                        {displayData.github ? (
                                                            <ListGroup.Item>
                                                                <a href={displayData.github} target="_blank" rel="noopener noreferrer">
                                                                    <i className="fab fa-github me-2"></i> GitHub
                                                                </a>
                                                            </ListGroup.Item>
                                                        ) : null}
                                                        {!displayData.linkedin && !displayData.github && (
                                                            <p className="text-muted">No social profiles added</p>
                                                        )}
                                                    </ListGroup>
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        <Col md={8}>
                                            <Card className="mb-4">
                                                <Card.Header>
                                                    <h5 className="mb-0">Bio</h5>
                                                </Card.Header>
                                                <Card.Body>
                                                    {displayData.bio ? (
                                                        <p>{displayData.bio}</p>
                                                    ) : (
                                                        <p className="text-muted">No bio added yet</p>
                                                    )}
                                                </Card.Body>
                                            </Card>

                                            {renderConnectionStats()}

                                            {/* Role-specific overview content */}
                                            {userRole === 'student' && (
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
                                            )}

                                            {userRole === 'alumni' && (
                                                <Card className="mb-4">
                                                    <Card.Header>
                                                        <h5 className="mb-0">Mentorship Activity</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <p><strong>Current Mentees:</strong> {mentorshipData.length}</p>
                                                        <p><strong>Projects Supervised:</strong> {
                                                            Array.from(new Set(mentorshipData.map(m => m._id))).length
                                                        }</p>

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
                                                                    onClick={() => setShowJobProfileModal(true)}
                                                                >
                                                                    <FontAwesomeIcon icon={faBriefcase} className="me-1" />
                                                                    Add Job Profile
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            )}

                                            {userRole === 'staff' && (
                                                <Card className="mb-4">
                                                    <Card.Header>
                                                        <h5 className="mb-0">Department Summary</h5>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        <p><strong>Department:</strong> {displayData.dept}</p>
                                                        <p><strong>Students:</strong> {connections.departmentStudents || 0}</p>
                                                        <p><strong>Alumni:</strong> {connections.departmentAlumni || 0}</p>
                                                        <p className="mt-3">
                                                            <Button variant="outline-primary" href="/analytics">
                                                                View Full Analytics
                                                            </Button>
                                                        </p>
                                                    </Card.Body>
                                                </Card>
                                            )}
                                        </Col>
                                    </Row>
                                </Tab>

                                {/* Projects Tab - Only for Students */}
                                {userRole === 'student' && (
                                    <Tab eventKey="projects" title="Projects">
                                        <Row>
                                            {projects.length > 0 ? (
                                                projects.map((project, index) => (
                                                    <Col md={6} lg={4} key={index} className="mb-4">
                                                        <Card className="h-100 project-card">
                                                            <Card.Body>
                                                                <Card.Title>{project.title}</Card.Title>
                                                                <Badge bg="info" className="me-2 mb-3">
                                                                    Progress: {project.progress || 0}%
                                                                </Badge>
                                                                <ProgressBar
                                                                    now={project.progress || 0}
                                                                    variant={
                                                                        project.progress >= 75 ? "success" :
                                                                            project.progress >= 40 ? "info" : "warning"
                                                                    }
                                                                    className="mb-3"
                                                                />
                                                                <Card.Text className="text-truncate-3">
                                                                    {project.abstract}
                                                                </Card.Text>
                                                                <div className="tech-stack mt-2">
                                                                    {project.tech_stack && project.tech_stack.map((tech, techIndex) => (
                                                                        <Badge key={techIndex} bg="secondary" className="me-1 mb-1">
                                                                            {tech}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </Card.Body>
                                                            <Card.Footer>
                                                                <Button
                                                                    variant="outline-primary"
                                                                    size="sm"
                                                                    href={`/projects/${project._id}`}
                                                                >
                                                                    View Details
                                                                </Button>
                                                                {project.github_link && (
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        size="sm"
                                                                        href={project.github_link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="ms-2"
                                                                    >
                                                                        <i className="fab fa-github"></i> GitHub
                                                                    </Button>
                                                                )}
                                                            </Card.Footer>
                                                        </Card>
                                                    </Col>
                                                ))
                                            ) : (
                                                <Col>
                                                    <Alert variant="info">
                                                        You don't have any projects yet.
                                                        <Button
                                                            variant="link"
                                                            href="/projects/create"
                                                            className="p-0 ms-2"
                                                        >
                                                            Create your first project
                                                        </Button>
                                                    </Alert>
                                                </Col>
                                            )}
                                        </Row>
                                    </Tab>
                                )}

                                {/* Job Profile Tab - Only for Alumni */}
                                {userRole === 'alumni' && (
                                    <Tab eventKey="job-profile" title="Job Profile">
                                        <Row>
                                            <Col>
                                                <Card className="mb-4">
                                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0">Current Position</h5>
                                                        {jobProfile && (
                                                            <Button
                                                                variant="outline-primary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setJobProfileForm({
                                                                        company: jobProfile.company || '',
                                                                        job_title: jobProfile.job_title || '',
                                                                        location: jobProfile.location || '',
                                                                        start_date: jobProfile.start_date || '',
                                                                        end_date: jobProfile.end_date || '',
                                                                        current: jobProfile.current || false,
                                                                        description: jobProfile.description || '',
                                                                        industry: jobProfile.industry || '',
                                                                        skills: Array.isArray(jobProfile.skills) ? jobProfile.skills.join(', ') : ''
                                                                    });
                                                                    setShowJobProfileModal(true);
                                                                }}
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
                                                                {jobProfile.industry && (
                                                                    <p className="text-muted">
                                                                        <FontAwesomeIcon icon={faIndustry} className="me-2" />
                                                                        Industry: {jobProfile.industry}
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
                                                                <p className="mb-3">You haven't added your job profile yet.</p>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() => setShowJobProfileModal(true)}
                                                                >
                                                                    <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                                                                    Add Job Profile
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </Card.Body>
                                                </Card>

                                                <Card className="mb-4">
                                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                                        <h5 className="mb-0">Work Experience</h5>
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setJobExperienceForm({
                                                                    company: '',
                                                                    job_title: '',
                                                                    location: '',
                                                                    start_date: '',
                                                                    end_date: '',
                                                                    current: false,
                                                                    description: '',
                                                                    skills: []
                                                                });
                                                                setSelectedExperienceId(null);
                                                                setShowJobExperienceModal(true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faPlus} /> Add Experience
                                                        </Button>
                                                    </Card.Header>
                                                    <Card.Body>
                                                        {jobProfile && jobProfile.experiences && jobProfile.experiences.length > 0 ? (
                                                            <ListGroup variant="flush">
                                                                {jobProfile.experiences.map((experience, index) => (
                                                                    <ListGroup.Item key={index} className="px-0 py-3">
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
                                                                            <div>
                                                                                <Button
                                                                                    variant="outline-secondary"
                                                                                    size="sm"
                                                                                    className="me-2"
                                                                                    onClick={() => handleEditJobExperience(experience)}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faPen} />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="outline-danger"
                                                                                    size="sm"
                                                                                    onClick={() => handleDeleteJobExperience(experience._id)}
                                                                                >
                                                                                    <FontAwesomeIcon icon={faTrash} />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </ListGroup.Item>
                                                                ))}
                                                            </ListGroup>
                                                        ) : (
                                                            <p className="text-center py-3">No work experience added yet.</p>
                                                        )}
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Tab>
                                )}

                                {/* Mentorship Tab - only for students and alumni */}
                                {(userRole === 'student' || userRole === 'alumni') && (
                                    <Tab eventKey="mentorship" title="Mentorship">
                                        <Row>
                                            <Col>
                                                {userRole === 'student' ? (
                                                    <>
                                                        <Card className="mb-4">
                                                            <Card.Header>
                                                                <h5 className="mb-0">My Mentorship Requests</h5>
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
                                                                                {request.status === 'accepted' && (
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
                                                                        You haven't requested any mentorships yet.
                                                                        <Button
                                                                            variant="link"
                                                                            href="/projects/mentorship"
                                                                            className="p-0 ms-2"
                                                                        >
                                                                            Find a mentor
                                                                        </Button>
                                                                    </Alert>
                                                                )}
                                                            </Card.Body>
                                                        </Card>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Card className="mb-4">
                                                            <Card.Header>
                                                                <h5 className="mb-0">My Mentees</h5>
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
                                                                                            <Button
                                                                                                variant="outline-primary"
                                                                                                size="sm"
                                                                                                href={`/messages?to=${student.email}`}
                                                                                            >
                                                                                                Message
                                                                                            </Button>
                                                                                        </ListGroup.Item>
                                                                                    ))}
                                                                                </ListGroup>
                                                                            </ListGroup.Item>
                                                                        ))}
                                                                    </ListGroup>
                                                                ) : (
                                                                    <Alert variant="info">
                                                                        You're not mentoring any students yet.
                                                                        <Button
                                                                            variant="link"
                                                                            href="/alumni/mentorship"
                                                                            className="p-0 ms-2"
                                                                        >
                                                                            View mentorship requests
                                                                        </Button>
                                                                    </Alert>
                                                                )}
                                                            </Card.Body>
                                                        </Card>
                                                    </>
                                                )}
                                            </Col>
                                        </Row>
                                    </Tab>
                                )}

                                {/* Connections Tab */}
                                <Tab eventKey="connections" title="Connections">
                                    <Row>
                                        <Col>
                                            <Card className="mb-4">
                                                <Card.Header className="d-flex justify-content-between align-items-center">
                                                    <h5 className="mb-0">My Connections</h5>
                                                    {connectionRequests.length > 0 && (
                                                        <Badge bg="primary" pill>
                                                            {connectionRequests.length} Pending Requests
                                                        </Badge>
                                                    )}
                                                </Card.Header>
                                                <Card.Body>
                                                    {connectionRequests.length > 0 && (
                                                        <div className="mb-4">
                                                            <h6 className="mb-3">Pending Connection Requests</h6>
                                                            <ListGroup className="mb-4">
                                                                {connectionRequests.map((request, index) => (
                                                                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="connection-avatar me-3">
                                                                                <img
                                                                                    src={request.from_user.photo_url || "https://via.placeholder.com/50"}
                                                                                    alt={request.from_user.name}
                                                                                    className="rounded-circle"
                                                                                    width="50"
                                                                                    height="50"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <h6 className="mb-0">{request.from_user.name}</h6>
                                                                                <p className="mb-0 text-muted">
                                                                                    {request.from_user.role} • {request.from_user.dept}
                                                                                    {request.from_user.batch && ` • Batch ${request.from_user.batch}`}
                                                                                </p>
                                                                                <small className="text-muted">
                                                                                    Requested on {new Date(request.created_at).toLocaleDateString()}
                                                                                </small>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <Button
                                                                                variant="success"
                                                                                size="sm"
                                                                                className="me-2"
                                                                                onClick={() => handleConnectionResponse(request._id, 'accepted')}
                                                                            >
                                                                                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                                                                                Accept
                                                                            </Button>
                                                                            <Button
                                                                                variant="danger"
                                                                                size="sm"
                                                                                onClick={() => handleConnectionResponse(request._id, 'rejected')}
                                                                            >
                                                                                <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                                                                                Decline
                                                                            </Button>
                                                                        </div>
                                                                    </ListGroup.Item>
                                                                ))}
                                                            </ListGroup>
                                                        </div>
                                                    )}

                                                    <h6 className="mb-3">All Connections</h6>
                                                    {userConnections.length > 0 ? (
                                                        <Row>
                                                            {userConnections.map((connection, index) => (
                                                                <Col md={6} xl={4} key={index} className="mb-3">
                                                                    <Card className="h-100 connection-card">
                                                                        <Card.Body>
                                                                            <div className="d-flex">
                                                                                <div className="connection-avatar me-3">
                                                                                    <img
                                                                                        src={connection.user.photo_url || "https://via.placeholder.com/60"}
                                                                                        alt={connection.user.name}
                                                                                        className="rounded-circle"
                                                                                        width="60"
                                                                                        height="60"
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <h6 className="mb-1">{connection.user.name}</h6>
                                                                                    <p className="mb-1 text-muted">
                                                                                        {connection.user.role.charAt(0).toUpperCase() + connection.user.role.slice(1)} • {connection.user.dept}
                                                                                    </p>
                                                                                    {connection.user.batch && (
                                                                                        <p className="mb-1 text-muted">Batch {connection.user.batch}</p>
                                                                                    )}
                                                                                    <small className="text-muted">
                                                                                        Connected on {new Date(connection.connected_at).toLocaleDateString()}
                                                                                    </small>
                                                                                </div>
                                                                            </div>
                                                                        </Card.Body>
                                                                        <Card.Footer className="bg-white">
                                                                            <Button
                                                                                variant="outline-primary"
                                                                                size="sm"
                                                                                className="w-100"
                                                                                href={`/messages?to=${connection.user.email}`}
                                                                            >
                                                                                <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                                                                                Message
                                                                            </Button>
                                                                        </Card.Footer>
                                                                    </Card>
                                                                </Col>
                                                            ))}
                                                        </Row>
                                                    ) : (
                                                        <Alert variant="info">
                                                            You don't have any connections yet. Connect with other users to build your network.
                                                        </Alert>
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Edit Profile Modal */}
            <Modal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Edit Profile</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditSubmit}>
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
                                onClick={() => setShowEditModal(false)}
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

            {/* Upload Photo Modal */}
            <Modal
                show={showPhotoModal}
                onHide={() => setShowPhotoModal(false)}
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
                                src={profileData.photo_url || "https://via.placeholder.com/150"}
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
                            onChange={handlePhotoChange}
                        />
                        <Form.Text className="text-muted">
                            Maximum file size: 2MB. Recommended dimensions: 500x500 pixels.
                        </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-end mt-4">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setShowPhotoModal(false);
                                setPhotoPreview(null);
                                setPhotoFile(null);
                            }}
                            className="me-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handlePhotoUpload}
                            disabled={!photoFile}
                        >
                            Upload Photo
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>

            {/* Job Profile Modal */}
            <Modal
                show={showJobProfileModal}
                onHide={() => setShowJobProfileModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>{jobProfile ? 'Edit Job Profile' : 'Add Job Profile'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleJobProfileSubmit}>
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
                                onClick={() => setShowJobProfileModal(false)}
                                className="me-2"
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                {jobProfile ? 'Update Profile' : 'Create Profile'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Job Experience Modal */}
            <Modal
                show={showJobExperienceModal}
                onHide={() => setShowJobExperienceModal(false)}
                size="lg"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>
                        {selectedExperienceId ? 'Edit Work Experience' : 'Add Work Experience'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleJobExperienceSubmit}>
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
                                onClick={() => setShowJobExperienceModal(false)}
                                className="me-2"
                            >
                                Cancel
                            </Button>
                            <Button variant="primary" type="submit">
                                {selectedExperienceId ? 'Update Experience' : 'Add Experience'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Profile;