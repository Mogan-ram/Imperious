// src/components/analytics/WillingnessManager.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, Row, Col, Form, Button, Table, Badge, Modal,
    InputGroup, Dropdown, ButtonGroup, Alert, Tabs, Tab
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaEnvelope, FaFilter, FaSearch, FaUserPlus, FaUsers, FaCheckCircle } from 'react-icons/fa';
import * as alumniApi from '../../services/api/alumni';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import messagingService from '../../services/api/messaging';

// Willingness options with colors and icons
const WILLINGNESS_OPTIONS = [
    { value: 'mentoring', label: 'Mentoring', color: 'primary', icon: '👨‍🏫', description: 'Alumni willing to mentor students on projects' },
    { value: 'guestLectures', label: 'Guest Lectures', color: 'info', icon: '🎤', description: 'Alumni willing to deliver guest lectures' },
    { value: 'workshops', label: 'Workshops', color: 'success', icon: '🛠️', description: 'Alumni willing to conduct workshops' },
    { value: 'internships', label: 'Internships', color: 'warning', icon: '💼', description: 'Alumni willing to offer internships' },
    { value: 'placements', label: 'Placements', color: 'danger', icon: '🎓', description: 'Alumni willing to help with placements' },
    { value: 'funding', label: 'Funding', color: 'secondary', icon: '💰', description: 'Alumni willing to provide funding' },
    { value: 'research', label: 'Research', color: 'dark', icon: '🔬', description: 'Alumni willing to collaborate on research' }
];

