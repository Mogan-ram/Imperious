import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, InputGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faFilter,
    faUserGraduate,
    faGraduationCap,
    faChalkboardTeacher,
    faBuilding,
    faHandshake,
    faCheck,
    faClock,
    faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { userService } from '../../services/api/users';
import { useConnections } from '../../contexts/ConnectionsContext';
import './UserList.css';

const UserCard = ({ user, connectionStatus, onConnect, loading }) => {
    const getStatusButton = () => {
        switch (connectionStatus?.status) {
            case 'connected':
                return (
                    <div className="d-grid gap-2">
                        <Button
                            variant="outline-primary"
                            href={`/messages?to=${user.email}`}
                            className="mt-2"
                        >
                            <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                            Message
                        </Button>
                        <Button
                            variant="success"
                            disabled
                            className="mt-2"
                        >
                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                            Connected
                        </Button>
                    </div>
                );
            case 'pending_sent':
                return (
                    <Button
                        variant="warning"
                        disabled
                        className="w-100 mt-2"
                    >
                        <FontAwesomeIcon icon={faClock} className="me-2" />
                        Request Sent
                    </Button>
                );
            case 'pending_received':
                return (
                    <Button
                        variant="primary"
                        className="w-100 mt-2"
                        onClick={() => onConnect(user._id, 'accept')}
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                        ) : (
                            <FontAwesomeIcon icon={faHandshake} className="me-2" />
                        )}
                        Accept Request
                    </Button>
                );
            default:
                return (
                    <Button
                        variant="primary"
                        className="w-100 mt-2"
                        onClick={() => onConnect(user._id)}
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                            />
                        ) : (
                            <FontAwesomeIcon icon={faHandshake} className="me-2" />
                        )}
                        Connect
                    </Button>
                );
        }
    };

    return (
        <Col md={6} lg={4} className="mb-4">
            <Card className="user-card h-100">
                <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                        <div className="user-avatar me-3">
                            <img
                                src={user.photo_url || "https://via.placeholder.com/80"}
                                alt={user.name}
                                className="rounded-circle"
                                width="80"
                                height="80"
                            />
                        </div>
                        <div>
                            <h5 className="mb-1">{user.name}</h5>
                            <div>
                                <Badge bg="primary" className="me-2">
                                    {user.role === 'student' && <FontAwesomeIcon icon={faUserGraduate} className="me-1" />}
                                    {user.role === 'alumni' && <FontAwesomeIcon icon={faGraduationCap} className="me-1" />}
                                    {(user.role === 'staff' || user.role === 'admin') && <FontAwesomeIcon icon={faChalkboardTeacher} className="me-1" />}
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                                <Badge bg="secondary">
                                    <FontAwesomeIcon icon={faBuilding} className="me-1" />
                                    {user.dept}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {user.batch && (
                        <p className="mb-2">
                            <strong>Batch:</strong> {user.batch}
                        </p>
                    )}

                    {user.bio && (
                        <p className="mb-2 text-truncate-3">
                            {user.bio}
                        </p>
                    )}

                    {user.skills && user.skills.length > 0 && (
                        <div className="mb-3">
                            <strong>Skills:</strong>
                            <div className="skills-container mt-1">
                                {user.skills.slice(0, 3).map((skill, index) => (
                                    <Badge key={index} bg="info" className="skill-badge me-1 mb-1">
                                        {skill}
                                    </Badge>
                                ))}
                                {user.skills.length > 3 && (
                                    <Badge bg="info" className="skill-badge me-1 mb-1">
                                        +{user.skills.length - 3}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="d-grid gap-2">
                        <Link to={`/profile/${user._id}`} className="btn btn-outline-secondary">
                            View Profile
                        </Link>
                        {getStatusButton()}
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );
};

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        department: ''
    });
    const [departments, setDepartments] = useState([]);
    const [connectionStatuses, setConnectionStatuses] = useState({});
    const [connectingUser, setConnectingUser] = useState(null);

    const { sendConnectionRequest, respondToConnectionRequest, checkConnectionStatus } = useConnections();

    // Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await userService.getUsers();

                // Extract unique departments
                const depts = [...new Set(response.users.map(user => user.dept))].filter(Boolean);
                setDepartments(depts);

                setUsers(response.users);
                setFilteredUsers(response.users);
                setError(null);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('Failed to load users. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Fetch connection status for visible users
    useEffect(() => {
        const fetchConnectionStatuses = async () => {
            const statuses = {};
            for (const user of filteredUsers) {
                try {
                    const status = await checkConnectionStatus(user._id);
                    statuses[user._id] = status;
                } catch (err) {
                    console.error(`Error checking connection status for user ${user._id}:`, err);
                }
            }
            setConnectionStatuses(statuses);
        };

        if (filteredUsers.length > 0) {
            fetchConnectionStatuses();
        }
    }, [filteredUsers, checkConnectionStatus]);

    // Apply filters when they change
    useEffect(() => {
        if (!users.length) return;

        const filtered = users.filter(user => {
            // Apply search filter
            const searchMatch = !filters.search ||
                user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.dept?.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.bio?.toLowerCase().includes(filters.search.toLowerCase());

            // Apply role filter
            const roleMatch = !filters.role || user.role === filters.role;

            // Apply department filter
            const deptMatch = !filters.department || user.dept === filters.department;

            return searchMatch && roleMatch && deptMatch;
        });

        setFilteredUsers(filtered);
    }, [users, filters]);

    const handleConnectClick = async (userId, action = 'connect') => {
        setConnectingUser(userId);
        try {
            if (action === 'accept') {
                // Accept a connection request
                const request = connectionStatuses[userId];
                if (request && request.status === 'pending_received') {
                    await respondToConnectionRequest(request.request_id, 'accepted');
                    // Update connection status
                    const newStatus = await checkConnectionStatus(userId);
                    setConnectionStatuses(prev => ({
                        ...prev,
                        [userId]: newStatus
                    }));
                }
            } else {
                // Send a new connection request
                await sendConnectionRequest(userId);
                // Update connection status
                const newStatus = await checkConnectionStatus(userId);
                setConnectionStatuses(prev => ({
                    ...prev,
                    [userId]: newStatus
                }));
            }
        } catch (err) {
            console.error('Error handling connection:', err);
        } finally {
            setConnectingUser(null);
        }
    };

    if (loading && !users.length) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading users...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="my-3">
                {error}
            </Alert>
        );
    }

    return (
        <div className="user-list-container">
            <Card className="mb-4">
                <Card.Body>
                    <h4 className="mb-3">Find Connections</h4>

                    <Form>
                        <Row className="g-3">
                            <Col md={6}>
                                <InputGroup>
                                    <InputGroup.Text>
                                        <FontAwesomeIcon icon={faSearch} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Search by name, department, or bio"
                                        value={filters.search}
                                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                    />
                                </InputGroup>
                            </Col>

                            <Col md={3}>
                                <Form.Select
                                    value={filters.role}
                                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                                >
                                    <option value="">All Roles</option>
                                    <option value="student">Student</option>
                                    <option value="alumni">Alumni</option>
                                    <option value="staff">Staff</option>
                                </Form.Select>
                            </Col>

                            <Col md={3}>
                                <Form.Select
                                    value={filters.department}
                                    onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                                >
                                    <option value="">All Departments</option>
                                    {departments.map((dept, index) => (
                                        <option key={index} value={dept}>{dept}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            <div className="mb-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'User' : 'Users'} Found
                </h5>

                <div>
                    <FontAwesomeIcon icon={faFilter} className="me-2" />
                    <span>Filters: </span>
                    {filters.role && (
                        <Badge bg="primary" className="me-2">
                            Role: {filters.role}
                        </Badge>
                    )}
                    {filters.department && (
                        <Badge bg="primary">
                            Department: {filters.department}
                        </Badge>
                    )}
                </div>
            </div>

            <Row>
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <UserCard
                            key={user._id}
                            user={user}
                            connectionStatus={connectionStatuses[user._id]}
                            onConnect={handleConnectClick}
                            loading={connectingUser === user._id}
                        />
                    ))
                ) : (
                    <Col>
                        <Alert variant="info">
                            No users found matching your filters. Try adjusting your search criteria.
                        </Alert>
                    </Col>
                )}
            </Row>
        </div>
    );
};

export default UserList;