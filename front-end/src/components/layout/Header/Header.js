import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import {
    FaFolder, FaPlus, FaProjectDiagram, FaBriefcase, FaHandshake,
    FaHome, FaNewspaper, FaCalendarAlt, FaChartLine, FaUserGraduate,
    FaUserPlus, FaEnvelope, FaSignOutAlt, FaUser
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const [scrollClass, setScrollClass] = useState('scrolled-up');
    const [prevScrollPos, setPrevScrollPos] = useState(0);

    // Handle scroll behavior
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.pageYOffset;

            if (currentScrollPos <= 10) {
                // Always show when at the top
                setScrollClass('scrolled-up');
            } else if (prevScrollPos > currentScrollPos) {
                // Scrolling up - show header
                setScrollClass('scrolled-up');
            } else {
                // Scrolling down - hide header
                setScrollClass('scrolled-down');
            }

            setPrevScrollPos(currentScrollPos);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/signin');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    // Check if a path is active - Using exact matching for paths
    const isActive = (path) => {
        if (path === '/') {
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    // Function to close navbar on mobile after clicking a link
    const closeNavbar = () => {
        if (expanded) {
            setExpanded(false);
        }
    };

    const renderRoleSpecificMenus = () => {
        if (!user) return null;

        const role = user.role.toLowerCase();

        if (role === 'student') {
            return (
                <>
                    <NavDropdown
                        title={<span className={isActive('/projects') ? 'active-link' : ''}>
                            <FaProjectDiagram className="nav-icon" />Projects
                        </span>}
                        id="projects-dropdown"
                        className={`nav-item ${isActive('/projects') ? 'active' : ''}`}
                    >
                        <NavDropdown.Item as={Link} to="/projects/my-projects" onClick={closeNavbar}>
                            <FaFolder className="dropdown-icon" />My Projects
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/projects/create" onClick={closeNavbar}>
                            <FaPlus className="dropdown-icon" />Create Project
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/projects/mentorship" onClick={closeNavbar}>
                            <FaHandshake className="dropdown-icon" />Seek Mentorship
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/projects/collaborations" onClick={closeNavbar}>
                            <FaUserPlus className="dropdown-icon" />Collaborations
                        </NavDropdown.Item>
                    </NavDropdown>
                    <Nav.Link
                        as={Link}
                        to="/jobs"
                        className={`nav-item ${isActive('/jobs') ? 'active' : ''}`}
                        onClick={closeNavbar}
                    >
                        <FaBriefcase className="nav-icon" />Jobs
                    </Nav.Link>
                </>
            );
        }

        if (role === 'alumni') {
            return (
                <>
                    <NavDropdown
                        title={<span className={isActive('/alumni/mentorship') ? 'active-link' : ''}>
                            <FaHandshake className="nav-icon" />Mentorship
                        </span>}
                        id="mentorship-dropdown"
                        className={`nav-item ${isActive('/alumni/mentorship') ? 'active' : ''}`}
                    >
                        <NavDropdown.Item as={Link} to="/alumni/mentorship" onClick={closeNavbar}>
                            <FaHandshake className="dropdown-icon" />Mentorship Requests
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/alumni/mentees" onClick={closeNavbar}>
                            <FaUserGraduate className="dropdown-icon" />My Mentees
                        </NavDropdown.Item>
                    </NavDropdown>

                    <NavDropdown
                        title={<span className={isActive('/jobs') ? 'active-link' : ''}>
                            <FaBriefcase className="nav-icon" />Jobs
                        </span>}
                        id="jobs-dropdown"
                        className={`nav-item ${isActive('/jobs') ? 'active' : ''}`}
                    >
                        <NavDropdown.Item as={Link} to="/jobs" onClick={closeNavbar}>
                            <FaBriefcase className="dropdown-icon" />View Jobs
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/jobs/create" onClick={closeNavbar}>
                            <FaPlus className="dropdown-icon" />Post Job
                        </NavDropdown.Item>
                    </NavDropdown>
                </>
            );
        }

        if (role === 'staff') {
            return (
                <Nav.Link
                    as={Link}
                    to="/analytics"
                    className={`nav-item ${isActive('/analytics') ? 'active' : ''}`}
                    onClick={closeNavbar}
                >
                    <FaChartLine className="nav-icon" />Analytics
                </Nav.Link>
            );
        }
    };

    return (
        <Navbar
            expand="lg"
            className={`modern-navbar ${scrollClass}`}
            variant="dark"
            expanded={expanded}
            onToggle={setExpanded}
        >
            <Container fluid>
                {/* Brand/Logo - Left aligned with smaller size */}
                <Navbar.Brand as={Link} to="/" className="navbar-brand">
                    <img src="/logo.png" alt="Logo" className="logo" />
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar" />

                <Navbar.Collapse id="main-navbar">
                    {/* Center-aligned nav items moved more to the left */}
                    <Nav className="me-auto main-nav">
                        <Nav.Link
                            as={Link}
                            to="/"
                            className={`nav-item ${isActive('/') ? 'active' : ''}`}
                            onClick={closeNavbar}
                        >
                            <FaHome className="nav-icon" />Home
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/news"
                            className={`nav-item ${isActive('/news') ? 'active' : ''}`}
                            onClick={closeNavbar}
                        >
                            <FaNewspaper className="nav-icon" />News
                        </Nav.Link>
                        <Nav.Link
                            as={Link}
                            to="/events"
                            className={`nav-item ${isActive('/events') ? 'active' : ''}`}
                            onClick={closeNavbar}
                        >
                            <FaCalendarAlt className="nav-icon" />Events
                        </Nav.Link>
                        {renderRoleSpecificMenus()}
                        <Nav.Link
                            as={Link}
                            to="/messages"
                            className={`nav-item ${isActive('/messages') ? 'active' : ''}`}
                            onClick={closeNavbar}
                        >
                            <FaEnvelope className="nav-icon" />Messages
                        </Nav.Link>
                    </Nav>

                    {/* Right-aligned user profile */}
                    <Nav>
                        {user ? (
                            <NavDropdown
                                title={
                                    <div className="user-profile-menu">
                                        <div className="user-avatar">
                                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                        <span className="user-name d-none d-lg-inline">{user.name}</span>
                                    </div>
                                }
                                align="end"
                                className="user-dropdown"
                            >
                                <NavDropdown.Item as={Link} to="/profile" onClick={closeNavbar}>
                                    <FaUser className="dropdown-icon" />Profile
                                </NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={() => { handleLogout(); closeNavbar(); }}>
                                    <FaSignOutAlt className="dropdown-icon" />Logout
                                </NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <Button
                                as={Link}
                                to="/signin"
                                variant="light"
                                className="sign-in-btn"
                                onClick={closeNavbar}
                            >
                                Sign In
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;