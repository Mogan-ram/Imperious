import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Container, Card, Row, Col } from 'react-bootstrap';

const MentorshipChart = ({ data }) => {
    if (!data) {
        return <div>No data available for Mentorship Activity.</div>;
    }

    // --- Mentorship Request Status Breakdown (Pie Chart) ---
    const requestStatusData = {
        labels: data.request_status_breakdown.map(item => item.status),
        datasets: [{
            label: 'Mentorship Request Status',
            data: data.request_status_breakdown.map(item => item.count),
            backgroundColor: [
                'rgba(255, 206, 86, 0.6)',  // Yellow for Pending
                'rgba(75, 192, 192, 0.6)', // Teal for Accepted
                'rgba(255, 99, 132, 0.6)',  // Red for Rejected
                'rgba(153, 102, 255, 0.6)' // Purple for others
            ],
            hoverOffset: 4
        }]
    };

    // --- Total Mentorship Requests (Bar Chart) ---
    const totalRequestsData = {
        labels: ['Total Requests'], // Single bar
        datasets: [{
            label: 'Total Mentorship Requests',
            data: [data.total_requests],
            backgroundColor: 'rgba(54, 162, 235, 0.6)', // Blue
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    const totalRequestsOptions = {
        scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    };

    return (
        <Container>
            <h2>Mentorship Activity</h2>
            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Mentorship Request Status</Card.Title>
                            <Pie data={requestStatusData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Total Mentorship Requests</Card.Title>
                            <Bar data={totalRequestsData} options={totalRequestsOptions} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};
export default MentorshipChart;