const WillingnessManager = () => {
    const [alumni, setAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeWillingness, setActiveWillingness] = useState('mentoring');
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [batchFilter, setBatchFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAlumni, setSelectedAlumni] = useState([]);
    const [showContactModal, setShowContactModal] = useState(false);
    const [messageTemplate, setMessageTemplate] = useState('');
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [messageTemplates, setMessageTemplates] = useState([
        { id: 1, title: 'Guest Lecture Request', content: 'Dear [Name],\n\nWe would like to invite you to deliver a guest lecture on [Topic] for our students. Your expertise would be valuable for our students.\n\nPlease let me know if you would be available on [Date].\n\nRegards,\n[Your Name]' },
        { id: 2, title: 'Mentorship Request', content: 'Dear [Name],\n\nWe are reaching out to request your mentorship for our students working on projects related to [Topic]. Your expertise would greatly benefit their learning experience.\n\nPlease let us know if you would be interested.\n\nRegards,\n[Your Name]' },
        { id: 3, title: 'Workshop Invitation', content: 'Dear [Name],\n\nWe would like to invite you to conduct a workshop on [Topic] for our students. Your practical knowledge would be invaluable for our students.\n\nThe workshop would be scheduled on [Date].\n\nRegards,\n[Your Name]' }
    ]);
    const [activeTab, setActiveTab] = useState('manage');

    const navigate = useNavigate();
    const { authToken, user } = useAuth();

    // Fetch alumni data
    const fetchAlumni = useCallback(async () => {
        try {
            setLoading(true);
            const data = await alumniApi.getAlumniWillingness("", authToken);
            setAlumni(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch alumni data. Please try again later.');
            toast.error('Failed to fetch alumni data.');
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    useEffect(() => {
        fetchAlumni();
    }, [fetchAlumni]);

    // Initialize conversation with selected alumni
    const startGroupConversation = async () => {
        if (selectedAlumni.length === 0) {
            toast.warning('Please select at least one alumnus');
            return;
        }

        try {
            // Get emails of selected alumni
            const emails = selectedAlumni.map(id =>
                alumni.find(a => a._id === id)?.email
            ).filter(Boolean);

            // Add current user's email
            emails.push(user.email);

            // Create a group conversation
            await messagingService.createConversation(emails);
            toast.success(`Conversation started with ${selectedAlumni.length} alumni`);

            // Navigate to messages page
            navigate('/messages');

            // Clear selection
            setSelectedAlumni([]);
            setShowContactModal(false);
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    // Start individual conversation
    const startConversation = async (alumniEmail) => {
        try {
            // Create a conversation with this alumni
            await messagingService.createConversation([alumniEmail, user.email]);
            toast.success(`Conversation started with alumni`);

            // Navigate to messages page
            navigate('/messages');
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    // Send batch email
    const sendBatchEmail = () => {
        if (selectedAlumni.length === 0) {
            toast.warning('Please select at least one alumnus');
            return;
        }

        // Get emails of selected alumni
        const emails = selectedAlumni.map(id =>
            alumni.find(a => a._id === id)?.email
        ).filter(Boolean);

        // Create mailto link with all emails
        const mailtoLink = `mailto:${emails.join(',')}?subject=${encodeURIComponent(`${activeWillingness.charAt(0).toUpperCase() + activeWillingness.slice(1)} Opportunity`)}&body=${encodeURIComponent(messageTemplate)}`;

        // Open default email client
        window.location.href = mailtoLink;

        // Clear selection and close modal
        setShowContactModal(false);
    };

    // Toggle alumni selection
    const toggleAlumniSelection = (id) => {
        setSelectedAlumni(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // Select all alumni in current view
    const selectAllAlumni = () => {
        const filteredIds = filteredAlumni.map(a => a._id);
        setSelectedAlumni(filteredIds);
    };

    // Clear all selections
    const clearAllSelections = () => {
        setSelectedAlumni([]);
    };

    // Handle using a template
    const useTemplate = (templateContent) => {
        setMessageTemplate(templateContent);
        setShowTemplateModal(false);
    };

    // Get filtered alumni based on active willingness and other filters
    const filteredAlumni = alumni.filter(alumnus => {
        // Willingness filter
        if (activeWillingness && (!alumnus.willingness || !alumnus.willingness.includes(activeWillingness))) {
            return false;
        }

        // Department filter
        if (departmentFilter !== 'all' && alumnus.dept !== departmentFilter) {
            return false;
        }

        // Batch filter
        if (batchFilter !== 'all' && alumnus.batch !== parseInt(batchFilter)) {
            return false;
        }

        // Search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                alumnus.name.toLowerCase().includes(term) ||
                alumnus.email.toLowerCase().includes(term) ||
                alumnus.dept.toLowerCase().includes(term)
            );
        }

        return true;
    });

    // Get unique departments for filter
    const departments = Array.from(new Set(alumni.map(a => a.dept).filter(Boolean)));

    // Get unique batch years for filter
    const batchYears = Array.from(new Set(alumni.map(a => a.batch).filter(Boolean)))
        .sort((a, b) => b - a); // Sort in descending order (newest first)

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <Alert variant="danger">
                {error}
            </Alert>
        );
    }

    return (
        <div>
            <Tabs
                activeKey={activeTab}
                onSelect={setActiveTab}
                className="mb-4"
            >
                <Tab eventKey="manage" title="Manage Willingness">
                    <Card className="mb-4">
                        <Card.Body>
                            <Card.Title>Willingness Manager</Card.Title>
                            <p className="text-muted">Find and contact alumni based on their willingness to participate in various activities.</p>

                            {/* Willingness Categories */}
                            <div className="d-flex flex-wrap mb-4">
                                {WILLINGNESS_OPTIONS.map(option => (
                                    <Button
                                        key={option.value}
                                        variant={activeWillingness === option.value ? option.color : `outline-${option.color}`}
                                        className="me-2 mb-2"
                                        onClick={() => setActiveWillingness(option.value)}
                                    >
                                        <span className="me-1">{option.icon}</span> {option.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Active Willingness Description */}
                            <Alert variant="info" className="mb-4">
                                <strong>{WILLINGNESS_OPTIONS.find(o => o.value === activeWillingness)?.label}: </strong>
                                {WILLINGNESS_OPTIONS.find(o => o.value === activeWillingness)?.description}
                            </Alert>

                            {/* Filters */}
                            <Row className="mb-3">
                                <Col md={4}>
                                    <InputGroup>
                                        <InputGroup.Text>
                                            <FaSearch />
                                        </InputGroup.Text>
                                        <Form.Control
                                            placeholder="Search alumni..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </InputGroup>
                                </Col>
                                <Col md={3}>
                                    <Form.Select
                                        value={departmentFilter}
                                        onChange={(e) => setDepartmentFilter(e.target.value)}
                                    >
                                        <option value="all">All Departments</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={3}>
                                    <Form.Select
                                        value={batchFilter}
                                        onChange={(e) => setBatchFilter(e.target.value)}
                                    >
                                        <option value="all">All Batches</option>
                                        {batchYears.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col md={2}>
                                    <Button variant="outline-secondary" onClick={() => {
                                        setSearchTerm('');
                                        setDepartmentFilter('all');
                                        setBatchFilter('all');
                                    }}>
                                        Clear Filters
                                    </Button>
                                </Col>
                            </Row>

                            {/* Bulk Actions */}
                            <div className="d-flex justify-content-between mb-3">
                                <div>
                                    <strong>Found {filteredAlumni.length} alumni willing to help with {WILLINGNESS_OPTIONS.find(o => o.value === activeWillingness)?.label.toLowerCase()}</strong>
                                </div>
                                <div>
                                    <ButtonGroup>
                                        <Button
                                            variant="outline-primary"
                                            onClick={selectAllAlumni}
                                            disabled={filteredAlumni.length === 0}
                                        >
                                            <FaUserPlus className="me-1" /> Select All
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            onClick={clearAllSelections}
                                            disabled={selectedAlumni.length === 0}
                                        >
                                            Clear Selection ({selectedAlumni.length})
                                        </Button>
                                        <Button
                                            variant="success"
                                            onClick={() => setShowContactModal(true)}
                                            disabled={selectedAlumni.length === 0}
                                        >
                                            <FaEnvelope className="me-1" /> Contact Selected
                                        </Button>
                                    </ButtonGroup>
                                </div>
                            </div>

                            {/* Alumni List */}
                            {filteredAlumni.length === 0 ? (
                                <Alert variant="warning">
                                    No alumni found with the selected criteria.
                                </Alert>
                            ) : (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th width="50">Select</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Department</th>
                                            <th>Batch</th>
                                            <th>Willingness</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAlumni.map(alumnus => (
                                            <tr key={alumnus._id}>
                                                <td className="text-center">
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={selectedAlumni.includes(alumnus._id)}
                                                        onChange={() => toggleAlumniSelection(alumnus._id)}
                                                    />
                                                </td>
                                                <td>{alumnus.name}</td>
                                                <td>{alumnus.email}</td>
                                                <td>{alumnus.dept}</td>
                                                <td>{alumnus.batch}</td>
                                                <td>
                                                    {Array.isArray(alumnus.willingness) && alumnus.willingness.length > 0 ? (
                                                        <div>
                                                            {alumnus.willingness.map(willing => {
                                                                const option = WILLINGNESS_OPTIONS.find(opt => opt.value === willing);
                                                                return (
                                                                    <Badge
                                                                        bg={option?.color || 'secondary'}
                                                                        className="me-1 mb-1"
                                                                        key={willing}
                                                                    >
                                                                        {option?.icon} {option?.label}
                                                                    </Badge>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">None specified</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => startConversation(alumnus.email)}
                                                    >
                                                        Message
                                                    </Button>
                                                    <a
                                                        href={`mailto:${alumnus.email}`}
                                                        className="btn btn-outline-secondary btn-sm"
                                                    >
                                                        Email
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>

                <Tab eventKey="stats" title="Willingness Statistics">
                    <Card>
                        <Card.Body>
                            <Card.Title>Willingness Statistics</Card.Title>
                            <p className="text-muted">Overview of alumni willingness to participate in various activities.</p>

                            <Row>
                                {WILLINGNESS_OPTIONS.map(option => {
                                    const count = alumni.filter(a =>
                                        a.willingness && a.willingness.includes(option.value)
                                    ).length;

                                    const percentage = Math.round((count / alumni.length) * 100) || 0;

                                    return (
                                        <Col md={3} key={option.value} className="mb-4">
                                            <Card className="h-100">
                                                <Card.Body className="d-flex flex-column">
                                                    <div className="d-flex align-items-center mb-3">
                                                        <div className={`badge bg-${option.color} p-2 me-2`} style={{ fontSize: '1.5rem' }}>
                                                            {option.icon}
                                                        </div>
                                                        <h5 className="mb-0">{option.label}</h5>
                                                    </div>

                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span className="text-muted">Willing Alumni:</span>
                                                        <strong>{count}</strong>
                                                    </div>

                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">Percentage:</span>
                                                        <strong>{percentage}%</strong>
                                                    </div>

                                                    <div className="progress mt-3">
                                                        <div
                                                            className={`progress-bar bg-${option.color}`}
                                                            role="progressbar"
                                                            style={{ width: `${percentage}%` }}
                                                            aria-valuenow={percentage}
                                                            aria-valuemin="0"
                                                            aria-valuemax="100"
                                                        ></div>
                                                    </div>

                                                    <Button
                                                        variant={`outline-${option.color}`}
                                                        className="mt-auto w-100"
                                                        onClick={() => {
                                                            setActiveWillingness(option.value);
                                                            setActiveTab('manage');
                                                        }}
                                                    >
                                                        View Alumni
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>

                            {/* Department Breakdown */}
                            <h5 className="mt-4 mb-3">Department Breakdown</h5>
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Department</th>
                                        {WILLINGNESS_OPTIONS.map(option => (
                                            <th key={option.value} className="text-center">
                                                <span className="d-block">{option.icon}</span>
                                                {option.label}
                                            </th>
                                        ))}
                                        <th className="text-center">Total Alumni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map(dept => {
                                        const deptAlumni = alumni.filter(a => a.dept === dept);
                                        const deptCount = deptAlumni.length;

                                        return (
                                            <tr key={dept}>
                                                <td><strong>{dept}</strong></td>
                                                {WILLINGNESS_OPTIONS.map(option => {
                                                    const willingCount = deptAlumni.filter(a =>
                                                        a.willingness && a.willingness.includes(option.value)
                                                    ).length;

                                                    const percentage = Math.round((willingCount / deptCount) * 100) || 0;

                                                    return (
                                                        <td key={option.value} className="text-center">
                                                            <Badge bg={percentage > 50 ? 'success' : percentage > 25 ? 'warning' : 'danger'}>
                                                                {willingCount} ({percentage}%)
                                                            </Badge>
                                                        </td>
                                                    );
                                                })}
                                                <td className="text-center"><strong>{deptCount}</strong></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            {/* Contact Modal */}
            <Modal show={showContactModal} onHide={() => setShowContactModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Contact Selected Alumni</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>You've selected {selectedAlumni.length} alumni who are willing to help with {WILLINGNESS_OPTIONS.find(o => o.value === activeWillingness)?.label.toLowerCase()}.</p>

                    <h6>Selected Alumni:</h6>
                    <div className="selected-alumni mb-3">
                        {selectedAlumni.map(id => {
                            const alumnus = alumni.find(a => a._id === id);
                            return (
                                <Badge bg="primary" className="me-1 mb-1" key={id}>
                                    {alumnus?.name} ({alumnus?.dept})
                                </Badge>
                            );
                        })}
                    </div>

                    <h6>Contact Method:</h6>
                    <div className="d-grid gap-2 mb-4">
                        <Button
                            variant="primary"
                            onClick={startGroupConversation}
                            className="d-flex align-items-center justify-content-center"
                        >
                            <FaUsers className="me-2" /> Start Group Conversation
                        </Button>

                        <Button
                            variant="info"
                            onClick={() => setShowTemplateModal(true)}
                            className="d-flex align-items-center justify-content-center"
                        >
                            <FaEnvelope className="me-2" /> Send Batch Email
                        </Button>
                    </div>

                    {messageTemplate && (
                        <div className="message-preview">
                            <h6>Email Message:</h6>
                            <Card>
                                <Card.Body>
                                    <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{messageTemplate}</pre>
                                </Card.Body>
                            </Card>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContactModal(false)}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Template Modal */}
            <Modal show={showTemplateModal} onHide={() => setShowTemplateModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Choose Message Template</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs defaultActiveKey="templates" id="template-tabs">
                        <Tab eventKey="templates" title="Templates">
                            <div className="templates-list">
                                {messageTemplates.map(template => (
                                    <Card key={template.id} className="mb-3">
                                        <Card.Body>
                                            <Card.Title>{template.title}</Card.Title>
                                            <Card.Text style={{ whiteSpace: 'pre-line' }}>
                                                {template.content.substring(0, 100)}...
                                            </Card.Text>
                                            <Button
                                                variant="primary"
                                                onClick={() => useTemplate(template.content)}
                                            >
                                                Use This Template
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </Tab>
                        <Tab eventKey="custom" title="Custom Message">
                            <Form.Group className="mb-3">
                                <Form.Label>Compose Your Message:</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={6}
                                    value={messageTemplate}
                                    onChange={(e) => setMessageTemplate(e.target.value)}
                                    placeholder="Enter your message here..."
                                />
                                <Form.Text className="text-muted">
                                    Use [Name] to automatically insert the recipient's name.
                                </Form.Text>
                            </Form.Group>
                            <div className="d-grid">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowTemplateModal(false);
                                        sendBatchEmail();
                                    }}
                                    disabled={!messageTemplate.trim()}
                                >
                                    <FaCheckCircle className="me-2" /> Confirm & Send
                                </Button>
                            </div>
                        </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default WillingnessManager;