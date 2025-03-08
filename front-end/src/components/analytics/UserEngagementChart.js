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
import { Card, Row, Col, Table, Button, Form, InputGroup } from 'react-bootstrap';
import {
    FaUsers, FaChartBar, FaUniversity, FaCalendarAlt, FaUserCircle,
    FaEnvelope, FaSearch, FaFilter, FaUserAlt, FaUserPlus,
    FaUserGraduate, FaUserTie, FaChartLine
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import messagingService from '../../services/api/messaging';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from './StatCard';

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

    // Fetch users for the users list tab
    useEffect(() => {
        const fetchUsers = async () => {
            if (activeTab === 'usersList') {
                try {
                    setLoading(true);
                    const response = await alumniApi.getAllUsers('', null);
                    setUsersList(response);
                } catch (error) {
                    console.error("Error fetching users:", error);
                    toast.error("Failed to load users");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUsers();
    }, [activeTab]);

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

    // New users in last 30 days (calculate from new_registrations data)
    const newUsers = data.new_registrations.reduce((sum, item) => sum + item.count, 0) || 0;

    // Active users percentage (example calculation)
    const activeUsersPercentage = "64%";

    // Fix for legendItemText.reduce error - ensure labels are strings
    const userRoles = Object.keys(data.user_counts).map(String);
    const userCounts = Object.values(data.user_counts);

    const userCountsData = {
        labels: userRoles,
        datasets: [{
            label: 'Number of Users',
            data: userCounts,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
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
            }
        }
    };

    const batchLabels = data.student_batches.map(item => String(item._id || ''));
    const batchCounts = data.student_batches.map(item => item.count);

    const batchDistributionData = {
        labels: batchLabels,
        datasets: [{
            label: 'Batch Year Distribution',
            data: batchCounts,
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

    const batchDistributionOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            }
        }
    };

    // Filter users based on search and filters
    const filteredUsers = usersList.filter(user => {
        // Apply role filter
        if (roleFilter !== 'all' && user.role !== roleFilter) {
            return false;
        }

        // Apply department filter
        if (departmentFilter !== 'all' && user.dept !== departmentFilter) {
            return false;
        }

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
    });

    // Extract unique departments for filter
    const departments = Array.from(new Set(usersList.map(user => user.dept).filter(Boolean)));

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
                    onClick={() => setActiveTab('newRegistrations')}
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
                    onClick={() => setActiveTab('usersList')}
                >
                    <FaUserCircle className="tab-icon" /> Users List
                </button>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={activeTab === 'usersList' ? 3 : 4}>
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
                        <Col md={activeTab === 'usersList' ? 3 : 4}>
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
                        {activeTab === 'usersList' && (
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
                        )}
                        <Col md={activeTab === 'usersList' ? 2 : 4}>
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

                    <div className="d-flex justify-content-end mt-3">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setSearchTerm('');
                                setRoleFilter('all');
                                setDepartmentFilter('all');
                                setDateFilter('all');
                            }}
                        >
                            <FaFilter className="me-1" /> Clear Filters
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Stat Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <StatCard
                        title="Total Users"
                        value={totalUsers}
                        icon={FaUserAlt}
                        color="primary"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="New Users"
                        value={newUsers}
                        icon={FaUserPlus}
                        color="success"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="User Distribution"
                        value={`${Math.round((totalStudents / totalUsers) * 100)}% Students`}
                        icon={FaUserGraduate}
                        color="warning"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="Active Users"
                        value={activeUsersPercentage}
                        icon={FaChartLine}
                        color="danger"
                    />
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
                        <div style={{ height: '400px' }}>
                            <Line
                                data={registrationData}
                                options={registrationOptions}
                                id="registrationsChart"
                            />
                        </div>
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
                                <div className="text-center py-4">Loading users...</div>
                            ) : filteredUsers.length === 0 ? (
                                <div className="text-center py-4">No users found matching the criteria.</div>
                            ) : (
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
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default UserEngagementChart;