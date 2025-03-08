// src/components/analytics/AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { analyticsService } from '../../services/api/analytics';
import { toast } from 'react-toastify';
import {
    FaChartPie, FaGraduationCap, FaUsers, FaBriefcase
} from 'react-icons/fa';

// Import existing components
import UserEngagementChart from './UserEngagementChart';
import AlumniMentorship from './AlumniMentorship';
import StudentAnalytics from './StudentAnalytics';
import JobAnalytics from './JobAnalytics';

import './AnalyticsDashboard.css';

// Sidebar navigation component
const AnalyticsSidebar = ({ activeSection, setActiveSection }) => {
    return (
        <div className="analytics-sidebar">
            <div className="sidebar-header">
                <h4>Analytics</h4>
            </div>
            <ul className="sidebar-nav">
                <li
                    className={activeSection === 'overview' ? 'active' : ''}
                    onClick={() => setActiveSection('overview')}
                >
                    <FaChartPie className="sidebar-icon" /> Overview
                </li>
                <li
                    className={activeSection === 'alumni' ? 'active' : ''}
                    onClick={() => setActiveSection('alumni')}
                >
                    <FaGraduationCap className="sidebar-icon" /> Alumni Activities
                </li>
                <li
                    className={activeSection === 'student' ? 'active' : ''}
                    onClick={() => setActiveSection('student')}
                >
                    <FaUsers className="sidebar-icon" /> Student Activities
                </li>
                <li
                    className={activeSection === 'jobs' ? 'active' : ''}
                    onClick={() => setActiveSection('jobs')}
                >
                    <FaBriefcase className="sidebar-icon" /> Job Analytics
                </li>
            </ul>
        </div>
    );
};

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [activeSection, setActiveSection] = useState('overview');

    // Fetch analytics data on mount
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const data = await analyticsService.getAnalytics();
                setAnalyticsData(data);
            } catch (error) {
                console.error("Error fetching analytics:", error);
                toast.error("Failed to fetch analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="analytics-loading">
                <Spinner animation="border" variant="primary" />
                <p>Loading analytics data...</p>
            </div>
        );
    }

    if (!analyticsData) {
        return <Container className="py-4"><p>No analytics data available.</p></Container>;
    }

    // Render content based on active section
    const renderContent = () => {
        switch (activeSection) {
            case 'overview':
                return <UserEngagementChart data={analyticsData} />;

            case 'alumni':
                return <AlumniMentorship data={analyticsData} />;

            case 'student':
                return <StudentAnalytics analyticsData={analyticsData} />;

            case 'jobs':
                return <JobAnalytics />;

            default:
                return <p>Select a section from the sidebar</p>;
        }
    };

    return (
        <div className="analytics-dashboard-container">
            <AnalyticsSidebar
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />

            <div className="analytics-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default AnalyticsDashboard;