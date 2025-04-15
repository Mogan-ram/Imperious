import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Card,
    Container,
    Row,
    Col,
    Spinner,
    Alert,
    Tabs,
    Tab,
    Button,
    Badge,
    ListGroup
} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { userProfileService } from '../../services/api/userProfile';
import { mentorshipService } from '../../services/api/mentorship';
import { projectService } from '../../services/api/projects';
import { connectionService } from '../../services/api/connection';
import { jobProfileService } from '../../services/api/jobProfile';
import avatarService from "../../services/api/avatarService";
import './Profile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

// Import our component files
import ProfileHeader from './ProfileHeader';
import ProfileOverview from './ProfileOverview';
import ProfileProjects from './ProfileProjects';
import ProfileMentorship from './ProfileMentorship';
import ProfileConnections from './ProfileConnections';
import ProfileJobExperience from './ProfileJobExperience';
import {
    EditProfileModal,
    AvatarSelectionModal, // Import the new AvatarSelectionModal
    JobProfileModal,
    JobExperienceModal
} from './modals/ProfileModals';

const Profile = () => {
    // Get userId from URL params
    const { userId } = useParams();

    const { user } = useAuth();

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
    const [connectionStatus, setConnectionStatus] = useState(null);

    // Avatar states
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState('default');
    const [userGender, setUserGender] = useState('male');

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showJobProfileModal, setShowJobProfileModal] = useState(false);
    const [showJobExperienceModal, setShowJobExperienceModal] = useState(false);

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
    const fetchUserConnections = useCallback(async (targetUserId = null) => {
        try {
            const connections = await userProfileService.getConnections(targetUserId);
            setUserConnections(connections);
        } catch (error) {
            console.error('Error fetching user connections:', error);
        }
    }, []);

    // Fetch connection stats
    const fetchConnections = useCallback(async (targetUserId = null) => {
        try {
            const response = await userProfileService.getConnections(targetUserId);
            setConnections(response || {});
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    }, []);

    // Fetch connection status between current user and viewed profile
    const fetchConnectionStatus = useCallback(async (targetUserId) => {
        if (!user || !targetUserId || user._id === targetUserId) return;

        try {
            const status = await connectionService.getConnectionStatus(targetUserId);
            setConnectionStatus(status);
        } catch (error) {
            console.error('Error fetching connection status:', error);
        }
    }, [user]);

    // Fetch user projects
    // Update in Profile.js - fetchProjects function
    const fetchProjects = useCallback(async (targetUserId = null) => {
        try {
            // Simply use getProjects for both cases
            const response = await projectService.getProjects();
            setProjects(response || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    }, [user]);

    // Fetch mentorship data based on user role
    // Update in Profile.js - fetchMentorshipData function
    const fetchMentorshipData = useCallback(async (targetUser = null) => {
        if (!targetUser) return;

        try {
            if (targetUser.role === 'alumni') {
                if (isOwnProfile) {
                    // Get current user's mentees
                    const response = await mentorshipService.getMentees();
                    setMentorshipData(response || {});
                }
            } else if (targetUser.role === 'student') {
                const response = await mentorshipService.getRequests();
                setMentorshipData(response || []);
            }
        } catch (error) {
            console.error('Error fetching mentorship data:', error);
        }
    }, [user, isOwnProfile]);

    // Fetch job profile for alumni
    const fetchJobProfile = useCallback(async (targetUserId = null) => {
        if (!targetUserId) return;

        try {
            // If viewing own profile or target is alumni
            const profile = await jobProfileService.getJobProfile(targetUserId);
            setJobProfile(profile);
        } catch (error) {
            console.error('Error fetching job profile:', error);
        }
    }, []);

    // Function to update the profile data with a new avatar URL
    const updateProfileAvatar = useCallback((avatarUrl) => {
        setProfileData(prevData => ({
            ...prevData,
            photo_url: avatarUrl
        }));
    }, []);

    // Handle avatar selection
    const handleAvatarSelect = (avatarId) => {
        if (!isOwnProfile || !user) return;

        // Get the avatar URL based on selection
        const avatarUrl = avatarService.getAvatarUrl(
            avatarId,
            profileData.role,
            userGender
        );


        console.log("Selected avatar ID:", avatarId);
        console.log("Generated avatar URL:", avatarUrl);
        // Update profile with new avatar URL
        updateProfileAvatar(avatarUrl);

        // Save the selection to localStorage
        avatarService.saveAvatarSelection(user.email, avatarId);

        setShowAvatarModal(false);
    };

    // Simplified data fetching in useEffect
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                let userData;



                // Check if we're viewing our own profile or someone else's
                if (!userId || userId === user._id) {
                    setIsOwnProfile(true);
                    // Use userProfileService instead of authService
                    userData = await userProfileService.getMyProfile();
                } else {
                    setIsOwnProfile(false);
                    userData = await userProfileService.getUserProfile(userId);
                }

                setProfileData(userData);
                console.log("Profile data: ", userData);

                // Initialize other data in parallel based on user role
                const promises = [];
                promises.push(fetchConnections(userId));
                promises.push(isOwnProfile ? fetchConnectionRequests() : null);
                promises.push(fetchUserConnections(userId));
                promises.push(fetchProjects(userId));

                if (userData.role === 'student') {
                    promises.push(fetchMentorshipData(userData));
                } else if (userData.role === 'alumni') {
                    promises.push(fetchMentorshipData(userData));
                    promises.push(fetchJobProfile(userId));
                }

                await Promise.all(promises.filter(p => p !== null));
            } catch (err) {
                setError('Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchAllData();
    }, [user, userId]);

    // Handle form submission for profile editing
    const handleEditSubmit = async (e) => {
        e.preventDefault();

        // Process skills from comma-separated string to array
        const formData = {
            ...editForm,
            skills: editForm.skills ? editForm.skills.split(',').map(skill => skill.trim()) : []
        };

        try {
            await userProfileService.updateProfile(formData);
            setShowEditModal(false);

            // Refresh profile data
            const updatedData = await userProfileService.getMyProfile();

            // Keep the avatar URL
            updatedData.photo_url = profileData.photo_url;

            setProfileData(updatedData);
        } catch (error) {
            console.error('Error updating profile:', error);
            setError('Failed to update profile. Please try again.');
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
    const handleSendConnectionRequest = async (toUserId, action = 'connect') => {
        try {
            if (action === 'accept') {
                // Find the request ID and accept it
                const request = connectionRequests.find(
                    req => req.from_user._id === toUserId
                );
                if (request) {
                    await connectionService.respondToRequest(request._id, 'accepted');
                    fetchConnectionRequests();
                    fetchUserConnections();
                }
            } else {
                // Send a new connection request
                await connectionService.sendConnectionRequest(toUserId);
                setConnectionStatus({ status: 'pending_sent' });
            }
        } catch (error) {
            console.error('Error handling connection request:', error);
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

    // Helper function to render connection stats
    const renderConnectionStats = () => {
        const userRole = profileData.role?.toLowerCase() || 'student';

        return (
            <Card className="mb-4 connection-stats-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Connections</h5>
                    {isOwnProfile && connectionRequests.length > 0 && (
                        <div className="position-relative">
                            <Button
                                variant="link"
                                className="p-0 text-decoration-none"
                                onClick={() => setShowRequestsDropdown(!showRequestsDropdown)}
                            >
                                <FontAwesomeIcon icon={faBell} />
                                <Badge bg="danger" pill className="notification-badge">
                                    {connectionRequests.length}
                                </Badge>
                            </Button>
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

                        {(userRole === 'staff' || userRole === 'admin') && (
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
                                                    src={connection.user.photo_url || "/img/default.png"}
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
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
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

    if (!profileData) return (
        <Container className="py-5">
            <Alert variant="warning">Profile not found.</Alert>
        </Container>
    );

    // Combine user and profile data
    const userRole = profileData.role?.toLowerCase() || 'student';

    return (
        <Container fluid className="profile-container py-5">
            <Row className="justify-content-center">
                <Col lg={10}>
                    <Card className="shadow profile-card">
                        {/* Profile Header */}
                        <ProfileHeader
                            profileData={profileData}
                            isOwnProfile={isOwnProfile}
                            connectionStatus={connectionStatus}
                            userRole={user?.role}
                            onEditClick={() => setShowEditModal(true)}
                            onPhotoClick={() => setShowAvatarModal(true)} // Open avatar modal instead
                            onSendConnectionRequest={handleSendConnectionRequest}
                        />

                        {/* Profile Content */}
                        <Card.Body className="profile-body">
                            <Tabs
                                activeKey={activeTab}
                                onSelect={(k) => setActiveTab(k)}
                                className="mb-4 profile-tabs"
                            >
                                {/* Overview Tab */}
                                <Tab eventKey="overview" title="Overview">
                                    <ProfileOverview
                                        profileData={profileData}
                                        connections={connections}
                                        projects={projects}
                                        mentorshipData={mentorshipData}
                                        jobProfile={jobProfile}
                                        isOwnProfile={isOwnProfile}
                                        onJobProfileClick={() => setShowJobProfileModal(true)}
                                        renderConnectionStats={renderConnectionStats}
                                    />
                                </Tab>

                                {/* Projects Tab - Only for Students */}
                                {userRole === 'student' && (
                                    <Tab eventKey="projects" title="Projects">
                                        <ProfileProjects
                                            projects={projects}
                                            isOwnProfile={isOwnProfile}
                                        />
                                    </Tab>
                                )}

                                {/* Job Profile Tab - Only for Alumni */}
                                {userRole === 'alumni' && (
                                    <Tab eventKey="job-profile" title="Job Profile">
                                        <ProfileJobExperience
                                            jobProfile={jobProfile}
                                            isOwnProfile={isOwnProfile}
                                            onEditJobProfile={() => {
                                                setJobProfileForm({
                                                    company: jobProfile.company || '',
                                                    job_title: jobProfile.job_title || '',
                                                    location: jobProfile.location || '',
                                                    start_date: jobProfile.start_date || '',
                                                    end_date: jobProfile.end_date || '',
                                                    current: jobProfile.current || false,
                                                    description: jobProfile.description || '',
                                                    industry: jobProfile.industry || '',
                                                    skills: Array.isArray(jobProfile.skills)
                                                        ? jobProfile.skills.join(', ')
                                                        : ''
                                                });
                                                setShowJobProfileModal(true);
                                            }}
                                            onAddJobProfile={() => setShowJobProfileModal(true)}
                                            onAddJobExperience={() => {
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
                                            onEditJobExperience={handleEditJobExperience}
                                            onDeleteJobExperience={handleDeleteJobExperience}
                                        />
                                    </Tab>
                                )}

                                {/* Mentorship Tab - only for students and alumni */}
                                {(userRole === 'student' || userRole === 'alumni') && (
                                    <Tab eventKey="mentorship" title="Mentorship">
                                        <ProfileMentorship
                                            mentorshipData={mentorshipData}
                                            userRole={userRole}
                                            isOwnProfile={isOwnProfile}
                                        />
                                    </Tab>
                                )}

                                {/* Connections Tab */}
                                <Tab eventKey="connections" title="Connections">
                                    <ProfileConnections
                                        userConnections={userConnections}
                                        connectionRequests={connectionRequests}
                                        isOwnProfile={isOwnProfile}
                                        onConnectionResponse={handleConnectionResponse}
                                    />
                                </Tab>
                            </Tabs>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Modals - Only render these if it's the user's own profile */}
            {isOwnProfile && (
                <>
                    {/* Edit Profile Modal */}
                    <EditProfileModal
                        show={showEditModal}
                        onHide={() => setShowEditModal(false)}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        onSubmit={handleEditSubmit}
                        userRole={userRole}
                    />

                    {/* Avatar Selection Modal */}
                    <AvatarSelectionModal
                        show={showAvatarModal}
                        onHide={() => setShowAvatarModal(false)}
                        selectedAvatar={selectedAvatar}
                        setSelectedAvatar={setSelectedAvatar}
                        userRole={userRole}
                        userGender={userGender}
                        onAvatarSelect={handleAvatarSelect}
                    />

                    {/* Job Profile Modal - Only for Alumni */}
                    {userRole === 'alumni' && (
                        <JobProfileModal
                            show={showJobProfileModal}
                            onHide={() => setShowJobProfileModal(false)}
                            jobProfileForm={jobProfileForm}
                            setJobProfileForm={setJobProfileForm}
                            onSubmit={handleJobProfileSubmit}
                            isEditing={!!jobProfile}
                        />
                    )}

                    {/* Job Experience Modal - Only for Alumni */}
                    {userRole === 'alumni' && (
                        <JobExperienceModal
                            show={showJobExperienceModal}
                            onHide={() => setShowJobExperienceModal(false)}
                            jobExperienceForm={jobExperienceForm}
                            setJobExperienceForm={setJobExperienceForm}
                            onSubmit={handleJobExperienceSubmit}
                            isEditing={!!selectedExperienceId}
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export default Profile;