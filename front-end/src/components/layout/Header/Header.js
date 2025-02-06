import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { FaUserCircle } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    // Function to render role-specific menu items
    const renderRoleSpecificMenus = () => {
        if (!user) return null;

        const role = user.role.toLowerCase();

        if (role === 'student') {
            return (
                <NavDropdown title="Studies" id="studies-dropdown">
                    <NavDropdown.Item as={Link} to="/study-groups">Study Groups</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/study-partners">Study Partners</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/study-materials">Study Materials</NavDropdown.Item>
                </NavDropdown>
            );
        }

        if (role === 'alumni') {
            return (
                <NavDropdown title="Mentoring" id="mentoring-dropdown">
                    <NavDropdown.Item as={Link} to="/mentoring/sessions">Mentoring Sessions</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/mentoring/requests">Mentoring Requests</NavDropdown.Item>
                </NavDropdown>
            );
        }

        if (role === 'staff') {
            return (
                <NavDropdown title="Incubation" id="incubation-dropdown">
                    <NavDropdown.Item as={Link} to="/incubation/projects">Projects</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/incubation/applications">Applications</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/incubation/resources">Resources</NavDropdown.Item>
                </NavDropdown>
            );
        }
    };

    return (
        <Navbar bg="light" expand="lg" className="shadow-sm">
            <Container>
                <Navbar.Brand as={Link} to="/feeds" className="d-flex align-items-center">
                    <span style={{
                        fontFamily: "'Segoe UI', Arial, sans-serif",
                        fontSize: "24px",
                        fontWeight: "bold",
                        background: "linear-gradient(45deg, #2196F3, #1976D2)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        letterSpacing: "1px"
                    }}>
                        Imperious
                    </span>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/feeds">Home</Nav.Link>
                        <Nav.Link as={Link} to="/news-events?type=news">News</Nav.Link>
                        <Nav.Link as={Link} to="/news-events?type=event">Events</Nav.Link>
                        <Nav.Link as={Link} to="/repository">Repository</Nav.Link>
                        {renderRoleSpecificMenus()}
                    </Nav>

                    <Nav>
                        {user ? (
                            <NavDropdown
                                title={
                                    <span>
                                        <FaUserCircle size={24} className="text-secondary" />
                                        <span className="ms-2">{user.name}</span>
                                    </span>
                                }
                                id="basic-nav-dropdown"
                                align="end"
                            >
                                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/settings">Settings</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>
                                    Logout
                                </NavDropdown.Item>
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