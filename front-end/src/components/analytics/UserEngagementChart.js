// front-end/src/components/analytics/charts/UserEngagementChart.js
import React, { useState } from 'react';
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
import { Container, Card, Tabs, Tab } from 'react-bootstrap'; // Removed Row, Col (not needed)

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

const UserEngagementChart = ({ data, activeTab, setActiveTab }) => { // Added setActiveTab
    // Removed local chartTab state, now controlled by AnalyticsDashboard
    if (!data) {
        return <div>No data available for User Engagement.</div>;
    }

    const userCountsData = {
        labels: Object.keys(data.user_counts),
        datasets: [{
            label: 'Number of Users',
            data: Object.values(data.user_counts),
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
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                }
            }
        }
    };

    const registrationData = {
        labels: data.new_registrations.map(item => item._id),
        datasets: [{
            label: 'New Registrations',
            data: data.new_registrations.map(item => item.count),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const registrationOptions = {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const deptDistributionData = {
        labels: data.student_departments.map(item => item._id),
        datasets: [{
            label: 'Department Distribution',
            data: data.student_departments.map(item => item.count),
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

    const batchDistributionData = {
        labels: data.student_batches.map(item => item._id.toString()),
        datasets: [{
            label: 'Batch Year Distribution',
            data: data.student_batches.map(item => item.count),
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

    return (
        <Container>
            <Tabs
                activeKey={activeTab} // Controlled by prop from AnalyticsDashboard
                onSelect={(k) => setActiveTab(k)} // Use prop function to update parent state
                id="user-engagement-tabs"
                className="mb-3"
            >
                <Tab eventKey="userCounts" title="User Counts">
                    <Card>
                        <Card.Body>
                            <Card.Title>User Counts by Role</Card.Title>
                            <Bar data={userCountsData} options={userCountsOptions} />
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="newRegistrations" title="New Registrations">
                    <Card>
                        <Card.Body>
                            <Card.Title>New User Registrations Over Time</Card.Title>
                            <Line data={registrationData} options={registrationOptions} />
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="departmentDistribution" title="Department Distribution">
                    <Card>
                        <Card.Body>
                            <Card.Title>Department Distribution</Card.Title>
                            <Pie data={deptDistributionData} />
                        </Card.Body>
                    </Card>
                </Tab>
                <Tab eventKey="batchDistribution" title="Batch Distribution">
                    <Card>
                        <Card.Body>
                            <Card.Title>Batch Distribution</Card.Title>
                            <Pie data={batchDistributionData} />
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default UserEngagementChart;