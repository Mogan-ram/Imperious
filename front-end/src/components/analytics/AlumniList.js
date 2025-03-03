// src/components/analytics/AlumniList.js
import React, { useState, useEffect } from 'react';
import { Table, Form, Button } from 'react-bootstrap';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaEnvelope } from 'react-icons/fa';  // For a message icon
import { Link } from 'react-router-dom'; // Import link
import { toast } from 'react-toastify'; // Import for error handling
import { useAuth } from '../../contexts/AuthContext';
import * as alumniApi from '../../services/api/alumni';

const AlumniList = ({ onAlumnusSelect }) => {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [willingnessFilter, setWillingnessFilter] = useState('');
    const { authToken } = useAuth();

    useEffect(() => {
        const fetchAlumni = async () => {
            try {
                setLoading(true);
                const data = await alumniApi.getAlumniWillingness(willingnessFilter, authToken);
                setAlumni(data);
                setError(null);
            } catch (err) {
                setError(err.message || "Failed to fetch alumni data.");
                toast.error(err.message || "Failed to fetch alumni data."); // Display error
            } finally {
                setLoading(false);
            }
        };

        fetchAlumni();
    }, [willingnessFilter, authToken]);


    const handleFilterChange = (e) => {
        setWillingnessFilter(e.target.value);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }


    return (
        <div>
            <Form.Group>
                <Form.Label>Filter by Willingness:</Form.Label>
                <Form.Select onChange={handleFilterChange} value={willingnessFilter}>
                    <option value="">All</option>
                    <option value="mentoring">Mentoring</option>
                    <option value="guestLectures">Guest Lectures</option>
                    <option value="workshops">Workshops</option>
                    <option value="internships">Internships</option>
                    <option value="placements">Placements</option>
                    <option value="other">Other</option>
                </Form.Select>
            </Form.Group>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Batch</th>
                        <th>Willingness</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {alumni.map((alumnus) => (
                        <tr key={alumnus._id}>
                            <td>{alumnus.name}</td>
                            <td>{alumnus.email}</td>
                            <td>{alumnus.dept}</td>
                            <td>{alumnus.batch}</td>
                            <td>{Array.isArray(alumnus.willingness) ? alumnus.willingness.join(', ') : ''}</td>
                            <td>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => onAlumnusSelect(alumnus.email)} // Pass email
                                    title="View Details"
                                >
                                    View
                                </Button>
                                <Link to={`mailto:${alumnus.email}`} title="Send Email">
                                    <FaEnvelope style={{ marginLeft: '10px' }} />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default AlumniList;