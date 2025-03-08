// src/components/analytics/StudentAnalytics.js
import React, { useState } from 'react';
import { Card, Row, Col, Form } from 'react-bootstrap';
import {
    FaChartPie, FaNetworkWired, FaLaptopCode, FaUsers,
    FaHandshake, FaChartLine, FaFilter
} from 'react-icons/fa';
import ProjectChart from './ProjectChart';
import ProjectCollaborationNetwork from './ProjectCollaborationNetwork';
import StatCard from './StatCard';

const StudentAnalytics = ({ analyticsData }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [batchFilter, setBatchFilter] = useState('all');

    // Calculate key metrics from analytics data
    const totalStudents = analyticsData?.user_counts?.student || 0;
    const totalProjects = analyticsData?.total_projects || 0;
    const projectCollaborations = Math.round(totalProjects * 0.7);
    const completionRate = "78%";

    // Extract unique departments and batches (this would come from your data)
    const departments = analyticsData?.student_departments?.map(item => item._id) || [];
    const batchYears = analyticsData?.student_batches?.map(item => item._id) || [];

    return (
        <div>
            <div className="section-header mb-4">
                <h1 className="dashboard-title">Student Activities</h1>
                <p className="text-muted">Analysis of student projects and collaborations</p>
            </div>

            {/* Tabs */}
            <div className="section-tabs mb-4">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FaChartPie className="tab-icon" /> Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'collaboration' ? 'active' : ''}`}
                    onClick={() => setActiveTab('collaboration')}
                >
                    <FaNetworkWired className="tab-icon" /> Collaboration Network
                </button>
                <button
                    className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projects')}
                >
                    <FaLaptopCode className="tab-icon" /> Projects
                </button>
                <button
                    className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    <FaUsers className="tab-icon" /> Student List
                </button>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <Row>
                        <Col md={5}>
                            <Form.Group>
                                <Form.Label>Department</Form.Label>
                                <Form.Select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map((dept, idx) => (
                                        <option key={idx} value={dept}>{dept}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={5}>
                            <Form.Group>
                                <Form.Label>Batch Year</Form.Label>
                                <Form.Select
                                    value={batchFilter}
                                    onChange={(e) => setBatchFilter(e.target.value)}
                                >
                                    <option value="all">All Batches</option>
                                    {batchYears.map((year, idx) => (
                                        <option key={idx} value={year}>{year}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                            <button
                                className="btn btn-outline-secondary w-100"
                                onClick={() => {
                                    setDepartmentFilter('all');
                                    setBatchFilter('all');
                                }}
                            >
                                <FaFilter className="me-2" /> Reset
                            </button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Stat Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <StatCard
                        title="Total Students"
                        value={totalStudents}
                        icon={FaUsers}
                        color="primary"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="Active Projects"
                        value={totalProjects}
                        icon={FaLaptopCode}
                        color="success"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="Collaborations"
                        value={projectCollaborations}
                        icon={FaHandshake}
                        color="warning"
                    />
                </Col>
                <Col md={3}>
                    <StatCard
                        title="Project Completion"
                        value={completionRate}
                        icon={FaChartLine}
                        color="danger"
                    />
                </Col>
            </Row>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <Card>
                    <Card.Body>
                        <ProjectChart data={analyticsData} />
                    </Card.Body>
                </Card>
            )}

            {activeTab === 'collaboration' && (
                <ProjectCollaborationNetwork />
            )}

            {activeTab === 'projects' && (
                <Card>
                    <Card.Body>
                        <h3>Projects Analysis</h3>
                        <p className="text-muted">Detailed project metrics will be shown here</p>
                        {/* Project list and analysis would go here */}
                    </Card.Body>
                </Card>
            )}

            {activeTab === 'students' && (
                <Card>
                    <Card.Body>
                        <h3>Student Directory</h3>
                        <p className="text-muted">Student list with details would go here</p>
                        {/* Student list would go here */}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default StudentAnalytics;