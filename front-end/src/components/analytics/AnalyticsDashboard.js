// AnalyticsDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Nav, Tab, Tabs } from 'react-bootstrap'; // Removed unused Tabs
import { analyticsService } from '../../services/api/analytics';
import { userService } from '../../services/api/users';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import UserEngagementChart from './UserEngagementChart';
//import MentorshipChart from './MentorshipChart'; // Removed - no longer needed
import ProjectChart from './ProjectChart';
import UserList from './UserList';
import AlumniMentorship from './AlumniMentorship'; // Import the new component

import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [activeTab, setActiveTab] = useState('userEngagement'); // Top-level tab (sidebar)
    const [activeChartTab, setActiveChartTab] = useState('userCounts'); //  Renamed for clarity
    const [users, setUsers] = useState([]);
    const [userLoading, setUserLoading] = useState(false);
    const [filters, setFilters] = useState({ role: '', dept: '', batch: '', regno: '' });

    const loadUsers = useCallback(async (page = 1, perPage = 10) => {
        setUserLoading(true);
        try {
            let queryFilters = { ...filters, page, per_page: perPage };

            // Contextual filtering based on activeChartTab
            if (activeChartTab === 'newRegistrations') {
                const twentyFourHoursAgo = new Date();
                twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 1);
                queryFilters.created_at = twentyFourHoursAgo.toISOString();
            } else if (activeChartTab === 'departmentDistribution' || activeChartTab === "batchDistribution") {
                // No additional filters, handled by general filters below

            }
            else { //For the userCounts
                // Remove role filter if it's empty.
                if (filters.role === "") {
                    delete queryFilters.role;
                }
            }

            const response = await userService.getUsers(queryFilters);
            if (response && response.users) {
                setUsers(response.users);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users.");
            setUsers([]);
        } finally {
            setUserLoading(false);
        }
    }, [filters, activeChartTab]);


    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await analyticsService.getAnalytics();
                setAnalyticsData(data);
            } catch (error) {
                console.error("Error fetching analytics:", error);
                toast.error("Failed to fetch analytics data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [activeChartTab, loadUsers]); // Depend on activeChartTab


    if (loading) {
        return <LoadingSpinner />;
    }

    if (!analyticsData) {
        return <Container className="py-4"><p>No analytics data available.</p></Container>;
    }

    return (
        <Container fluid className="py-4">
            <Row>
                {/* Sidebar */}
                <Col md={3} lg={2} className="sidebar">
                    <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={setActiveTab}>
                        <Nav.Item>
                            <Nav.Link eventKey="userEngagement">User Engagement</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="alumniActivities">Alumni Activities</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="studentActivities">Student Activities</Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>

                {/* Main Content Area */}
                <Col md={9} lg={10} className="content">
                    {activeTab === 'userEngagement' && (
                        <>
                            <UserEngagementChart data={analyticsData} activeTab={activeChartTab} setActiveTab={setActiveChartTab} />
                            <UserList users={users} setUsers={setUsers} filters={filters} setFilters={setFilters} userLoading={userLoading} loadUsers={loadUsers} />
                        </>
                    )}

                    {activeTab === 'alumniActivities' && (
                        <AlumniMentorship />
                    )}

                    {activeTab === 'studentActivities' && (
                        <ProjectChart data={analyticsData} />
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default AnalyticsDashboard;
