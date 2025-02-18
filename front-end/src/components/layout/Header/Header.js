import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaUserCircle, FaFolder, FaPlus, FaProjectDiagram } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/signin');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    // Function to render role-specific menu items
    const renderRoleSpecificMenus = () => {
        if (!user) return null;

        const role = user.role.toLowerCase();

        if (role === 'student') {
            return (
                <>
                    <NavDropdown
                        title={
                            <span>
                                <FaProjectDiagram className="me-1" />
                                Projects
                            </span>
                        }
                        id="projects-dropdown"
                    >
                        <NavDropdown.Item
                            as={Link}
                            to="/projects/my-projects"
                            className="d-flex align-items-center"
                        >
                            <FaFolder className="me-2" />
                            My Projects
                        </NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/projects/create"
                            className="d-flex align-items-center"
                        >
                            <FaPlus className="me-2" />
                            Create Project
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/projects/mentorship">Seek Mentorship</NavDropdown.Item>
                        <NavDropdown.Item
                            as={Link}
                            to="/projects/collaborations">
                            Collaborations
                        </NavDropdown.Item>
                    </NavDropdown>
                    <Nav.Link as={Link} to="/jobs">Jobs</Nav.Link>
                </>
            );
        }

        if (role === 'alumni') {
            return (
                <>
                    <NavDropdown title="Mentorship" id="mentorship-dropdown">
                        <NavDropdown.Item as={Link} to="/mentorship/requests">Mentorship Requests</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/mentorship/my-mentees">My Mentees</NavDropdown.Item>
                    </NavDropdown>
                    <Nav.Link as={Link} to="/jobs/post">Post Jobs</Nav.Link>
                </>
            );
        }

        if (role === 'staff') {
            return (
                <>
                    <Nav.Link as={Link} to="/projects">Student Projects</Nav.Link>
                    <Nav.Link as={Link} to="/analytics">Analytics</Nav.Link>
                </>
            );
        }
    };

    const projectsDropdownItems = [
        {
            label: 'My Projects',
            path: '/projects/my-projects',
            icon: <FaFolder className="me-2" />
        },
        {
            label: 'Create Project',
            path: '/projects/create',
            icon: <FaPlus className="me-2" />
        }
    ];

    return (
        <Navbar bg="white" expand="lg" className="shadow-sm">
            <Container>
                <Navbar.Brand as={Link} to="/">Imperious</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/news">News</Nav.Link>
                        <Nav.Link as={Link} to="/events">Events</Nav.Link>
                        {renderRoleSpecificMenus()}
                    </Nav>

                    <Nav>
                        {user ? (
                            <NavDropdown title={<><FaUserCircle size={24} /> {user.name}</>} align="end">
                                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <Nav.Link as={Link} to="/signin">Sign In</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header; 