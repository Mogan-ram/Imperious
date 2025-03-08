import React, { useState, useEffect, useCallback } from 'react';
import { Table, Pagination, Form, Button, Row, Col } from 'react-bootstrap';
import { FaEnvelope } from 'react-icons/fa';
import LoadingSpinner from '../common/LoadingSpinner';
import { Link } from 'react-router-dom';
import { userService } from '../../services/api/users';

const UserList = ({
    users,
    setUsers,
    filters,
    setFilters,
    userLoading = false,
    loadUsers = null
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isFiltering, setIsFiltering] = useState(false);
    const [localUsers, setLocalUsers] = useState([]);

    // Calculate totalPages whenever the users array or perPage changes.
    useEffect(() => {
        if (users && users.length > 0) {
            setLocalUsers(users);
            setTotalPages(Math.ceil(users.length / 10)); // Using 10 as example of perPage
        } else {
            setTotalPages(1);
        }
    }, [users]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
        setCurrentPage(1); // Reset the page on filters changes
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Custom load users function if not provided
    const fetchUsers = useCallback(async () => {
        if (loadUsers && typeof loadUsers === 'function') {
            return loadUsers(currentPage, 10);
        }

        setIsFiltering(true);
        try {
            let queryFilters = { ...filters, page: currentPage, per_page: 10 };
            const response = await userService.getUsers(queryFilters);
            if (response && response.users) {
                if (setUsers && typeof setUsers === 'function') {
                    setUsers(response.users);
                } else {
                    setLocalUsers(response.users);
                }
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsFiltering(false);
        }
    }, [filters, currentPage, loadUsers, setUsers]);

    useEffect(() => {
        fetchUsers();
    }, [filters, fetchUsers]);

    // Display the spinner either when the data is loading or when the filter is loading
    if (userLoading || isFiltering) {
        return <LoadingSpinner />;
    }

    // Get the proper list of users to display
    const displayUsers = localUsers.length > 0 ? localUsers : users;

    // Return early if users is empty
    if (!displayUsers || displayUsers.length === 0) {
        return <div className="text-center">No users found.</div>;
    }

    return (
        <div>
            <h2>User List</h2>
            {/* Filters */}
            <Row className="mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Role</Form.Label>
                        <Form.Select
                            name="role"
                            value={filters.role}
                            onChange={handleFilterChange}
                            aria-label="Role"
                        >
                            <option value="">All Roles</option>
                            <option value="student">Student</option>
                            <option value="alumni">Alumni</option>
                            <option value="staff">Staff</option>
                        </Form.Select>
                    </Form.Group>
                </Col>

                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Department</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Filter by Department"
                            name="dept"
                            value={filters.dept}
                            onChange={handleFilterChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Batch Year</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="Filter by Batch Year"
                            name="batch"
                            value={filters.batch}
                            onChange={handleFilterChange}
                        />
                    </Form.Group>
                </Col>
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>RegNo</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Filter by Reg.No"
                            name="regno"
                            value={filters.regno}
                            onChange={handleFilterChange}
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Button variant="primary" onClick={fetchUsers} className="mb-3">
                Apply Filters
            </Button>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Batch</th>
                        <th>Reg. No</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {displayUsers.map((user) => (
                        <tr key={user._id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.dept}</td>
                            <td>{user.batch}</td>
                            <td>{user.regno}</td>
                            <td>
                                <Link
                                    to={`/users/${user._id}`}
                                    className="btn btn-outline-info btn-sm me-2"
                                >
                                    View Profile
                                </Link>
                                <Button variant="outline-primary" size="sm">
                                    <FaEnvelope /> Message
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <Pagination className="justify-content-center">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => handlePageChange(page)}
                        >
                            {page}
                        </Pagination.Item>
                    ))}
                </Pagination>
            )}
        </div>
    );
};

export default UserList;