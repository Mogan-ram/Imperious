// src/components/analytics/ProjectChart.js
import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Container, Card, Row, Col } from 'react-bootstrap';

const ProjectChart = ({ data }) => {
    if (!data) {
        return <div>No data available for Project Activity.</div>;
    }

    // Fix for legendItemText.reduce error - ensure labels are strings
    const statusLabels = data.project_status_breakdown.map(item => String(item.status || ''));
    const statusCounts = data.project_status_breakdown.map(item => item.count);

    // Project Status Breakdown
    const projectStatusData = {
        labels: statusLabels,
        datasets: [{
            label: 'Project Status Breakdown',
            data: statusCounts,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',  // Example color
                'rgba(54, 162, 235, 0.6)', // Example color
                'rgba(255, 206, 86, 0.6)',  // Example color
                'rgba(75, 192, 192, 0.6)'  // Example color
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
            }
        }
    };

    // Top Technologies
    const techLabels = data.top_technologies.map(item => String(item.tech || ''));
    const techCounts = data.top_technologies.map(item => item.count);

    const topTechnologiesData = {
        labels: techLabels,
        datasets: [{
            label: 'Times Used',
            data: techCounts,
            backgroundColor: 'rgba(153, 102, 255, 0.6)', // Example color
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
            }
        }
    };

    // Total Projects
    const totalProjectsData = {
        labels: ['Total Projects'], // Single bar
        datasets: [{
            label: 'Total Projects',
            data: [data.total_projects],
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    const totalProjectsOptions = {
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
            }
        }
    };

    return (
        <Container>
            <h2>Project Activity</h2>
            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Project Status Breakdown</Card.Title>
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
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Top Technologies</Card.Title>
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
                    <Card>
                        <Card.Body>
                            <Card.Title>Total Projects Created</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Bar
                                    data={totalProjectsData}
                                    options={totalProjectsOptions}
                                    id="totalProjectsChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Project Completion Rate</Card.Title>
                            <div style={{ height: '300px' }}>
                                <div className="d-flex align-items-center h-100 justify-content-center">
                                    <div className="text-center">
                                        <h1 className="display-1 text-success">
                                            {Math.round((data.project_status_breakdown.find(s => s.status === 'Completed')?.count || 0) /
                                                (data.total_projects || 1) * 100)}%
                                        </h1>
                                        <p className="lead">Completion Rate</p>
                                    </div>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectChart;