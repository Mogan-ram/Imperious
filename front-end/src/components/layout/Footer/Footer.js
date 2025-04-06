import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { FaGithub, FaLinkedin, FaBug, FaEnvelope, FaHeart } from 'react-icons/fa';
// import axios from '../axios'; // Import your configured axios instance
import axios from 'axios';
import './Footer.css';

const Footer = () => {
    const [bugReport, setBugReport] = useState({
        name: '',
        email: '',
        description: '',
    });
    const [submitStatus, setSubmitStatus] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBugReport(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Send to your backend API
            const response = await axios.post('http://localhost:5000/submit-bug-report', bugReport);

            if (response.status === 201) {
                setSubmitStatus({ type: 'success', message: 'Bug report submitted successfully!' });
                setBugReport({ name: '', email: '', description: '' });
            } else {
                setSubmitStatus({ type: 'danger', message: 'Failed to submit bug report. Please try again.' });
            }
        } catch (error) {
            console.error('Error sending bug report:', error);
            // Get more detailed error message if available
            const errorMessage = error.response?.data?.message || 'Failed to submit bug report';
            setSubmitStatus({ type: 'danger', message: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <footer className="footer">
            <Container className="footer-content">
                <Row className="g-4">
                    <Col lg={4} md={6} sm={12}>
                        <div className="footer-section">
                            <h3>About Nexum</h3>
                            <p>
                                A social networking platform for collaborative learning and professional growth,
                                connecting educational institutions, alumni, and students.
                            </p>
                            <div className="social-links">
                                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                                    <FaGithub />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                                    <FaLinkedin />
                                </a>
                                <a href="mailto:moganram10@gmail.com" className="social-icon">
                                    <FaEnvelope />
                                </a>
                            </div>
                        </div>
                    </Col>

                    <Col lg={4} md={6} sm={12}>
                        <div className="footer-section links-section">
                            <h3>Quick Links</h3>
                            <ul className="footer-links">
                                <li><a href="/">Home</a></li>
                                <li><a href="/news">News</a></li>
                                <li><a href="/events">Events</a></li>
                                <li><a href="/projects">Projects</a></li>
                                <li><a href="/jobs">Jobs</a></li>
                                <li><a href="/messages">Messages</a></li>
                            </ul>
                        </div>
                    </Col>

                    <Col lg={4} md={12} sm={12}>
                        <div className="footer-section">
                            <h3><FaBug className="me-2" />Report a Bug</h3>
                            {submitStatus && (
                                <Alert variant={submitStatus.type} className="mt-2 mb-3">
                                    {submitStatus.message}
                                </Alert>
                            )}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="text"
                                        placeholder="Your Name"
                                        name="name"
                                        value={bugReport.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        type="email"
                                        placeholder="Your Email"
                                        name="email"
                                        value={bugReport.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Describe the bug"
                                        name="description"
                                        value={bugReport.description}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="bug-submit-btn"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                                </Button>
                            </Form>
                        </div>
                    </Col>
                </Row>

                <hr className="footer-divider" />

                <Row>
                    <Col className="text-center py-2">
                        <p className="copyright">
                            &copy; {new Date().getFullYear()} Nexum. All rights reserved.
                            <span className="made-with-love">
                                Made with <FaHeart className="heart-icon" /> by <a href="mailto:moganram10@gmail.com">Mogan Ram</a>
                            </span>
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;