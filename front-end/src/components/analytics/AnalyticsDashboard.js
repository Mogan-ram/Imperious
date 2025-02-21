import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap'; // Import Bootstrap components
import { analyticsService } from '../../services/api/analytics';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import './AnalyticsDashboard.css'; // Import the CSS file
// Import chart components (we'll create these next)
import UserEngagementChart from './UserEngagementChart';
import MentorshipChart from './MentorshipChart';
import ProjectChart from './ProjectChart';


const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [activeSection, setActiveSection] = useState('user-engagement'); // 'user-engagement', 'mentorship', 'projects'

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
                    <Nav className="flex-column">
                        <Nav.Item>
                            <Nav.Link
                                active={activeSection === 'user-engagement'}
                                onClick={() => setActiveSection('user-engagement')}
                            >
                                User Engagement
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={activeSection === 'mentorship'}
                                onClick={() => setActiveSection('mentorship')}
                            >
                                Mentorship Activity
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link
                                active={activeSection === 'projects'}
                                onClick={() => setActiveSection('projects')}
                            >
                                Project Activity
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </Col>

                {/* Main Content Area */}
                <Col md={9} lg={10} className="content">
                    {activeSection === 'user-engagement' && <UserEngagementChart data={analyticsData} />}
                    {activeSection === 'mentorship' && <MentorshipChart data={analyticsData} />}
                    {activeSection === 'projects' && <ProjectChart data={analyticsData} />}
                </Col>
            </Row>
        </Container>
    );
};

export default AnalyticsDashboard;