// src/components/analytics/AlumniList.js
import React, { useState, useEffect } from 'react';
import {
    Table, Card, Button, Pagination, Form, Row, Col,
    Badge, InputGroup, Dropdown, DropdownButton, Modal
} from 'react-bootstrap';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaEnvelope, FaEye, FaComments, FaFilter, FaPhone, FaStar, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import * as alumniApi from '../../services/api/alumni';
import messagingService from '../../services/api/messaging';

// Willingness options with colors and icons (could be moved to a constants file)
const WILLINGNESS_OPTIONS = [
    { value: 'mentoring', label: 'Mentoring', color: 'primary', icon: '👨‍🏫' },
    { value: 'guestLectures', label: 'Guest Lectures', color: 'info', icon: '🎤' },
    { value: 'workshops', label: 'Workshops', color: 'success', icon: '🛠️' },
    { value: 'internships', label: 'Internships', color: 'warning', icon: '💼' },
    { value: 'placements', label: 'Placements', color: 'danger', icon: '🎓' },
    { value: 'funding', label: 'Funding', color: 'secondary', icon: '💰' },
    { value: 'research', label: 'Research', color: 'dark', icon: '🔬' },
    { value: 'other', label: 'Other', color: 'light', icon: '➕' }
];

const AlumniList = ({ onAlumnusSelect, departmentFilter, batchFilter }) => {
    const [alumni, setAlumni] = useState([]);
    const [filteredAlumni, setFilteredAlumni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [selectedWillingness, setSelectedWillingness] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedAlumnus, setSelectedAlumnus] = useState(null);
    const [engagementFilter, setEngagementFilter] = useState('all');
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');

    const { authToken, user } = useAuth();
    const navigate = useNavigate();

    // Fetch alumni data
    useEffect(() => {
        const fetchAlumni = async () => {
            try {
                setLoading(true);
                const data = await alumniApi.getAlumniWillingness("", authToken);
                setAlumni(data);
                setError(null);
            } catch (err) {
                setError(err.message || "Failed to fetch alumni data.");
                toast.error(err.message || "Failed to fetch alumni data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAlumni();
    }, [authToken]);

    // Apply filters when they change
    useEffect(() => {
        let result = [...alumni];

        // Department filter
        if (departmentFilter && departmentFilter !== 'all') {
            result = result.filter(alumnus => alumnus.dept === departmentFilter);
        }

        // Batch filter
        if (batchFilter && batchFilter !== 'all') {
            result = result.filter(alumnus => alumnus.batch === parseInt(batchFilter));
        }

        // Willingness filter
        if (selectedWillingness.length > 0) {
            result = result.filter(alumnus =>
                selectedWillingness.every(selected =>
                    alumnus.willingness && alumnus.willingness.includes(selected)
                )
            );
        }

        // Search term filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(alumnus =>
                alumnus.name.toLowerCase().includes(term) ||
                alumnus.email.toLowerCase().includes(term) ||
                alumnus.dept.toLowerCase().includes(term)
            );
        }

        // Engagement filter (simulated - in real app this would use actual engagement data)
        if (engagementFilter !== 'all') {
            // Simple simulation of engagement levels
            const engagementLevels = alumni.reduce((acc, alumnus) => {
                const willingness = alumnus.willingness ? alumnus.willingness.length : 0;
                // Just a simple algorithm for demo purposes
                const engagement = (willingness * 10) + Math.floor(Math.random() * 50);
                acc[alumnus._id] = engagement;
                return acc;
            }, {});

            if (engagementFilter === 'high') {
                result = result.filter(alumnus => (engagementLevels[alumnus._id] || 0) > 70);
            } else if (engagementFilter === 'medium') {
                result = result.filter(alumnus => {
                    const level = engagementLevels[alumnus._id] || 0;
                    return level >= 30 && level <= 70;
                });
            } else if (engagementFilter === 'low') {
                result = result.filter(alumnus => (engagementLevels[alumnus._id] || 0) < 30);
            }
        }

        // Sort results
        result.sort((a, b) => {
            let comparison = 0;

            if (sortField === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortField === 'batch') {
                comparison = (a.batch || 0) - (b.batch || 0);
            } else if (sortField === 'willingness') {
                const aCount = a.willingness ? a.willingness.length : 0;
                const bCount = b.willingness ? b.willingness.length : 0;
                comparison = aCount - bCount;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        setFilteredAlumni(result);
        setCurrentPage(1); // Reset to first page when filters change
    }, [alumni, departmentFilter, batchFilter, selectedWillingness, searchTerm, engagementFilter, sortField, sortDirection]);

    // Initialize conversation
    const startConversation = async (alumniEmail) => {
        try {
            // First search for the alumni user to get their details
            const searchResult = await messagingService.searchUsers(alumniEmail);

            if (searchResult && searchResult.length > 0) {
                const alumniUser = searchResult.find(u => u.email === alumniEmail);

                if (alumniUser) {
                    // Create a conversation with this alumni
                    await messagingService.createConversation([alumniEmail, user.email]);
                    toast.success(`Conversation started with ${alumniUser.name}`);

                    // Navigate to messages page
                    navigate('/messages');
                }
            } else {
                toast.error("Could not find alumni user details");
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    // Handle willingness toggle
    const toggleWillingness = (value) => {
        setSelectedWillingness(prev => {
            if (prev.includes(value)) {
                return prev.filter(item => item !== value);
            } else {
                return [...prev, value];
            }
        });
    };

    // Clear all filters
    const clearFilters = () => {
        setSelectedWillingness([]);
        setSearchTerm('');
        setEngagementFilter('all');
    };

    // Open contact modal
    const openContactModal = (alumnus) => {
        setSelectedAlumnus(alumnus);
        setShowContactModal(true);
    };

    // Navigate to profile
    const viewProfile = (alumniId) => {
        navigate(`/profile/${alumniId}`);
    };

    // Pagination logic
    const paginate = (items) => {
        const startIndex = (currentPage - 1) * pageSize;
        return items.slice(startIndex, startIndex + pageSize);
    };

    const totalPages = Math.ceil(filteredAlumni.length / pageSize);
    const currentAlumni = paginate(filteredAlumni);

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <Card body className="text-danger">
                Error: {error}
            </Card>
        );
    }

    return (
        <div>
            <Card className="mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0">Alumni Directory</h5>
                        <div>
                            <Badge bg="primary" className="me-2">Total Alumni: {alumni.length}</Badge>
                            <Badge bg="success">Filtered: {filteredAlumni.length}</Badge>
                        </div>
                    </div>

                    {/* Search and Filter Controls */}
                    <Row className="mb-4">
                        <Col md={4}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    placeholder="Search by name, email, dept..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={engagementFilter}
                                onChange={(e) => setEngagementFilter(e.target.value)}
                            >
                                <option value="all">All Engagement Levels</option>
                                <option value="high">High Engagement</option>
                                <option value="medium">Medium Engagement</option>
                                <option value="low">Low Engagement</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <DropdownButton
                                title={<><FaFilter /> Willingness</>}
                                variant="outline-primary"
                                className="w-100"
                            >
                                {WILLINGNESS_OPTIONS.map((option) => (
                                    <Dropdown.Item
                                        key={option.value}
                                        onClick={() => toggleWillingness(option.value)}
                                        active={selectedWillingness.includes(option.value)}
                                    >
                                        {option.icon} {option.label}
                                    </Dropdown.Item>
                                ))}
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={clearFilters}>
                                    Clear All Filters
                                </Dropdown.Item>
                            </DropdownButton>
                        </Col>
                        <Col md={2}>
                            <Form.Select
                                value={`${sortField}-${sortDirection}`}
                                onChange={(e) => {
                                    const [field, direction] = e.target.value.split('-');
                                    setSortField(field);
                                    setSortDirection(direction);
                                }}
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="batch-asc">Batch (Oldest)</option>
                                <option value="batch-desc">Batch (Newest)</option>
                                <option value="willingness-desc">Most Willing</option>
                                <option value="willingness-asc">Least Willing</option>
                            </Form.Select>
                        </Col>
                    </Row>

                    {/* Active Filters Display */}
                    {(selectedWillingness.length > 0 || searchTerm || engagementFilter !== 'all') && (
                        <div className="mb-3">
                            <div className="d-flex align-items-center">
                                <small className="text-muted me-2">Active Filters:</small>
                                {selectedWillingness.map(filter => {
                                    const option = WILLINGNESS_OPTIONS.find(opt => opt.value === filter);
                                    return (
                                        <Badge
                                            bg={option?.color || 'secondary'}
                                            className="me-1"
                                            key={filter}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => toggleWillingness(filter)}
                                        >
                                            {option?.icon} {option?.label} ×
                                        </Badge>
                                    );
                                })}
                                {searchTerm && (
                                    <Badge
                                        bg="info"
                                        className="me-1"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setSearchTerm('')}
                                    >
                                        Search: {searchTerm} ×
                                    </Badge>
                                )}
                                {engagementFilter !== 'all' && (
                                    <Badge
                                        bg="dark"
                                        className="me-1"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setEngagementFilter('all')}
                                    >
                                        Engagement: {engagementFilter} ×
                                    </Badge>
                                )}
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-decoration-none"
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    )}

                    {filteredAlumni.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="mb-0">No alumni found with the selected filters.</p>
                        </div>
                    ) : (
                        <>
                            <Table striped bordered hover responsive className="table-sm">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Department</th>
                                        <th>Batch</th>
                                        <th>Willingness</th>
                                        <th>Engagement</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAlumni.map((alumnus) => {
                                        // Calculate mock engagement level (this would be real data in production)
                                        const willingnessCount = alumnus.willingness ? alumnus.willingness.length : 0;
                                        const mockEngagement = (willingnessCount * 10) + Math.floor(Math.random() * 50);
                                        let engagementLevel = 'Low';
                                        let engagementBadge = 'danger';

                                        if (mockEngagement > 70) {
                                            engagementLevel = 'High';
                                            engagementBadge = 'success';
                                        } else if (mockEngagement >= 30) {
                                            engagementLevel = 'Medium';
                                            engagementBadge = 'warning';
                                        }

                                        return (
                                            <tr key={alumnus._id}>
                                                <td className="align-middle">{alumnus.name}</td>
                                                <td className="align-middle">{alumnus.email}</td>
                                                <td className="align-middle">{alumnus.dept}</td>
                                                <td className="align-middle">{alumnus.batch}</td>
                                                <td className="align-middle">
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
                                                <td className="align-middle">
                                                    <Badge bg={engagementBadge}>
                                                        {engagementLevel}
                                                    </Badge>
                                                    <div className="mt-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <FaStar
                                                                key={i}
                                                                color={i < Math.ceil(mockEngagement / 20) ? "#FFD700" : "#e4e5e9"}
                                                                style={{ marginRight: '2px' }}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="align-middle text-center">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => onAlumnusSelect(alumnus.email)}
                                                        title="View Details"
                                                    >
                                                        <FaEye />
                                                    </Button>

                                                    <Button
                                                        variant="outline-success"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => startConversation(alumnus.email)}
                                                        title="Message"
                                                    >
                                                        <FaComments />
                                                    </Button>

                                                    <Button
                                                        variant="outline-info"
                                                        size="sm"
                                                        className="me-1"
                                                        onClick={() => viewProfile(alumnus._id)}
                                                        title="View Profile"
                                                    >
                                                        <FaEye />
                                                    </Button>

                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => openContactModal(alumnus)}
                                                        title="Contact Options"
                                                    >
                                                        <FaPhone />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <Pagination>
                                        <Pagination.First
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                        />
                                        <Pagination.Prev
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        />

                                        {[...Array(totalPages)].map((_, idx) => {
                                            const pageNumber = idx + 1;
                                            // Show a window of 5 pages centered around the current page
                                            if (
                                                pageNumber === 1 ||
                                                pageNumber === totalPages ||
                                                (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                                            ) {
                                                return (
                                                    <Pagination.Item
                                                        key={pageNumber}
                                                        active={pageNumber === currentPage}
                                                        onClick={() => setCurrentPage(pageNumber)}
                                                    >
                                                        {pageNumber}
                                                    </Pagination.Item>
                                                );
                                            } else if (
                                                (pageNumber === currentPage - 3 && currentPage > 3) ||
                                                (pageNumber === currentPage + 3 && currentPage < totalPages - 2)
                                            ) {
                                                return <Pagination.Ellipsis key={pageNumber} />;
                                            }
                                            return null;
                                        })}

                                        <Pagination.Next
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        />
                                        <Pagination.Last
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                        />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Contact Modal */}
            <Modal show={showContactModal} onHide={() => setShowContactModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Contact {selectedAlumnus?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedAlumnus && (
                        <div>
                            <p><strong>Email:</strong> {selectedAlumnus.email}</p>

                            <div className="d-grid gap-2">
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        startConversation(selectedAlumnus.email);
                                        setShowContactModal(false);
                                    }}
                                >
                                    <FaComments className="me-2" /> Start Conversation
                                </Button>

                                <a
                                    href={`mailto:${selectedAlumnus.email}`}
                                    className="btn btn-info"
                                    onClick={() => setShowContactModal(false)}
                                >
                                    <FaEnvelope className="me-2" /> Send Email
                                </a>

                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        viewProfile(selectedAlumnus._id);
                                        setShowContactModal(false);
                                    }}
                                >
                                    <FaEye className="me-2" /> View Full Profile
                                </Button>
                            </div>

                            {selectedAlumnus.willingness && selectedAlumnus.willingness.length > 0 && (
                                <div className="mt-3">
                                    <p><strong>Willing to help with:</strong></p>
                                    <div>
                                        {selectedAlumnus.willingness.map(willing => {
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
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowContactModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AlumniList;