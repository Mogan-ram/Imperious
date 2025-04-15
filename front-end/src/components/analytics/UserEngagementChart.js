// src/components/analytics/UserEngagementChart.js
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Card, Row, Col, Table, Button, Form, InputGroup, Alert, Spinner, Pagination } from 'react-bootstrap';
import {
    FaUsers, FaChartBar, FaUniversity, FaCalendarAlt, FaUserCircle,
    FaEnvelope, FaSearch, FaFilter, FaUserAlt, FaProjectDiagram,
    FaBuilding
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import messagingService from '../../services/api/messaging';
import { useAuth } from '../../contexts/AuthContext';


ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const UserEngagementChart = ({ data }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('userCounts');
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [batchFilter, setBatchFilter] = useState('all');

    // Fetch users for the users list tab
    useEffect(() => {
        const fetchUsers = async () => {
            if (activeTab === 'usersList') {
                try {
                    setLoading(true);
                    setError(null);
                    // Build the query string for filtering
                    const queryString = new URLSearchParams({
                        role: roleFilter !== 'all' ? roleFilter : '',
                        dept: departmentFilter !== 'all' ? departmentFilter : '',
                        page: currentPage,
                        per_page: 10
                    }).toString();

                    const response = await alumniApi.getAllUsers(queryString, user?.authToken);

                    // Check if response.users exists and is an array
                    if (response && response.users && Array.isArray(response.users)) {
                        setUsersList(response.users);
                        setTotalPages(response.total_pages || 1);
                    } else if (response && Array.isArray(response)) {
                        // If response itself is an array
                        setUsersList(response);
                        setTotalPages(Math.ceil(response.length / 10));
                    } else {
                        console.error("Unexpected response format:", response);
                        setUsersList([]);
                        setError("Received unexpected data format from server");
                    }
                } catch (error) {
                    console.error("Error fetching users:", error);
                    setError("Failed to load users. Please try again later.");
                    toast.error("Failed to load users");
                    setUsersList([]);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUsers();
    }, [activeTab, roleFilter, departmentFilter, user?.authToken, currentPage]);

    if (!data) {
        return <div>No data available for User Engagement.</div>;
    }

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

    // Calculate key metrics
    const totalStudents = data.user_counts.student || 0;
    const totalAlumni = data.user_counts.alumni || 0;
    const totalStaff = data.user_counts.staff || 0;
    const totalUsers = totalStudents + totalAlumni + totalStaff;

    // Get most active department
    const mostActiveDept = data.student_departments.length > 0 ?
        data.student_departments.reduce((prev, current) => (prev.count > current.count) ? prev : current)._id : "None";

    // Count number of departments with active students
    const activeDepartments = data.student_departments.length;

    // Get most used technology from top_technologies
    const topTechnology = data.top_technologies && data.top_technologies.length > 0
        ? data.top_technologies[0].tech
        : "None";
    const topTechProjects = data.top_technologies && data.top_technologies.length > 0
        ? data.top_technologies[0].count
        : 0;

    // Fix for legendItemText.reduce error - ensure labels are strings
    const userRoles = Object.keys(data.user_counts).map(String);
    const userCounts = Object.values(data.user_counts);

    // Map role names to more readable format
    const roleLabels = userRoles.map(role => {
        switch (role.toLowerCase()) {
            case 'student': return 'Students';
            case 'alumni': return 'Alumni';
            case 'staff': return 'Staff';
            default: return role;
        }
    });

    const userCountsData = {
        labels: roleLabels,
        datasets: [{
            label: 'Number of Users',
            data: userCounts,
            backgroundColor: [
                'rgba(54, 162, 235, 0.6)', // Students - Blue
                'rgba(255, 99, 132, 0.6)', // Alumni - Pink
                'rgba(255, 206, 86, 0.6)', // Staff - Yellow
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1
        }]
    };

    const userCountsOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        const percentage = ((value / totalUsers) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}% of total)`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0
                }
            }
        }
    };

    // Ensure dates are properly formatted as strings
    const regDates = data.new_registrations.map(item => String(item._id || ''));
    const regCounts = data.new_registrations.map(item => item.count);

    const registrationData = {
        labels: regDates,
        datasets: [{
            label: 'New Registrations',
            data: regCounts,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const registrationOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        return `${label}: ${value} users`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    };

    const deptLabels = data.student_departments.map(item => String(item._id || ''));
    const deptCounts = data.student_departments.map(item => item.count);

    // Prepare data for department breakdown
    const deptStudentCounts = {};
    const deptAlumniCounts = {};

    // Process student department data
    data.student_departments.forEach(item => {
        deptStudentCounts[item._id] = item.count;
    });

    // Process alumni department data
    data.alumni_departments.forEach(item => {
        deptAlumniCounts[item._id] = item.count;
    });

    // Combine unique departments
    // const allDepts = [...new Set([...deptLabels, ...data.alumni_departments.map(item => String(item._id || ''))])];

    const deptDistributionData = {
        labels: deptLabels,
        datasets: [{
            label: 'Department Distribution',
            data: deptCounts,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    };

    const deptDistributionOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const dept = context.label;
                        const totalCount = context.parsed;
                        const studentCount = deptStudentCounts[dept] || 0;
                        const alumniCount = deptAlumniCounts[dept] || 0;

                        return [
                            `Total: ${totalCount}`,
                            `Students: ${studentCount}`,
                            `Alumni: ${alumniCount}`
                        ];
                    }
                }
            }
        }
    };

    // Combine both student and alumni batches to get complete data
    const allBatches = new Map();

    // First process student batches
    data.student_batches.forEach(item => {
        if (item._id) {
            allBatches.set(String(item._id), {
                studentCount: item.count || 0,
                alumniCount: 0,
                total: item.count || 0
            });
        }
    });

    // Then process alumni batches and merge
    data.alumni_batches.forEach(item => {
        if (item._id) {
            const batchId = String(item._id);
            if (allBatches.has(batchId)) {
                const existing = allBatches.get(batchId);
                existing.alumniCount = item.count || 0;
                existing.total += item.count || 0;
                allBatches.set(batchId, existing);
            } else {
                allBatches.set(batchId, {
                    studentCount: 0,
                    alumniCount: item.count || 0,
                    total: item.count || 0
                });
            }
        }
    });

    // Convert to arrays for chart
    const batchEntries = Array.from(allBatches.entries())
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0])); // Sort by batch year

    const batchLabels = batchEntries.map(([year]) => year);
    const batchTotals = batchEntries.map(([_, data]) => data.total);

    // Store for tooltip data
    // const batchStudentCounts = Object.fromEntries(
    //     batchEntries.map(([year, data]) => [year, data.studentCount])
    // );
    const batchAlumniCounts = Object.fromEntries(
        batchEntries.map(([year, data]) => [year, data.alumniCount])
    );

    // Define a color generator function to get a nice gradient of colors
    const generateColors = (count) => {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 360 / count) % 360;
            colors.push(`hsla(${hue}, 80%, 65%, 0.6)`);
        }
        return colors;
    };

    const backgroundColors = generateColors(batchLabels.length);
    const borderColors = backgroundColors.map(color => color.replace('0.6', '1'));

    const batchDistributionData = {
        labels: batchLabels,
        datasets: [{
            label: 'Total Users',
            data: batchTotals,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
        }]
    };

    const batchDistributionOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const batch = context.label;
                        const studentCount = context.parsed;
                        const alumniCount = batchAlumniCounts[batch] || 0;

                        return [
                            `Total: ${studentCount + alumniCount}`,
                            `Current Students: ${studentCount}`,
                            `Alumni: ${alumniCount}`
                        ];
                    }
                }
            }
        }
    };

    // Safely filter users - ensure usersList is an array before filtering
    const filteredUsers = Array.isArray(usersList) ? usersList.filter(user => {
        // Apply search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                user.regno?.toLowerCase().includes(term) ||
                user.dept?.toLowerCase().includes(term)
            );
        }

        return true;
    }) : [];

    // Extract unique departments for filter
    const departments = Array.isArray(usersList)
        ? Array.from(new Set(usersList.map(user => user.dept).filter(Boolean)))
        : [];

    // Extract unique batches for filter
    // const batches = [...new Set([
    //     ...data.student_batches.map(item => String(item._id || '')),
    //     ...data.alumni_batches.map(item => String(item._id || ''))
    // ])].filter(Boolean).sort();

    // Render appropriate filters based on active tab
    const renderFilters = () => {
        switch (activeTab) {
            case 'userCounts':
                // No filters needed for User Counts
                return null;

            case 'newRegistrations':
                return (
                    <Row>
                        <Col md={4} className="mx-auto">
                            <Form.Group>
                                <Form.Label>Time Period</Form.Label>
                                <Form.Select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                >
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                    <option value="90days">Last 90 Days</option>
                                    <option value="year">This Year</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                );

            case 'departmentDistribution':
                // No filters needed as we show breakdown on hover
                return null;

            case 'batchDistribution':
                // No filters with role selection as we show all data in tooltips
                return null;

            case 'usersList':
                return (
                    <Row>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Filter by Role</Form.Label>
                                <Form.Select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="student">Students</option>
                                    <option value="alumni">Alumni</option>
                                    <option value="staff">Staff</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group>
                                <Form.Label>Filter by Department</Form.Label>
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
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Search</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <FaSearch />
                                    </InputGroup.Text>
                                    <Form.Control
                                        placeholder="Search by name, email, reg.no..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group>
                                <Form.Label>Date Range</Form.Label>
                                <Form.Select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                >
                                    <option value="all">All Time</option>
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                    <option value="90days">Last 90 Days</option>
                                    <option value="year">This Year</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                );

            default:
                return null;
        }
    };

    // Render pagination controls
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const items = [];

        // Add previous button
        items.push(
            <Pagination.Prev
                key="prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
            />
        );

        // Add first page
        items.push(
            <Pagination.Item
                key={1}
                active={currentPage === 1}
                onClick={() => setCurrentPage(1)}
            >
                1
            </Pagination.Item>
        );

        // Add ellipsis if needed
        if (currentPage > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis1" />);
        }

        // Add pages around the current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            items.push(
                <Pagination.Item
                    key={i}
                    active={currentPage === i}
                    onClick={() => setCurrentPage(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }

        // Add ellipsis if needed
        if (currentPage < totalPages - 2) {
            items.push(<Pagination.Ellipsis key="ellipsis2" />);
        }

        // Add last page if not already included
        if (totalPages > 1) {
            items.push(
                <Pagination.Item
                    key={totalPages}
                    active={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                >
                    {totalPages}
                </Pagination.Item>
            );
        }

        // Add next button
        items.push(
            <Pagination.Next
                key="next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
            />
        );

        return <Pagination className="justify-content-center mt-3">{items}</Pagination>;
    };

    return (
        <div>
            <div className="section-header mb-4">
                <h1 className="dashboard-title">Analytics Overview</h1>
                <p className="text-muted">A comprehensive overview of user engagement metrics</p>
            </div>

            {/* Tabs */}
            <div className="section-tabs mb-4">
                <button
                    className={`tab-btn ${activeTab === 'userCounts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('userCounts')}
                >
                    <FaUsers className="tab-icon" /> User Counts
                </button>
                <button
                    className={`tab-btn ${activeTab === 'newRegistrations' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('newRegistrations');

                    }}
                >
                    <FaChartBar className="tab-icon" /> New Registrations
                </button>
                <button
                    className={`tab-btn ${activeTab === 'departmentDistribution' ? 'active' : ''}`}
                    onClick={() => setActiveTab('departmentDistribution')}
                >
                    <FaUniversity className="tab-icon" /> Department Distribution
                </button>
                <button
                    className={`tab-btn ${activeTab === 'batchDistribution' ? 'active' : ''}`}
                    onClick={() => setActiveTab('batchDistribution')}
                >
                    <FaCalendarAlt className="tab-icon" /> Batch Distribution
                </button>
                <button
                    className={`tab-btn ${activeTab === 'usersList' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveTab('usersList');
                        setCurrentPage(1);
                    }}
                >
                    <FaUserCircle className="tab-icon" /> Users List
                </button>
            </div>

            {/* Filters */}
            {(activeTab === 'usersList' || activeTab === 'newRegistrations') && (
                <Card className="mb-4">
                    <Card.Body>
                        {renderFilters()}

                        <div className="d-flex justify-content-end mt-3">
                            <Button
                                variant="outline-secondary"
                                onClick={() => {
                                    setSearchTerm('');
                                    setRoleFilter('all');
                                    setDepartmentFilter('all');
                                    setDateFilter('all');
                                    setBatchFilter('all');
                                    setCurrentPage(1);
                                }}
                            >
                                <FaFilter className="me-1" /> Clear Filters
                            </Button>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Stat Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 className="text-muted">Total Users</h6>
                                    <h2>{totalUsers}</h2>
                                </div>
                                <div className="bg-primary text-white p-3 rounded">
                                    <FaUserAlt />
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 className="text-muted">Most Active Department</h6>
                                    <h2>{mostActiveDept}</h2>
                                </div>
                                <div className="bg-warning text-white p-3 rounded">
                                    <FaBuilding />
                                </div>
                            </div>
                            <div className="text-muted mt-2 pt-2 border-top">
                                {`${data.student_departments.find(d => d._id === mostActiveDept)?.count || 0} users`}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 className="text-muted">Active Departments</h6>
                                    <h2>{activeDepartments}</h2>
                                </div>
                                <div className="bg-success text-white p-3 rounded">
                                    <FaUniversity />
                                </div>
                            </div>
                            <div className="text-muted mt-2 pt-2 border-top">
                                Departments with active students
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="h-100">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <h6 className="text-muted">Top Technology</h6>
                                    <h2>{topTechnology}</h2>
                                </div>
                                <div className="bg-danger text-white p-3 rounded">
                                    <FaProjectDiagram />
                                </div>
                            </div>
                            <div className="text-muted mt-2 pt-2 border-top">
                                {`Used in ${topTechProjects} projects`}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Content based on active tab */}
            <Card>
                <Card.Body>
                    {activeTab === 'userCounts' && (
                        <div style={{ height: '400px' }}>
                            <Bar
                                data={userCountsData}
                                options={userCountsOptions}
                                id="userCountsChart"
                            />
                        </div>
                    )}

                    {activeTab === 'newRegistrations' && (
                        <>
                            <div style={{ height: '400px' }}>
                                <Line
                                    data={registrationData}
                                    options={registrationOptions}
                                    id="registrationsChart"
                                />
                            </div>


                        </>
                    )}

                    {activeTab === 'departmentDistribution' && (
                        <div style={{ height: '400px' }}>
                            <Pie
                                data={deptDistributionData}
                                options={deptDistributionOptions}
                                id="deptDistributionChart"
                            />
                        </div>
                    )}

                    {activeTab === 'batchDistribution' && (
                        <div style={{ height: '400px' }}>
                            <Pie
                                data={batchDistributionData}
                                options={batchDistributionOptions}
                                id="batchDistributionChart"
                            />
                        </div>
                    )}

                    {activeTab === 'usersList' && (
                        <>
                            {loading ? (
                                <div className="text-center py-4">
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-2">Loading users...</p>
                                </div>
                            ) : error ? (
                                <Alert variant="danger">{error}</Alert>
                            ) : filteredUsers.length === 0 ? (
                                <Alert variant="info">No users found matching the criteria.</Alert>
                            ) : (
                                <>
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Department</th>
                                                <th>Reg. No</th>
                                                <th>Batch</th>
                                                <th className="text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((user) => (
                                                <tr key={user._id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td className="text-capitalize">{user.role}</td>
                                                    <td>{user.dept}</td>
                                                    <td>{user.regno || '-'}</td>
                                                    <td>{user.batch || '-'}</td>
                                                    <td className="text-center">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={() => viewProfile(user._id)}
                                                        >
                                                            <FaUserCircle className="me-1" /> Profile
                                                        </Button>
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            onClick={() => startConversation(user.email)}
                                                        >
                                                            <FaEnvelope className="me-1" /> Message
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>

                                    {/* Pagination for Users List */}
                                    {renderPagination()}
                                </>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default UserEngagementChart;