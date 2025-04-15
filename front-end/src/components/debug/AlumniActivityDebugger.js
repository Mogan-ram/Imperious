import React, { useState } from 'react';
import { Card, Button, Accordion, Alert } from 'react-bootstrap';
import axios from '../../services/api/axios';

const AlumniActivityDebugger = () => {
    const [mentorshipData, setMentorshipData] = useState(null);
    const [mentorshipError, setMentorshipError] = useState(null);
    const [mentorshipLoading, setMentorshipLoading] = useState(false);

    const [postsData, setPostsData] = useState(null);
    const [postsError, setPostsError] = useState(null);
    const [postsLoading, setPostsLoading] = useState(false);

    const [eventsData, setEventsData] = useState(null);
    const [eventsError, setEventsError] = useState(null);
    const [eventsLoading, setEventsLoading] = useState(false);

    const [networkDetails, setNetworkDetails] = useState([]);

    // Debug Mentorship API
    const fetchMentorshipData = async () => {
        setMentorshipLoading(true);
        setMentorshipError(null);
        try {
            const response = await axios.get('/mentorship/my_mentees');
            setMentorshipData(response.data);
            addNetworkDetail('✅ Mentorship API', 'SUCCESS', `/mentorship/my_mentees`, response.data);
        } catch (error) {
            setMentorshipError(error.response?.data?.message || error.message);
            addNetworkDetail('❌ Mentorship API', 'FAILED', `/mentorship/my_mentees`, error);
        } finally {
            setMentorshipLoading(false);
        }
    };

    // Debug Posts API
    const fetchPostsData = async () => {
        setPostsLoading(true);
        setPostsError(null);
        try {
            // Try with the current user's email
            const token = localStorage.getItem('access_token');
            const userResponse = await axios.get('/profile');
            const email = userResponse.data.email;

            const response = await axios.get(`/alumni/${email}/posts`);
            setPostsData(response.data);
            addNetworkDetail('✅ Posts API', 'SUCCESS', `/alumni/${email}/posts`, response.data);
        } catch (error) {
            setPostsError(error.response?.data?.message || error.message);
            addNetworkDetail('❌ Posts API', 'FAILED', error.config?.url || 'Unknown URL', error);
        } finally {
            setPostsLoading(false);
        }
    };

    // Debug Events API
    const fetchEventsData = async () => {
        setEventsLoading(true);
        setEventsError(null);
        try {
            const response = await axios.get('/news-events?type=event');
            setEventsData(response.data);
            addNetworkDetail('✅ Events API', 'SUCCESS', `/news-events?type=event`, response.data);
        } catch (error) {
            setEventsError(error.response?.data?.message || error.message);
            addNetworkDetail('❌ Events API', 'FAILED', '/news-events?type=event', error);
        } finally {
            setEventsLoading(false);
        }
    };

    const addNetworkDetail = (title, status, url, data) => {
        const now = new Date();
        setNetworkDetails(prev => [
            {
                title,
                status,
                url,
                data: JSON.stringify(data, null, 2),
                timestamp: now.toLocaleTimeString()
            },
            ...prev
        ]);
    };

    return (
        <Card className="mt-4">
            <Card.Header className="bg-warning text-white">
                <h4>Alumni Activity Debugger</h4>
            </Card.Header>
            <Card.Body>
                <Alert variant="info">
                    This component helps diagnose issues with alumni activities data.
                </Alert>

                <div className="d-flex gap-2 mb-4">
                    <Button
                        variant="primary"
                        onClick={fetchMentorshipData}
                        disabled={mentorshipLoading}
                    >
                        Test Mentorship API
                    </Button>

                    <Button
                        variant="success"
                        onClick={fetchPostsData}
                        disabled={postsLoading}
                    >
                        Test Posts API
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={fetchEventsData}
                        disabled={eventsLoading}
                    >
                        Test Events API
                    </Button>
                </div>

                <Accordion>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Mentorship Data</Accordion.Header>
                        <Accordion.Body>
                            {mentorshipLoading ? (
                                <p>Loading mentorship data...</p>
                            ) : mentorshipError ? (
                                <Alert variant="danger">
                                    Error: {mentorshipError}
                                </Alert>
                            ) : mentorshipData ? (
                                <div>
                                    <p>Found {Array.isArray(mentorshipData) ? mentorshipData.length : '?'} mentorship records</p>
                                    <pre className="bg-light p-3" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                        {JSON.stringify(mentorshipData, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <p>Click "Test Mentorship API" to fetch mentorship data</p>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="1">
                        <Accordion.Header>Posts Data</Accordion.Header>
                        <Accordion.Body>
                            {postsLoading ? (
                                <p>Loading posts data...</p>
                            ) : postsError ? (
                                <Alert variant="danger">
                                    Error: {postsError}
                                </Alert>
                            ) : postsData ? (
                                <div>
                                    <p>Found {Array.isArray(postsData) ? postsData.length : '?'} posts</p>
                                    <pre className="bg-light p-3" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                        {JSON.stringify(postsData, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <p>Click "Test Posts API" to fetch posts data</p>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="2">
                        <Accordion.Header>Events Data</Accordion.Header>
                        <Accordion.Body>
                            {eventsLoading ? (
                                <p>Loading events data...</p>
                            ) : eventsError ? (
                                <Alert variant="danger">
                                    Error: {eventsError}
                                </Alert>
                            ) : eventsData ? (
                                <div>
                                    <p>Found {eventsData.items ? eventsData.items.length : '?'} events</p>
                                    <pre className="bg-light p-3" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                        {JSON.stringify(eventsData, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                <p>Click "Test Events API" to fetch events data</p>
                            )}
                        </Accordion.Body>
                    </Accordion.Item>

                    <Accordion.Item eventKey="3">
                        <Accordion.Header>Network Log</Accordion.Header>
                        <Accordion.Body>
                            {networkDetails.length === 0 ? (
                                <p>No network requests have been made yet.</p>
                            ) : (
                                networkDetails.map((detail, index) => (
                                    <div key={index} className="border-bottom py-2">
                                        <h6>{detail.title} ({detail.timestamp})</h6>
                                        <p>
                                            <strong>Status:</strong> {detail.status}<br />
                                            <strong>URL:</strong> {detail.url}
                                        </p>
                                        <pre className="bg-light p-2" style={{ maxHeight: '150px', overflow: 'auto', fontSize: '0.8rem' }}>
                                            {detail.data}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Card.Body>
        </Card>
    );
};

export default AlumniActivityDebugger;