// src/components/analytics/StudentAnalytics.js
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Table, Badge, Alert, Spinner, Button } from 'react-bootstrap';
import {
    FaChartPie, FaNetworkWired, FaLaptopCode, FaUsers,
    FaHandshake, FaChartLine, FaFilter, FaExclamationTriangle, FaLock
} from 'react-icons/fa';
// import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/api/analytics';
import ProjectChart from './ProjectChart';
import ProjectCollaborationNetwork from './ProjectCollaborationNetwork';
import StatCard from './StatCard';

const StudentAnalytics = ({ analyticsData }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [batchFilter, setBatchFilter] = useState('all');

    // Project list state
    const [projects, setProjects] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectsError, setProjectsError] = useState(null);

    // Student list state
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentsError, setStudentsError] = useState(null);
    const [studentFilters, setStudentFilters] = useState({
        role: 'student',
        dept: '',
        batch: ''
    });

    // Access control state
    const [isAuthorized, setIsAuthorized] = useState(true);

    // Check if user has permission to access analytics
    useEffect(() => {
        if (user) {
            const hasAccess = user.role && ['staff', 'admin'].includes(user.role.toLowerCase());
            setIsAuthorized(hasAccess);

            if (!hasAccess) {
                console.warn('User does not have permission to access analytics data');
            }
        }
    }, [user]);

    // Calculate key metrics from analytics data
    const totalStudents = analyticsData?.user_counts?.student || 0;
    const totalProjects = analyticsData?.total_projects || 0;
    const projectCollaborations = analyticsData?.total_collaborations || Math.round(totalProjects * 0.7);
    const completionRate = analyticsData?.completion_rate ||
        (analyticsData?.project_status_breakdown?.find(s => s.status === 'Completed')?.count / totalProjects * 100)?.toFixed(0) + '%' || '0%';

    // Extract unique departments and batches
    const departments = analyticsData?.student_departments?.map(item => item._id) || [];
    const batchYears = analyticsData?.student_batches?.map(item => item._id) || [];

    // Fetch projects from analytics service
    const fetchProjects = async () => {
        if (!isAuthorized) {
            setProjectsError("You don't have permission to access this data.");
            return;
        }

        setProjectsLoading(true);
        setProjectsError(null);
        try {
            // Use the analytics service to get all projects
            const allProjects = await analyticsService.getAllProjects();
            console.log('Fetched projects:', allProjects);

            if (Array.isArray(allProjects)) {
                // Filter projects based on selected filters
                let filteredProjects = [...allProjects];

                if (departmentFilter !== 'all') {
                    filteredProjects = filteredProjects.filter(project => {
                        const projectDept = project.department ||
                            project.student?.dept ||
                            project.created_by_dept ||
                            (project.creator && project.creator.dept);
                        return projectDept === departmentFilter;
                    });
                }

                if (batchFilter !== 'all') {
                    filteredProjects = filteredProjects.filter(project => {
                        const projectBatch = project.batch ||
                            project.student?.batch ||
                            (project.creator && project.creator.batch);
                        return projectBatch === batchFilter;
                    });
                }

                setProjects(filteredProjects);
            } else {
                setProjects([]);
                setProjectsError("Invalid project data format received.");
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            const errorMessage = error.response?.status === 403
                ? "You don't have permission to access this data."
                : "Failed to load project data. Please try again later.";
            setProjectsError(errorMessage);
        } finally {
            setProjectsLoading(false);
        }
    };

    // Fetch students for analytics
    const fetchStudents = async () => {
        if (!isAuthorized) {
            setStudentsError("You don't have permission to access this data.");
            return;
        }

        setStudentsLoading(true);
        setStudentsError(null);
        try {
            // Use the analytics service to get students with filters
            const filters = {
                role: 'student',
                ...studentFilters
            };

            const response = await analyticsService.getUsers(filters);

            if (response && response.users) {
                setStudents(response.users);
            } else {
                setStudents([]);
                setStudentsError("No student data available");
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            const errorMessage = error.response?.status === 403
                ? "You don't have permission to access this data."
                : "Failed to load student data. Please try again later.";
            setStudentsError(errorMessage);
        } finally {
            setStudentsLoading(false);
        }
    };

    // Load data when tab changes
    useEffect(() => {
        if (activeTab === 'projects' && projects.length === 0 && !projectsLoading) {
            fetchProjects();
        }
        if (activeTab === 'students' && students.length === 0 && !studentsLoading) {
            fetchStudents();
        }
    }, [activeTab]);

    // Refresh data when filters change
    useEffect(() => {
        if (activeTab === 'projects') {
            fetchProjects();
        }
    }, [departmentFilter, batchFilter]);

    // Handle student filter changes
    const handleStudentFilterChange = (e) => {
        const { name, value } = e.target;
        setStudentFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // If user is not authorized, show access denied
    if (!isAuthorized) {
        return (
            <Alert variant="warning" className="d-flex align-items-center">
                <FaLock className="me-3" size={24} />
                <div>
                    <h4 className="mb-2">Access Restricted</h4>
                    <p className="mb-0">You don't have permission to access the analytics dashboard. This feature is available only for staff and admin users.</p>
                </div>
            </Alert>
        );
    }

    // Project List Component
    const ProjectList = () => {
        if (projectsLoading) {
            return (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading projects...</p>
                </div>
            );
        }

        if (projectsError) {
            return (
                <Alert variant="danger" className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <div>
                        <p className="mb-2">{projectsError}</p>
                        <Button variant="outline-danger" size="sm" onClick={fetchProjects}>
                            Try Again
                        </Button>
                    </div>
                </Alert>
            );
        }

        if (projects.length === 0) {
            return (
                <Alert variant="info">
                    <FaExclamationTriangle className="me-2" />
                    No projects found for the selected filters.
                </Alert>
            );
        }

        return (
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Creator</th>
                        <th>Department</th>
                        <th>Tech Stack</th>
                        <th>Progress</th>
                        <th>Collaborators</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map(project => (
                        <tr key={project._id}>
                            <td>
                                <a href={`/projects/${project._id}`} className="text-decoration-none">
                                    {project.title || "Untitled Project"}
                                </a>
                            </td>
                            <td>
                                {(project.creator && project.creator.name) ||
                                    "Unknown"}
                            </td>
                            <td>
                                {project.department ||
                                    (project.creator && project.creator.dept) ||
                                    "Unknown"}
                            </td>
                            <td>
                                {(project.techStack || project.tech_stack || []).slice(0, 3).map((tech, index) => (
                                    <Badge bg="info" key={index} className="me-1 mb-1">
                                        {tech}
                                    </Badge>
                                ))}
                                {(project.techStack?.length > 3 || project.tech_stack?.length > 3) && (
                                    <Badge bg="secondary">+{(project.techStack || project.tech_stack).length - 3}</Badge>
                                )}
                            </td>
                            <td>
                                <div className="progress" style={{ height: '20px' }}>
                                    <div
                                        className={`progress-bar ${project.progress >= 100 ? 'bg-success' : 'bg-primary'}`}
                                        style={{ width: `${project.progress || 0}%` }}
                                    >
                                        {project.progress || 0}%
                                    </div>
                                </div>
                            </td>
                            <td className="text-center">
                                {project.collaborators && project.collaborators.length > 0 ? (
                                    <Badge bg="success">{project.collaborators.length}</Badge>
                                ) : (
                                    <Badge bg="secondary">0</Badge>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    // Student List Component
    const StudentList = () => {
        if (studentsLoading) {
            return (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading students...</p>
                </div>
            );
        }

        if (studentsError) {
            return (
                <Alert variant="danger" className="d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" />
                    <div>
                        <p className="mb-2">{studentsError}</p>
                        <Button variant="outline-danger" size="sm" onClick={fetchStudents}>
                            Try Again
                        </Button>
                    </div>
                </Alert>
            );
        }

        if (students.length === 0) {
            return (
                <Alert variant="info">
                    <FaExclamationTriangle className="me-2" />
                    No students found for the selected filters.
                </Alert>
            );
        }

        return (
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Batch</th>
                        <th>Reg. No</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student._id}>
                            <td>{student.name}</td>
                            <td>{student.email}</td>
                            <td>{student.dept}</td>
                            <td>{student.batch}</td>
                            <td>{student.regno}</td>
                            <td>
                                <a href={`/profile/${student._id}`} className="btn btn-outline-primary btn-sm me-2">
                                    View Profile
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        );
    };

    return (
        <div>
            <div className="section-header mb-4">
                <h1 className="dashboard-title">Student Activities</h1>
                <p className="text-muted">Analysis of student projects and collaborations</p>
            </div>

            {/* Tabs */}
            <div className="section-tabs mb-4">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FaChartPie className="tab-icon" /> Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'collaboration' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collaboration')}
                >
                    <FaNetworkWired className="tab-icon" /> Collaboration Network
                </button>
                <button
                    className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projects')}
                >
                    <FaLaptopCode className="tab-icon" /> Projects
                </button>
                <button
                    className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    <FaUsers className="tab-icon" /> Student List
                </button>
            </div>

            {/* Global Filters for Projects/Overview */}
            {(activeTab === 'overview' || activeTab === 'projects') && (
                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label>Department</Form.Label>
                                    <Form.Select
                                        value={departmentFilter}
                                        onChange={(e) => setDepartmentFilter(e.target.value)}
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map((dept, idx) => (
                                            <option key={idx} value={dept}>{dept}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label>Batch Year</Form.Label>
                                    <Form.Select
                                        value={batchFilter}
                                        onChange={(e) => setBatchFilter(e.target.value)}
                                    >
                                        <option value="all">All Batches</option>
                                        {batchYears.map((year, idx) => (
                                            <option key={idx} value={year}>{year}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <button
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() => {
                                        setDepartmentFilter('all');
                                        setBatchFilter('all');
                                    }}
                                >
                                    <FaFilter className="me-2" /> Reset
                                </button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Stat Cards (for overview and project tabs) */}
            {(activeTab === 'overview' || activeTab === 'projects') && (
                <Row className="mb-4">
                    <Col md={3}>
                        <StatCard
                            title="Total Students"
                            value={totalStudents}
                            icon={FaUsers}
                            color="primary"
                        />
                    </Col>
                    <Col md={3}>
                        <StatCard
                            title="Active Projects"
                            value={totalProjects}
                            icon={FaLaptopCode}
                            color="success"
                        />
                    </Col>
                    <Col md={3}>
                        <StatCard
                            title="Collaborations"
                            value={projectCollaborations}
                            icon={FaHandshake}
                            color="warning"
                        />
                    </Col>
                    <Col md={3}>
                        <StatCard
                            title="Project Completion"
                            value={completionRate}
                            icon={FaChartLine}
                            color="danger"
                        />
                    </Col>
                </Row>
            )}

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <Card>
                    <Card.Body>
                        <ProjectChart data={analyticsData} />
                    </Card.Body>
                </Card>
            )}

            {activeTab === 'collaboration' && (
                <ProjectCollaborationNetwork />
            )}

            {activeTab === 'projects' && (
                <Card>
                    <Card.Body>
                        <h3 className="mb-3">Projects Analysis</h3>
                        <ProjectList />
                    </Card.Body>
                </Card>
            )}

            {activeTab === 'students' && (
                <Card>
                    <Card.Body>
                        <h3 className="mb-3">Student Directory</h3>

                        {/* Student-specific filters */}
                        <Row className="mb-3">
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label>Department</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Filter by department"
                                        name="dept"
                                        value={studentFilters.dept}
                                        onChange={handleStudentFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label>Batch</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Filter by batch year"
                                        name="batch"
                                        value={studentFilters.batch}
                                        onChange={handleStudentFilterChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <button
                                    className="btn btn-primary w-100"
                                    onClick={fetchStudents}
                                >
                                    Apply Filters
                                </button>
                            </Col>
                        </Row>

                        <StudentList />
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default StudentAnalytics;