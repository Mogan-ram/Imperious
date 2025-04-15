// src/components/analytics/AlumniCharts.js
import React, { useMemo } from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AlumniCharts = ({ alumniData, menteesData, postsData }) => {
    // Willingness chart data
    const willingnessChartData = useMemo(() => {
        // Calculate willingness counts
        const willingnessCounts = {};

        alumniData.forEach(alumnus => {
            if (alumnus.willingness && Array.isArray(alumnus.willingness)) {
                alumnus.willingness.forEach(w => {
                    // Convert to title case and remove camelCase/snake_case
                    const formatted = w
                        .replace(/_/g, ' ')
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    willingnessCounts[formatted] = (willingnessCounts[formatted] || 0) + 1;
                });
            }
        });

        return {
            labels: Object.keys(willingnessCounts),
            datasets: [{
                label: 'Number of Alumni',
                data: Object.values(willingnessCounts),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(54, 102, 235, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(54, 102, 235, 1)'
                ],
                borderWidth: 1,
            }]
        };
    }, [alumniData]);

    // Mentees chart data
    const menteesChartData = useMemo(() => {
        // console.log("Preparing mentees chart data with:", menteesData);

        // Filter out alumni with no mentees and ensure mentees field exists
        const activeAlumni = menteesData
            .filter(alumnus => alumnus.mentees && Array.isArray(alumnus.mentees) && alumnus.mentees.length > 0)
            .sort((a, b) => b.mentees.length - a.mentees.length)
            .slice(0, 10); // Top 10 mentors

        // console.log("Active alumni for chart:", activeAlumni.length);

        if (activeAlumni.length === 0) {
            // Return placeholder data if no active alumni
            return {
                labels: ['No Data Available'],
                datasets: [
                    {
                        label: 'Number of Mentees',
                        data: [0],
                        backgroundColor: 'rgba(200, 200, 200, 0.7)',
                        borderColor: 'rgba(200, 200, 200, 1)',
                        borderWidth: 1,
                    },
                ],
            };
        }

        // Use proper name field
        const labels = activeAlumni.map(alumnus => alumnus.alumnusName || alumnus.name || "Unknown");
        const data = activeAlumni.map(alumnus => alumnus.mentees.length);

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Number of Mentees',
                    data: data,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [menteesData]);

    // Department distribution
    const deptDistributionData = useMemo(() => {
        const deptCounts = {};
        alumniData.forEach(alumnus => {
            if (alumnus.dept) {
                deptCounts[alumnus.dept] = (deptCounts[alumnus.dept] || 0) + 1;
            }
        });

        return {
            labels: Object.keys(deptCounts),
            datasets: [{
                label: 'Alumni by Department',
                data: Object.values(deptCounts),
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1,
            }]
        };
    }, [alumniData]);

    // Posts chart data
    const postsChartData = useMemo(() => {
        // console.log("Preparing posts chart data with:", postsData);

        // Filter and sort by post count
        const activePosters = postsData
            .filter(alumnus => alumnus.posts && Array.isArray(alumnus.posts) && alumnus.posts.length > 0)
            .sort((a, b) => b.posts.length - a.posts.length)
            .slice(0, 8); // Top 8 contributors

        // console.log("Active posters for chart:", activePosters.length);

        if (activePosters.length === 0) {
            // Return placeholder data if no active posters
            return {
                labels: ['No Data Available'],
                datasets: [{
                    label: 'Number of Posts',
                    data: [0],
                    backgroundColor: 'rgba(200, 200, 200, 0.7)',
                    borderColor: 'rgba(200, 200, 200, 1)',
                    borderWidth: 1,
                }]
            };
        }

        // Use proper name field
        const labels = activePosters.map(alumnus => alumnus.alumnusName || alumnus.name || "Unknown");
        const data = activePosters.map(alumnus => alumnus.posts.length);

        const backgroundColors = activePosters.map((_, i) =>
            `hsla(${i * 360 / activePosters.length}, 70%, 60%, 0.7)`
        );

        const borderColors = activePosters.map((_, i) =>
            `hsl(${i * 360 / activePosters.length}, 70%, 50%)`
        );

        return {
            labels: labels,
            datasets: [{
                label: 'Number of Posts',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
            }]
        };
    }, [postsData]);

    // Batch distribution data
    const batchDistributionData = useMemo(() => {
        const batchCounts = {};
        alumniData.forEach(alumnus => {
            if (alumnus.batch) {
                const batchYear = String(alumnus.batch);
                batchCounts[batchYear] = (batchCounts[batchYear] || 0) + 1;
            }
        });

        // Convert to arrays and sort by year
        const sortedBatches = Object.keys(batchCounts).sort();

        return {
            labels: sortedBatches,
            datasets: [{
                label: 'Alumni by Batch',
                data: sortedBatches.map(batch => batchCounts[batch]),
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            }]
        };
    }, [alumniData]);

    // Chart options
    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
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

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    // This more specific font property overrides the global property
                    font: {
                        size: 11
                    },
                    boxWidth: 15
                }
            }
        }
    };

    const hasMenteesData = menteesData && menteesData.some(m => m.mentees && m.mentees.length > 0);
    const hasPostsData = postsData && postsData.some(p => p.posts && p.posts.length > 0);

    return (
        <div>
            <Row>
                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Alumni Willingness Distribution</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Doughnut
                                    data={willingnessChartData}
                                    options={doughnutOptions}
                                    id="willingnessChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Department Distribution</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Doughnut
                                    data={deptDistributionData}
                                    options={doughnutOptions}
                                    id="deptDistributionChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Top Mentors by Number of Mentees</Card.Title>
                            {!hasMenteesData ? (
                                <Alert variant="info" className="mt-3">
                                    No mentorship data available. Once alumni begin mentoring students,
                                    this chart will show the most active mentors.
                                </Alert>
                            ) : (
                                <div style={{ height: '300px' }}>
                                    <Bar
                                        data={menteesChartData}
                                        options={barOptions}
                                        id="menteesChart"
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Top Content Contributors</Card.Title>
                            {!hasPostsData ? (
                                <Alert variant="info" className="mt-3">
                                    No posts data available. Once alumni begin posting content,
                                    this chart will show the most active contributors.
                                </Alert>
                            ) : (
                                <div style={{ height: '300px' }}>
                                    <Bar
                                        data={postsChartData}
                                        options={barOptions}
                                        id="postsChart"
                                    />
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col>
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Alumni by Graduation Year</Card.Title>
                            <div style={{ height: '300px' }}>
                                <Bar
                                    data={batchDistributionData}
                                    options={barOptions}
                                    id="batchDistributionChart"
                                />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AlumniCharts;