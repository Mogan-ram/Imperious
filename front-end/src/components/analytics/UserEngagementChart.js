import React from 'react';
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
} from 'chart.js'
import { Container, Row, Col, Card } from 'react-bootstrap';


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

    if (!data) {
        return <div>No data available for User Engagement.</div>;
    }
    // --- User Counts Chart (Bar Chart) ---
    const userCountsData = {
        labels: Object.keys(data.user_counts),
        datasets: [{
            label: 'Number of Users',
            data: Object.values(data.user_counts),
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',  // Red
                'rgba(54, 162, 235, 0.6)', // Blue
                'rgba(255, 206, 86, 0.6)', // Yellow
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
                    stepSize: 1, // Ensure integer ticks

                }
            }
        }
    };


    // --- New User Registrations (Line Chart) ---
    const registrationData = {
        labels: data.new_registrations.map(item => item._id), // Dates
        datasets: [{
            label: 'New Registrations',
            data: data.new_registrations.map(item => item.count),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    // --- Department Distribution (Pie Chart - Students) ---
    const studentDeptData = {
        labels: data.student_departments.map(item => item._id),
        datasets: [{
            label: 'Student Department Distribution',
            data: data.student_departments.map(item => item.count),
            backgroundColor: [ // Some distinct colors
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)'
            ],
            hoverOffset: 4
        }]
    };
    // --- Department Distribution (Pie Chart - Alumni) ---
    const alumniDeptData = {
        labels: data.alumni_departments.map(item => item._id),
        datasets: [{
            label: 'Alumni Department Distribution',
            data: data.alumni_departments.map(item => item.count),
            backgroundColor: [ // Some distinct colors
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)'
            ],
            hoverOffset: 4
        }]
    };

    const batchData = {
        labels: data.student_batches.map(item => item._id),
        datasets: [{
            label: 'Student Batch Distribution',
            data: data.student_batches.map(item => item.count),
            backgroundColor: [
                'rgba(75, 192, 192, 0.5)',    // Teal
                'rgba(54, 162, 235, 0.5)',   // Blue
                'rgba(255, 99, 132, 0.5)',  // Red
                'rgba(255, 206, 86, 0.5)',  // Yellow
                'rgba(153, 102, 255, 0.5)', // Purple
                'rgba(255, 159, 64, 0.5)'   // Orange
            ],
            hoverOffset: 4
        }]
    };



    return (
        <Container>
            <h2>User Engagement and Growth</h2>

            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>User Counts by Role</Card.Title>
                            <Bar data={userCountsData} options={userCountsOptions} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>New User Registrations (Last 30 Days)</Card.Title>
                            <Line data={registrationData} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Student Department Distribution</Card.Title>
                            <Pie data={studentDeptData} />
                        </Card.Body>
                    </Card>
                </Col>
                <Col>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Alumni Department Distribution</Card.Title>
                            <Pie data={alumniDeptData} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Batch Year Distribution</Card.Title>
                            <Bar data={batchData} options={userCountsOptions} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>

    );
};

export default UserEngagementChart;