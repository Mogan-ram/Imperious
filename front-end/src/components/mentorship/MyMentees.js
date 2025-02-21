import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, ListGroup, Button } from 'react-bootstrap';
import { mentorshipService } from '../../services/api/mentorship';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const MyMentees = () => {
    const [loading, setLoading] = useState(true);
    const [menteesData, setMenteesData] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null); // For the message sidebar

    const loadMenteesData = useCallback(async () => {
        try {
            const data = await mentorshipService.getMentees();
            // Check if response.data is an array before setting state
            if (Array.isArray(data)) {
                setMenteesData(data);
            } else {
                console.error("Invalid data format for mentees:", data);
                toast.error("Received invalid data format for Mentees.");
                setMenteesData([]); //set empty on error
            }

        } catch (error) {
            console.error("Error loading mentees data:", error);
            toast.error("Failed to load your mentees.");
            setMenteesData([]); // Set to empty array to avoid rendering errors
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMenteesData();
    }, [loadMenteesData]);

    const handleMessageClick = (student) => {
        console.log("Messaging student:", student); // Log student details
        setSelectedStudent(student); // Set the selected student
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <Container className="py-4">
            <h2>My Mentees</h2>

            <div className="d-flex">
                <div className="flex-grow-1 me-3"> {/* Main content area */}
                    {menteesData.length === 0 ? (
                        <p>You have not accepted any mentorship requests yet.</p>
                    ) : (
                        menteesData.map((project) => (
                            <Card key={project._id} className="mb-3">
                                <Card.Body>
                                    <Card.Title>{project.title}</Card.Title>
                                    <ListGroup variant="flush">
                                        {project.students.map((student) => (
                                            <ListGroup.Item key={student.id} className="d-flex justify-content-between align-items-center">
                                                <span>
                                                    {student.name} ({student.dept}), Batch:{student.batch} - <strong>{student.role}</strong>
                                                </span>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleMessageClick(student)}
                                                >
                                                    Message
                                                </Button>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                </Card.Body>
                            </Card>
                        ))
                    )}
                </div>


            </div>
        </Container>
    );
};

export default MyMentees;