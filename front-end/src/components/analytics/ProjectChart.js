import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Container, Card, Row, Col } from 'react-bootstrap';


const ProjectChart = ({ data }) => {
    if (!data) {
        return <div>No data available for Project Activity.</div>;
    }

    // --- Project Status Breakdown (Pie Chart) ---
    const projectStatusData = {
        labels: data.project_status_breakdown.map(item => item.status),
        datasets: [{
            label: 'Project Status Breakdown',
            data: data.project_status_breakdown.map(item => item.count),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',  // Example color
                'rgba(54, 162, 235, 0.6)', // Example color
                'rgba(255, 206, 86, 0.6)',  // Example color
                'rgba(75, 192, 192, 0.6)'  // Example color
            ],
            hoverOffset: 4
        }]
    };

    // --- Top Technologies (Bar Chart) ---
    const topTechnologiesData = {
        labels: data.top_technologies.map(item => item.tech),
        datasets: [{
            label: 'Times Used',
            data: data.top_technologies.map(item => item.count),
            backgroundColor: 'rgba(153, 102, 255, 0.6)', // Example color
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    };

    const topTechnologiesOptions = {
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };
    // --- Total Projects (Bar Chart) ---
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
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
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
                            <Pie data={projectStatusData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Top Technologies</Card.Title>
                            <Bar data={topTechnologiesData} options={topTechnologiesOptions} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Total Projects Created</Card.Title>
                            <Bar data={totalProjectsData} options={totalProjectsOptions} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default ProjectChart;