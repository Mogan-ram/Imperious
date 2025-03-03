// src/components/analytics/AlumniMentorship.js
import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab, Card, ListGroup, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import AlumniList from './AlumniList';
import MenteesList from './MenteesList';
import PostsList from './PostsList';
import AlumniCharts from './AlumniCharts'; // Import the charts component


const AlumniMentorship = () => {
    const [activeTab, setActiveTab] = useState('willingness');
    const [loading, setLoading] = useState(false);
    const [alumniData, setAlumniData] = useState([]);
    const [selectedAlumnus, setSelectedAlumnus] = useState(null);
    const { user, authToken } = useAuth();

    // New states for mentees and posts data (for charts)
    const [menteesData, setMenteesData] = useState([]);
    const [postsData, setPostsData] = useState([]);

    const loadAlumni = useCallback(async () => {
        setLoading(true);
        try {
            const data = await alumniApi.getAlumniWillingness("", authToken);
            setAlumniData(data);
        } catch (error) {
            console.error("Error loading alumni:", error);
            toast.error("Failed to load alumni data.");
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    // New function to load all mentees data (for charting)
    const loadAllMentees = useCallback(async () => {
        try {
            const allAlumni = await alumniApi.getAlumniWillingness("", authToken); // Fetch all alumni to get their emails
            const menteesPromises = allAlumni.map(async (alumnus) => {
                try {
                    const mentees = await alumniApi.getAlumniMentees(alumnus.email, authToken);
                    return { alumnusName: alumnus.name, mentees: mentees || [] }; // Return alumnus name and mentees
                } catch (error) {
                    console.error(`Error fetching mentees for ${alumnus.email}:`, error);
                    return { alumnusName: alumnus.name, mentees: [] }; // Return with empty array on error.
                }
            });

            const menteesResults = await Promise.all(menteesPromises);
            setMenteesData(menteesResults);
        } catch (error) {
            console.error("Error loading all mentees:", error);
            toast.error("Failed to load all mentees data.");
        }
    }, [authToken]);

    // New function to load all posts data (for charting)
    const loadAllPosts = useCallback(async () => {
        try {
            const allAlumni = await alumniApi.getAlumniWillingness("", authToken); // Fetch all alumni
            const postsPromises = allAlumni.map(async (alumnus) => {
                try {
                    const posts = await alumniApi.getAlumniPosts(alumnus.email, authToken);
                    return { alumnusName: alumnus.name, posts: posts || [] }; // Return alumnus name and posts
                } catch (error) {
                    console.error(`Error fetching posts for ${alumnus.email}:`, error);
                    return { alumnusName: alumnus.name, posts: [] }; // Return with empty array on error.
                }

            });
            const postsResults = await Promise.all(postsPromises);
            setPostsData(postsResults);
        } catch (error) {
            console.error("Error loading all posts:", error);
            toast.error("Failed to load all posts data.");
        }
    }, [authToken]);


    useEffect(() => {
        loadAlumni();
        loadAllMentees(); // Load all mentees for charting
        loadAllPosts();   // Load all posts for charting
    }, [loadAlumni, loadAllMentees, loadAllPosts]);


    const handleAlumnusSelect = (email) => {
        setSelectedAlumnus(email);
        setActiveTab('mentees');
    };


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            id="alumni-management-tabs"
            className="mb-3"
        >
            <Tab eventKey="willingness" title="Willingness">
                <AlumniList alumni={alumniData} onAlumnusSelect={handleAlumnusSelect} />
                <AlumniCharts alumniData={alumniData} menteesData={menteesData} postsData={postsData} />
            </Tab>
            <Tab eventKey="mentees" title="Mentees">
                {selectedAlumnus ? (
                    <MenteesList alumnusId={selectedAlumnus} />
                ) : (
                    <p>Select an alumnus from the Willingness tab to view mentees.</p>
                )}
            </Tab>
            <Tab eventKey="posts" title="Posts">
                {selectedAlumnus ? (
                    <PostsList alumnusId={selectedAlumnus} />
                ) : (
                    <p>Select an alumnus from the Willingness tab to view posts.</p>
                )}
            </Tab>
        </Tabs>
    );
};

export default AlumniMentorship;