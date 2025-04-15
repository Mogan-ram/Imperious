// src/components/analytics/AlumniMentorship.js
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Form, Alert, Table, Badge, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import AlumniList from './AlumniList';
import AlumniCharts from './AlumniCharts';
import ConnectionVisualization from './ConnectionVisualization';
import StatCard from './StatCard';
import {
    FaGraduationCap, FaChalkboardTeacher, FaUsers, FaChartLine,
    FaNetworkWired, FaAddressBook, FaUserGraduate, FaChartPie, FaLaptopCode,
    FaFilter, FaRss, FaUserCircle, FaEnvelope
} from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import messagingService from '../../services/api/messaging';

const AlumniMentorship = ({ data }) => {
    const [activeTab, setActiveTab] = useState('network');
    const [loading, setLoading] = useState(false);
    const [alumniData, setAlumniData] = useState([]);
    const [menteesData, setMenteesData] = useState([]);
    const [postsData, setPostsData] = useState([]);
    const [allMentees, setAllMentees] = useState([]);
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [batchFilter, setBatchFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const { authToken, user } = useAuth();
    const navigate = useNavigate();

    const loadAlumni = useCallback(async () => {
        setLoading(true);
        try {
            const data = await alumniApi.getAlumniWillingness("", authToken);
            setAlumniData(data);
            setError(null);
        } catch (error) {
            console.error("Error loading alumni:", error);
            setError("Failed to load alumni data. Please try again later.");
            toast.error("Failed to load alumni data.");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    // Update for loadAllMentees function in AlumniMentorship.js

    // Replace or update the loadAllMentees function with this improved version
    const loadAllMentees = useCallback(async () => {
        try {
            setLoading(true);
            const allAlumni = await alumniApi.getAlumniWillingness("", authToken);

            const menteesPromises = allAlumni.map(async (alumnus) => {
                try {
                    const response = await alumniApi.getAlumniMentees(alumnus.email, authToken);

                    // Check if the response is in the new format
                    if (response && (response.mentees || response.project_groups)) {
                        // Process the new format
                        return {
                            alumnusId: alumnus._id,
                            alumnusName: alumnus.name,
                            department: alumnus.dept,
                            batch: alumnus.batch,
                            email: alumnus.email,
                            willingness: alumnus.willingness,
                            // Use mentees array if available, otherwise extract students from project_groups
                            mentees: response.mentees ||
                                (response.project_groups || []).flatMap(project =>
                                    (project.students || []).map(student => ({
                                        ...student,
                                        project: {
                                            _id: project._id,
                                            title: project.title,
                                            abstract: project.abstract,
                                            progress: project.progress
                                        }
                                    }))
                                )
                        };
                    } else if (Array.isArray(response)) {
                        // Handle old format where response is an array of projects
                        return {
                            alumnusId: alumnus._id,
                            alumnusName: alumnus.name,
                            department: alumnus.dept,
                            batch: alumnus.batch,
                            email: alumnus.email,
                            willingness: alumnus.willingness,
                            mentees: response.flatMap(project =>
                                (project.students || []).map(student => ({
                                    ...student,
                                    project: {
                                        _id: project._id,
                                        title: project.title,
                                        abstract: project.abstract,
                                        progress: project.progress
                                    }
                                }))
                            )
                        };
                    } else {
                        // Fallback for unknown format
                        console.warn("Unknown response format for mentees:", response);
                        return {
                            alumnusId: alumnus._id,
                            alumnusName: alumnus.name,
                            department: alumnus.dept,
                            batch: alumnus.batch,
                            email: alumnus.email,
                            willingness: alumnus.willingness,
                            mentees: []
                        };
                    }
                } catch (error) {
                    console.error(`Error fetching mentees for ${alumnus.email}:`, error);
                    return {
                        alumnusId: alumnus._id,
                        alumnusName: alumnus.name,
                        department: alumnus.dept,
                        batch: alumnus.batch,
                        email: alumnus.email,
                        willingness: alumnus.willingness,
                        mentees: []
                    };
                }
            });

            const menteesResults = await Promise.all(menteesPromises);
            setMenteesData(menteesResults);

            // Extract all mentees into a flat list with mentor information
            const flattenedMentees = [];
            menteesResults.forEach(result => {
                if (result.mentees && result.mentees.length > 0) {
                    result.mentees.forEach(mentee => {
                        flattenedMentees.push({
                            ...mentee,
                            mentorName: result.alumnusName,
                            mentorEmail: result.email,
                            mentorDept: result.department
                        });
                    });
                }
            });
            setAllMentees(flattenedMentees);

            setError(null);
        } catch (error) {
            console.error("Error loading all mentees:", error);
            setError("Failed to load mentee data. Please try again later.");
            toast.error("Failed to load all mentees data.");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    // Function to load all posts data
    const loadAllPosts = useCallback(async () => {
        try {
            setLoading(true);
            const allAlumni = await alumniApi.getAlumniWillingness("", authToken);
            const postsPromises = allAlumni.map(async (alumnus) => {
                try {
                    const posts = await alumniApi.getAlumniPosts(alumnus.email, authToken);
                    return {
                        alumnusId: alumnus._id,
                        alumnusName: alumnus.name,
                        department: alumnus.dept,
                        batch: alumnus.batch,
                        email: alumnus.email,
                        posts: posts || []
                    };
                } catch (error) {
                    console.error(`Error fetching posts for ${alumnus.email}:`, error);
                    return {
                        alumnusId: alumnus._id,
                        alumnusName: alumnus.name,
                        department: alumnus.dept,
                        batch: alumnus.batch,
                        email: alumnus.email,
                        posts: []
                    };
                }
            });

            const postsResults = await Promise.all(postsPromises);
            setPostsData(postsResults);
            setError(null);
        } catch (error) {
            console.error("Error loading all posts:", error);
            setError("Failed to load posts data. Please try again later.");
            toast.error("Failed to load all posts data.");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        // Load all data when the component mounts
        const loadAllData = async () => {
            setLoading(true);
            try {
                await loadAlumni();
                await loadAllMentees();
                await loadAllPosts();
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [loadAlumni, loadAllMentees, loadAllPosts]);

    // Start conversation with a user
    const startConversation = async (targetEmail) => {
        try {
            // Search for the user
            const searchResult = await messagingService.searchUsers(targetEmail);

            if (searchResult && searchResult.length > 0) {
                const targetUser = searchResult.find(u => u.email === targetEmail);

                if (targetUser) {
                    // Create a conversation
                    await messagingService.createConversation([targetEmail, user.email]);
                    toast.success(`Conversation started with ${targetUser.name}`);

                    // Navigate to messages page
                    navigate('/messages');
                }
            } else {
                toast.error("Could not find user details");
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    // Navigate to profile
    const viewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // View project
    const viewProject = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <Alert variant="danger">
                {error}
            </Alert>
        );
    }

    // Calculate metrics for alumni analytics
    const totalAlumni = alumniData.length;
    const activeAlumniCount = menteesData.filter(a => a.mentees && a.mentees.length > 0).length;
    const alumniEngagementRate = totalAlumni > 0 ? Math.round((activeAlumniCount / totalAlumni) * 100) : 0;
    const totalMentees = allMentees.length;

    // Get unique departments for filter
    const departments = Array.from(new Set(alumniData.map(a => a.dept).filter(Boolean)));

    // Get unique batch years for filter
    const batchYears = Array.from(new Set(alumniData.map(a => a.batch).filter(Boolean)))
        .sort((a, b) => b - a); // Sort in descending order (newest first)

    // Filter mentees based on filters
    const filteredMentees = allMentees.filter(mentee => {
        // Department filter
        if (departmentFilter !== 'all' && mentee.dept !== departmentFilter) {
            return false;
        }

        // Search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                mentee.name?.toLowerCase().includes(term) ||
                mentee.email?.toLowerCase().includes(term) ||
                mentee.project?.title?.toLowerCase().includes(term) ||
                mentee.mentorName?.toLowerCase().includes(term)
            );
        }

        return true;
    });

    // Prepare posts data for visualization
    const postsByMonth = postsData.reduce((acc, alumnus) => {
        if (alumnus.posts && alumnus.posts.length > 0) {
            alumnus.posts.forEach(post => {
                if (post.created_at) {
                    const date = new Date(post.created_at);
                    const month = date.toLocaleString('default', { month: 'short' });
                    acc[month] = (acc[month] || 0) + 1;
                }
            });
        }
        return acc;
    }, {});

    const postsByType = postsData.reduce((acc, alumnus) => {
        if (alumnus.posts && alumnus.posts.length > 0) {
            alumnus.posts.forEach(post => {
                if (post.type) {
                    acc[post.type] = (acc[post.type] || 0) + 1;
                }
            });
        }
        return acc;
    }, {});

    // Posts by Month chart data
    const postsByMonthData = {
        labels: Object.keys(postsByMonth),
        datasets: [{
            label: 'Posts by Month',
            data: Object.values(postsByMonth),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    // Posts by Type chart data
    const postsByTypeData = {
        labels: Object.keys(postsByType),
        datasets: [{
            label: 'Posts by Type',
            data: Object.values(postsByType),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)'
            ],
            borderWidth: 1
        }]
    };

    // Top alumni posters
    const topPosters = postsData
        .filter(alumnus => alumnus.posts && alumnus.posts.length > 0)
        .sort((a, b) => b.posts.length - a.posts.length)
        .slice(0, 5);

    return (
        <div>
            <div className="section-header mb-4">
                <h1 className="dashboard-title">Alumni Activities</h1>
                <p className="text-muted">Insights into alumni engagement and contributions</p>
            </div>

            {/* Tabs */}
            <div className="section-tabs mb-4">
                <button
                    className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
                    onClick={() => setActiveTab('network')}
                >
                    <FaNetworkWired className="tab-icon" /> Network View
                </button>
                <button
                    className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
                    onClick={() => setActiveTab('directory')}
                >
                    <FaAddressBook className="tab-icon" /> Alumni Directory
                </button>
                <button
                    className={`tab-btn ${activeTab === 'mentees' ? 'active' : ''}`}
                    onClick={() => setActiveTab('mentees')}
                >
                    <FaUserGraduate className="tab-icon" /> Mentees List
                </button>
                <button
                    className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <FaRss className="tab-icon" /> Posts Activity
                </button>
                <button
                    className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    <FaChartPie className="tab-icon" /> Analytics
                </button>
            </div>

            {/* Key Alumni Metrics */}
            <Row className="mb-4">
                <Col md={3}>
                    <StatCard
                        title="Total Alumni"
                        value={totalAlumni}
                        icon={FaGraduationCap}
                        color="primary"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="Active Mentors"
                        value={activeAlumniCount}
                        icon={FaChalkboardTeacher}
                        color="success"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="Total Mentees"
                        value={totalMentees}
                        icon={FaUsers}
                        color="warning"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="Engagement Rate"
                        value={`${alumniEngagementRate}%`}
                        icon={FaChartLine}
                        color="danger"
                    />
                </Col>
            </Row>

            {/* Filter section - moved here after stat cards */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filter by Department</Form.Label>
                                <Form.Select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Filter by Batch Year</Form.Label>
                                <Form.Select
                                    value={batchFilter}
                                    onChange={(e) => setBatchFilter(e.target.value)}
                                >
                                    <option value="all">All Batches</option>
                                    {batchYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by name, email, project..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-3">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setDepartmentFilter('all');
                                setBatchFilter('all');
                                setSearchTerm('');
                            }}
                        >
                            <FaFilter className="me-2" /> Reset Filters
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Content based on active tab */}
            {activeTab === 'network' && (
                <ConnectionVisualization
                    alumniData={menteesData}
                    menteesData={menteesData}
                />
            )}

            {activeTab === 'directory' && (
                <AlumniList
                    departmentFilter={departmentFilter}
                    batchFilter={batchFilter}
                // onAlumnusSelect={(email) => console.log("Alumni selected:", email)}
                />
            )}

            {activeTab === 'mentees' && (
                <Card>
                    <Card.Body>
                        <h4 className="mb-4">All Mentees</h4>

                        {filteredMentees.length === 0 ? (
                            <Alert variant="info">
                                No mentees found matching the current filters.
                            </Alert>
                        ) : (
                            <Table responsive striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Department</th>
                                        <th>Project</th>
                                        <th>Mentor</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMentees.map((mentee, index) => (
                                        <tr key={index}>
                                            <td>{mentee.name}</td>
                                            <td>{mentee.email}</td>
                                            <td>{mentee.dept}</td>
                                            <td>
                                                {mentee.project ? (
                                                    <>
                                                        <strong>{mentee.project.title}</strong>
                                                        <div>
                                                            <Badge bg="info" className="me-1">
                                                                {mentee.project.progress || 0}% Complete
                                                            </Badge>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-muted">No project</span>
                                                )}
                                            </td>
                                            <td>
                                                <div>{mentee.mentorName}</div>
                                                <small className="text-muted">{mentee.mentorDept}</small>
                                            </td>
                                            <td className="text-center">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => viewProfile(mentee._id)}
                                                >
                                                    <FaUserCircle className="me-1" /> Profile
                                                </Button>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => startConversation(mentee.email)}
                                                >
                                                    <FaEnvelope className="me-1" /> Message
                                                </Button>
                                                {mentee.project && (
                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        className="ms-2"
                                                        onClick={() => viewProject(mentee.project._id)}
                                                    >
                                                        <FaLaptopCode className="me-1" /> Project
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            )}

            {activeTab === 'posts' && (
                <div>
                    <Row>
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Body>
                                    <h4 className="mb-3">Posts by Month</h4>
                                    <div style={{ height: '300px' }}>
                                        <Bar
                                            data={postsByMonthData}
                                            options={{
                                                maintainAspectRatio: false,
                                                responsive: true,
                                                scales: {
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: {
                                                            precision: 0
                                                        }
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Body>
                                    <h4 className="mb-3">Posts by Type</h4>
                                    <div style={{ height: '300px' }}>
                                        <Pie
                                            data={postsByTypeData}
                                            options={{
                                                maintainAspectRatio: false,
                                                responsive: true
                                            }}
                                        />
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            <h4 className="mb-4">Top Alumni Contributors</h4>

                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Department</th>
                                        <th>Batch</th>
                                        <th>Posts Count</th>
                                        <th>Latest Post</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topPosters.map((alumnus, index) => {
                                        // Find the latest post
                                        const latestPost = alumnus.posts.length > 0
                                            ? alumnus.posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                                            : null;

                                        return (
                                            <tr key={index}>
                                                <td>{alumnus.alumnusName}</td>
                                                <td>{alumnus.department}</td>
                                                <td>{alumnus.batch}</td>
                                                <td>
                                                    <Badge bg="primary">{alumnus.posts.length}</Badge>
                                                </td>
                                                <td>
                                                    {latestPost ? (
                                                        <>
                                                            <div><strong>{latestPost.title}</strong></div>
                                                            <small>
                                                                {new Date(latestPost.created_at).toLocaleDateString()}
                                                            </small>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted">No posts</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-2"
                                                        onClick={() => viewProfile(alumnus.alumnusId)}
                                                    >
                                                        <FaUserCircle className="me-1" /> Profile
                                                    </Button>
                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        onClick={() => startConversation(alumnus.email)}
                                                    >
                                                        <FaEnvelope className="me-1" /> Message
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>

                            {topPosters.length === 0 && (
                                <Alert variant="info">
                                    No alumni posts found.
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            )}

            {activeTab === 'analytics' && (
                <AlumniCharts
                    alumniData={alumniData}
                    menteesData={menteesData}
                    postsData={postsData}
                    id="alumniCharts"
                />
            )}
        </div>
    );
};

export default AlumniMentorship;