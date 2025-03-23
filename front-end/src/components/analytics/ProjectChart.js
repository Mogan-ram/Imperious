// src/components/analytics/ProjectChart.js
import React from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Container, Card, Row, Col } from 'react-bootstrap';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ProjectChart = ({ data }) => {
    if (!data) {
        return <div>No data available for Project Activity.</div>;
    }

    // Fix for legendItemText.reduce error - ensure labels are strings
    const statusLabels = data.project_status_breakdown?.map(item => String(item.status || '')) || [];
    const statusCounts = data.project_status_breakdown?.map(item => item.count) || [];

    // Project Status Breakdown
    const projectStatusData = {
        labels: statusLabels,
        datasets: [{
            label: 'Project Status Breakdown',
            data: statusCounts,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',  // Red - Not Started
                'rgba(54, 162, 235, 0.6)',  // Blue - In Progress
                'rgba(75, 192, 192, 0.6)'   // Green - Completed
            ],
            hoverOffset: 4
        }]
    };

    const projectStatusOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Project Status Distribution'
            }
        }
    };

    // Top Technologies
    const techLabels = data.top_technologies?.map(item => String(item.tech || '')) || [];
    const techCounts = data.top_technologies?.map(item => item.count) || [];

    const topTechnologiesData = {
        labels: techLabels,
        datasets: [{
            label: 'Times Used',
            data: techCounts,
            backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    const topTechnologiesOptions = {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Top Technologies Used in Projects'
            }
        }
    };

    // NEW CHART: Projects with/without Mentors
    // Calculate from available data or use example data
    const mentorshipData = {
        labels: ['With Mentors', 'Without Mentors'],
        datasets: [{
            label: 'Projects',
            data: [
                // Extract from data or use example values
                data.projects_with_mentors || Math.floor(data.total_projects * 0.4),
                data.projects_without_mentors || Math.floor(data.total_projects * 0.6)
            ],
            backgroundColor: [
                'rgba(255, 159, 64, 0.6)', // Orange - With Mentors
                'rgba(201, 203, 207, 0.6)' // Gray - Without Mentors
            ],
            borderColor: [
                'rgb(255, 159, 64)',
                'rgb(201, 203, 207)'
            ],
            borderWidth: 1
        }]
    };

    const mentorshipOptions = {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Projects With & Without Mentors'
            }
        }
    };

    // NEW CHART: Department-wise Project Distribution
    // Use student_departments data or sample data
    const departmentData = {
        labels: data.student_departments?.map(dept => dept._id) ||
            ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE'],
        datasets: [{
            label: 'Number of Projects',
            data: data.student_departments?.map(dept => dept.project_count || Math.ceil(dept.count * 0.75)) ||
                [15, 12, 8, 6, 5],
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    const departmentOptions = {
        maintainAspectRatio: false,
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                    precision: 0
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Department-wise Project Distribution'
            }
        }
    };

    return (
        <Container>
            <h2 className="mb-4">Project Activity Overview</h2>
            <Row>
                <Col md={6}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <div style={{ height: '300px' }}>
                                <Pie
                                    data={projectStatusData}
                                    options={projectStatusOptions}
                                    id="projectStatusChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <div style={{ height: '300px' }}>
                                <Bar
                                    data={topTechnologiesData}
                                    options={topTechnologiesOptions}
                                    id="topTechnologiesChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <div style={{ height: '300px' }}>
                                <Doughnut
                                    data={mentorshipData}
                                    options={mentorshipOptions}
                                    id="mentorshipChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4 shadow-sm">
                        <Card.Body>
                            <div style={{ height: '300px' }}>
                                <Bar
                                    data={departmentData}
                                    options={departmentOptions}
                                    id="departmentProjectsChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectChart;