// src/components/analytics/AlumniCharts.js
import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Card } from 'react-bootstrap';
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

    // --- Willingness Chart ---
    const willingnessCounts = {};
    alumniData.forEach(alumnus => {
        if (alumnus.willingness) {
            alumnus.willingness.forEach(w => {
                willingnessCounts[w] = (willingnessCounts[w] || 0) + 1;
            })
        }
    });

    const willingnessChartData = {
        labels: Object.keys(willingnessCounts),
        datasets: [{
            label: 'Number of Alumni',
            data: Object.values(willingnessCounts),
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }]
    };

    // --- Mentees Chart (Bar Chart - Mentees per Alumnus)---
    const menteesChartData = {
        labels: menteesData.map(alumnus => alumnus.alumnusName), // Assuming you have an 'alumnusName'
        datasets: [
            {
                label: 'Number of Mentees',
                data: menteesData.map(alumnus => alumnus.mentees.length),
                backgroundColor: 'rgba(255, 99, 132, 0.5)', // Different color
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };
    // --- Posts Chart (Doughnut Chart - Posts per Alumnus) ---
    const postsChartData = {
        labels: postsData.map(alumnus => alumnus.alumnusName),
        datasets: [{
            label: 'Number of Posts',
            data: postsData.map(alumnus => alumnus.posts.length),
            backgroundColor: postsData.map((_, i) => `hsl(${i * 360 / postsData.length}, 70%, 60%)`), // Dynamic colors
            borderColor: postsData.map((_, i) => `hsl(${i * 360 / postsData.length}, 70%, 40%)`),
            borderWidth: 1,
        }]
    };

    return (
        <div>
            <Card className="mb-3">
                <Card.Body>
                    <Card.Title>Alumni Willingness</Card.Title>
                    <Bar data={willingnessChartData} />
                </Card.Body>
            </Card>

            <Card className="mb-3">
                <Card.Body>
                    <Card.Title>Mentees per Alumnus</Card.Title>
                    <Bar data={menteesChartData} />
                </Card.Body>
            </Card>

            <Card className="mb-3">
                <Card.Body>
                    <Card.Title>Posts per Alumnus</Card.Title>
                    <Doughnut data={postsChartData} />
                </Card.Body>
            </Card>

        </div>
    );
};

export default AlumniCharts;